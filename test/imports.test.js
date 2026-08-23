import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createLedger } from "../lib/db.js";

test("import catalog versions every required production template", () => {
  const ledger = createLedger(":memory:");
  assert.deepEqual(
    ledger.importTemplateCatalog().map((item) => item.key),
    [
      "chart_of_accounts",
      "opening_balances",
      "customers",
      "contracts",
      "invoices",
      "payments",
      "bank_transactions",
      "journals",
      "investments",
      "fixed_assets",
    ],
  );
  assert.equal(
    ledger.importTemplateCatalog().every((item) => item.version === 1),
    true,
  );
  ledger.close();
});

test("stage validates mappings, formula-like text, rows and within-file duplicates", () => {
  const ledger = createLedger(":memory:");
  const batch = ledger.stageImport({
    template_key: "chart_of_accounts",
    filename: "accounts.csv",
    mapping: { code: "account", name: "label", type: "classification" },
    csv: [
      "account,label,classification",
      "9001,Implementation costs,expense",
      '9002,=HYPERLINK("https://malicious.invalid"),expense',
      "9001,Duplicate code,expense",
      "9003,Wrong type,other",
    ].join("\n"),
  });
  assert.equal(batch.row_count, 4);
  assert.equal(batch.valid_count, 1);
  assert.equal(batch.error_count, 2);
  assert.equal(batch.duplicate_count, 1);
  assert.equal(batch.exceptions.length, 3);
  assert.throws(() => ledger.approveImport({ id: batch.id }), /explicitly approve/);
  ledger.close();
});

test("tenant duplicate policies flag fuzzy candidates with evidence and reviewed override", () => {
  const ledger = createLedger(":memory:");
  const policy = ledger.configureImportDuplicatePolicy({
    template_key: "customers",
    field_key: "name",
    threshold_percent: 75,
  });
  assert.equal(policy.version, 1);
  assert.equal(policy.indexed_rows, 0);
  assert.equal(policy.active, true);
  assert.throws(
    () =>
      ledger.configureImportDuplicatePolicy({
        template_key: "invoices",
        field_key: "amount_cents",
        threshold_percent: 80,
      }),
    /text field/,
  );

  const batch = ledger.stageImport({
    template_key: "customers",
    filename: "fuzzy-customers.csv",
    csv: [
      "name,segment,region,external_id",
      "Acme Corporation,Enterprise,US,cust-1",
      "Acme Corporatoin,Enterprise,US,cust-2",
    ].join("\n"),
  });
  assert.equal(batch.valid_count, 1);
  assert.equal(batch.duplicate_count, 1);
  assert.equal(batch.duplicate_policy.version, 1);
  const candidate = batch.rows.find((row) => row.status === "duplicate");
  assert.equal(candidate.duplicate_evidence.kind, "fuzzy");
  assert.equal(candidate.duplicate_evidence.field_key, "name");
  assert.ok(candidate.duplicate_evidence.score_percent >= 75);
  const fuzzyException = batch.exceptions.find((item) => item.code === "FUZZY_DUPLICATE");
  assert.ok(fuzzyException);
  assert.throws(() => ledger.acceptImportDuplicate({ id: fuzzyException.id }), /expected string/i);

  const accepted = ledger.acceptImportDuplicate({
    id: fuzzyException.id,
    resolution: "Controller compared source identifiers and confirmed separate legal customers",
  });
  assert.equal(accepted.batch.valid_count, 2);
  assert.equal(accepted.batch.duplicate_count, 0);
  assert.equal(accepted.exception.status, "resolved");
  ledger.approveImport({ id: batch.id });
  assert.equal(ledger.applyImport(batch.id).applied_count, 2);
  assert.equal(ledger.importDuplicatePolicies()[0].indexed_rows, 2);
  const revisedPolicy = ledger.configureImportDuplicatePolicy({
    template_key: "customers",
    field_key: "name",
    threshold_percent: 76,
  });
  assert.equal(revisedPolicy.version, 2);
  assert.equal(revisedPolicy.indexed_rows, 2);
  assert.equal(
    ledger.db
      .prepare(
        "SELECT COUNT(*) count FROM import_duplicate_policies WHERE template_key='customers'",
      )
      .get().count,
    2,
  );

  const historicalCandidate = ledger.stageImport({
    template_key: "customers",
    filename: "historical-fuzzy.csv",
    csv: ["name,segment,region,external_id", "Acme Corporations,Enterprise,US,cust-3"].join("\n"),
  });
  assert.equal(historicalCandidate.duplicate_count, 1);
  assert.equal(historicalCandidate.rows[0].duplicate_evidence.source, "applied_import");
  assert.ok(historicalCandidate.rows[0].duplicate_evidence.candidate_batch_id);

  const exact = ledger.stageImport({
    template_key: "customers",
    filename: "exact-customers.csv",
    csv: ["name,segment,region,external_id", "Different Display Name,Enterprise,US,cust-1"].join(
      "\n",
    ),
  });
  const exactException = exact.exceptions.find((item) => item.code === "EXACT_DUPLICATE");
  assert.equal(exactException.severity, "blocking");
  assert.throws(
    () =>
      ledger.acceptImportDuplicate({
        id: exactException.id,
        resolution: "Reviewed exact-key collision and attempted override",
      }),
    /Only a fuzzy duplicate/,
  );
  const disabledPolicy = ledger.configureImportDuplicatePolicy({
    template_key: "customers",
    field_key: "name",
    threshold_percent: 76,
    active: false,
  });
  assert.equal(disabledPolicy.version, 3);
  assert.equal(disabledPolicy.active, false);
  assert.equal(disabledPolicy.indexed_rows, 0);
  const disabledCandidate = ledger.stageImport({
    template_key: "customers",
    filename: "disabled-fuzzy.csv",
    csv: ["name,segment,region,external_id", "Acme Corporaton,Enterprise,US,cust-4"].join("\n"),
  });
  assert.equal(disabledCandidate.valid_count, 1);
  assert.equal(disabledCandidate.duplicate_count, 0);
  ledger.close();
});

