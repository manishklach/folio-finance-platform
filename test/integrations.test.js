import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { runWithRequestContext } from "../lib/request-context.js";

function configuredLedger(provider = "plaid") {
  const ledger = createLedger(":memory:");
  const connection = ledger.configureIntegration({
    provider,
    display_name: `${provider} sandbox`,
    environment: "sandbox",
    credential_secret_ref: `${provider.toUpperCase()}_CREDENTIAL_REF`,
    webhook_secret_ref: `${provider.toUpperCase()}_WEBHOOK_REF`,
    settings: { region: "us" },
  });
  return { ledger, connection };
}

test("integration catalog declares the initial provider boundaries", () => {
  const ledger = createLedger(":memory:");
  assert.deepEqual(
    ledger.providerCatalog().map(({ provider }) => provider),
    ["plaid", "stripe", "gusto", "hubspot"],
  );
  ledger.close();
});

test("connection configuration stores references and rejects embedded secrets", () => {
  const ledger = createLedger(":memory:");
  assert.throws(
    () =>
      ledger.configureIntegration({
        provider: "stripe",
        environment: "sandbox",
        credential_secret_ref: "STRIPE_CREDENTIAL_REF",
        settings: { access_token: "must-not-be-stored" },
      }),
    /must be stored in a referenced secret/,
  );
  assert.throws(
    () =>
      ledger.configureIntegration({
        provider: "gusto",
        environment: "production",
        credential_secret_ref: "GUSTO_CREDENTIAL_REF",
      }),
    /provider account identifier/,
  );
  const connection = ledger.configureIntegration({
    provider: "stripe",
    environment: "production",
    external_account_id: "acct_123",
    credential_secret_ref: "STRIPE_CREDENTIAL_REF",
  });
  assert.equal(connection.status, "configured");
  assert.equal(connection.credential_secret_ref, "STRIPE_CREDENTIAL_REF");
  assert.deepEqual(connection.settings, {});
  ledger.close();
});

test("cursor sync stages additions, changes and removals idempotently", () => {
  const { ledger, connection } = configuredLedger();
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const first = ledger.startIntegrationSync({ connection_id: connection.id, trigger: "webhook" });
  const succeeded = ledger.ingestIntegrationPage({
    sync_run_id: first.id,
    next_cursor: "cursor-1",
    has_more: false,
    added: [
      {
        object_type: "bank_transaction",
        external_id: "txn-1",
        source_version: "v1",
        normalized: { amount_cents: 1200, description: "Hosting" },
      },
    ],
    modified: [
      {
        object_type: "bank_transaction",
        external_id: "txn-2",
        source_version: "v2",
        normalized: { amount_cents: 3500 },
      },
    ],
    removed: [
      {
        object_type: "bank_transaction",
        external_id: "txn-3",
        source_version: "v3",
        normalized: {},
      },
    ],
  });
  assert.equal(succeeded.status, "succeeded");
  assert.deepEqual([succeeded.added, succeeded.modified, succeeded.removed], [1, 1, 1]);
  assert.equal(ledger.integrationConnection(connection.id).cursor, "cursor-1");
  assert.equal(ledger.integrationRecords(connection.id).length, 3);

  const replay = ledger.startIntegrationSync({ connection_id: connection.id });
  const replayed = ledger.ingestIntegrationPage({
    sync_run_id: replay.id,
    next_cursor: "cursor-2",
    has_more: false,
    added: [
      {
        object_type: "bank_transaction",
        external_id: "txn-1",
        source_version: "v1",
        normalized: { amount_cents: 1200, description: "Hosting" },
      },
    ],
  });
  assert.equal(replayed.duplicates, 1);
  assert.equal(ledger.integrationRecords(connection.id).length, 3);
  ledger.close();
});

test("failed synchronization creates an owned, resolvable exception", () => {
  const { ledger, connection } = configuredLedger("hubspot");
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const run = ledger.startIntegrationSync({ connection_id: connection.id });
  const failed = ledger.failIntegrationSync({
    sync_run_id: run.id,
    error_code: "RATE_LIMIT",
    error_message: "Provider rate limit reached",
    object_type: "deal",
    external_id: "deal-1",
    payload: { id: "deal-1" },
  });
  assert.equal(failed.run.status, "failed");
  assert.equal(failed.dead_letter.status, "open");
  assert.equal(ledger.integrationConnection(connection.id).status, "error");
  const resolved = ledger.resolveIntegrationDeadLetter({
    id: failed.dead_letter.id,
    status: "resolved",
    resolution: "Retried after provider window reset",
  });
  assert.equal(resolved.status, "resolved");
  assert.match(resolved.resolution, /Retried/);
  ledger.close();
});

function stageBankRecord(ledger, connection, normalized, operation = "added") {
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const run = ledger.startIntegrationSync({ connection_id: connection.id });
  ledger.ingestIntegrationPage({
    sync_run_id: run.id,
    next_cursor: "application-cursor",
    has_more: false,
    [operation]: [
      {
        object_type: "bank_transaction",
        external_id: `txn-${operation}`,
        source_version: "v1",
        normalized,
      },
    ],
  });
  return ledger.integrationRecords(connection.id)[0];
}

