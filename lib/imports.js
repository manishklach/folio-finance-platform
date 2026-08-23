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
    CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(status,created_at);
    CREATE INDEX IF NOT EXISTS idx_import_rows_batch_status ON import_rows(batch_id,status,row_number);
    CREATE INDEX IF NOT EXISTS idx_import_exceptions_status ON import_exceptions(status,severity,created_at);
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

  function stageImport(input) {
    const definition = definitionFor(input.template_key);
    const csv = z.string().min(1).max(5_000_000).parse(input.csv);
    const filename = safeFilename(input.filename || `${input.template_key}.csv`);
    const hash = sha256(csv);
    const prior = db
      .prepare("SELECT id,status FROM import_batches WHERE template_key=? AND file_sha256=?")
      .get(input.template_key, hash);
    if (prior) throw bad(`This exact file was already staged as batch ${prior.id}`, 409);
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
    for (const [index, raw] of parsed.rows.entries()) {
      const result = normalizeRow(definition, raw, mapping);
      const naturalKey = definition.natural_key
        .map((key) => result.normalized[key] ?? "")
        .join("|");
      const rowHash = sha256(stableJson(result.normalized));
      const alreadyApplied = db
        .prepare("SELECT batch_id FROM import_applied_keys WHERE template_key=? AND natural_key=?")
        .get(input.template_key, naturalKey);
      const duplicate = seen.has(naturalKey) || Boolean(alreadyApplied);
      seen.add(naturalKey);
      staged.push({
        id: randomUUID(),
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
                alreadyApplied
                  ? "Natural key was previously applied"
                  : "Duplicate natural key in file",
              ]
            : [],
      });
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
        `INSERT INTO import_batches(id,template_key,template_version,filename,file_sha256,mapping_json,mapping_profile_id,mapping_profile_version,restaged_from_batch_id,options_json,row_count,valid_count,error_count,duplicate_count,created_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        JSON.stringify(options),
        staged.length,
        validCount,
        errorCount,
        duplicateCount,
        currentActor(),
      );
      const insertRow = db.prepare(
        `INSERT INTO import_rows(id,batch_id,row_number,raw_json,normalized_json,row_sha256,natural_key,status,errors_json)
         VALUES(?,?,?,?,?,?,?,?,?)`,
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
        );
        if (row.status !== "valid")
          insertException.run(
            randomUUID(),
            id,
            row.id,
            row.status === "error" ? "blocking" : "warning",
            row.status === "error" ? "ROW_VALIDATION" : "POSSIBLE_DUPLICATE",
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
  };
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
