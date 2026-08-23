import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createFolioServer } from "../server.js";

test("API enforces authentication, roles, CSRF, and tenant isolation", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-api-"));
  const app = createFolioServer({
    platformDbPath: join(root, "platform.db"),
    tenantDir: join(root, "tenants"),
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });
  assert.equal((await fetch(`${origin}/api/dashboard`)).status, 401);
  const setup = await call(origin, "/api/auth/register", {
    organization_name: "Alpha Cloud",
    email: "admin@example.com",
    password: "StrongPassword123",
  });
  assert.equal(setup.response.status, 201);
  const adminCookie = setup.response.headers.get("set-cookie").split(";")[0];
  const admin = { cookie: adminCookie, csrf: setup.body.csrf_token };
  assert.equal((await call(origin, "/api/dashboard", null, admin)).response.status, 200);
  const assessment = await call(
    origin,
    "/api/gaap/assessments",
    {
      topic: "ASC 606",
      assessment_key: "API-LICENSE-1",
      as_of: "2026-08-22",
      facts: { license: true },
      conclusion: "Recognition over time",
      policy_basis: "Functional IP is supported throughout the license term.",
      disclosure: { significant_judgment: true },
    },
    admin,
  );
  assert.equal(assessment.response.status, 201);
  const gaap = await call(origin, "/api/gaap/overview", null, admin);
  assert.equal(gaap.body.assessments[0].assessment_key, "API-LICENSE-1");
  const investment = await call(
    origin,
    "/api/investments",
    {
      instrument_number: "API-EQ-1",
      name: "API investment",
      issuer: "Example issuer",
      security_type: "equity",
      accounting_model: "equity_fair_value",
      acquisition_date: "2026-08-22",
      readily_determinable_fair_value: true,
      fair_value_level: 1,
      policy_basis: "Quoted shares are measured through earnings under ASC 321.",
    },
    admin,
  );
  assert.equal(investment.response.status, 201);
  const investments = await call(origin, "/api/investments/overview", null, admin);
  assert.equal(investments.body.instruments[0].instrument_number, "API-EQ-1");
  assert.equal(
    (
      await call(
        origin,
        "/api/admin/users",
        { email: "viewer@example.com", role: "read_only", temporary_password: "ViewerPassword123" },
        admin,
      )
    ).response.status,
    201,
  );
  const login = await call(origin, "/api/auth/login", {
    email: "viewer@example.com",
    password: "ViewerPassword123",
  });
  const viewer = {
    cookie: login.response.headers.get("set-cookie").split(";")[0],
    csrf: login.body.csrf_token,
  };
  assert.equal(
    (await call(origin, "/api/journals", { date: "2026-08-22" }, viewer)).response.status,
    403,
  );
  assert.equal(
    (
      await call(
        origin,
        "/api/accounts",
        { code: "9998", name: "Denied", type: "asset" },
        { ...admin, csrf: "wrong" },
      )
    ).response.status,
    403,
  );
  const org = await call(origin, "/api/admin/organizations", { name: "Beta Cloud" }, admin);
  assert.equal(org.response.status, 201);
  const switched = await call(origin, "/api/auth/switch-org", { org_id: org.body.id }, admin);
  const beta = {
    cookie: switched.response.headers.get("set-cookie").split(";")[0],
    csrf: switched.body.csrf_token,
  };
  const betaAccount = await call(
    origin,
    "/api/accounts",
    { code: "9997", name: "Beta only", type: "asset" },
    beta,
  );
  assert.equal(betaAccount.response.status, 201);
  const relogin = await call(origin, "/api/auth/login", {
    email: "admin@example.com",
    password: "StrongPassword123",
    org_id: setup.body.organization.id,
  });
  const alphaAccounts = await call(origin, "/api/accounts", null, {
    cookie: relogin.response.headers.get("set-cookie").split(";")[0],
  });
  assert.equal(
    alphaAccounts.body.some((account) => account.code === "9997"),
    false,
  );
});

async function call(origin, path, body, auth = {}) {
  const response = await fetch(`${origin}${path}`, {
    method: body == null ? "GET" : "POST",
    headers: {
      ...(body == null ? {} : { "Content-Type": "application/json" }),
      ...(auth.cookie ? { Cookie: auth.cookie } : {}),
      ...(auth.csrf ? { "X-CSRF-Token": auth.csrf } : {}),
    },
    ...(body == null ? {} : { body: JSON.stringify(body) }),
  });
  return { response, body: await response.json() };
}
