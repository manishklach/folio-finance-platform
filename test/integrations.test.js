import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";

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
