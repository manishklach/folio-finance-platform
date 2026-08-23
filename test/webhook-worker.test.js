import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { createPlatform } from "../lib/platform.js";
import { processNextWebhookDelivery } from "../lib/webhook-worker.js";

test("durable webhook queue deduplicates, leases, retries, reclaims, and dead-letters", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-webhook-queue-"));
  const platform = createPlatform(join(root, "platform.db"), join(root, "tenants"));
  t.after(() => {
    platform.close();
    rmSync(root, { recursive: true, force: true });
  });
  const setup = await platform.setup({
    organization_name: "Webhook Queue",
    email: "admin@example.test",
    password: "SecurePassword123",
  });
  const input = {
    provider: "stripe",
    eventId: "evt_queue_1",
    orgId: setup.session.org_id,
    connectionId: "connection-1",
    payload: { id: "evt_queue_1", type: "invoice.created", data: { object: { id: "in_1" } } },
    payloadHash: "a".repeat(64),
  };
  const queued = platform.enqueueWebhookDelivery(input);
  assert.equal(queued.duplicate, false);
  assert.equal(platform.enqueueWebhookDelivery(input).duplicate, true);
  const otherOrganization = platform.createOrganization(
    { name: "Other Webhook Queue" },
    setup.session,
  );
  assert.throws(
    () => platform.enqueueWebhookDelivery({ ...input, orgId: otherOrganization.id }),
    /reused across a tenant/,
  );
  assert.throws(
    () => platform.enqueueWebhookDelivery({ ...input, payloadHash: "b".repeat(64) }),
    /reused across a tenant/,
  );
  const claimed = platform.claimWebhookDelivery({ leaseSeconds: 10 });
  assert.equal(claimed.status, "processing");
  assert.equal(claimed.attempts, 1);
  assert.deepEqual(claimed.payload, input.payload);
  assert.equal(platform.failWebhookDelivery(claimed.id, "temporary failure").status, "retry");
  platform.db
    .prepare("UPDATE webhook_deliveries SET available_at=datetime('now','-1 second') WHERE id=?")
    .run(claimed.id);
  assert.equal(platform.claimWebhookDelivery().attempts, 2);
  assert.equal(
    platform.failWebhookDelivery(claimed.id, "permanent failure", { maxAttempts: 2 }).status,
    "dead_letter",
  );
  assert.equal(platform.retryWebhookDelivery(claimed.id).status, "retry");
  platform.db
    .prepare("UPDATE webhook_deliveries SET status='dead_letter' WHERE id=?")
    .run(claimed.id);

  const leased = platform.enqueueWebhookDelivery({
    ...input,
    eventId: "evt_queue_lease",
    payload: { ...input.payload, id: "evt_queue_lease" },
    payloadHash: "c".repeat(64),
  });
  assert.equal(platform.claimWebhookDelivery().id, leased.id);
  platform.db
    .prepare("UPDATE webhook_deliveries SET locked_at=datetime('now','-20 seconds') WHERE id=?")
    .run(leased.id);
  const reclaimed = platform.claimWebhookDelivery({ leaseSeconds: 10 });
  assert.equal(reclaimed.id, leased.id);
  assert.equal(reclaimed.attempts, 2);
  assert.equal(reclaimed.last_error, "Worker lease expired");
  assert.equal(platform.completeWebhookDelivery(reclaimed.id, { ok: true }).status, "completed");
  const metrics = platform.webhookQueueMetrics();
  assert.equal(metrics.counts.dead_letter, 1);
  assert.equal(metrics.counts.completed, 1);
});

test("webhook worker stages native provider data exactly once and records safe failures", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-webhook-worker-"));
  const platform = createPlatform(join(root, "platform.db"), join(root, "tenants"));
  t.after(() => {
    platform.close();
    rmSync(root, { recursive: true, force: true });
  });
  const setup = await platform.setup({
    organization_name: "Webhook Worker",
    email: "admin@example.test",
    password: "SecurePassword123",
  });
  const ledger = createLedger(setup.session.database_path, { orgId: setup.session.org_id });
  const connection = ledger.configureIntegration({
    provider: "stripe",
    environment: "production",
    display_name: "Stripe production",
    external_account_id: "acct_worker",
    credential_secret_ref: "STRIPE_WORKER_CREDENTIAL",
    webhook_secret_ref: "STRIPE_WORKER_WEBHOOK",
  });
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  ledger.close();
  const event = {
    id: "evt_worker_invoice",
    type: "invoice.created",
    created: 1787472200,
    data: {
      object: {
        id: "in_worker_1",
        customer: "cus_worker_1",
        amount_due: 8250,
        currency: "usd",
        status: "draft",
        livemode: true,
      },
    },
  };
  const delivery = platform.enqueueWebhookDelivery({
    provider: "stripe",
    eventId: event.id,
    orgId: setup.session.org_id,
    connectionId: connection.id,
    payload: event,
    payloadHash: "d".repeat(64),
  });
  const processed = await processNextWebhookDelivery(platform);
  assert.equal(processed.delivery.id, delivery.id);
  assert.equal(processed.delivery.status, "completed", processed.cause?.stack);
  assert.equal(processed.application.duplicate, false);
  assert.equal(await processNextWebhookDelivery(platform), null);
  const verification = createLedger(setup.session.database_path, {
    seed: false,
    orgId: setup.session.org_id,
  });
  assert.equal(verification.integrationRecords(connection.id).length, 1);
  assert.equal(
    verification.db
      .prepare("SELECT COUNT(*) count FROM journal_entries WHERE source='stripe_webhook'")
      .get().count,
    0,
  );
  verification.close();

  const unsupported = { id: "evt_worker_unsupported", type: "radar.created", data: { object: {} } };
  platform.enqueueWebhookDelivery({
    provider: "stripe",
    eventId: unsupported.id,
    orgId: setup.session.org_id,
    connectionId: connection.id,
    payload: unsupported,
    payloadHash: "e".repeat(64),
  });
  const failed = await processNextWebhookDelivery(platform, { maxAttempts: 1 });
  assert.equal(failed.delivery.status, "dead_letter");
  assert.equal(failed.error, "Webhook processing failed");
  assert.equal(failed.delivery.last_error, "Webhook processing failed");
  assert.match(failed.cause.message, /not supported/);
});
