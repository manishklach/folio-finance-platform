import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createFolioServer } from "../server.js";
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
