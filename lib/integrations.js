import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { currentActor } from "./request-context.js";

const providers = {
  plaid: {
    domain: "bank",
    name: "Plaid Transactions",
    auth: "secret_and_item_token",
    capabilities: ["accounts", "transactions_sync", "transaction_updates", "removals"],
    cursor_model: "transactions_sync",
  },
  stripe: {
    domain: "billing_payments",
    name: "Stripe Billing & Payments",
    auth: "oauth_or_restricted_key",
    capabilities: [
      "customers",
      "subscriptions",
      "invoices",
      "credits",
      "charges",
      "refunds",
      "disputes",
      "fees",
      "payouts",
    ],
    cursor_model: "created_id_pagination",
  },
  gusto: {
    domain: "payroll",
    name: "Gusto Payroll",
    auth: "oauth2",
    capabilities: ["companies", "payrolls", "taxes", "benefits", "departments"],
    cursor_model: "event_timestamp",
  },
  hubspot: {
    domain: "crm",
    name: "HubSpot CRM",
    auth: "oauth2",
    capabilities: ["companies", "deals", "products", "line_items"],
    cursor_model: "updated_after",
  },
};

const providerSchema = z.enum(Object.keys(providers));
const secretReferenceSchema = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_]{2,79}$/, "Secret references must be uppercase secret-manager names");
const connectionStatus = z.enum(["configured", "active", "paused", "error", "disconnected"]);
const environmentSchema = z.enum(["sandbox", "production"]);
const triggerSchema = z.enum(["manual", "scheduled", "webhook", "backfill"]);
const objectTypeSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9_]*$/);
const externalIdSchema = z.string().trim().min(1).max(240);
const applicationTargetSchema = z.enum([
  "date",
  "memo",
  "amount_cents",
  "debit_account_code",
  "credit_account_code",
]);

