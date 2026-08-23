import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { createFolioServer } from "../server.js";
import { processNextWebhookDelivery } from "../lib/webhook-worker.js";
import { verifyStripeSignature, verifyWebhookSignature } from "../lib/webhook-verification.js";

const secret = "whsec_test_endpoint_secret";
const timestamp = 1_800_000_000;
const rawBody = Buffer.from('{"id":"evt_1","type":"invoice.created","data":{}}');
const stripeHeader = (body = rawBody, time = timestamp) =>
  `t=${time},v1=${createHmac("sha256", secret).update(`${time}.`).update(body).digest("hex")}`;

test("Stripe verification authenticates the exact raw body and current signed timestamp", () => {
  assert.equal(
    verifyStripeSignature({
      rawBody,
      signatureHeader: stripeHeader(),
      signingSecret: secret,
      nowSeconds: timestamp + 299,
    }),
    true,
  );
  assert.equal(
    verifyStripeSignature({
      rawBody: Buffer.from(`${rawBody.toString("utf8")} `),
      signatureHeader: stripeHeader(),
      signingSecret: secret,
      nowSeconds: timestamp,
    }),
    false,
  );
});

test("Stripe verification rejects stale, future, malformed and wrong signatures", () => {
  for (const signatureHeader of [
    stripeHeader(rawBody, timestamp - 301),
    stripeHeader(rawBody, timestamp + 301),
    `t=${timestamp},v1=${"0".repeat(64)}`,
    `v1=${"0".repeat(64)}`,
    "",
  ])
    assert.equal(
      verifyStripeSignature({
        rawBody,
        signatureHeader,
        signingSecret: secret,
        nowSeconds: timestamp,
      }),
      false,
    );
});

test("Stripe secret rotation accepts any valid v1 signature and legacy sources remain isolated", () => {
  const valid = stripeHeader().split("v1=")[1];
  assert.equal(
    verifyWebhookSignature({
      provider: "stripe",
      rawBody,
      headers: { "stripe-signature": `t=${timestamp},v1=${"0".repeat(64)},v1=${valid}` },
      signingSecret: secret,
      nowSeconds: timestamp,
    }),
    true,
  );
  const legacy = createHmac("sha256", secret).update(rawBody).digest("hex");
  assert.equal(
    verifyWebhookSignature({
      provider: "payroll",
      rawBody,
      headers: { "x-folio-signature": legacy },
      signingSecret: secret,
    }),
    true,
  );
  assert.equal(
    verifyWebhookSignature({
      provider: "stripe",
      rawBody,
      headers: { "x-folio-signature": legacy },
      signingSecret: secret,
      nowSeconds: timestamp,
    }),
    false,
  );
});

test("Stripe HTTP boundary rejects legacy and stale signatures before event processing", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-stripe-webhook-"));
  const app = createFolioServer({
    platformDbPath: join(directory, "platform.db"),
    tenantDir: join(directory, "tenants"),
    environment: { NODE_ENV: "test", WEBHOOK_SECRET_STRIPE: secret },
  });
  const setup = await app.platform.setup({
    organization_name: "Stripe boundary",
    name: "Admin",
    email: "admin@example.test",
    password: "SecurePassword123",
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const endpoint = `http://127.0.0.1:${app.server.address().port}/webhooks/stripe/${setup.session.slug}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });
  const body = Buffer.from('{"id":"evt_http_1","type":"unsupported","data":{}}');
  const now = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${now}.`).update(body).digest("hex");
  const staleTime = now - 301;
  const staleSignature = createHmac("sha256", secret)
    .update(`${staleTime}.`)
    .update(body)
    .digest("hex");
  const send = (headers) => fetch(endpoint, { method: "POST", headers, body });
  const legacy = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal((await send({ "x-folio-signature": legacy })).status, 401);
  assert.equal(
    (await send({ "stripe-signature": `t=${staleTime},v1=${staleSignature}` })).status,
    401,
  );
  assert.equal((await send({ "stripe-signature": `t=${now},v1=${signature}` })).status, 422);
});

test("Stripe connection endpoint uses its secret reference and binds provider account", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-stripe-connection-webhook-"));
  const connectionSecret = "whsec_connection_specific_secret";
  const app = createFolioServer({
    platformDbPath: join(directory, "platform.db"),
    tenantDir: join(directory, "tenants"),
    environment: { NODE_ENV: "test", STRIPE_CONNECTION_WEBHOOK: connectionSecret },
  });
  const setup = await app.platform.setup({
    organization_name: "Stripe connection boundary",
    name: "Admin",
    email: "admin@example.test",
    password: "SecurePassword123",
  });
  const ledger = createLedger(setup.session.database_path, { orgId: setup.session.org_id });
  const connection = ledger.configureIntegration({
    provider: "stripe",
    environment: "production",
    display_name: "Stripe production",
    external_account_id: "acct_expected",
    credential_secret_ref: "STRIPE_CONNECTION_CREDENTIAL",
    webhook_secret_ref: "STRIPE_CONNECTION_WEBHOOK",
  });
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  ledger.close();
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });
  const endpoint = `http://127.0.0.1:${app.server.address().port}/webhooks/stripe/${setup.session.slug}/${connection.id}`;
  const send = async (account, type = "unsupported") => {
    const body = Buffer.from(
      JSON.stringify({
        id: `evt_${account}_${type}`,
        type,
        account,
        created: 1787472200,
        data: {
          object: {
            id: "in_connection_1",
            customer: "cus_connection_1",
            amount_due: 9100,
            currency: "usd",
            status: "draft",
            livemode: true,
          },
        },
      }),
    );
    const now = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", connectionSecret)
      .update(`${now}.`)
      .update(body)
      .digest("hex");
    return fetch(endpoint, {
      method: "POST",
      headers: { "stripe-signature": `t=${now},v1=${signature}` },
      body,
    });
  };
  assert.equal((await send("acct_wrong")).status, 401);
  const first = await send("acct_expected", "invoice.created");
  const replay = await send("acct_expected", "invoice.created");
  assert.equal(first.status, 202);
  assert.equal(replay.status, 202);
  assert.equal((await first.json()).duplicate, false);
  assert.equal((await replay.json()).duplicate, true);
  const activeLedger = app.ledgers.get(setup.session.org_id);
  assert.equal(activeLedger.integrationRecords(connection.id).length, 0);
  const processed = await processNextWebhookDelivery(app.platform);
  assert.equal(processed.delivery.status, "completed");
  const records = activeLedger.integrationRecords(connection.id);
  assert.equal(records.length, 1);
  assert.equal(records[0].object_type, "stripe_invoice");
  assert.equal(
    activeLedger.db
      .prepare("SELECT COUNT(*) count FROM journal_entries WHERE source='stripe_webhook'")
      .get().count,
    0,
  );
});

test("production Stripe webhooks reject tenant-slug-only endpoints", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-stripe-production-route-"));
  const app = createFolioServer({
    platformDbPath: join(directory, "platform.db"),
    tenantDir: join(directory, "tenants"),
    environment: { NODE_ENV: "production" },
  });
  const setup = await app.platform.setup({
    organization_name: "Production route",
    name: "Admin",
    email: "admin@example.test",
    password: "SecurePassword123",
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });
  const response = await fetch(
    `http://127.0.0.1:${app.server.address().port}/webhooks/stripe/${setup.session.slug}`,
    { method: "POST", body: "{}" },
  );
  assert.equal(response.status, 404);
});
