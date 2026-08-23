import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createPlatform } from "../lib/platform.js";
import { validateBrowserOrigin } from "../lib/runtime-config.js";
import { createFolioServer } from "../server.js";

const password = "SecurePassword123";

test("only one concurrent request can claim the initial administrator bootstrap", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-bootstrap-"));
  const platform = createPlatform(join(directory, "platform.db"), join(directory, "tenants"));
  t.after(() => {
    platform.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const attempts = await Promise.allSettled([
    platform.setup({
      organization_name: "First organization",
      name: "First Admin",
      email: "first@example.test",
      password,
    }),
    platform.setup({
      organization_name: "Second organization",
      name: "Second Admin",
      email: "second@example.test",
      password,
    }),
  ]);
  assert.equal(attempts.filter((item) => item.status === "fulfilled").length, 1);
  const rejected = attempts.find((item) => item.status === "rejected");
  assert.equal(rejected.reason.statusCode, 409);
  assert.equal(platform.db.prepare("SELECT COUNT(*) count FROM users").get().count, 1);
  assert.equal(platform.db.prepare("SELECT COUNT(*) count FROM organizations").get().count, 1);
  assert.equal(platform.db.prepare("SELECT COUNT(*) count FROM memberships").get().count, 1);
});

test("production origin enforcement requires an exact supplied Origin", () => {
  assert.throws(
    () => validateBrowserOrigin({}, "https://folio.example.test"),
    /origin is required/,
  );
  assert.throws(
    () =>
      validateBrowserOrigin({ origin: "https://evil.example.test" }, "https://folio.example.test"),
    /not allowed/,
  );
  assert.equal(
    validateBrowserOrigin(
      { origin: "https://folio.example.test", "sec-fetch-site": "same-origin" },
      "https://folio.example.test",
    ),
    true,
  );
});

test("first-administrator HTTP setup requires the configured deployment bootstrap token", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-bootstrap-http-"));
  const token = "test-bootstrap-token-with-at-least-thirty-two-bytes";
  const app = createFolioServer({
    platformDbPath: join(directory, "platform.db"),
    tenantDir: join(directory, "tenants"),
    environment: { NODE_ENV: "test", BOOTSTRAP_TOKEN: token },
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });
  const body = {
    organization_name: "Protected organization",
    name: "First Admin",
    email: "admin@example.test",
    password,
  };
  const register = (bootstrapToken) =>
    fetch(`${origin}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(bootstrapToken ? { "x-folio-bootstrap-token": bootstrapToken } : {}),
      },
      body: JSON.stringify(body),
    });
  assert.equal((await register()).status, 403);
  assert.equal((await register("wrong-token")).status, 403);
  assert.equal((await register(token)).status, 201);
  assert.equal(app.platform.db.prepare("SELECT COUNT(*) count FROM users").get().count, 1);
});

test("HTTP boundaries reject ambiguous bodies and sanitize attacker-controlled metadata", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-http-hardening-"));
  const app = createFolioServer({
    platformDbPath: join(directory, "platform.db"),
    tenantDir: join(directory, "tenants"),
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });

  const invalidType = await fetch(`${origin}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({
      organization_name: "Content Type",
      name: "Admin",
      email: "admin@example.test",
      password,
    }),
  });
  assert.equal(invalidType.status, 415);

  const longRequestId = "x".repeat(500);
  const response = await fetch(`${origin}/livez`, { headers: { "x-request-id": longRequestId } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
  assert.notEqual(response.headers.get("x-request-id"), longRequestId);

  const malformedCookie = await fetch(`${origin}/api/auth/me`, {
    headers: { cookie: "folio_session=%E0%A4%A" },
  });
  assert.equal(malformedCookie.status, 401);

  const traversal = await fetch(`${origin}/%2e%2e%5cpackage.json`);
  assert.notEqual(traversal.status, 200);
});

test("Prometheus request series remain bounded under arbitrary-path traffic", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "folio-metrics-bound-"));
  const app = createFolioServer({
    platformDbPath: join(directory, "platform.db"),
    tenantDir: join(directory, "tenants"),
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });
  for (let index = 0; index < 540; index++) await fetch(`${origin}/unknown-${index}-random`);
  const metrics = await (await fetch(`${origin}/metrics`)).text();
  const requestSeries = metrics
    .split("\n")
    .filter((line) => line.startsWith("folio_http_requests_total{"));
  assert.ok(
    requestSeries.length <= 513,
    `expected bounded series, received ${requestSeries.length}`,
  );
  assert.match(metrics, /route="\/_overflow"/);
});
