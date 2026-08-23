import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { currentActor } from "./request-context.js";

const accountTypes = ["asset", "liability", "equity", "revenue", "expense"];
const recognitionMethods = ["straight_line", "point_in_time", "usage", "milestone"];
const templateDefinitions = {
  chart_of_accounts: template(
    "Chart of accounts",
    "account",
    [
      field("code", "Account code", "string", true),
      field("name", "Account name", "string", true),
      field("type", "Account type", "enum", true, { values: accountTypes }),
    ],
    ["code"],
  ),
  opening_balances: template(
    "Opening balances",
    "journal",
    [
      field("date", "Effective date", "date", true),
      field("memo", "Memo", "string", true),
      field("account_code", "Account code", "string", true),
      field("offset_account_code", "Offset account code", "string", true),
      field("amount_cents", "Amount in cents", "cents", true),
      field("side", "Debit or credit", "enum", true, { values: ["debit", "credit"] }),
      field("external_id", "Source ID", "string", true),
    ],
    ["external_id"],
  ),
  customers: template(
    "Customers",
    "customer",
    [
      field("name", "Customer name", "string", true),
      field("segment", "Segment", "string", false),
      field("region", "Region", "string", false),
      field("external_id", "Source ID", "string", true),
    ],
    ["external_id"],
  ),
  contracts: template(
    "Customer contracts",
    "contract",
    [
      field("customer_id", "Customer ID", "integer", true),
      field("entity_id", "Entity ID", "integer", true),
      field("contract_number", "Contract number", "string", true),
      field("signed_date", "Signed date", "date", true),
      field("start_date", "Service start", "date", true),
      field("end_date", "Service end", "date", true),
      field("transaction_price_cents", "Transaction price in cents", "cents", true),
      field("obligation_description", "Performance obligation", "string", true),
      field("ssp_cents", "Standalone selling price in cents", "cents", true),
      field("recognition_method", "Recognition method", "enum", true, {
        values: recognitionMethods,
      }),
    ],
    ["contract_number"],
  ),
  invoices: template(
    "Invoices",
    "invoice",
    [
      field("contract_id", "Contract ID", "integer", true),
      field("invoice_number", "Invoice number", "string", true),
      field("invoice_date", "Invoice date", "date", true),
      field("due_date", "Due date", "date", false),
      field("amount_cents", "Subtotal in cents", "cents", true),
      field("tax_cents", "Tax in cents", "cents", false),
    ],
    ["invoice_number"],
  ),
  payments: template(
    "Customer payments",
    "payment",
    [
      field("customer_id", "Customer ID", "integer", true),
      field("entity_id", "Entity ID", "integer", false),
      field("payment_number", "Payment number", "string", true),
      field("payment_date", "Payment date", "date", true),
      field("amount_cents", "Amount in cents", "cents", true),
      field("method", "Payment method", "string", false),
      field("reference", "Bank reference", "string", false),
    ],
    ["payment_number"],
  ),
  bank_transactions: template(
    "Bank transactions",
    "bank_statement",
    [
      field("date", "Transaction date", "date", true),
      field("description", "Description", "string", true),
      field("amount", "Amount in currency units", "decimal", true),
      field("external_id", "Bank transaction ID", "string", true),
    ],
    ["external_id"],
    {
      required_options: [
        "cash_account_id",
        "start_date",
        "end_date",
        "opening_cents",
        "closing_cents",
      ],
    },
  ),
  journals: template(
    "Two-sided journal drafts",
    "journal",
    [
      field("date", "Journal date", "date", true),
      field("memo", "Memo", "string", true),
      field("debit_account_code", "Debit account code", "string", true),
      field("credit_account_code", "Credit account code", "string", true),
      field("amount_cents", "Amount in cents", "cents", true),
      field("external_id", "Source ID", "string", true),
    ],
    ["external_id"],
  ),
  investments: template(
    "Investment instruments",
    "investment",
    [
      field("instrument_number", "Instrument number", "string", true),
      field("name", "Instrument name", "string", true),
      field("issuer", "Issuer", "string", true),
      field("security_type", "Security type", "string", true),
      field("accounting_model", "Accounting model", "string", true),
      field("acquisition_date", "Acquisition date", "date", true),
      field("maturity_date", "Maturity date", "date", false),
      field("face_value_cents", "Face value in cents", "cents", false),
      field("policy_basis", "Classification policy basis", "string", true),
    ],
    ["instrument_number"],
  ),
  fixed_assets: template(
    "Fixed assets",
    "fixed_asset",
    [
      field("asset_number", "Asset number", "string", true),
      field("class_code", "Asset class code", "string", true),
      field("description", "Description", "string", true),
      field("acquisition_date", "Acquisition date", "date", true),
      field("placed_in_service_date", "Placed in service date", "date", false),
      field("cost_cents", "Cost in cents", "cents", true),
      field("useful_life_months", "Useful life in months", "integer", false),
      field("qualifying_ppe", "Qualifies as PP&E", "boolean", true),
      field("policy_basis", "Capitalization policy basis", "string", true),
    ],
    ["asset_number"],
  ),
};

