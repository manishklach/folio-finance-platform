import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { API_ROUTE_POLICIES, apiRoutePolicy } from "../lib/api-route-policies.js";
import { createFolioServer } from "../server.js";

test("API route manifest is unambiguous, complete-by-construction, and fail-closed", () => {
  assert.ok(API_ROUTE_POLICIES.length >= 150);
  const identities = new Set();
  for (const policy of API_ROUTE_POLICIES) {
    const identity = `${policy.method} ${policy.template}`;
    assert.equal(identities.has(identity), false, `duplicate policy: ${identity}`);
    identities.add(identity);
    assert.equal(apiRoutePolicy(policy.method, policy.sample), policy, identity);
    assert.equal(
      API_ROUTE_POLICIES.filter(
        (candidate) => candidate.method === policy.method && candidate.matcher.test(policy.sample),
      ).length,
      1,
      `ambiguous policy: ${identity}`,
    );
    assert.ok(["GET", "POST", "PATCH"].includes(policy.method));
    assert.ok(["public", "bootstrap_or_platform", "platform", "tenant"].includes(policy.scope));
    if (policy.scope === "tenant") assert.ok(policy.permission, identity);
    if (policy.method !== "GET" && policy.scope !== "public") assert.equal(policy.csrf, true);
  }
  assert.equal(apiRoutePolicy("GET", "/api/not-declared"), null);
  assert.equal(apiRoutePolicy("DELETE", "/api/accounts"), null);
  assert.equal(apiRoutePolicy("POST", "/api/journals/not-a-number/post"), null);

  const serverSource = readFileSync(new URL("../server.js", import.meta.url), "utf8");
  const exactHandlerPattern =
    /if\s*\(\s*req\.method === "(GET|POST|PATCH)"\s*&&\s*url\.pathname === "(\/api\/[^"]+)"/g;
  const exactHandlers = [...serverSource.matchAll(exactHandlerPattern)].map((match) => ({
    method: match[1],
    path: match[2],
  }));
  assert.ok(exactHandlers.length >= 140, "exact route source inventory unexpectedly shrank");
  for (const handler of exactHandlers)
    assert.ok(
      apiRoutePolicy(handler.method, handler.path),
      `handler is missing policy: ${handler.method} ${handler.path}`,
    );
  assert.equal(
    API_ROUTE_POLICIES.filter((policy) => policy.template.includes(":")).length,
    45,
    "dynamic route inventory changed; review and update the manifest",
  );
});

test("every declared API route is authenticated and every mutation is CSRF and role protected", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-route-policy-"));
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

  for (const policy of API_ROUTE_POLICIES.filter((item) =>
    ["platform", "tenant"].includes(item.scope),
  )) {
    const response = await request(origin, policy.method, policy.sample);
    assert.equal(response.status, 401, `authentication: ${policy.method} ${policy.template}`);
  }

  const bootstrap = await request(origin, "POST", "/api/auth/register", null, {
    body: {
      organization_name: "Route Policy Test",
      email: "admin@example.com",
      password: "AdminPassword123",
    },
  });
  assert.equal(bootstrap.status, 201);
  const admin = authFrom(bootstrap);
  assert.equal((await request(origin, "POST", "/api/auth/register")).status, 401);
  const viewerInvite = await request(origin, "POST", "/api/admin/users", admin.cookie, {
    csrf: admin.csrf,
    body: {
      email: "viewer@example.com",
      role: "read_only",
      temporary_password: "ViewerPassword123",
    },
  });
  assert.equal(viewerInvite.status, 201);
  const viewerLogin = await request(origin, "POST", "/api/auth/login", null, {
    body: { email: "viewer@example.com", password: "ViewerPassword123" },
  });
  assert.equal(viewerLogin.status, 200);
  const viewer = authFrom(viewerLogin);

  for (const policy of API_ROUTE_POLICIES.filter((item) => item.csrf)) {
    const response = await request(origin, policy.method, policy.sample, admin.cookie);
    assert.equal(response.status, 403, `CSRF: ${policy.method} ${policy.template}`);
  }

  for (const policy of API_ROUTE_POLICIES.filter(
    (item) => item.permission && item.permission !== "read",
  )) {
    const response = await request(origin, policy.method, policy.sample, viewer.cookie, {
      csrf: viewer.csrf,
    });
    assert.equal(response.status, 403, `role: ${policy.method} ${policy.template}`);
  }

  assert.equal((await request(origin, "GET", "/api/not-declared", admin.cookie)).status, 404);
});

async function request(origin, method, path, cookie = null, options = {}) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.csrf ? { "X-CSRF-Token": options.csrf } : {}),
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method !== "GET" ? { body: JSON.stringify(options.body || {}) } : {}),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, headers: response.headers, body };
}

function authFrom(result) {
  return {
    cookie: result.headers.get("set-cookie").split(";")[0],
    csrf: result.body.csrf_token,
  };
}
