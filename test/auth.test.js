import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createFolioServer } from "../server.js";

test("registration, login, expiry, and every role tier are enforced", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-auth-"));
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

  assert.equal((await request(origin, "GET", "/api/setup/status")).status, 401);
  assert.equal((await request(origin, "POST", "/api/setup", {})).status, 401);
  const bootstrap = await request(origin, "POST", "/api/auth/register", {
    organization_name: "Auth Test Cloud",
    email: "admin@example.com",
    password: "AdminPassword123",
  });
  assert.equal(bootstrap.status, 201);
  const admin = authFrom(bootstrap);
  assert.equal(
    (
      await request(origin, "POST", "/api/auth/login", {
        email: "admin@example.com",
        password: "incorrect-password",
      })
    ).status,
    401,
  );
  const me = await request(origin, "GET", "/api/auth/me", null, admin);
  assert.equal(me.body.role, "admin");
  admin.csrf = me.body.csrf_token;

  for (const role of ["bookkeeper", "approver", "read_only"]) {
    const created = await request(
      origin,
      "POST",
      "/api/auth/register",
      {
        email: `${role}@example.com`,
        role,
        password: `${role[0].toUpperCase()}${role.slice(1)}Password123`,
      },
      admin,
    );
    assert.equal(created.status, 201);
  }
  const bookkeeper = authFrom(
    await request(origin, "POST", "/api/auth/login", {
      email: "bookkeeper@example.com",
      password: "BookkeeperPassword123",
    }),
  );
  const approver = authFrom(
    await request(origin, "POST", "/api/auth/login", {
      email: "approver@example.com",
      password: "ApproverPassword123",
    }),
  );
  const readOnly = authFrom(
    await request(origin, "POST", "/api/auth/login", {
      email: "read_only@example.com",
      password: "Read_onlyPassword123",
    }),
  );
  const accounts = (await request(origin, "GET", "/api/accounts", null, bookkeeper)).body;
  const cash = accounts.find((account) => account.code === "1000");
  const prepaid = accounts.find((account) => account.code === "1200");
  const draft = await request(
    origin,
    "POST",
    "/api/journals",
    {
      date: "2026-08-22",
      memo: "Role enforcement draft",
      lines: [
        { account_id: prepaid.id, debit_cents: 1000, credit_cents: 0 },
        { account_id: cash.id, debit_cents: 0, credit_cents: 1000 },
      ],
    },
    bookkeeper,
  );
  assert.equal(draft.status, 201);
  const deniedPost = await request(
    origin,
    "POST",
    `/api/journals/${draft.body.id}/post`,
    {},
    bookkeeper,
  );
  assert.equal(deniedPost.status, 403);
  assert.match(deniedPost.body.error, /post/);
  assert.equal(
    (await request(origin, "POST", `/api/journals/${draft.body.id}/post`, {}, approver)).status,
    200,
  );
  assert.equal(
    (await request(origin, "POST", "/api/journals", { date: "2026-08-22" }, readOnly)).status,
    403,
  );
  const audit = (await request(origin, "GET", "/api/audit-log", null, admin)).body;
  assert.equal(
    audit.some(
      (item) => item.actor === "bookkeeper@example.com" && item.action === "draft_created",
    ),
    true,
  );
  assert.equal(
    audit.some((item) => item.actor === "approver@example.com" && item.action === "posted"),
    true,
  );

  const expiringLogin = await request(origin, "POST", "/api/auth/login", {
    email: "bookkeeper@example.com",
    password: "BookkeeperPassword123",
  });
  const expiring = authFrom(expiringLogin);
  app.platform.db
    .prepare("UPDATE sessions SET expires_at='2000-01-01T00:00:00.000Z' WHERE token_hash=?")
    .run(hashCookieToken(expiring.cookie));
  assert.equal((await request(origin, "GET", "/api/auth/me", null, expiring)).status, 401);
});

async function request(origin, method, path, body, auth = {}) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      ...(body == null ? {} : { "Content-Type": "application/json" }),
      ...(auth.cookie ? { Cookie: auth.cookie } : {}),
      ...(auth.csrf ? { "X-CSRF-Token": auth.csrf } : {}),
    },
    ...(body == null ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, headers: response.headers, body: await response.json() };
}
function authFrom(result) {
  return { cookie: result.headers.get("set-cookie").split(";")[0], csrf: result.body.csrf_token };
}
function hashCookieToken(cookie) {
  const token = decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1));
  return createHash("sha256").update(token).digest("hex");
}