function configureBankJournalMappings(ledger, connection) {
  const definitions = [
    ["transaction_date", "date", "date", undefined],
    ["description", "memo", "identity", undefined],
    ["amount_cents", "amount_cents", "cents", undefined],
    ["debit", "debit_account_code", "identity", "5000"],
    ["credit", "credit_account_code", "identity", "1000"],
  ];
  for (const [source_field, target_field, transform, fallback] of definitions)
    ledger.createIntegrationMapping({
      connection_id: connection.id,
      object_type: "bank_transaction",
      source_field,
      target_field,
      transform,
      ...(fallback === undefined ? { required: true } : { default: fallback }),
    });
}

test("mapped provider records require preview and approval before creating an idempotent draft", () => {
  const { ledger, connection } = configuredLedger();
  configureBankJournalMappings(ledger, connection);
  const record = stageBankRecord(ledger, connection, {
    transaction_date: "2026-08-21T14:00:00.000Z",
    description: "Provider hosting debit",
    amount_cents: 1275,
  });

  const preview = ledger.previewIntegrationRecordApplication({ record_id: record.id });
  assert.equal(preview.ready, true);
  assert.deepEqual(preview.mapped, {
    amount_cents: 1275,
    credit_account_code: "1000",
    date: "2026-08-21",
    debit_account_code: "5000",
    memo: "Provider hosting debit",
  });
  assert.throws(
    () => ledger.applyIntegrationRecord({ record_id: record.id, approval_note: "Reviewed" }),
    /Explicit accounting application approval/,
  );

  const applied = runWithRequestContext({ actor: "operator-a" }, () =>
    ledger.applyIntegrationRecord({
      record_id: record.id,
      approved: true,
      approval_note: "Reviewed provider lineage and mapped accounts",
      mapping_fingerprint: preview.mapping_fingerprint,
    }),
  );
  assert.equal(applied.status, "applied");
  assert.equal(applied.journal.status, "draft");
  assert.equal(applied.journal.source, "provider_integration");
  assert.equal(ledger.integrationRecord(record.id).applied_entity_id, String(applied.journal.id));
  assert.throws(
    () =>
      runWithRequestContext({ actor: "operator-a" }, () => ledger.postJournal(applied.journal.id)),
    /different approver/,
  );
  const posted = runWithRequestContext({ actor: "approver-b" }, () =>
    ledger.postJournal(applied.journal.id),
  );
  assert.equal(posted.status, "posted");

  const replay = ledger.applyIntegrationRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Repeated request must not create another draft",
  });
  assert.equal(replay.duplicate, true);
  assert.equal(replay.journal.id, applied.journal.id);
  ledger.close();
});

test("mapping validation failures enter one retryable exception and stale previews fail closed", () => {
  const { ledger, connection } = configuredLedger();
  const record = stageBankRecord(ledger, connection, {
    transaction_date: "2026-08-21",
    description: "Unmapped debit",
    amount_cents: 600,
  });
  const failed = ledger.applyIntegrationRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Attempted after source review",
  });
  assert.equal(failed.status, "error");
  assert.equal(failed.exception.error_code, "MAPPING_VALIDATION_FAILED");
  const repeated = ledger.applyIntegrationRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Repeated mapping validation attempt",
  });
  assert.equal(repeated.exception.id, failed.exception.id);

  configureBankJournalMappings(ledger, connection);
  const preview = ledger.previewIntegrationRecordApplication({ record_id: record.id });
  ledger.createIntegrationMapping({
    connection_id: connection.id,
    object_type: "bank_transaction",
    source_field: "description",
    target_field: "memo",
    transform: "uppercase",
    required: true,
    version: 2,
  });
  assert.throws(
    () =>
      ledger.applyIntegrationRecord({
        record_id: record.id,
        approved: true,
        approval_note: "Approval against an old mapping preview",
        mapping_fingerprint: preview.mapping_fingerprint,
      }),
    /Mappings changed after preview/,
  );
  ledger.close();
});

test("removed provider records are routed to reversal-policy review", () => {
  const { ledger, connection } = configuredLedger();
  configureBankJournalMappings(ledger, connection);
  const record = stageBankRecord(
    ledger,
    connection,
    {
      transaction_date: "2026-08-21",
      description: "Removed provider transaction",
      amount_cents: 600,
    },
    "removed",
  );
  const result = ledger.applyIntegrationRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Reviewed removed source transaction",
  });
  assert.equal(result.status, "error");
  assert.match(result.preview.issues.join(" "), /reversal policy/);
  assert.equal(
    ledger.listJournals().some((item) => item.source === "provider_integration"),
    false,
  );
  ledger.close();
});

test("controlled previews classify invalid staged records into the exception workbench", () => {
  const { ledger, connection } = configuredLedger();
  const record = stageBankRecord(ledger, connection, {
    transaction_date: "2026-08-21",
    description: "Needs mapping",
    amount_cents: 700,
  });
  const preview = ledger.previewIntegrationRecordApplication({
    record_id: record.id,
    classify: true,
  });
  assert.equal(preview.ready, false);
  assert.equal(preview.exception.error_code, "MAPPING_VALIDATION_FAILED");
  assert.equal(ledger.integrationRecord(record.id).status, "error");
  assert.equal(ledger.integrationDeadLetters().length, 1);
  ledger.close();
});
