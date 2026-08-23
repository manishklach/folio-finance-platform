import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  admissionClass,
  admissionConfig,
  createAdmissionController,
} from "../lib/admission-control.js";
import { createFolioServer } from "../server.js";

const generous = {
  globalConcurrency: 10,
  tenantConcurrency: 5,
  heavyTenantConcurrency: 1,
  userRequestsPerMinute: 100,
  heavyTenantRequestsPerMinute: 100,
  maxTrackedPrincipals: 100,
};

test("route admission class is strict only for synchronous expensive workloads", () => {
  assert.equal(admissionClass("GET", "/api/reports/income_statement.pdf"), "heavy");
  assert.equal(admissionClass("POST", "/api/imports/stage"), "heavy");
  assert.equal(admissionClass("POST", "/api/imports/batches/batch-1/apply"), "heavy");
  assert.equal(admissionClass("POST", "/api/integrations/sync-runs"), "heavy");
  assert.equal(admissionClass("POST", "/api/ai/draft"), "heavy");
  assert.equal(admissionClass("GET", "/api/accounts"), "standard");
});

test("admission leases isolate tenant pools and are idempotently released", () => {
  const controller = createAdmissionController({}, { config: generous, now: () => 0 });
  const first = controller.enter({ orgId: "org-a", userId: "user-a", category: "heavy" });
  assert.throws(
    () => controller.enter({ orgId: "org-a", userId: "user-b", category: "heavy" }),
    (error) => error.statusCode === 429 && error.admissionReason === "heavy_tenant_concurrency",
  );
  const otherTenant = controller.enter({
    orgId: "org-b",
    userId: "user-b",
    category: "heavy",
  });
  assert.equal(controller.snapshot().active, 2);
  first.release();
  first.release();
  otherTenant.release();
  assert.equal(controller.snapshot().active, 0);
});

test("fixed rate windows return retry guidance, expire, and retain bounded metric labels", () => {
  let timestamp = 1_000;
  const controller = createAdmissionController(
    {},
    {
      config: { ...generous, userRequestsPerMinute: 1 },
      now: () => timestamp,
    },
  );
  controller.enter({ orgId: "org-a", userId: "user-a" }).release();
  assert.throws(
    () => controller.enter({ orgId: "org-a", userId: "user-a" }),
    (error) =>
      error.statusCode === 429 && error.admissionReason === "user_rate" && error.retryAfter === 60,
  );
  timestamp += 60_000;
  controller.enter({ orgId: "org-a", userId: "user-a" }).release();
  assert.deepEqual(Object.keys(controller.snapshot().rejected).sort(), [
    "global_concurrency",
    "heavy_tenant_concurrency",
    "heavy_tenant_rate",
    "tenant_concurrency",
    "tracking_capacity",
    "user_rate",
  ]);
});

test("invalid admission environment values fail closed", () => {
  assert.throws(
    () => admissionConfig({ ADMISSION_TENANT_CONCURRENCY: "0" }),
    /Admission-control value/,
  );
  assert.equal(admissionConfig({ ADMISSION_TENANT_CONCURRENCY: "12" }).tenantConcurrency, 12);
});

test("authenticated HTTP admission rejects with 429, Retry-After, safe body, and metrics", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-admission-"));
  const app = createFolioServer({
    platformDbPath: join(root, "platform.db"),
    tenantDir: join(root, "tenants"),
    environment: { ADMISSION_USER_REQUESTS_PER_MINUTE: "1" },
  });
  const setup = await app.platform.setup({
    organization_name: "Admission Test",
    name: "Controller",
    email: "controller@example.test",
    password: "StrongPassword123",
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });
  const headers = { cookie: `folio_session=${setup.token}` };
  assert.equal((await fetch(`${origin}/api/auth/me`, { headers })).status, 200);
  const rejected = await fetch(`${origin}/api/auth/me`, { headers });
  assert.equal(rejected.status, 429);
  assert.equal(rejected.headers.get("retry-after"), "60");
  assert.equal((await rejected.json()).error, "Request limit exceeded");
  const metrics = await (await fetch(`${origin}/metrics`)).text();
  assert.match(metrics, /folio_admission_rejections_total\{reason="user_rate"\} 1/);
  assert.doesNotMatch(metrics, new RegExp(setup.session.org_id));
});