export function migrateIntegrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS integration_connections (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL CHECK(provider IN ('plaid','stripe','gusto','hubspot')),
      domain TEXT NOT NULL CHECK(domain IN ('bank','billing_payments','payroll','crm')),
      display_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'configured' CHECK(status IN ('configured','active','paused','error','disconnected')),
      environment TEXT NOT NULL CHECK(environment IN ('sandbox','production')),
      external_account_id TEXT,
      credential_secret_ref TEXT NOT NULL,
      webhook_secret_ref TEXT,
      scopes_json TEXT NOT NULL DEFAULT '[]',
      settings_json TEXT NOT NULL DEFAULT '{}',
      cursor TEXT,
      last_synced_at TEXT,
      last_error TEXT,
      consecutive_failures INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider,external_account_id)
    );
    CREATE TABLE IF NOT EXISTS integration_sync_runs (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      trigger TEXT NOT NULL CHECK(trigger IN ('manual','scheduled','webhook','backfill')),
      status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','succeeded','partial','failed')),
      cursor_before TEXT,
      cursor_after TEXT,
      pages INTEGER NOT NULL DEFAULT 0,
      added INTEGER NOT NULL DEFAULT 0,
      modified INTEGER NOT NULL DEFAULT 0,
      removed INTEGER NOT NULL DEFAULT 0,
      duplicates INTEGER NOT NULL DEFAULT 0,
      errors INTEGER NOT NULL DEFAULT 0,
      requested_by TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      error_code TEXT,
      error_message TEXT
    );
    CREATE TABLE IF NOT EXISTS integration_records (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      sync_run_id TEXT NOT NULL REFERENCES integration_sync_runs(id),
      object_type TEXT NOT NULL,
      external_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('added','modified','removed')),
      source_version TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      normalized_json TEXT NOT NULL,
      effective_at TEXT,
      status TEXT NOT NULL DEFAULT 'staged' CHECK(status IN ('staged','applied','ignored','error')),
      applied_entity_type TEXT,
      applied_entity_id TEXT,
      error_message TEXT,
      first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(connection_id,object_type,external_id,source_version,operation)
    );
    CREATE TABLE IF NOT EXISTS integration_mappings (
      id TEXT PRIMARY KEY,
      connection_id TEXT REFERENCES integration_connections(id),
      domain TEXT NOT NULL,
      object_type TEXT NOT NULL,
      source_field TEXT NOT NULL,
      target_field TEXT NOT NULL,
      transform TEXT NOT NULL DEFAULT 'identity' CHECK(transform IN ('identity','date','cents','debit_cents','credit_cents','lowercase','uppercase')),
      default_json TEXT,
      required INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(connection_id,object_type,source_field,version)
    );
    CREATE TABLE IF NOT EXISTS integration_dead_letters (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      sync_run_id TEXT REFERENCES integration_sync_runs(id),
      object_type TEXT,
      external_id TEXT,
      payload_hash TEXT NOT NULL,
      error_code TEXT NOT NULL,
      error_message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','retrying','resolved','ignored')),
      attempts INTEGER NOT NULL DEFAULT 0,
      owner TEXT,
      resolution TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS integration_record_applications (
      id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL UNIQUE REFERENCES integration_records(id),
      mapping_fingerprint TEXT NOT NULL,
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
      approved_by TEXT NOT NULL,
      approval_note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_integration_connections_status ON integration_connections(status,provider);
    CREATE INDEX IF NOT EXISTS idx_integration_runs_connection ON integration_sync_runs(connection_id,started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_integration_records_external ON integration_records(connection_id,object_type,external_id);
    CREATE INDEX IF NOT EXISTS idx_integration_dead_letters_status ON integration_dead_letters(status,created_at);
    CREATE INDEX IF NOT EXISTS idx_integration_applications_journal ON integration_record_applications(journal_entry_id);
  `);
  const deadLetterColumns = new Set(
    db
      .prepare("PRAGMA table_info(integration_dead_letters)")
      .all()
      .map((column) => column.name),
  );
  if (!deadLetterColumns.has("integration_record_id"))
    db.exec(
      "ALTER TABLE integration_dead_letters ADD COLUMN integration_record_id TEXT REFERENCES integration_records(id)",
    );
}

export function createIntegrationsRepository(
  db,
  ledger,
  operations,
  stripeReconciliation,
  payroll,
  crmHandoff,
) {
  function providerCatalog() {
    return Object.entries(providers).map(([key, value]) => ({ provider: key, ...value }));
  }

  function configureIntegration(input) {
    const provider = providerSchema.parse(input.provider);
    const definition = providers[provider];
    const environment = environmentSchema.parse(input.environment || "sandbox");
    const credentialRef = secretReferenceSchema.parse(input.credential_secret_ref);
    const webhookRef = input.webhook_secret_ref
      ? secretReferenceSchema.parse(input.webhook_secret_ref)
      : null;
    const scopes = z
      .array(z.string().trim().min(1).max(120))
      .max(40)
      .parse(input.scopes || []);
    const settings = safeSettings(input.settings || {});
    if (environment === "production" && !input.external_account_id)
      throw bad("Production connections require the provider account identifier");
    const id = randomUUID();
    db.prepare(
      `INSERT INTO integration_connections(id,provider,domain,display_name,environment,external_account_id,credential_secret_ref,webhook_secret_ref,scopes_json,settings_json,created_by)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      provider,
      definition.domain,
      z
        .string()
        .trim()
        .min(2)
        .max(120)
        .parse(input.display_name || definition.name),
      environment,
      input.external_account_id ? externalIdSchema.parse(input.external_account_id) : null,
      credentialRef,
      webhookRef,
      JSON.stringify(scopes),
      JSON.stringify(settings),
      currentActor(),
    );
    return integrationConnection(id);
  }

  function integrationConnection(id) {
    const row = db.prepare("SELECT * FROM integration_connections WHERE id=?").get(id);
    if (!row) throw bad("Integration connection not found", 404);
    return hydrateConnection(row);
  }

  function integrationConnections() {
    return db
      .prepare("SELECT * FROM integration_connections ORDER BY provider,display_name")
      .all()
      .map(hydrateConnection);
  }

  function setIntegrationStatus(input) {
    const status = connectionStatus.parse(input.status);
    const connection = integrationConnection(input.connection_id);
    const allowed = {
      configured: ["active", "disconnected"],
      active: ["paused", "error", "disconnected"],
      paused: ["active", "disconnected"],
      error: ["active", "paused", "disconnected"],
      disconnected: [],
    };
    if (!allowed[connection.status].includes(status))
      throw bad(`Connection cannot move from ${connection.status} to ${status}`, 409);
    db.prepare(
      "UPDATE integration_connections SET status=?,last_error=CASE WHEN ?='active' THEN NULL ELSE last_error END,consecutive_failures=CASE WHEN ?='active' THEN 0 ELSE consecutive_failures END,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(status, status, status, connection.id);
    return integrationConnection(connection.id);
  }

  function startIntegrationSync(input) {
    const connection = integrationConnection(input.connection_id);
    if (connection.status !== "active") throw bad("Connection must be active to synchronize", 409);
    const id = randomUUID();
    db.prepare(
      "INSERT INTO integration_sync_runs(id,connection_id,trigger,cursor_before,requested_by) VALUES(?,?,?,?,?)",
    ).run(
      id,
      connection.id,
      triggerSchema.parse(input.trigger || "manual"),
      connection.cursor,
      currentActor(),
    );
    return integrationSyncRun(id);
  }

  function ingestIntegrationPage(input) {
    const run = integrationSyncRun(input.sync_run_id);
    if (run.status !== "running") throw bad("Only a running synchronization can ingest pages", 409);
    const connection = integrationConnection(run.connection_id);
    const added = normalizeRecords(input.added || [], "added");
    const modified = normalizeRecords(input.modified || [], "modified");
    const removed = normalizeRecords(input.removed || [], "removed");
    const pageRecords = [...added, ...modified, ...removed];
    let duplicates = 0;
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      const insert = db.prepare(
        `INSERT OR IGNORE INTO integration_records(id,connection_id,sync_run_id,object_type,external_id,operation,source_version,payload_hash,normalized_json,effective_at)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
      );
      for (const record of pageRecords) {
        const result = insert.run(
          randomUUID(),
          connection.id,
          run.id,
          record.object_type,
          record.external_id,
          record.operation,
          record.source_version,
          record.payload_hash,
          JSON.stringify(record.normalized),
          record.effective_at,
        );
        if (!result.changes) {
          duplicates++;
          db.prepare(
            "UPDATE integration_records SET last_seen_at=CURRENT_TIMESTAMP WHERE connection_id=? AND object_type=? AND external_id=? AND source_version=? AND operation=?",
          ).run(
            connection.id,
            record.object_type,
            record.external_id,
            record.source_version,
            record.operation,
          );
        }
      }
      const completed = input.has_more ? null : new Date().toISOString();
      const status = input.has_more ? "running" : "succeeded";
      db.prepare(
        `UPDATE integration_sync_runs SET status=?,cursor_after=?,pages=pages+1,added=added+?,modified=modified+?,removed=removed+?,duplicates=duplicates+?,completed_at=? WHERE id=?`,
      ).run(
        status,
        input.next_cursor || run.cursor_after || run.cursor_before,
        added.length,
        modified.length,
        removed.length,
        duplicates,
        completed,
        run.id,
      );
      if (!input.has_more)
        db.prepare(
          "UPDATE integration_connections SET cursor=?,last_synced_at=CURRENT_TIMESTAMP,last_error=NULL,consecutive_failures=0,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        ).run(input.next_cursor || run.cursor_after || run.cursor_before, connection.id);
      if (ownsTransaction) db.exec("COMMIT");
    } catch (error) {
      if (ownsTransaction && db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
    return integrationSyncRun(run.id);
  }

  function failIntegrationSync(input) {
    const run = integrationSyncRun(input.sync_run_id);
    if (run.status !== "running") throw bad("Only a running synchronization can fail", 409);
    const errorCode = z.string().trim().min(1).max(80).parse(input.error_code);
    const errorMessage = z.string().trim().min(1).max(500).parse(input.error_message);
    const id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "UPDATE integration_sync_runs SET status='failed',errors=errors+1,error_code=?,error_message=?,completed_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(errorCode, errorMessage, run.id);
      db.prepare(
        "UPDATE integration_connections SET status='error',last_error=?,consecutive_failures=consecutive_failures+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(errorMessage, run.connection_id);
      db.prepare(
        "INSERT INTO integration_dead_letters(id,connection_id,sync_run_id,object_type,external_id,payload_hash,error_code,error_message) VALUES(?,?,?,?,?,?,?,?)",
      ).run(
        id,
        run.connection_id,
        run.id,
        input.object_type || null,
        input.external_id || null,
        sha256(JSON.stringify(input.payload || {})),
        errorCode,
        errorMessage,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { run: integrationSyncRun(run.id), dead_letter: integrationDeadLetter(id) };
  }

  function integrationSyncRun(id) {
    const run = db.prepare("SELECT * FROM integration_sync_runs WHERE id=?").get(id);
    if (!run) throw bad("Integration synchronization not found", 404);
    return run;
  }

  function integrationSyncRuns(connectionId = null) {
    return connectionId
      ? db
          .prepare(
            "SELECT * FROM integration_sync_runs WHERE connection_id=? ORDER BY started_at DESC,id DESC LIMIT 100",
          )
          .all(connectionId)
      : db
          .prepare("SELECT * FROM integration_sync_runs ORDER BY started_at DESC,id DESC LIMIT 100")
          .all();
  }

  function integrationRecords(connectionId, status = null) {
    return status
      ? db
          .prepare(
            "SELECT * FROM integration_records WHERE connection_id=? AND status=? ORDER BY first_seen_at,id",
          )
          .all(connectionId, status)
          .map(hydrateRecord)
      : db
          .prepare(
            "SELECT * FROM integration_records WHERE connection_id=? ORDER BY first_seen_at,id",
          )
          .all(connectionId)
          .map(hydrateRecord);
  }

  function createIntegrationMapping(input) {
    const connection = input.connection_id ? integrationConnection(input.connection_id) : null;
    const objectType = objectTypeSchema.parse(input.object_type);
    const id = randomUUID();
    const sourceField = z.string().trim().min(1).max(160).parse(input.source_field);
    const targetField = applicationTargetSchema.parse(input.target_field);
    const transform = z
      .enum(["identity", "date", "cents", "debit_cents", "credit_cents", "lowercase", "uppercase"])
      .parse(input.transform || "identity");
    const connectionId = connection?.id || null;
    const domain = connection?.domain || z.string().trim().min(1).max(80).parse(input.domain);
    const latestVersion = connectionId
      ? db
          .prepare(
            "SELECT COALESCE(MAX(version),0) version FROM integration_mappings WHERE connection_id=? AND object_type=? AND source_field=?",
          )
          .get(connectionId, objectType, sourceField).version
      : db
          .prepare(
            "SELECT COALESCE(MAX(version),0) version FROM integration_mappings WHERE connection_id IS NULL AND domain=? AND object_type=? AND source_field=?",
          )
          .get(domain, objectType, sourceField).version;
    const version =
      input.version === undefined
        ? latestVersion + 1
        : z.number().int().positive().parse(Number(input.version));
    db.exec("BEGIN IMMEDIATE");
    try {
      if (connectionId)
        db.prepare(
          "UPDATE integration_mappings SET active=0 WHERE connection_id=? AND object_type=? AND target_field=? AND active=1",
        ).run(connectionId, objectType, targetField);
      else
        db.prepare(
          "UPDATE integration_mappings SET active=0 WHERE connection_id IS NULL AND domain=? AND object_type=? AND target_field=? AND active=1",
        ).run(domain, objectType, targetField);
      db.prepare(
        `INSERT INTO integration_mappings(id,connection_id,domain,object_type,source_field,target_field,transform,default_json,required,version,created_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        id,
        connectionId,
        domain,
        objectType,
        sourceField,
        targetField,
        transform,
        input.default === undefined ? null : JSON.stringify(input.default),
        input.required ? 1 : 0,
        version,
        currentActor(),
      );
      db.exec("COMMIT");
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
    return db.prepare("SELECT * FROM integration_mappings WHERE id=?").get(id);
  }

  function integrationMappings(connectionId = null) {
    return connectionId
      ? db
          .prepare(
            "SELECT * FROM integration_mappings WHERE connection_id=? AND active=1 ORDER BY object_type,source_field",
          )
          .all(connectionId)
      : db
          .prepare(
            "SELECT * FROM integration_mappings WHERE connection_id IS NULL AND active=1 ORDER BY domain,object_type,source_field",
          )
          .all();
  }

  function integrationRecord(id) {
    const row = db.prepare("SELECT * FROM integration_records WHERE id=?").get(id);
    if (!row) throw bad("Integration record not found", 404);
    return hydrateRecord(row);
  }

  function previewIntegrationRecordApplication(input) {
    const record = integrationRecord(input.record_id);
    const connection = integrationConnection(record.connection_id);
    const mappings = effectiveMappings(connection, record.object_type);
    const issues = [];
    const mapped = {};
    if (record.operation === "removed")
      issues.push(
        "Removed provider records require a reversal policy and cannot be applied directly",
      );
    if (!mappings.length) issues.push("No active mapping set is configured for this record type");
    for (const mapping of mappings) {
      let value = valueAtPath(record.normalized, mapping.source_field);
      if (value === undefined && mapping.default_json !== null)
        value = JSON.parse(mapping.default_json);
      if (value === undefined || value === null || value === "") {
        if (mapping.required) issues.push(`${mapping.target_field} is required`);
        continue;
      }
      try {
        mapped[mapping.target_field] = transformMappingValue(value, mapping.transform);
      } catch (error) {
        issues.push(`${mapping.target_field}: ${error.message}`);
      }
    }
    for (const field of applicationTargetSchema.options)
      if (mapped[field] === undefined) issues.push(`Mapping must produce ${field}`);
    if (mapped.date !== undefined && !isCalendarDate(String(mapped.date)))
      issues.push("date must use YYYY-MM-DD");
    if (mapped.memo !== undefined && String(mapped.memo).trim().length < 2)
      issues.push("memo must contain at least 2 characters");
    if (
      mapped.amount_cents !== undefined &&
      (!Number.isSafeInteger(mapped.amount_cents) || mapped.amount_cents <= 0)
    )
      issues.push("amount_cents must be a positive whole number");
    const accounts = new Map(ledger.getAccounts().map((account) => [account.code, account]));
    for (const field of ["debit_account_code", "credit_account_code"])
      if (mapped[field] !== undefined && !accounts.has(String(mapped[field])))
        issues.push(`${field} does not identify an active Folio account`);
    if (
      mapped.debit_account_code !== undefined &&
      String(mapped.debit_account_code) === String(mapped.credit_account_code)
    )
      issues.push("Debit and credit accounts must differ");
    const uniqueIssues = [...new Set(issues)];
    const preview = {
      record: {
        id: record.id,
        connection_id: record.connection_id,
        object_type: record.object_type,
        external_id: record.external_id,
        operation: record.operation,
        source_version: record.source_version,
        status: record.status,
      },
      mapped,
      mappings: mappings.map(publicMapping),
      mapping_fingerprint: mappingFingerprint(mappings),
      ready: uniqueIssues.length === 0 && record.status !== "applied",
      issues:
        record.status === "applied" ? [...uniqueIssues, "Record is already applied"] : uniqueIssues,
    };
    if (input.classify && !preview.ready && record.status !== "applied")
      preview.exception = recordApplicationFailure(preview, "MAPPING_VALIDATION_FAILED");
    return preview;
  }

  function applyIntegrationRecord(input) {
    if (input.approved !== true) throw bad("Explicit accounting application approval is required");
    const approvalNote = z.string().trim().min(5).max(500).parse(input.approval_note);
    const existing = db
      .prepare("SELECT * FROM integration_record_applications WHERE record_id=?")
      .get(input.record_id);
    if (existing)
      return {
        duplicate: true,
        application: existing,
        journal: ledger.getJournal(existing.journal_entry_id),
      };
    const preview = previewIntegrationRecordApplication(input);
    if (!preview.ready) {
      const exception = recordApplicationFailure(preview, "MAPPING_VALIDATION_FAILED");
      return { duplicate: false, status: "error", preview, exception };
    }
    if (
      input.mapping_fingerprint &&
      z.string().length(64).parse(input.mapping_fingerprint) !== preview.mapping_fingerprint
    )
      throw bad("Mappings changed after preview; review the record again", 409);
    const debit = ledger
      .getAccounts()
      .find((account) => account.code === String(preview.mapped.debit_account_code));
    const credit = ledger
      .getAccounts()
      .find((account) => account.code === String(preview.mapped.credit_account_code));
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      const journal = ledger.createDraft({
        date: String(preview.mapped.date),
        memo: String(preview.mapped.memo),
        source: "provider_integration",
        lines: [
          { account_id: debit.id, debit_cents: preview.mapped.amount_cents, credit_cents: 0 },
          { account_id: credit.id, debit_cents: 0, credit_cents: preview.mapped.amount_cents },
        ],
      });
      const id = randomUUID();
      db.prepare(
        "INSERT INTO integration_record_applications(id,record_id,mapping_fingerprint,journal_entry_id,approved_by,approval_note) VALUES(?,?,?,?,?,?)",
      ).run(
        id,
        input.record_id,
        preview.mapping_fingerprint,
        journal.id,
        currentActor(),
        approvalNote,
      );
      db.prepare(
        "UPDATE integration_records SET status='applied',applied_entity_type='journal_entry',applied_entity_id=?,error_message=NULL WHERE id=?",
      ).run(String(journal.id), input.record_id);
      db.prepare(
        "UPDATE integration_dead_letters SET status='resolved',owner=?,resolution='Record mapping corrected and applied',updated_at=CURRENT_TIMESTAMP WHERE integration_record_id=? AND status IN ('open','retrying')",
      ).run(currentActor(), input.record_id);
      if (ownsTransaction) db.exec("COMMIT");
      return {
        duplicate: false,
        status: "applied",
        application: db.prepare("SELECT * FROM integration_record_applications WHERE id=?").get(id),
        journal: ledger.getJournal(journal.id),
      };
    } catch (error) {
      if (ownsTransaction && db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function previewBankFeedRecordApplication(input) {
    const record = integrationRecord(input.record_id);
    const connection = integrationConnection(record.connection_id);
    const preview = operations.previewProviderBankRecord(record, connection);
    if (input.classify && !preview.ready && record.status !== "applied")
      preview.exception = recordApplicationFailure(preview, "BANK_FEED_VALIDATION_FAILED");
    return preview;
  }

  function applyBankFeedRecord(input) {
    if (input.approved !== true) throw bad("Explicit bank-feed application approval is required");
    const approvalNote = z.string().trim().min(5).max(500).parse(input.approval_note);
    const record = integrationRecord(input.record_id);
    const connection = integrationConnection(record.connection_id);
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      const result = operations.applyProviderBankRecord(record, connection, {
        approval_note: approvalNote,
      });
      if (result.status === "error") {
        if (ownsTransaction) db.exec("ROLLBACK");
        const preview = previewBankFeedRecordApplication({ record_id: record.id, classify: true });
        return { ...result, preview, exception: preview.exception };
      }
      db.prepare(
        "UPDATE integration_records SET status='applied',applied_entity_type='bank_feed_transaction',applied_entity_id=?,error_message=NULL WHERE id=?",
      ).run(result.transaction.id, record.id);
      db.prepare(
        "UPDATE integration_dead_letters SET status='resolved',owner=?,resolution='Bank-feed record validated and applied',updated_at=CURRENT_TIMESTAMP WHERE integration_record_id=? AND status IN ('open','retrying')",
      ).run(currentActor(), record.id);
      if (ownsTransaction) db.exec("COMMIT");
      return result;
    } catch (error) {
      if (ownsTransaction && db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function previewStripeRecordApplication(input) {
    const record = integrationRecord(input.record_id);
    const preview = stripeReconciliation.previewStripeRecord(
      record,
      integrationConnection(record.connection_id),
    );
    if (input.classify && !preview.ready && record.status !== "applied")
      preview.exception = recordApplicationFailure(preview, "STRIPE_RECONCILIATION_FAILED");
    return preview;
  }

  function applyStripeRecordApplication(input) {
    const record = integrationRecord(input.record_id);
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      const result = stripeReconciliation.applyStripeRecord(
        record,
        integrationConnection(record.connection_id),
        input,
      );
      if (result.status !== "applied") {
        if (ownsTransaction) db.exec("ROLLBACK");
        const preview = previewStripeRecordApplication({ record_id: record.id, classify: true });
        return { ...result, preview, exception: preview.exception };
      }
      db.prepare(
        "UPDATE integration_records SET status='applied',applied_entity_type='stripe_reconciliation',applied_entity_id=?,error_message=NULL WHERE id=?",
      ).run(result.reconciliation.id, record.id);
      db.prepare(
        "UPDATE integration_dead_letters SET status='resolved',owner=?,resolution='Stripe record reconciled through native subledger',updated_at=CURRENT_TIMESTAMP WHERE integration_record_id=? AND status IN ('open','retrying')",
      ).run(currentActor(), record.id);
      if (ownsTransaction) db.exec("COMMIT");
      return result;
    } catch (error) {
      if (ownsTransaction && db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function previewPayrollRecordApplication(input) {
    const record = integrationRecord(input.record_id);
    const preview = payroll.previewPayrollRecord(
      record,
      integrationConnection(record.connection_id),
    );
    if (input.classify && !preview.ready && record.status !== "applied")
      preview.exception = recordApplicationFailure(preview, "PAYROLL_VALIDATION_FAILED");
    return preview;
  }

  function applyPayrollRecordApplication(input) {
    const record = integrationRecord(input.record_id);
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      const result = payroll.applyPayrollRecord(
        record,
        integrationConnection(record.connection_id),
        input,
      );
      if (result.status !== "applied") {
        if (ownsTransaction) db.exec("ROLLBACK");
        const preview = previewPayrollRecordApplication({ record_id: record.id, classify: true });
        return { ...result, preview, exception: preview.exception };
      }
      db.prepare(
        "UPDATE integration_records SET status='applied',applied_entity_type='payroll_run',applied_entity_id=?,error_message=NULL WHERE id=?",
      ).run(result.payroll_run.id, record.id);
      db.prepare(
        "UPDATE integration_dead_letters SET status='resolved',owner=?,resolution='Payroll record applied through native subledger',updated_at=CURRENT_TIMESTAMP WHERE integration_record_id=? AND status IN ('open','retrying')",
      ).run(currentActor(), record.id);
      if (ownsTransaction) db.exec("COMMIT");
      return result;
    } catch (error) {
      if (ownsTransaction && db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function previewCrmRecordApplication(input) {
    const record = integrationRecord(input.record_id);
    const preview = crmHandoff.previewCrmDeal(input);
    if (input.classify && !preview.ready && record.status !== "applied")
      preview.exception = recordApplicationFailure(preview, "CRM_HANDOFF_VALIDATION_FAILED");
    return preview;
  }

  function prepareCrmRecordApplication(input) {
    const result = crmHandoff.prepareCrmProposal(input);
    if (result.status === "error")
      return {
        ...result,
        preview: previewCrmRecordApplication({ record_id: input.record_id, classify: true }),
      };
    return result;
  }

  function effectiveMappings(connection, objectType) {
    const specific = db
      .prepare(
        "SELECT * FROM integration_mappings WHERE connection_id=? AND object_type=? AND active=1 ORDER BY target_field",
      )
      .all(connection.id, objectType);
    return specific.length
      ? specific
      : db
          .prepare(
            "SELECT * FROM integration_mappings WHERE connection_id IS NULL AND domain=? AND object_type=? AND active=1 ORDER BY target_field",
          )
          .all(connection.domain, objectType);
  }

  function recordApplicationFailure(preview, errorCode) {
    const record = integrationRecord(preview.record.id);
    const message = preview.issues.join("; ").slice(0, 500);
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("UPDATE integration_records SET status='error',error_message=? WHERE id=?").run(
        message,
        record.id,
      );
      let exception = db
        .prepare(
          "SELECT * FROM integration_dead_letters WHERE integration_record_id=? AND error_code=? AND status IN ('open','retrying') ORDER BY created_at DESC LIMIT 1",
        )
        .get(record.id, errorCode);
      if (!exception) {
        const id = randomUUID();
        db.prepare(
          "INSERT INTO integration_dead_letters(id,connection_id,sync_run_id,object_type,external_id,payload_hash,error_code,error_message,integration_record_id) VALUES(?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          record.connection_id,
          record.sync_run_id,
          record.object_type,
          record.external_id,
          record.payload_hash,
          errorCode,
          message,
          record.id,
        );
        exception = integrationDeadLetter(id);
      }
      db.exec("COMMIT");
      return exception;
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function integrationDeadLetter(id) {
    const row = db.prepare("SELECT * FROM integration_dead_letters WHERE id=?").get(id);
    if (!row) throw bad("Integration exception not found", 404);
    return row;
  }

  function integrationDeadLetters() {
    return db
      .prepare(
        "SELECT * FROM integration_dead_letters ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'retrying' THEN 1 ELSE 2 END,created_at DESC",
      )
      .all();
  }

  function resolveIntegrationDeadLetter(input) {
    const status = z.enum(["retrying", "resolved", "ignored"]).parse(input.status);
    const result = db
      .prepare(
        "UPDATE integration_dead_letters SET status=?,owner=?,resolution=?,attempts=attempts+CASE WHEN ?='retrying' THEN 1 ELSE 0 END,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .run(status, currentActor(), input.resolution || null, status, input.id);
    if (!result.changes) throw bad("Integration exception not found", 404);
    return integrationDeadLetter(input.id);
  }

  function integrationsOverview() {
    const connections = integrationConnections();
    return {
      catalog: providerCatalog(),
      connections,
      runs: integrationSyncRuns(),
      dead_letters: integrationDeadLetters(),
      metrics: {
        active_connections: connections.filter((item) => item.status === "active").length,
        error_connections: connections.filter((item) => item.status === "error").length,
        open_exceptions: integrationDeadLetters().filter((item) => item.status === "open").length,
        staged_records: db
          .prepare("SELECT COUNT(*) count FROM integration_records WHERE status='staged'")
          .get().count,
        mapping_errors: db
          .prepare("SELECT COUNT(*) count FROM integration_records WHERE status='error'")
          .get().count,
        latest_success_at:
          db
            .prepare(
              "SELECT MAX(completed_at) value FROM integration_sync_runs WHERE status='succeeded'",
            )
            .get().value || null,
      },
    };
  }

  return {
    providerCatalog,
    configureIntegration,
    integrationConnection,
    integrationConnections,
    setIntegrationStatus,
    startIntegrationSync,
    ingestIntegrationPage,
    failIntegrationSync,
    integrationSyncRun,
    integrationSyncRuns,
    integrationRecords,
    createIntegrationMapping,
    integrationMappings,
    integrationRecord,
    previewIntegrationRecordApplication,
    applyIntegrationRecord,
    previewBankFeedRecordApplication,
    applyBankFeedRecord,
    previewStripeRecordApplication,
    applyStripeRecordApplication,
    previewPayrollRecordApplication,
    applyPayrollRecordApplication,
    previewCrmRecordApplication,
    prepareCrmRecordApplication,
    integrationDeadLetters,
    resolveIntegrationDeadLetter,
    integrationsOverview,
  };
}

function publicMapping(mapping) {
  return {
    id: mapping.id,
    source_field: mapping.source_field,
    target_field: mapping.target_field,
    transform: mapping.transform,
    required: Boolean(mapping.required),
    version: mapping.version,
  };
}

function mappingFingerprint(mappings) {
  return sha256(
    JSON.stringify(
      mappings.map(
        ({ id, source_field, target_field, transform, default_json, required, version }) => ({
          id,
          source_field,
          target_field,
          transform,
          default_json,
          required,
          version,
        }),
      ),
    ),
  );
}

function valueAtPath(value, path) {
  return String(path)
    .split(".")
    .reduce(
      (current, key) => (current && typeof current === "object" ? current[key] : undefined),
      value,
    );
}

function transformMappingValue(value, transform) {
  if (transform === "identity") {
    if (typeof value === "object") throw new Error("value must be scalar");
    return value;
  }
  if (transform === "lowercase") return String(value).toLowerCase();
  if (transform === "uppercase") return String(value).toUpperCase();
  if (transform === "date") {
    const text = String(value).slice(0, 10);
    if (!isCalendarDate(text)) throw new Error("value is not a date");
    return text;
  }
  if (["cents", "debit_cents", "credit_cents"].includes(transform)) {
    const amount =
      transform === "cents" && typeof value === "number" && !Number.isInteger(value)
        ? Math.round(value * 100)
        : Number(value);
    if (!Number.isSafeInteger(amount))
      throw new Error("value cannot be converted to integer cents");
    return amount;
  }
  throw new Error("unsupported mapping transform");
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizeRecords(records, operation) {
  return z
    .array(z.record(z.string(), z.unknown()))
    .max(10_000)
    .parse(records)
    .map((record) => {
      const objectType = objectTypeSchema.parse(record.object_type);
      const externalId = externalIdSchema.parse(record.external_id);
      const normalized = z.record(z.string(), z.unknown()).parse(record.normalized || {});
      const sourceVersion = String(record.source_version || sha256(JSON.stringify(record))).slice(
        0,
        128,
      );
      return {
        object_type: objectType,
        external_id: externalId,
        operation,
        source_version: sourceVersion,
        payload_hash: sha256(JSON.stringify(record.source || record)),
        normalized,
        effective_at: record.effective_at
          ? z.string().datetime({ offset: true }).parse(record.effective_at)
          : null,
      };
    });
}

function hydrateConnection(row) {
  return {
    ...row,
    scopes: JSON.parse(row.scopes_json),
    settings: JSON.parse(row.settings_json),
    credential_secret_ref: row.credential_secret_ref,
    webhook_secret_ref: row.webhook_secret_ref,
  };
}

function hydrateRecord(row) {
  return { ...row, normalized: JSON.parse(row.normalized_json) };
}

function safeSettings(input) {
  const parsed = z.record(z.string(), z.unknown()).parse(input);
  for (const key of Object.keys(parsed))
    if (/secret|password|token|credential|private.?key/i.test(key))
      throw bad(`Connection setting ${key} must be stored in a referenced secret`);
  const json = JSON.stringify(parsed);
  if (json.length > 20_000) throw bad("Connection settings are too large");
  return parsed;
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