export function migrateImports(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      template_key TEXT NOT NULL,
      template_version INTEGER NOT NULL,
      filename TEXT NOT NULL,
      file_sha256 TEXT NOT NULL,
      mapping_json TEXT NOT NULL,
      mapping_profile_id TEXT,
      mapping_profile_version INTEGER,
      restaged_from_batch_id TEXT,
      duplicate_policy_version INTEGER,
      duplicate_policy_json TEXT,
      options_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'staged' CHECK(status IN ('staged','approved','applying','applied','failed','rejected')),
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
    );
    CREATE TABLE IF NOT EXISTS import_rows (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES import_batches(id),
      row_number INTEGER NOT NULL,
      raw_json TEXT NOT NULL,
      normalized_json TEXT NOT NULL,
      row_sha256 TEXT NOT NULL,
      natural_key TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('valid','error','duplicate','applied')),
      errors_json TEXT NOT NULL DEFAULT '[]',
      duplicate_evidence_json TEXT,
      applied_entity_type TEXT,
      applied_entity_id TEXT,
      applied_at TEXT,
      UNIQUE(batch_id,row_number)
    );
    CREATE TABLE IF NOT EXISTS import_applied_keys (
      template_key TEXT NOT NULL,
      natural_key TEXT NOT NULL,
      row_sha256 TEXT NOT NULL,
      batch_id TEXT NOT NULL REFERENCES import_batches(id),
      row_id TEXT NOT NULL REFERENCES import_rows(id),
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(template_key,natural_key)
    );
    CREATE TABLE IF NOT EXISTS import_mapping_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      template_key TEXT NOT NULL,
      template_version INTEGER NOT NULL,
      mapping_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name,template_key,version)
    );
    CREATE TABLE IF NOT EXISTS import_exceptions (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES import_batches(id),
      row_id TEXT REFERENCES import_rows(id),
      severity TEXT NOT NULL CHECK(severity IN ('warning','error','blocking')),
      code TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved','ignored')),
      owner TEXT,
      resolution TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS import_duplicate_policies (
      template_key TEXT NOT NULL,
      field_key TEXT NOT NULL,
      threshold_percent INTEGER NOT NULL CHECK(threshold_percent BETWEEN 70 AND 99),
      active INTEGER NOT NULL DEFAULT 1,
      version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(template_key,version)
    );
    CREATE TABLE IF NOT EXISTS import_duplicate_index (
      template_key TEXT NOT NULL,
      policy_version INTEGER NOT NULL,
      row_id TEXT NOT NULL REFERENCES import_rows(id),
      batch_id TEXT NOT NULL REFERENCES import_batches(id),
      natural_key TEXT NOT NULL,
      normalized_value TEXT NOT NULL,
      PRIMARY KEY(template_key,policy_version,row_id)
    );
    CREATE TABLE IF NOT EXISTS import_duplicate_terms (
      template_key TEXT NOT NULL,
      policy_version INTEGER NOT NULL,
      row_id TEXT NOT NULL,
      term TEXT NOT NULL,
      PRIMARY KEY(template_key,policy_version,row_id,term)
    );
    CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(status,created_at);
    CREATE INDEX IF NOT EXISTS idx_import_rows_batch_status ON import_rows(batch_id,status,row_number);
    CREATE INDEX IF NOT EXISTS idx_import_exceptions_status ON import_exceptions(status,severity,created_at);
    CREATE INDEX IF NOT EXISTS idx_import_duplicate_terms_lookup ON import_duplicate_terms(template_key,policy_version,term,row_id);
  `);
  const batchColumns = new Set(
    db
      .prepare("PRAGMA table_info(import_batches)")
      .all()
      .map((column) => column.name),
  );
  if (!batchColumns.has("mapping_profile_id"))
    db.exec("ALTER TABLE import_batches ADD COLUMN mapping_profile_id TEXT");
  if (!batchColumns.has("mapping_profile_version"))
    db.exec("ALTER TABLE import_batches ADD COLUMN mapping_profile_version INTEGER");
  if (!batchColumns.has("restaged_from_batch_id"))
    db.exec("ALTER TABLE import_batches ADD COLUMN restaged_from_batch_id TEXT");
  if (!batchColumns.has("duplicate_policy_version"))
    db.exec("ALTER TABLE import_batches ADD COLUMN duplicate_policy_version INTEGER");
  if (!batchColumns.has("duplicate_policy_json"))
    db.exec("ALTER TABLE import_batches ADD COLUMN duplicate_policy_json TEXT");
  const rowColumns = new Set(
    db
      .prepare("PRAGMA table_info(import_rows)")
      .all()
      .map((column) => column.name),
  );
  if (!rowColumns.has("duplicate_evidence_json"))
    db.exec("ALTER TABLE import_rows ADD COLUMN duplicate_evidence_json TEXT");
}

export function createImportsRepository(db, ledger) {
  function importTemplateCatalog() {
    return Object.entries(templateDefinitions).map(([key, definition]) => ({
      key,
      version: definition.version,
      name: definition.name,
      entity_type: definition.entity_type,
      fields: definition.fields,
      sample_header: definition.fields.map((item) => item.key).join(","),
      required_options: definition.required_options || [],
    }));
  }

  function stageImport(input, { returnExisting = false } = {}) {
    const definition = definitionFor(input.template_key);
    const csv = z.string().min(1).max(5_000_000).parse(input.csv);
    const filename = safeFilename(input.filename || `${input.template_key}.csv`);
    const hash = sha256(csv);
    const prior = db
      .prepare("SELECT id,status FROM import_batches WHERE template_key=? AND file_sha256=?")
      .get(input.template_key, hash);
    if (prior) {
      if (returnExisting) return importBatch(prior.id);
      throw bad(`This exact file was already staged as batch ${prior.id}`, 409);
    }
    const parsed = parseCsv(csv);
    if (!parsed.rows.length) throw bad("Import file has no data rows");
    if (parsed.rows.length > 10_000) throw bad("Import files are limited to 10,000 rows");
    const mappingProfileId = input.mapping_profile_id
      ? z.string().uuid().parse(input.mapping_profile_id)
      : null;
    const mappingProfile = mappingProfileId
      ? db
          .prepare("SELECT * FROM import_mapping_profiles WHERE id=? AND active=1")
          .get(mappingProfileId)
      : null;
    if (mappingProfileId && !mappingProfile) throw bad("Import mapping profile not found", 404);
    if (
      mappingProfile &&
      (mappingProfile.template_key !== input.template_key ||
        mappingProfile.template_version !== definition.version)
    )
      throw bad("Import mapping profile does not match this template version", 409);
    const profileMapping = mappingProfile
      ? validateMapping(definition, parsed.headers, JSON.parse(mappingProfile.mapping_json))
      : null;
    const suppliedMapping = input.mapping
      ? validateMapping(definition, parsed.headers, input.mapping)
      : null;
    if (
      profileMapping &&
      suppliedMapping &&
      stableJson(profileMapping) !== stableJson(suppliedMapping)
    )
      throw bad("A versioned mapping profile cannot be overridden during staging", 409);
    const mapping =
      profileMapping || suppliedMapping || validateMapping(definition, parsed.headers, {});
    const options = z.record(z.string(), z.unknown()).parse(input.options || {});
    for (const option of definition.required_options || [])
      if (options[option] === undefined || options[option] === "")
        throw bad(`Import requires option ${option}`);
    const restagedFromBatchId = input.restaged_from_batch_id
      ? z.string().uuid().parse(input.restaged_from_batch_id)
      : null;
    const restagedFrom = restagedFromBatchId
      ? db.prepare("SELECT * FROM import_batches WHERE id=?").get(restagedFromBatchId)
      : null;
    if (restagedFromBatchId && !restagedFrom) throw bad("Source import batch not found", 404);
    if (restagedFrom && restagedFrom.template_key !== input.template_key)
      throw bad("A corrected import must use the source batch template", 409);
    if (restagedFrom && !["staged", "applied", "failed"].includes(restagedFrom.status))
      throw bad("Source batch is not eligible for correction", 409);
    if (
      restagedFrom &&
      restagedFrom.status !== "failed" &&
      !db
        .prepare(
          "SELECT 1 FROM import_rows WHERE batch_id=? AND status IN ('error','duplicate') LIMIT 1",
        )
        .get(restagedFromBatchId)
    )
      throw bad("Source batch has no rows requiring correction", 409);
    const id = randomUUID();
    const staged = [];
    const seen = new Set();
    const duplicatePolicy = activeDuplicatePolicy(input.template_key);
    const inFileCandidates = createCandidateIndex();
    const historicalCandidates = duplicatePolicy
      ? historicalCandidateIndex(input.template_key, duplicatePolicy)
      : null;
    const appliedKeys = new Map(
      db
        .prepare("SELECT natural_key,batch_id FROM import_applied_keys WHERE template_key=?")
        .all(input.template_key)
        .map((row) => [row.natural_key, row.batch_id]),
    );
    for (const [index, raw] of parsed.rows.entries()) {
      const result = normalizeRow(definition, raw, mapping);
      const naturalKey = definition.natural_key
        .map((key) => result.normalized[key] ?? "")
        .join("|");
      const rowHash = sha256(stableJson(result.normalized));
      const alreadyAppliedBatchId = appliedKeys.get(naturalKey);
      const rowId = randomUUID();
      const exactDuplicate = seen.has(naturalKey) || Boolean(alreadyAppliedBatchId);
      const fuzzyDuplicate =
        !result.errors.length && !exactDuplicate && duplicatePolicy
          ? findDuplicateCandidate(
              duplicatePolicy,
              result.normalized,
              inFileCandidates,
              historicalCandidates,
            )
          : null;
      const duplicate = exactDuplicate || Boolean(fuzzyDuplicate);
      const duplicateEvidence = exactDuplicate
        ? {
            kind: "exact",
            natural_key: naturalKey,
            source: alreadyAppliedBatchId ? "applied_import" : "current_file",
            batch_id: alreadyAppliedBatchId || null,
          }
        : fuzzyDuplicate;
      seen.add(naturalKey);
      const stagedRow = {
        id: rowId,
        row_number: index + 2,
        raw,
        normalized: result.normalized,
        row_hash: rowHash,
        natural_key: naturalKey,
        status: result.errors.length ? "error" : duplicate ? "duplicate" : "valid",
        errors: result.errors.length
          ? result.errors
          : duplicate
            ? [
                exactDuplicate && alreadyAppliedBatchId
                  ? "Natural key was previously applied"
                  : exactDuplicate
                    ? "Duplicate natural key in file"
                    : fuzzyDuplicate.message,
              ]
            : [],
        duplicate_evidence: duplicateEvidence,
      };
      staged.push(stagedRow);
      if (!result.errors.length && duplicatePolicy)
        addCandidate(inFileCandidates, duplicatePolicy, stagedRow);
    }
    if (restagedFrom) {
      const expectedRows =
        restagedFrom.status === "applied"
          ? Number(
              db
                .prepare(
                  "SELECT COUNT(*) AS count FROM import_rows WHERE batch_id=? AND status IN ('error','duplicate')",
                )
                .get(restagedFromBatchId).count,
            )
          : restagedFrom.row_count;
      if (staged.length !== expectedRows)
        throw bad(`Corrected import must retain all ${expectedRows} source rows`, 409);
    }
    const validCount = staged.filter((row) => row.status === "valid").length;
    const errorCount = staged.filter((row) => row.status === "error").length;
    const duplicateCount = staged.filter((row) => row.status === "duplicate").length;
    db.exec("BEGIN IMMEDIATE");
    try {
      if (restagedFrom) {
        const lockedSource = db
          .prepare("SELECT status FROM import_batches WHERE id=?")
          .get(restagedFromBatchId);
        if (!lockedSource || lockedSource.status !== restagedFrom.status)
          throw bad("Source batch changed while the correction was being staged", 409);
      }
      db.prepare(
        `INSERT INTO import_batches(id,template_key,template_version,filename,file_sha256,mapping_json,mapping_profile_id,mapping_profile_version,restaged_from_batch_id,duplicate_policy_version,duplicate_policy_json,options_json,row_count,valid_count,error_count,duplicate_count,created_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        id,
        input.template_key,
        definition.version,
        filename,
        hash,
        JSON.stringify(mapping),
        mappingProfile?.id || null,
        mappingProfile?.version || null,
        restagedFromBatchId,
        duplicatePolicy?.version || null,
        duplicatePolicy ? JSON.stringify(duplicatePolicy) : null,
        JSON.stringify(options),
        staged.length,
        validCount,
        errorCount,
        duplicateCount,
        currentActor(),
      );
      const insertRow = db.prepare(
        `INSERT INTO import_rows(id,batch_id,row_number,raw_json,normalized_json,row_sha256,natural_key,status,errors_json,duplicate_evidence_json)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
      );
      const insertException = db.prepare(
        `INSERT INTO import_exceptions(id,batch_id,row_id,severity,code,message) VALUES(?,?,?,?,?,?)`,
      );
      for (const row of staged) {
        insertRow.run(
          row.id,
          id,
          row.row_number,
          JSON.stringify(row.raw),
          JSON.stringify(row.normalized),
          row.row_hash,
          row.natural_key,
          row.status,
          JSON.stringify(row.errors),
          row.duplicate_evidence ? JSON.stringify(row.duplicate_evidence) : null,
        );
        if (row.status !== "valid")
          insertException.run(
            randomUUID(),
            id,
            row.id,
            row.status === "error" || row.duplicate_evidence?.kind === "exact"
              ? "blocking"
              : "warning",
            row.status === "error"
              ? "ROW_VALIDATION"
              : row.duplicate_evidence?.kind === "fuzzy"
                ? "FUZZY_DUPLICATE"
                : "EXACT_DUPLICATE",
            row.errors.join("; "),
          );
      }
      if (restagedFrom?.status === "staged") {
        db.prepare(
          "UPDATE import_batches SET status='rejected' WHERE id=? AND status='staged'",
        ).run(restagedFromBatchId);
        db.prepare(
          `UPDATE import_exceptions
           SET status='acknowledged',owner=?,resolution=?,updated_at=CURRENT_TIMESTAMP
           WHERE batch_id=? AND status='open'`,
        ).run(currentActor(), `Superseded by corrected batch ${id}`, restagedFromBatchId);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return importBatch(id);
  }

  function approveImport(input) {
    const batch = importBatch(input.id);
    if (batch.status !== "staged") throw bad("Only a staged import can be approved", 409);
    if (!batch.valid_count) throw bad("Import has no valid rows to apply", 409);
    const allowPartial = Boolean(input.apply_valid_rows);
    if ((batch.error_count || batch.duplicate_count) && !allowPartial)
      throw bad("Import contains exceptions; explicitly approve applying only valid rows", 409);
    db.prepare(
      "UPDATE import_batches SET status='approved',allow_partial=?,approved_by=?,approved_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(allowPartial ? 1 : 0, currentActor(), batch.id);
    return importBatch(batch.id);
  }

  function applyImport(id) {
    const batch = importBatch(id);
    if (batch.status === "applied") return batch;
    if (batch.status !== "approved") throw bad("Import must be approved before application", 409);
    const rows = db
      .prepare("SELECT * FROM import_rows WHERE batch_id=? AND status='valid' ORDER BY row_number")
      .all(id)
      .map(hydrateRow);
    db.prepare("UPDATE import_batches SET status='applying' WHERE id=?").run(id);
    try {
      if (batch.template_key === "bank_transactions") applyBankBatch(batch, rows);
      else {
        db.exec("BEGIN IMMEDIATE");
        try {
          for (const row of rows)
            markApplied(batch, row, applyRow(batch.template_key, row.normalized));
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      }
      db.prepare(
        "UPDATE import_batches SET status='applied',applied_count=?,applied_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(rows.length, id);
      return importBatch(id);
    } catch (error) {
      db.prepare("UPDATE import_batches SET status='failed' WHERE id=?").run(id);
      db.prepare(
        "INSERT INTO import_exceptions(id,batch_id,severity,code,message) VALUES(?,?,'blocking','APPLY_FAILED',?)",
      ).run(randomUUID(), id, String(error.message).slice(0, 500));
      throw error;
    }
  }

  function applyBankBatch(batch, rows) {
    const options = batch.options;
    const csv = [
      "date,description,amount,external_id",
      ...rows.map(({ normalized: row }) =>
        [row.date, csvCell(row.description), row.amount, csvCell(row.external_id)].join(","),
      ),
    ].join("\n");
    db.exec("BEGIN IMMEDIATE");
    try {
      const statement = ledger.importBankStatement({ ...options, csv });
      for (const row of rows)
        markApplied(batch, row, { entity_type: "bank_statement", id: statement.id });
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function applyRow(key, row) {
    if (key === "chart_of_accounts") return entity("account", ledger.createAccount(row));
    if (key === "customers") {
      const result = db
        .prepare("INSERT INTO customers(name,segment,region) VALUES(?,?,?)")
        .run(row.name, row.segment || "SMB", row.region || "Unknown");
      const id = Number(result.lastInsertRowid);
      db.prepare(
        "INSERT INTO audit_log(entity_type,entity_id,action,actor,payload) VALUES('customer',?,'imported',?,?)",
      ).run(id, currentActor(), JSON.stringify(row));
      return { entity_type: "customer", id };
    }
    if (key === "opening_balances") {
      const amount = row.amount_cents;
      return entity(
        "journal",
        ledger.createDraft({
          date: row.date,
          memo: row.memo,
          source: "opening_balance_import",
          lines:
            row.side === "debit"
              ? [debit(row.account_code, amount), credit(row.offset_account_code, amount)]
              : [credit(row.account_code, amount), debit(row.offset_account_code, amount)],
        }),
      );
    }
    if (key === "journals")
      return entity(
        "journal",
        ledger.createDraft({
          date: row.date,
          memo: row.memo,
          source: "journal_import",
          lines: [
            debit(row.debit_account_code, row.amount_cents),
            credit(row.credit_account_code, row.amount_cents),
          ],
        }),
      );
    if (key === "contracts")
      return entity(
        "contract",
        ledger.createContract({
          ...row,
          obligations: [
            {
              description: row.obligation_description,
              ssp_cents: row.ssp_cents,
              recognition_method: row.recognition_method,
            },
          ],
        }),
      );
    if (key === "invoices") return entity("invoice", ledger.createInvoice(row));
    if (key === "payments") return entity("payment", ledger.recordPayment(row));
    if (key === "investments") return entity("investment", ledger.createInvestment(row));
    if (key === "fixed_assets") return entity("fixed_asset", ledger.acquireFixedAsset(row));
    throw bad(`Unsupported import template ${key}`);
  }

  function markApplied(batch, row, applied) {
    db.prepare(
      "INSERT INTO import_applied_keys(template_key,natural_key,row_sha256,batch_id,row_id,entity_type,entity_id) VALUES(?,?,?,?,?,?,?)",
    ).run(
      batch.template_key,
      row.natural_key,
      row.row_sha256,
      batch.id,
      row.id,
      applied.entity_type,
      String(applied.id),
    );
    db.prepare(
      "UPDATE import_rows SET status='applied',applied_entity_type=?,applied_entity_id=?,applied_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(applied.entity_type, String(applied.id), row.id);
    const policy = activeDuplicatePolicy(batch.template_key);
    if (policy) indexAppliedCandidate(batch.template_key, policy, row);
  }

  function importBatch(id, input = {}) {
    const row = db.prepare("SELECT * FROM import_batches WHERE id=?").get(id);
    if (!row) throw bad("Import batch not found", 404);
    const page = boundedInteger(input.page, 1, 1, 100_000);
    const pageSize = boundedInteger(input.page_size, 100, 25, 250);
    const totalRows = Number(
      db.prepare("SELECT COUNT(*) AS count FROM import_rows WHERE batch_id=?").get(id).count,
    );
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    if (page > totalPages) throw bad("Import preview page is out of range", 404);
    const offset = (page - 1) * pageSize;
    return {
      ...row,
      mapping: JSON.parse(row.mapping_json),
      options: JSON.parse(row.options_json),
      duplicate_policy: row.duplicate_policy_json ? JSON.parse(row.duplicate_policy_json) : null,
      rows: db
        .prepare("SELECT * FROM import_rows WHERE batch_id=? ORDER BY row_number LIMIT ? OFFSET ?")
        .all(id, pageSize, offset)
        .map(hydrateRow),
      row_page: {
        page,
        page_size: pageSize,
        total_rows: totalRows,
        total_pages: totalPages,
        from: totalRows ? offset + 1 : 0,
        to: Math.min(offset + pageSize, totalRows),
      },
      exceptions: db
        .prepare("SELECT * FROM import_exceptions WHERE batch_id=? ORDER BY created_at,id")
        .all(id),
    };
  }

  function importCorrectionSource(id) {
    const batch = db.prepare("SELECT * FROM import_batches WHERE id=?").get(id);
    if (!batch) throw bad("Import batch not found", 404);
    if (!["staged", "applied", "failed"].includes(batch.status))
      throw bad("Import batch is not eligible for correction", 409);
    const includeAllUnapplied = ["staged", "failed"].includes(batch.status) ? 1 : 0;
    const rows = db
      .prepare(
        `SELECT raw_json,row_number,status FROM import_rows
         WHERE batch_id=? AND (status IN ('error','duplicate') OR (?=1 AND status='valid'))
         ORDER BY row_number`,
      )
      .all(id, includeAllUnapplied)
      .map((row) => ({ ...row, raw: JSON.parse(row.raw_json) }));
    if (!rows.length) throw bad("Import batch has no rows requiring correction", 409);
    const headers = [];
    const seen = new Set();
    for (const row of rows)
      for (const header of Object.keys(row.raw))
        if (!seen.has(header)) {
          seen.add(header);
          headers.push(header);
        }
    const csv = [
      headers.map(csvCell).join(","),
      ...rows.map((row) => headers.map((header) => csvCell(row.raw[header])).join(",")),
    ].join("\n");
    const stem = batch.filename.replace(/\.csv$/i, "");
    return {
      source_batch_id: batch.id,
      source_filename: batch.filename,
      template_key: batch.template_key,
      template_version: batch.template_version,
      filename: safeFilename(`${stem}.corrected.csv`),
      mapping: JSON.parse(batch.mapping_json),
      options: JSON.parse(batch.options_json),
      csv,
      row_count: rows.length,
      scope: includeAllUnapplied ? "full_replacement" : "exception_rows",
      source_row_numbers: rows.map((row) => row.row_number),
    };
  }

  function importBatches() {
    return db
      .prepare("SELECT * FROM import_batches ORDER BY created_at DESC,id DESC LIMIT 100")
      .all()
      .map((row) => ({
        ...row,
        mapping: JSON.parse(row.mapping_json),
        options: JSON.parse(row.options_json),
        duplicate_policy: row.duplicate_policy_json ? JSON.parse(row.duplicate_policy_json) : null,
      }));
  }

  function createImportMappingProfile(input) {
    const definition = definitionFor(input.template_key);
    const mapping = z.record(z.string(), z.string()).parse(input.mapping);
    const allowedTargets = new Set(definition.fields.map((item) => item.key));
    for (const [target, source] of Object.entries(mapping)) {
      if (!allowedTargets.has(target)) throw bad(`Unknown template field ${target}`);
      if (!/^[A-Za-z0-9_. -]{1,160}$/.test(source))
        throw bad(`Invalid source column for ${target}`);
    }
    const version = Number(input.version || 1);
    if (!Number.isSafeInteger(version) || version < 1)
      throw bad("Mapping version must be positive");
    const id = randomUUID();
    db.prepare(
      "INSERT INTO import_mapping_profiles(id,name,template_key,template_version,mapping_json,version,created_by) VALUES(?,?,?,?,?,?,?)",
    ).run(
      id,
      z.string().trim().min(2).max(120).parse(input.name),
      input.template_key,
      definition.version,
      JSON.stringify(mapping),
      version,
      currentActor(),
    );
    return db.prepare("SELECT * FROM import_mapping_profiles WHERE id=?").get(id);
  }

  function importMappingProfiles() {
    return db
      .prepare(
        "SELECT * FROM import_mapping_profiles WHERE active=1 ORDER BY template_key,name,version DESC",
      )
      .all()
      .map((row) => ({ ...row, mapping: JSON.parse(row.mapping_json) }));
  }

  function importExceptions(input) {
    const order =
      "ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'acknowledged' THEN 1 ELSE 2 END,created_at DESC,id";
    if (!input) return db.prepare(`SELECT * FROM import_exceptions ${order}`).all();
    const status = z
      .enum(["open", "acknowledged", "resolved", "ignored", "all"])
      .parse(input.status || "open");
    const requestedPage = boundedInteger(input.page, 1, 1, 100_000);
    const pageSize = boundedInteger(input.page_size, 20, 10, 100);
    const where = status === "all" ? "" : "WHERE status=?";
    const parameters = status === "all" ? [] : [status];
    const total = Number(
      db.prepare(`SELECT COUNT(*) AS count FROM import_exceptions ${where}`).get(...parameters)
        .count,
    );
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;
    return {
      items: db
        .prepare(`SELECT * FROM import_exceptions ${where} ${order} LIMIT ? OFFSET ?`)
        .all(...parameters, pageSize, offset),
      page: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPages,
        from: total ? offset + 1 : 0,
        to: Math.min(offset + pageSize, total),
      },
      open_total: Number(
        db.prepare("SELECT COUNT(*) AS count FROM import_exceptions WHERE status='open'").get()
          .count,
      ),
    };
  }

  function resolveImportException(input) {
    const status = z.enum(["acknowledged", "resolved", "ignored"]).parse(input.status);
    const result = db
      .prepare(
        "UPDATE import_exceptions SET status=?,owner=?,resolution=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .run(status, currentActor(), input.resolution || null, input.id);
    if (!result.changes) throw bad("Import exception not found", 404);
    return db.prepare("SELECT * FROM import_exceptions WHERE id=?").get(input.id);
  }

  function importDuplicatePolicies() {
    return db
      .prepare(
        `SELECT p.*,
          (SELECT COUNT(*) FROM import_duplicate_index i
           WHERE i.template_key=p.template_key AND i.policy_version=p.version) indexed_rows
         FROM import_duplicate_policies p
         WHERE p.version=(SELECT MAX(latest.version) FROM import_duplicate_policies latest
                          WHERE latest.template_key=p.template_key)
         ORDER BY p.template_key`,
      )
      .all()
      .map((policy) => ({ ...policy, active: Boolean(policy.active) }));
  }

  function configureImportDuplicatePolicy(input) {
    const definition = definitionFor(input.template_key);
    const fieldKey = z.string().trim().min(1).max(120).parse(input.field_key);
    const fieldDefinition = definition.fields.find((item) => item.key === fieldKey);
    if (!fieldDefinition || fieldDefinition.type !== "string")
      throw bad("Duplicate matching requires a text field from the selected template");
    const threshold = boundedInteger(input.threshold_percent, 88, 70, 99);
    const active = z.boolean().optional().parse(input.active) ?? true;
    const existing = db
      .prepare("SELECT MAX(version) version FROM import_duplicate_policies WHERE template_key=?")
      .get(input.template_key);
    const version = Number(existing?.version || 0) + 1;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("UPDATE import_duplicate_policies SET active=0 WHERE template_key=?").run(
        input.template_key,
      );
      db.prepare(
        `INSERT INTO import_duplicate_policies(template_key,field_key,threshold_percent,active,version,updated_by)
         VALUES(?,?,?,?,?,?)`,
      ).run(input.template_key, fieldKey, threshold, active ? 1 : 0, version, currentActor());
      db.prepare("DELETE FROM import_duplicate_terms WHERE template_key=?").run(input.template_key);
      db.prepare("DELETE FROM import_duplicate_index WHERE template_key=?").run(input.template_key);
      if (active) {
        const policy = { field_key: fieldKey, threshold_percent: threshold, version };
        const appliedRows = db
          .prepare(
            `SELECT r.* FROM import_rows r
             JOIN import_batches b ON b.id=r.batch_id
             WHERE b.template_key=? AND r.status='applied' ORDER BY r.row_number,r.id`,
          )
          .all(input.template_key)
          .map(hydrateRow);
        for (const row of appliedRows) indexAppliedCandidate(input.template_key, policy, row);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return importDuplicatePolicies().find((item) => item.template_key === input.template_key);
  }

  function acceptImportDuplicate(input) {
    const id = z.string().uuid().parse(input.id);
    const resolution = z.string().trim().min(8).max(500).parse(input.resolution);
    db.exec("BEGIN IMMEDIATE");
    try {
      const item = db
        .prepare(
          `SELECT e.*,r.status row_status,r.natural_key,r.duplicate_evidence_json,b.status batch_status,
             b.template_key
           FROM import_exceptions e JOIN import_rows r ON r.id=e.row_id
           JOIN import_batches b ON b.id=e.batch_id WHERE e.id=?`,
        )
        .get(id);
      if (!item) throw bad("Import exception not found", 404);
      if (item.code !== "FUZZY_DUPLICATE")
        throw bad("Only a fuzzy duplicate candidate can be accepted as distinct", 409);
      if (item.status !== "open" || item.row_status !== "duplicate")
        throw bad("Duplicate candidate is no longer open", 409);
      if (item.batch_status !== "staged")
        throw bad("Only a staged import candidate can be accepted", 409);
      const exactCollision = db
        .prepare("SELECT 1 FROM import_applied_keys WHERE template_key=? AND natural_key=?")
        .get(item.template_key, item.natural_key);
      if (exactCollision) throw bad("Natural key is now an exact applied duplicate", 409);
      db.prepare("UPDATE import_rows SET status='valid',errors_json='[]' WHERE id=?").run(
        item.row_id,
      );
      db.prepare(
        `UPDATE import_batches SET valid_count=valid_count+1,duplicate_count=duplicate_count-1
         WHERE id=? AND status='staged'`,
      ).run(item.batch_id);
      db.prepare(
        `UPDATE import_exceptions SET status='resolved',owner=?,resolution=?,updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND status='open'`,
      ).run(currentActor(), resolution, id);
      db.exec("COMMIT");
      return {
        exception: db.prepare("SELECT * FROM import_exceptions WHERE id=?").get(id),
        batch: importBatch(item.batch_id),
      };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function activeDuplicatePolicy(templateKey) {
    const policy = db
      .prepare(
        `SELECT template_key,field_key,threshold_percent,version FROM import_duplicate_policies
         WHERE template_key=? AND active=1 ORDER BY version DESC LIMIT 1`,
      )
      .get(templateKey);
    return policy || null;
  }

  function findDuplicateCandidate(policy, normalized, inFileCandidates, historicalCandidates) {
    const value = normalizeCandidate(normalized[policy.field_key]);
    if (!value) return null;
    const terms = candidateTerms(value);
    const candidates = new Map();
    for (const term of terms) {
      for (const candidate of inFileCandidates.get(term) || [])
        candidates.set(`file:${candidate.id}`, candidate);
      for (const candidate of historicalCandidates?.get(term) || [])
        candidates.set(`applied:${candidate.row_id}`, { ...candidate, source: "applied_import" });
    }
    let best = null;
    for (const candidate of candidates.values()) {
      const score = similarityPercent(value, candidate.normalized_value);
      if (score < policy.threshold_percent) continue;
      if (!best || score > best.score_percent) best = { ...candidate, score_percent: score };
    }
    if (!best) return null;
    return {
      kind: "fuzzy",
      field_key: policy.field_key,
      value,
      candidate_value: best.normalized_value,
      score_percent: best.score_percent,
      threshold_percent: policy.threshold_percent,
      policy_version: policy.version,
      source: best.source || "current_file",
      candidate_row_id: best.row_id || best.id,
      candidate_batch_id: best.batch_id || null,
      candidate_row_number: best.row_number || null,
      candidate_natural_key: best.natural_key,
      message: `${policy.field_key} is ${best.score_percent}% similar to ${best.source === "applied_import" ? "an applied record" : `CSV row ${best.row_number}`} (threshold ${policy.threshold_percent}%)`,
    };
  }

  function historicalCandidateIndex(templateKey, policy) {
    const index = createCandidateIndex();
    const rows = db
      .prepare(
        `SELECT row_id,batch_id,natural_key,normalized_value
         FROM import_duplicate_index WHERE template_key=? AND policy_version=? ORDER BY row_id`,
      )
      .all(templateKey, policy.version);
    for (const row of rows) addNormalizedCandidate(index, row);
    return index;
  }

  function indexAppliedCandidate(templateKey, policy, row) {
    const value = normalizeCandidate(row.normalized[policy.field_key]);
    if (!value) return;
    db.prepare(
      `INSERT OR REPLACE INTO import_duplicate_index(template_key,policy_version,row_id,batch_id,natural_key,normalized_value)
       VALUES(?,?,?,?,?,?)`,
    ).run(templateKey, policy.version, row.id, row.batch_id, row.natural_key, value);
    const insertTerm = db.prepare(
      `INSERT OR IGNORE INTO import_duplicate_terms(template_key,policy_version,row_id,term)
       VALUES(?,?,?,?)`,
    );
    for (const term of candidateTerms(value))
      insertTerm.run(templateKey, policy.version, row.id, term);
  }

  return {
    importTemplateCatalog,
    stageImport,
    approveImport,
    applyImport,
    importBatch,
    importCorrectionSource,
    importBatches,
    createImportMappingProfile,
    importMappingProfiles,
    importExceptions,
    resolveImportException,
    importDuplicatePolicies,
    configureImportDuplicatePolicy,
    acceptImportDuplicate,
  };

  function accountId(code) {
    const account = db.prepare("SELECT id FROM accounts WHERE code=? AND active=1").get(code);
    if (!account) throw bad(`Active account ${code} was not found`);
    return account.id;
  }
  function debit(code, amount) {
    return { account_id: accountId(code), debit_cents: amount, credit_cents: 0 };
  }
  function credit(code, amount) {
    return { account_id: accountId(code), debit_cents: 0, credit_cents: amount };
  }
}

function normalizeRow(definition, raw, mapping) {
  const normalized = {};
  const errors = [];
  for (const item of definition.fields) {
    const source = mapping[item.key];
    const value = source ? raw[source] : undefined;
    try {
      normalized[item.key] = normalizeValue(item, value);
    } catch (error) {
      errors.push(`${item.label}: ${error.message}`);
    }
  }
  return { normalized, errors };
}

function normalizeValue(field, value) {
  const text = String(value ?? "").trim();
  if (!text) {
    if (field.required) throw new Error("is required");
    return null;
  }
  if (field.type === "string") {
    if (/^[=+\-@]/.test(text)) throw new Error("formula-like text is not allowed");
    if (text.length > 1000) throw new Error("must be 1,000 characters or fewer");
    return text;
  }
  if (field.type === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`)))
      throw new Error("must be a valid YYYY-MM-DD date");
    return text;
  }
  if (field.type === "integer" || field.type === "cents") {
    const number = Number(text);
    if (!Number.isSafeInteger(number)) throw new Error("must be a whole number");
    if (field.type === "cents" && number < 0) throw new Error("cannot be negative");
    return number;
  }
  if (field.type === "decimal") {
    const number = Number(text);
    if (!Number.isFinite(number)) throw new Error("must be numeric");
    return number;
  }
  if (field.type === "boolean") {
    if (["true", "yes", "1"].includes(text.toLowerCase())) return true;
    if (["false", "no", "0"].includes(text.toLowerCase())) return false;
    throw new Error("must be true/false, yes/no, or 1/0");
  }
  if (field.type === "enum") {
    if (!field.values.includes(text)) throw new Error(`must be one of ${field.values.join(", ")}`);
    return text;
  }
  return text;
}

