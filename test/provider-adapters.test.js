import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { stripeWebhookPage, synchronizeProviderConnection } from "../lib/provider-adapters.js";

function connection(provider, settings = {}, externalAccountId = null) {
  const ledger = createLedger(":memory:");
  const configured = ledger.configureIntegration({
    provider,
    display_name: `${provider} contract fixture`,
    environment: "sandbox",
    external_account_id: externalAccountId,
    credential_secret_ref: `${provider.toUpperCase()}_SYNC_CREDENTIALS`,
    settings,
  });
  ledger.setIntegrationStatus({ connection_id: configured.id, status: "active" });
  return { ledger, configured };
}

function response(body, { status = 200, headers = {} } = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

test("Plaid adapter restarts from the persisted cursor and stages additions, changes, and removals", async () => {
  const { ledger, configured } = connection("plaid");
  const requests = [];
  const pages = [
    {
      added: [
        {
          transaction_id: "txn-added",
          account_id: "checking-1",
          date: "2026-08-20",
          amount: 12.34,
          name: "Cloud hosting",
          iso_currency_code: "USD",
          pending: false,
        },
      ],
      modified: [],
      removed: [],
      next_cursor: "plaid-page-2",
      has_more: true,
    },
    {
      added: [],
      modified: [
        {
          transaction_id: "txn-modified",
          account_id: "checking-1",
          date: "2026-08-21",
          amount: -50,
          name: "Customer receipt",
          pending: false,
        },
      ],
      removed: [{ transaction_id: "txn-removed" }],
      next_cursor: "plaid-complete",
      has_more: false,
    },
  ];
  const run = await synchronizeProviderConnection({
    ledger,
    connectionId: configured.id,
    credentialResolver: () =>
      JSON.stringify({ client_id: "client", secret: "secret", access_token: "item-token" }),
    fetchImpl: async (url, init) => {
      requests.push({ url, body: JSON.parse(init.body) });
      return response(pages.shift());
    },
  });
  assert.equal(run.status, "succeeded");
  assert.deepEqual([run.pages, run.added, run.modified, run.removed], [2, 1, 1, 1]);
  assert.equal(requests[0].url, "https://sandbox.plaid.com/transactions/sync");
  assert.equal(requests[1].body.cursor, "plaid-page-2");
  assert.equal(ledger.integrationConnection(configured.id).cursor, "plaid-complete");
  assert.equal(
    ledger.integrationRecords(configured.id).find((item) => item.external_id === "txn-added")
      .normalized.cash_amount_cents,
    -1234,
  );
  ledger.close();
});

test("Plaid mutation during pagination restarts the full update from its original cursor", async () => {
  const { ledger, configured } = connection("plaid");
  const transaction = {
    transaction_id: "txn-replayed",
    account_id: "checking-1",
    date: "2026-08-20",
    amount: 10,
    name: "Replayed page",
  };
  const responses = [
    response({
      added: [transaction],
      modified: [],
      removed: [],
      next_cursor: "unstable",
      has_more: true,
    }),
    response({ error_code: "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION" }, { status: 400 }),
    response({
      added: [transaction],
      modified: [],
      removed: [],
      next_cursor: "stable",
      has_more: true,
    }),
    response({ added: [], modified: [], removed: [], next_cursor: "complete", has_more: false }),
  ];
  const cursors = [];
  const run = await synchronizeProviderConnection({
    ledger,
    connectionId: configured.id,
    credentialResolver: () => ({ client_id: "client", secret: "secret", access_token: "token" }),
    fetchImpl: async (_url, init) => {
      cursors.push(JSON.parse(init.body).cursor || null);
      return responses.shift();
    },
  });
  assert.equal(run.status, "succeeded");
  assert.deepEqual(cursors, [null, "unstable", null, "stable"]);
  assert.equal(run.duplicates, 1);
  assert.equal(ledger.integrationRecords(configured.id).length, 1);
  ledger.close();
});

test("Stripe adapter paginates by object ID and preserves a created-time watermark", async () => {
  const { ledger, configured } = connection("stripe", { resource: "invoices" });
  const urls = [];
  const pages = [
    {
      data: [
        { id: "in_1", created: 1787472000, amount_paid: 2500, currency: "usd", status: "paid" },
      ],
      has_more: true,
    },
    {
      data: [
        { id: "in_2", created: 1787472060, amount_paid: 1200, currency: "usd", status: "paid" },
      ],
      has_more: false,
    },
  ];
  const run = await synchronizeProviderConnection({
    ledger,
    connectionId: configured.id,
    credentialResolver: () => ({ api_key: "rk_test_fixture" }),
    fetchImpl: async (url) => {
      urls.push(url);
      return response(pages.shift());
    },
  });
  assert.equal(run.added, 2);
  assert.match(urls[1], /starting_after=in_1/);
  assert.deepEqual(JSON.parse(ledger.integrationConnection(configured.id).cursor), {
    watermark: "1787472060",
  });
  ledger.close();
});

test("Stripe webhook events become versioned provider records instead of accounting commands", () => {
  const page = stripeWebhookPage({
    id: "evt_invoice_created_1",
    type: "invoice.created",
    created: 1787472200,
    data: {
      object: {
        id: "in_webhook_1",
        customer: "cus_1",
        amount_due: 7250,
        currency: "usd",
        status: "draft",
        livemode: true,
      },
    },
  });
  assert.equal(page.added.length, 1);
  assert.equal(page.added[0].object_type, "stripe_invoice");
  assert.equal(page.added[0].external_id, "in_webhook_1");
  assert.equal(page.added[0].source_version, "evt_invoice_created_1");
  assert.deepEqual(page.added[0].normalized, {
    customer_external_id: "cus_1",
    amount_cents: 7250,
    currency: "usd",
    status: "draft",
    livemode: true,
  });
  assert.throws(
    () =>
      stripeWebhookPage({
        id: "evt_unknown",
        type: "radar.early_fraud_warning.created",
        data: { object: { id: "issfr_1" } },
      }),
    /not supported/,
  );
});

test("Gusto adapter honors response pagination metadata and normalizes payroll totals", async () => {
  const { ledger, configured } = connection("gusto", {}, "company-123");
  const urls = [];
  const run = await synchronizeProviderConnection({
    ledger,
    connectionId: configured.id,
    credentialResolver: () => ({ access_token: "gusto-company-token" }),
    fetchImpl: async (url) => {
      urls.push(url);
      const page = urls.length;
      return response(
        [
          {
            payroll_uuid: `payroll-${page}`,
            company_uuid: "company-123",
            check_date: `2026-08-2${page}`,
            processed_date: `2026-08-2${page}T18:00:00Z`,
            payroll_type: "regular",
            pay_period: { start_date: "2026-08-01", end_date: "2026-08-15" },
            totals: { gross_pay: "1000.25", net_pay: "780.10", employer_taxes: "80.00" },
          },
        ],
        { headers: { "x-total-pages": "2" } },
      );
    },
  });
  assert.equal(run.pages, 2);
  assert.match(urls[1], /page=2/);
  assert.equal(ledger.integrationRecords(configured.id)[0].normalized.gross_pay_cents, 100025);
  ledger.close();
});

test("HubSpot adapter uses search paging and updated-time watermarks", async () => {
  const { ledger, configured } = connection("hubspot", { resource: "deals" });
  const requestBodies = [];
  const pages = [
    {
      results: [
        {
          id: "deal-1",
          updatedAt: "2026-08-20T10:00:00Z",
          properties: {
            dealname: "Enterprise",
            amount: "42000",
            hs_lastmodifieddate: "1787210400000",
          },
        },
      ],
      paging: { next: { after: "20" } },
    },
    {
      results: [
        {
          id: "deal-2",
          updatedAt: "2026-08-21T10:00:00Z",
          properties: { dealname: "Growth", amount: "9000", hs_lastmodifieddate: "1787296800000" },
        },
      ],
    },
  ];
  const run = await synchronizeProviderConnection({
    ledger,
    connectionId: configured.id,
    credentialResolver: () => ({ access_token: "hubspot-token" }),
    fetchImpl: async (_url, init) => {
      requestBodies.push(JSON.parse(init.body));
      return response(pages.shift());
    },
  });
  assert.equal(run.added, 2);
  assert.equal(requestBodies[1].after, "20");
  assert.deepEqual(JSON.parse(ledger.integrationConnection(configured.id).cursor), {
    watermark: "2026-08-21T10:00:00Z",
  });
  ledger.close();
});

test("provider throttling is retried without exposing credentials, then becomes an exception", async () => {
  const { ledger, configured } = connection("stripe");
  let calls = 0;
  const run = await synchronizeProviderConnection({
    ledger,
    connectionId: configured.id,
    credentialResolver: () => ({ api_key: "sensitive-provider-secret" }),
    fetchImpl: async () => {
      calls++;
      return response({ error: { message: "secret echoed by provider" } }, { status: 429 });
    },
    retry: { attempts: 3, sleep: async () => {} },
  });
  assert.equal(calls, 3);
  assert.equal(run.status, "failed");
  assert.equal(run.error_code, "RATE_LIMIT");
  assert.doesNotMatch(run.error_message, /sensitive|echoed/i);
  assert.equal(ledger.integrationDeadLetters()[0].status, "open");
  ledger.close();
});