test("saved mapping profiles drive staging and retain version lineage", () => {
  const ledger = createLedger(":memory:");
  const profile = ledger.createImportMappingProfile({
    name: "Legacy account export",
    template_key: "chart_of_accounts",
    mapping: { code: "account", name: "label", type: "classification" },
  });
  const batch = ledger.stageImport({
    template_key: "chart_of_accounts",
    mapping_profile_id: profile.id,
    filename: "legacy-accounts.csv",
    csv: "account,label,classification\n9050,Implementation support,expense",
  });
  assert.equal(batch.mapping_profile_id, profile.id);
  assert.equal(batch.mapping_profile_version, 1);
  assert.deepEqual(batch.mapping, {
    code: "account",
    name: "label",
    type: "classification",
  });
  assert.equal(batch.rows[0].normalized.code, "9050");
  assert.throws(
    () =>
      ledger.stageImport({
        template_key: "chart_of_accounts",
        mapping_profile_id: profile.id,
        mapping: { code: "label", name: "account", type: "classification" },
        filename: "profile-override.csv",
        csv: "account,label,classification\n9060,Profile override,expense",
      }),
    /cannot be overridden/,
  );
  assert.throws(
    () =>
      ledger.stageImport({
        template_key: "customers",
        mapping_profile_id: profile.id,
        filename: "wrong-template.csv",
        csv: "name,external_id\nWrong template,C-1",
      }),
    /does not match this template version/,
  );
  ledger.close();
});

test("existing import batches upgrade to mapping and duplicate-policy lineage", (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-import-upgrade-"));
  const databasePath = join(root, "tenant.db");
  let ledger;
  t.after(() => {
    ledger?.close();
    rmSync(root, { recursive: true, force: true });
  });
  const old = new DatabaseSync(databasePath);
  old.exec(`CREATE TABLE import_batches (
    id TEXT PRIMARY KEY,
    template_key TEXT NOT NULL,
    template_version INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_sha256 TEXT NOT NULL,
    mapping_json TEXT NOT NULL,
    options_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'staged',
    row_count INTEGER NOT NULL,
    valid_count INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    duplicate_count INTEGER NOT NULL,
    applied_count INTEGER NOT NULL DEFAULT 0,
    allow_partial INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    approved_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TEXT,
    applied_at TEXT,
    UNIQUE(template_key,file_sha256)
  )`);
  old.close();
  ledger = createLedger(databasePath, { seed: false, orgId: "import-upgrade" });
  const columns = new Set(
    ledger.db
      .prepare("PRAGMA table_info(import_batches)")
      .all()
      .map((column) => column.name),
  );
  assert.equal(columns.has("mapping_profile_id"), true);
  assert.equal(columns.has("mapping_profile_version"), true);
  assert.equal(columns.has("restaged_from_batch_id"), true);
  assert.equal(columns.has("duplicate_policy_version"), true);
  assert.equal(columns.has("duplicate_policy_json"), true);
  const rowColumns = new Set(
    ledger.db
      .prepare("PRAGMA table_info(import_rows)")
      .all()
      .map((column) => column.name),
  );
  assert.equal(rowColumns.has("duplicate_evidence_json"), true);
  assert.equal(
    ledger.db
      .prepare(
        "SELECT COUNT(*) count FROM sqlite_master WHERE type='table' AND name LIKE 'import_duplicate_%'",
      )
      .get().count,
    3,
  );
  ledger.close();
  ledger = null;
});