function validateMapping(definition, headers, supplied) {
  const mapping = {};
  const parsed = z.record(z.string(), z.string()).parse(supplied);
  for (const item of definition.fields) {
    const source = parsed[item.key] || item.key;
    if (item.required && !headers.includes(source))
      throw bad(`Map required field ${item.key} to a CSV column`);
    if (source && !headers.includes(source)) throw bad(`Mapped CSV column ${source} was not found`);
    mapping[item.key] = headers.includes(source) ? source : null;
  }
  return mapping;
}

function parseCsv(input) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  const text = input.replace(/^\uFEFF/, "");
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw bad("CSV contains an unterminated quoted field");
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows.shift().map((value) => value.trim());
  if (new Set(headers).size !== headers.length) throw bad("CSV headers must be unique");
  return {
    headers,
    rows: rows.map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    ),
  };
}

function hydrateRow(row) {
  return {
    ...row,
    raw: JSON.parse(row.raw_json),
    normalized: JSON.parse(row.normalized_json),
    errors: JSON.parse(row.errors_json),
    duplicate_evidence: row.duplicate_evidence_json
      ? JSON.parse(row.duplicate_evidence_json)
      : null,
  };
}

function createCandidateIndex() {
  return new Map();
}

function addCandidate(index, policy, row) {
  const normalizedValue = normalizeCandidate(row.normalized[policy.field_key]);
  if (!normalizedValue) return;
  addNormalizedCandidate(index, {
    ...row,
    normalized_value: normalizedValue,
    source: "current_file",
  });
}

