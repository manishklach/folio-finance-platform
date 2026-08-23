import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { createFolioServer } from "../server.js";

const hash = (value) => createHash("sha256").update(value).digest("hex");

test("tenant webhook inbox commits replay key and accounting effect atomically", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-webhook-inbox-"));
  const ledger = createLedger(join(directory, "tenant.db"), { orgId: "webhook-org" });
  t.after(() => {
    ledger.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const accounts = Object.fromEntries(
    ledger.getAccounts().map((account) => [account.code, account.id]),
  );
  let calls = 0;
  const apply = () => {
    calls += 1;
    const draft = ledger.createDraft({
      date: "2026-08-23",
      memo: "Atomic external receipt",
      source: "stripe_webhook",
      lines: [
        { account_id: accounts["1000"], debit_cents: 12500, credit_cents: 0 },
        { account_id: accounts["2150"], debit_cents: 0, credit_cents: 12500 },
      ],
    });
    return ledger.postJournal(draft.id);
  };
  const payloadHash = hash("event-one");
  const first = ledger.applyExternalEvent("stripe", "evt_atomic_1", payloadHash, apply);
  const replay = ledger.applyExternalEvent("stripe", "evt_atomic_1", payloadHash, apply);
  assert.equal(first.duplicate, false);
  assert.equal(replay.duplicate, true);
  assert.equal(replay.result.id, first.result.id);
  assert.equal(calls, 1);
  assert.equal(
    ledger.db.prepare("SELECT COUNT(*) count FROM external_event_applications").get().count,
    1,
  );
  assert.throws(
    () => ledger.applyExternalEvent("stripe", "evt_atomic_1", hash("tampered"), apply),
    /reused with a new payload/,
  );
});

test("failed webhook application rolls back both partial accounting and inbox claim", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-webhook-rollback-"));
  const ledger = createLedger(join(directory, "tenant.db"), { orgId: "rollback-org" });
  t.after(() => {
    ledger.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const accounts = Object.fromEntries(
    ledger.getAccounts().map((account) => [account.code, account.id]),
  );
  const before = ledger.listJournals().length;
  const createEffect = () => {
    const draft = ledger.createDraft({
      date: "2026-08-23",
      memo: "Effect that must roll back",
      source: "payroll_webhook",
      lines: [
        { account_id: accounts["5200"], debit_cents: 9000, credit_cents: 0 },
        { account_id: accounts["1000"], debit_cents: 0, credit_cents: 9000 },
      ],
    });
    ledger.postJournal(draft.id);
    return draft;
  };
  const payloadHash = hash("event-two");
  assert.throws(
    () =>
      ledger.applyExternalEvent("payroll", "evt_atomic_2", payloadHash, () => {
        createEffect();
        throw new Error("simulated worker crash");
      }),
    /simulated worker crash/,
  );
  assert.equal(ledger.listJournals().length, before);
  assert.equal(
    ledger.db.prepare("SELECT COUNT(*) count FROM external_event_applications").get().count,
    0,
  );
  assert.equal(
    ledger.applyExternalEvent("payroll", "evt_atomic_2", payloadHash, createEffect).duplicate,
    false,
  );
  assert.equal(ledger.listJournals().length, before + 1);
});

test("HTTP webhook replay returns the original result without another posted journal", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-webhook-http-inbox-"));
  const signingSecret = "payroll-test-signing-secret";
  const app = createFolioServer({
    platformDbPath: join(directory, "platform.db"),
    tenantDir: join(directory, "tenants"),
    environment: { NODE_ENV: "test", WEBHOOK_SECRET_PAYROLL: signingSecret },
  });
  const setup = await app.platform.setup({
    organization_name: "Webhook inbox HTTP",
    name: "Admin",
    email: "admin@example.test",
    password: "SecurePassword123",
  });
  const fixtureLedger = createLedger(setup.session.database_path, {
    orgId: setup.session.org_id,
  });
  const accounts = Object.fromEntries(
    fixtureLedger.getAccounts().map((account) => [account.code, account.id]),
  );
  fixtureLedger.close();
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });
  const body = JSON.stringify({
    id: "payroll_evt_1",
    type: "payroll.posted",
    data: {
      date: "2026-08-23",
      memo: "Provider payroll event",
      lines: [
        { account_id: accounts["5200"], debit_cents: 44000, credit_cents: 0 },
        { account_id: accounts["1000"], debit_cents: 0, credit_cents: 44000 },
      ],
    },
  });
  const signature = createHmac("sha256", signingSecret).update(body).digest("hex");
  const endpoint = `http://127.0.0.1:${app.server.address().port}/webhooks/payroll/${setup.session.slug}`;
  const send = async () => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "x-folio-signature": signature },
      body,
    });
    return { status: response.status, body: await response.json() };
  };
  const first = await send();
  const replay = await send();
  assert.equal(first.status, 200);
  assert.equal(first.body.duplicate, false);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.duplicate, true);
  assert.equal(replay.body.result.id, first.body.result.id);
  const tenant = app.ledgers.get(setup.session.org_id);
  assert.equal(
    tenant.db
      .prepare("SELECT COUNT(*) count FROM journal_entries WHERE source='payroll_webhook'")
      .get().count,
    1,
  );
  assert.equal(
    tenant.db.prepare("SELECT COUNT(*) count FROM external_event_applications").get().count,
    1,
  );
  const payloadHash = hash(body);
  assert.throws(
    () => app.platform.webhookLookup("payroll", "payroll_evt_1", "another-org", payloadHash),
    /reused across a tenant/,
  );
  assert.throws(
    () =>
      app.platform.webhookLookup(
        "payroll",
        "payroll_evt_1",
        setup.session.org_id,
        hash("changed-body"),
      ),
    /reused across a tenant/,
  );
});