test("large previews paginate and reject invalid page boundaries", () => {
  const ledger = createLedger(":memory:");
  const rows = Array.from(
    { length: 260 },
    (_, index) => `P${String(index + 1).padStart(4, "0")},Paged account ${index + 1},expense`,
  );
  const staged = ledger.stageImport({
    template_key: "chart_of_accounts",
    filename: "paged-accounts.csv",
    csv: ["code,name,type", ...rows].join("\n"),
  });
  assert.deepEqual(staged.row_page, {
    page: 1,
    page_size: 100,
    total_rows: 260,
    total_pages: 3,
    from: 1,
    to: 100,
  });
  const lastPage = ledger.importBatch(staged.id, { page: 3, page_size: 100 });
  assert.equal(lastPage.rows.length, 60);
  assert.equal(lastPage.rows[0].row_number, 202);
  assert.equal(lastPage.row_page.to, 260);
  assert.throws(() => ledger.importBatch(staged.id, { page: 4 }), /out of range/);
  assert.throws(
    () => ledger.importBatch(staged.id, { page_size: 251 }),
    /whole number from 25 through 250/,
  );
  ledger.close();
});

test("exception queue filters and paginates on the tenant database", () => {
  const ledger = createLedger(":memory:");
  const invalidRows = Array.from(
    { length: 45 },
    (_, index) => `,Invalid account ${index + 1},expense`,
  );
  ledger.stageImport({
    template_key: "chart_of_accounts",
    filename: "many-invalid-accounts.csv",
    csv: ["code,name,type", ...invalidRows].join("\n"),
  });
  const lastPage = ledger.importExceptions({ status: "open", page: 3, page_size: 20 });
  assert.equal(lastPage.items.length, 5);
  assert.equal(lastPage.open_total, 45);
  assert.deepEqual(lastPage.page, {
    page: 3,
    page_size: 20,
    total: 45,
    total_pages: 3,
    from: 41,
    to: 45,
  });
  ledger.resolveImportException({
    id: lastPage.items[0].id,
    status: "resolved",
    resolution: "Corrected by operator",
  });
  assert.equal(ledger.importExceptions({ status: "resolved" }).items.length, 1);
  assert.equal(ledger.importExceptions({ status: "open" }).open_total, 44);
  ledger.close();
});