function addNormalizedCandidate(index, candidate) {
  for (const term of candidateTerms(candidate.normalized_value)) {
    const entries = index.get(term) || [];
    if (entries.length < 25) entries.push(candidate);
    index.set(term, entries);
  }
}

function normalizeCandidate(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 240);
}

function candidateTerms(value) {
  if (!value) return [];
  const padded = `  ${value}  `;
  const terms = new Set();
  for (let index = 0; index <= padded.length - 3; index += 1)
    terms.add(padded.slice(index, index + 3));
  return [...terms].sort();
}

function similarityPercent(left, right) {
  if (left === right) return 100;
  const leftTerms = new Set(candidateTerms(left));
  const rightTerms = new Set(candidateTerms(right));
  if (!leftTerms.size || !rightTerms.size) return 0;
  let overlap = 0;
  for (const term of leftTerms) if (rightTerms.has(term)) overlap += 1;
  return Math.round((2 * overlap * 100) / (leftTerms.size + rightTerms.size));
}
function definitionFor(key) {
  const definition = templateDefinitions[key];
  if (!definition) throw bad("Unknown import template");
  return definition;
}
function template(name, entityType, fields, naturalKey, options = {}) {
  return { version: 1, name, entity_type: entityType, fields, natural_key: naturalKey, ...options };
}
function field(key, label, type, required, options = {}) {
  return { key, label, type, required, ...options };
}
function entity(entityType, value) {
  return { entity_type: entityType, id: value.id };
}
function stableJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}
function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}
function safeFilename(value) {
  const name = String(value)
    .replaceAll("\\", "/")
    .split("/")
    .pop()
    .replace(/[^A-Za-z0-9._ -]/g, "_")
    .slice(0, 180);
  if (!name || name === "." || name === "..") throw bad("A valid filename is required");
  return name;
}
function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function boundedInteger(value, fallback, minimum, maximum) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum)
    throw bad(`Value must be a whole number from ${minimum} through ${maximum}`);
  return parsed;
}
function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
