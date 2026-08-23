import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createFolioServer } from "../server.js";

test("two organizations cannot leak list, get, subledger, or aggregate data", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-tenancy-"));
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

  const setup = await request(origin, "POST", "/api/auth/register", {
    organization_name: "Alpha Books",
    email: "owner@example.com",
    password: "OwnerPassword123",
  });
  const alphaOrg = setup.body.organization.id;
  const alpha = authFrom(setup);
  const alphaBefore = await request(origin, "GET", "/api/dashboard", null, alpha);
  const organization = await request(
    origin,
    "POST",
    "/api/admin/organizations",
    { name: "Beta Books" },
    alpha,
  );
  assert.equal(organization.status, 201);
  const betaOrg = organization.body.id;
  const switched = await request(
    origin,
    "POST",
    "/api/auth/switch-org",
    { org_id: betaOrg },
    alpha,
  );
  const beta = authFrom(switched);
  const betaOverview = (await request(origin, "GET", "/api/saas/overview", null, beta)).body;
  const customer = betaOverview.customers[0],
    product = betaOverview.products[0],
    entity = betaOverview.entities[0];
  const contract = await request(
    origin,
    "POST",
    "/api/contracts",
    {
      customer_id: customer.id,
      entity_id: entity.id,
      contract_number: "BETA-ONLY-001",
      signed_date: "2026-08-22",
      start_date: "2026-09-01",
      end_date: "2027-08-31",
      transaction_price_cents: 1200000,
      obligations: [
        {
          product_id: product.id,
          description: "Beta isolated subscription",
          ssp_cents: 1200000,
          recognition_method: "straight_line",
          start_date: "2026-09-01",
          end_date: "2027-08-31",
        },
      ],
    },
    beta,
  );
  assert.equal(contract.status, 201);
  const invoice = await request(
    origin,
    "POST",
    "/api/invoices",
    {
      contract_id: contract.body.id,
      invoice_number: "BETA-INV-001",
      invoice_date: "2026-09-01",
      amount_cents: 1200000,
    },
    beta,
    { "Idempotency-Key": "beta-invoice-001" },
  );
  assert.equal(invoice.status, 201);
  const betaAccounts = (await request(origin, "GET", "/api/accounts", null, beta)).body;
  const cloud = betaAccounts.find((account) => account.code === "5000"),
    payable = betaAccounts.find((account) => account.code === "2000");
  const draft = await request(
    origin,
    "POST",
    "/api/journals",
    {
      org_id: alphaOrg,
      date: "2026-08-22",
      memo: "Beta tenant-only expense",
      lines: [
        { account_id: cloud.id, debit_cents: 1234, credit_cents: 0 },
        { account_id: payable.id, debit_cents: 0, credit_cents: 1234 },
      ],
    },
    beta,
  );
  await request(origin, "POST", `/api/journals/${draft.body.id}/post`, {}, beta);

  const alphaLogin = await request(origin, "POST", "/api/auth/login", {
    email: "owner@example.com",
    password: "OwnerPassword123",
    org_id: alphaOrg,
  });
  const alphaAgain = authFrom(alphaLogin);
  const alphaOverview = (await request(origin, "GET", "/api/saas/overview", null, alphaAgain)).body;
  assert.equal(
    alphaOverview.contracts.some((item) => item.contract_number === "BETA-ONLY-001"),
    false,
  );
  assert.equal(
    alphaOverview.receivables.invoices.some((item) => item.invoice_number === "BETA-INV-001"),
    false,
  );
  assert.equal(
    (await request(origin, "GET", "/api/journals", null, alphaAgain)).body.some(
      (item) => item.memo === "Beta tenant-only expense",
    ),
    false,
  );
  assert.equal(
    (await request(origin, "GET", `/api/contracts/${contract.body.id}`, null, alphaAgain)).status,
    404,
  );
  assert.deepEqual(
    (await request(origin, "GET", "/api/dashboard", null, alphaAgain)).body,
    alphaBefore.body,
  );

  const tenant = app.ledgers.get(betaOrg);
  const tables = tenant.db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('tenant_metadata','schema_migrations')",
    )
    .all();
  for (const { name } of tables) {
    const column = tenant.db
      .prepare(`PRAGMA table_info(${name})`)
      .all()
      .find((item) => item.name === "org_id");
    assert.equal(column?.notnull, 1, `${name}.org_id must be NOT NULL`);
  }
});

test("cached ledger handles fail closed when the verified organization path changes", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-tenant-cache-"));
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

  const setup = await request(origin, "POST", "/api/auth/register", {
    organization_name: "Cache Binding Books",
    email: "owner@example.com",
    password: "OwnerPassword123",
  });
  const auth = authFrom(setup);
  assert.equal((await request(origin, "GET", "/api/dashboard", null, auth)).status, 200);
  const originalLedger = app.ledgers.get(setup.body.organization.id);
  const redirectedPath = join(root, "tenants", "redirected.db");
  app.platform.db
    .prepare("UPDATE organizations SET database_path=? WHERE id=?")
    .run(redirectedPath, setup.body.organization.id);

  const rejected = await request(origin, "GET", "/api/dashboard", null, auth);
  assert.equal(rejected.status, 500);
  assert.equal(rejected.body.error, "Unexpected server error");
  assert.equal(app.ledgers.get(setup.body.organization.id), originalLedger);
  assert.equal(existsSync(redirectedPath), false);
});

async function request(origin, method, path, body, auth = {}, extraHeaders = {}) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      ...(body == null ? {} : { "Content-Type": "application/json" }),
      ...(auth.cookie ? { Cookie: auth.cookie } : {}),
      ...(auth.csrf ? { "X-CSRF-Token": auth.csrf } : {}),
      ...extraHeaders,
    },
    ...(body == null ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, headers: response.headers, body: await response.json() };
}
function authFrom(result) {
  return { cookie: result.headers.get("set-cookie").split(";")[0], csrf: result.body.csrf_token };
}