test("correction sources preserve full-replacement and applied-exception lineage", () => {
  const ledger = createLedger(":memory:");
  const original = ledger.stageImport({
    template_key: "chart_of_accounts",
    filename: "accounts-with-errors.csv",
    mapping: { code: "account", name: "label", type: "classification" },
    csv: [
      "account,label,classification",
      "9100,Valid row,expense",
      ",Missing code,expense",
      "9100,Duplicate code,expense",
    ].join("\n"),
  });
  const fullSource = ledger.importCorrectionSource(original.id);
  assert.equal(fullSource.scope, "full_replacement");
  assert.equal(fullSource.row_count, 3);
  assert.deepEqual(fullSource.source_row_numbers, [2, 3, 4]);
  assert.match(fullSource.csv, /Missing code/);
  assert.throws(
    () =>
      ledger.stageImport({
        template_key: "chart_of_accounts",
        restaged_from_batch_id: original.id,
        filename: "incomplete-correction.csv",
        csv: "account,label,classification\n9200,Only one row,expense",
        mapping: fullSource.mapping,
      }),
    /retain all 3 source rows/,
  );
  assert.equal(ledger.importBatch(original.id).status, "staged");
  const corrected = ledger.stageImport({
    template_key: fullSource.template_key,
    restaged_from_batch_id: fullSource.source_batch_id,
    filename: fullSource.filename,
    mapping: fullSource.mapping,
    csv: [
      "account,label,classification",
      "9100,Valid row,expense",
      "9200,Fixed missing code,expense",
      "9300,Fixed duplicate code,expense",
    ].join("\n"),
  });
  assert.equal(corrected.restaged_from_batch_id, original.id);
  assert.equal(corrected.valid_count, 3);
  assert.equal(ledger.importBatch(original.id).status, "rejected");
  assert.ok(
    ledger
      .importBatch(original.id)
      .exceptions.every(
        (item) => item.status === "acknowledged" && item.resolution.includes(corrected.id),
      ),
  );
  assert.throws(() => ledger.importCorrectionSource(original.id), /not eligible/);

  const partial = ledger.stageImport({
    template_key: "chart_of_accounts",
    filename: "partially-applied-accounts.csv",
    csv: [
      "code,name,type",
      "9400,Applied row,expense",
      ",Missing code,expense",
      "9400,Duplicate applied row,expense",
    ].join("\n"),
  });
  ledger.approveImport({ id: partial.id, apply_valid_rows: true });
  ledger.applyImport(partial.id);
  const exceptionSource = ledger.importCorrectionSource(partial.id);
  assert.equal(exceptionSource.scope, "exception_rows");
  assert.equal(exceptionSource.row_count, 2);
  assert.deepEqual(exceptionSource.source_row_numbers, [3, 4]);
  const exceptionCorrection = ledger.stageImport({
    template_key: exceptionSource.template_key,
    restaged_from_batch_id: exceptionSource.source_batch_id,
    filename: exceptionSource.filename,
    mapping: exceptionSource.mapping,
    csv: ["code,name,type", "9500,Fixed missing,expense", "9600,Fixed duplicate,expense"].join(
      "\n",
    ),
  });
  assert.equal(exceptionCorrection.valid_count, 2);
  assert.equal(ledger.importBatch(partial.id).status, "applied");
  ledger.close();
});

test("approved valid subset applies once and exact file replay is rejected", () => {
  const ledger = createLedger(":memory:");
  const input = {
    template_key: "chart_of_accounts",
    filename: "accounts.csv",
    csv: "code,name,type\n9010,Customer success,expense\n9010,Duplicate,expense",
  };
  const staged = ledger.stageImport(input);
  ledger.approveImport({ id: staged.id, apply_valid_rows: true });
  const applied = ledger.applyImport(staged.id);
  assert.equal(applied.status, "applied");
  assert.equal(applied.applied_count, 1);
  assert.equal(ledger.getAccounts().filter((account) => account.code === "9010").length, 1);
  assert.equal(ledger.applyImport(staged.id).applied_count, 1);
  assert.throws(() => ledger.stageImport(input), /already staged/);
  ledger.close();
});

test("runtime apply failure rolls the entire valid batch back and creates a blocking exception", () => {
  const ledger = createLedger(":memory:");
  const staged = ledger.stageImport({
    template_key: "chart_of_accounts",
    filename: "atomic.csv",
    csv: "code,name,type\n9020,Would roll back,expense\n1000,Conflicts at apply,asset",
  });
  ledger.approveImport({ id: staged.id });
  assert.throws(() => ledger.applyImport(staged.id), /UNIQUE constraint failed/);
  assert.equal(
    ledger.getAccounts().some((account) => account.code === "9020"),
    false,
  );
  const failed = ledger.importBatch(staged.id);
  assert.equal(failed.status, "failed");
  assert.equal(
    failed.exceptions.some((item) => item.code === "APPLY_FAILED"),
    true,
  );
  ledger.close();
});

test("journal import creates balanced drafts with source lineage", () => {
  const ledger = createLedger(":memory:");
  const staged = ledger.stageImport({
    template_key: "journals",
    filename: "journal.csv",
    csv: "date,memo,debit_account_code,credit_account_code,amount_cents,external_id\n2026-08-23,Accrual,5100,2000,12500,j-1",
  });
  ledger.approveImport({ id: staged.id });
  const applied = ledger.applyImport(staged.id);
  const row = applied.rows[0];
  const journal = ledger.getJournal(Number(row.applied_entity_id));
  assert.equal(journal.status, "draft");
  assert.equal(journal.source, "journal_import");
  assert.equal(
    journal.lines.reduce((sum, line) => sum + line.debit_cents - line.credit_cents, 0),
    0,
  );
  ledger.close();
});

