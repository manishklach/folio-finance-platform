import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { createPlatform } from "../lib/platform.js";
import { processNextWebhookDelivery } from "../lib/webhook-worker.js";

test("killed webhook workers recover after claim and after tenant commit without duplicate effects", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-webhook-crash-"));
  const platformDatabasePath = join(root, "platform.db");
  const tenantDatabaseDirectory = join(root, "tenants");
  const platform = createPlatform(platformDatabasePath, tenantDatabaseDirectory);
  const children = new Set();
  t.after(() => {
    for (const child of children) child.kill("SIGKILL");
    platform.close();
    rmSync(root, { recursive: true, force: true });
  });
  const setup = await platform.setup({
    organization_name: "Webhook Crash Recovery",
    email: "admin@example.test",
    password: "SecurePassword123",
  });
  const ledger = createLedger(setup.session.database_path, { orgId: setup.session.org_id });
  const connection = ledger.configureIntegration({
    provider: "stripe",
    environment: "production",
    display_name: "Stripe crash recovery",
    external_account_id: "acct_crash",
    credential_secret_ref: "STRIPE_CRASH_CREDENTIAL",
    webhook_secret_ref: "STRIPE_CRASH_WEBHOOK",
  });
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  ledger.close();

  const claimedOnly = enqueueInvoice(platform, setup.session.org_id, connection.id, "claim", "a");
  await killAtBoundary(
    children,
    "after-claim",
    claimedOnly.id,
    platformDatabasePath,
    tenantDatabaseDirectory,
  );
  expireLease(platform, claimedOnly.id);
  const recoveredClaim = await processNextWebhookDelivery(platform, { leaseSeconds: 10 });
  assert.equal(recoveredClaim.delivery.status, "completed");
  assert.equal(recoveredClaim.delivery.attempts, 2);
  assert.equal(recoveredClaim.application.duplicate, false);

  const tenantCommitted = enqueueInvoice(
    platform,
    setup.session.org_id,
    connection.id,
    "tenant-commit",
    "b",
  );
  await killAtBoundary(
    children,
    "after-tenant-commit",
    tenantCommitted.id,
    platformDatabasePath,
    tenantDatabaseDirectory,
  );
  expireLease(platform, tenantCommitted.id);
  const recoveredCommit = await processNextWebhookDelivery(platform, { leaseSeconds: 10 });
  assert.equal(recoveredCommit.delivery.status, "completed");
  assert.equal(recoveredCommit.delivery.attempts, 2);
  assert.equal(recoveredCommit.application.duplicate, true);

  const verification = createLedger(setup.session.database_path, {
    seed: false,
    orgId: setup.session.org_id,
  });
  assert.equal(verification.integrationRecords(connection.id).length, 2);
  assert.equal(verification.integrationSyncRuns(connection.id).length, 2);
  assert.equal(
    verification.db.prepare("SELECT COUNT(*) count FROM external_event_applications").get().count,
    2,
  );
  verification.close();
});

function enqueueInvoice(platform, orgId, connectionId, suffix, hashCharacter) {
  const id = `evt_crash_${suffix}`;
  return platform.enqueueWebhookDelivery({
    provider: "stripe",
    eventId: id,
    orgId,
    connectionId,
    payload: {
      id,
      type: "invoice.created",
      created: 1787472200,
      data: {
        object: {
          id: `in_crash_${suffix}`,
          customer: "cus_crash",
          amount_due: 12500,
          currency: "usd",
          status: "draft",
          livemode: true,
        },
      },
    },
    payloadHash: hashCharacter.repeat(64),
  });
}

async function killAtBoundary(
  children,
  phase,
  expectedDeliveryId,
  platformDatabasePath,
  tenantDatabaseDirectory,
) {
  const child = spawn(
    process.execPath,
    [
      join(import.meta.dirname, "..", "test-support", "webhook-crash-worker.js"),
      phase,
      platformDatabasePath,
      tenantDatabaseDirectory,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  children.add(child);
  try {
    const ready = await readyMessage(child);
    assert.deepEqual(ready, { phase, delivery_id: expectedDeliveryId });
    const exited = once(child, "exit");
    assert.equal(child.kill("SIGKILL"), true);
    await exited;
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGKILL");
      await exited;
    }
    children.delete(child);
  }
}

function readyMessage(child) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(
      () => reject(new Error(`Crash-test worker timed out: ${stderr}`)),
      10_000,
    );
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const newline = stdout.indexOf("\n");
      if (newline < 0) return;
      clearTimeout(timeout);
      resolve(JSON.parse(stdout.slice(0, newline)));
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      if (stdout.includes("\n")) return;
      clearTimeout(timeout);
      reject(new Error(`Crash-test worker exited ${code}: ${stderr}`));
    });
  });
}

function expireLease(platform, id) {
  platform.db
    .prepare("UPDATE webhook_deliveries SET locked_at=datetime('now','-20 seconds') WHERE id=?")
    .run(id);
}
