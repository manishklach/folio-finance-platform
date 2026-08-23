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
    CREATE INDEX IF NOT EXISTS idx_integration_connections_status ON integration_connections(status,provider);
    CREATE INDEX IF NOT EXISTS idx_integration_runs_connection ON integration_sync_runs(connection_id,started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_integration_records_external ON integration_records(connection_id,object_type,external_id);
    CREATE INDEX IF NOT EXISTS idx_integration_dead_letters_status ON integration_dead_letters(status,created_at);
  `);
}

export function createIntegrationsRepository(db) {
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
    db.prepare(
      `INSERT INTO integration_mappings(id,connection_id,domain,object_type,source_field,target_field,transform,default_json,required,version,created_by)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      connection?.id || null,
      connection?.domain || z.string().trim().min(1).max(80).parse(input.domain),
      objectType,
      z.string().trim().min(1).max(160).parse(input.source_field),
      z.string().trim().min(1).max(160).parse(input.target_field),
      z
        .enum([
          "identity",
          "date",
          "cents",
          "debit_cents",
          "credit_cents",
          "lowercase",
          "uppercase",
        ])
        .parse(input.transform || "identity"),
      input.default === undefined ? null : JSON.stringify(input.default),
      input.required ? 1 : 0,
      z
        .number()
        .int()
        .positive()
        .parse(Number(input.version || 1)),
      currentActor(),
    );
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
    integrationDeadLetters,
    resolveIntegrationDeadLetter,
    integrationsOverview,
  };
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