test("bank import applies as one atomic statement and matches unique posted cash", () => {
  const ledger = createLedger(":memory:");
  const cash = ledger.getAccounts().find((account) => account.code === "1000");
  const staged = ledger.stageImport({
    template_key: "bank_transactions",
    filename: "bank.csv",
    options: {
      cash_account_id: cash.id,
      start_date: "2026-06-01",
      end_date: "2026-06-30",
      opening_cents: 0,
      closing_cents: 25_000_000,
    },
    csv: "date,description,amount,external_id\n2026-06-01,Founder deposit,250000,bank-import-1",
  });
  ledger.approveImport({ id: staged.id });
  const applied = ledger.applyImport(staged.id);
  assert.equal(applied.status, "applied");
  assert.equal(ledger.bankStatements()[0].status, "reconciled");
  ledger.close();
});

test("entity templates apply customers, contracts, invoices, payments, investments and fixed assets", () => {
  const ledger = createLedger(":memory:");
  const apply = (template_key, filename, csv) => {
    const staged = ledger.stageImport({ template_key, filename, csv });
    ledger.approveImport({ id: staged.id });
    return ledger.applyImport(staged.id);
  };

  const customer = apply(
    "customers",
    "customers.csv",
    "name,segment,region,external_id\nImport Customer,enterprise,West,c-import-1",
  );
  assert.equal(customer.rows[0].applied_entity_type, "customer");
  const customerId = Number(customer.rows[0].applied_entity_id);

  const contract = apply(
    "contracts",
    "contracts.csv",
    [
      "customer_id,entity_id,contract_number,signed_date,start_date,end_date,transaction_price_cents,obligation_description,ssp_cents,recognition_method",
      `${customerId},1,IMP-CON-1,2026-08-01,2026-08-01,2026-08-31,120000,Implementation service,120000,point_in_time`,
    ].join("\n"),
  );
  const contractId = Number(contract.rows[0].applied_entity_id);
  assert.equal(ledger.getContract(contractId).contract_number, "IMP-CON-1");

  const invoice = apply(
    "invoices",
    "invoices.csv",
    `contract_id,invoice_number,invoice_date,due_date,amount_cents,tax_cents\n${contractId},IMP-INV-1,2026-08-01,2026-08-31,120000,0`,
  );
  assert.equal(invoice.rows[0].applied_entity_type, "invoice");

  const payment = apply(
    "payments",
    "payments.csv",
    `customer_id,entity_id,payment_number,payment_date,amount_cents,method,reference\n${customerId},1,IMP-PAY-1,2026-08-15,120000,ach,bank-ref-1`,
  );
  assert.equal(payment.rows[0].applied_entity_type, "payment");

  const investment = apply(
    "investments",
    "investments.csv",
    "instrument_number,name,issuer,security_type,accounting_model,acquisition_date,maturity_date,face_value_cents,policy_basis\nIMP-EQ-1,Imported equity,Issuer Inc,equity,equity_fair_value,2026-08-01,,,Quoted ownership interest is measured under ASC 321.",
  );
  assert.equal(investment.rows[0].applied_entity_type, "investment");

  const fixedAsset = apply(
    "fixed_assets",
    "fixed-assets.csv",
    "asset_number,class_code,description,acquisition_date,placed_in_service_date,cost_cents,useful_life_months,qualifying_ppe,policy_basis\nIMP-FA-1,COMPUTER,Imported server,2026-08-01,2026-08-01,500000,36,true,Invoice and receiving evidence support capitalization.",
  );
  assert.equal(fixedAsset.rows[0].applied_entity_type, "fixed_asset");
  assert.equal(ledger.verifyIntegrity().valid, true);
  ledger.close();
});

test("opening-balance template creates a controlled balanced draft", () => {
  const ledger = createLedger(":memory:");
  const staged = ledger.stageImport({
    template_key: "opening_balances",
    filename: "opening.csv",
    csv: "date,memo,account_code,offset_account_code,amount_cents,side,external_id\n2026-01-01,Opening prepaid,1200,3000,25000,debit,open-1",
  });
  ledger.approveImport({ id: staged.id });
  const applied = ledger.applyImport(staged.id);
  const journal = ledger.getJournal(Number(applied.rows[0].applied_entity_id));
  assert.equal(journal.status, "draft");
  assert.equal(journal.source, "opening_balance_import");
  ledger.close();
});
