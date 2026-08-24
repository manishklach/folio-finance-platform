import { createHash } from "node:crypto";
import { z } from "zod";

const credentialSchema = z.record(z.string(), z.string().min(1));
const stripeResources = new Set([
  "customers",
  "subscriptions",
  "invoices",
  "credit_notes",
  "charges",
  "refunds",
  "disputes",
  "payouts",
  "balance_transactions",
]);
const hubspotResources = new Set(["companies", "deals", "products", "line_items"]);
const stripeWebhookResources = {
  customer: "customers",
  "customer.subscription": "subscriptions",
  invoice: "invoices",
  credit_note: "credit_notes",
  charge: "charges",
  refund: "refunds",
  "charge.dispute": "disputes",
  payout: "payouts",
};

export async function synchronizeProviderConnection({
  ledger,
  connectionId,
  fetchImpl = globalThis.fetch,
  credentialResolver,
  trigger = "scheduled",
  maxPages = 250,
  retry = {},
}) {
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");
  if (typeof credentialResolver !== "function")
    throw new Error("A credential resolver is required");
  const connection = ledger.integrationConnection(connectionId);
  const run = ledger.startIntegrationSync({ connection_id: connection.id, trigger });
  let cursor = connection.cursor;
  try {
    const credentials = parseCredentials(
      await credentialResolver(connection.credential_secret_ref, connection),
    );
    const adapter = providerAdapter(connection, credentials, {
      fetchImpl,
      retry,
    });
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
      let page;
      try {
        page = await adapter.page(cursor);
      } catch (error) {
        if (
          connection.provider === "plaid" &&
          error?.code === "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION"
        ) {
          cursor = connection.cursor;
          continue;
        }
        throw error;
      }
      const current = ledger.ingestIntegrationPage({
        sync_run_id: run.id,
        ...page,
      });
      if (!page.has_more) return current;
      cursor = page.next_cursor;
    }
    throw providerError("PAGE_LIMIT", `Provider exceeded the ${maxPages}-page safety limit`);
  } catch (error) {
    const current = ledger.integrationSyncRun(run.id);
    if (current.status !== "running") throw error;
    return ledger.failIntegrationSync({
      sync_run_id: run.id,
      error_code: safeErrorCode(error),
      error_message: safeErrorMessage(error),
    }).run;
  }
}

export function providerAdapter(connection, credentials, options = {}) {
  const request = providerRequest(options.fetchImpl || globalThis.fetch, options.retry);
  if (connection.provider === "plaid") return plaidAdapter(connection, credentials, request);
  if (connection.provider === "stripe") return stripeAdapter(connection, credentials, request);
  if (connection.provider === "gusto") return gustoAdapter(connection, credentials, request);
  if (connection.provider === "hubspot") return hubspotAdapter(connection, credentials, request);
  throw providerError("UNSUPPORTED_PROVIDER", "Provider adapter is not implemented");
}

export function stripeWebhookPage(event) {
  const parsed = z
    .object({
      id: z.string().trim().min(1).max(255),
      type: z.string().trim().min(3).max(160),
      created: z.number().int().nonnegative().optional(),
      data: z.object({ object: z.record(z.string(), z.unknown()) }),
    })
    .parse(event);
  const eventAction = parsed.type.split(".").at(-1);
  const objectPrefix = Object.keys(stripeWebhookResources)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => parsed.type === prefix || parsed.type.startsWith(`${prefix}.`));
  if (!objectPrefix)
    throw providerError("UNSUPPORTED_EVENT", "Stripe webhook event is not supported");
  const operation = ["deleted", "voided", "canceled"].includes(eventAction)
    ? "removed"
    : ["created", "succeeded"].includes(eventAction)
      ? "added"
      : "modified";
  const normalized = stripeObject(stripeWebhookResources[objectPrefix], parsed.data.object);
  const record = {
    ...normalized,
    source_version: parsed.id,
    effective_at: parsed.created
      ? new Date(parsed.created * 1000).toISOString()
      : normalized.effective_at,
  };
  return {
    added: operation === "added" ? [record] : [],
    modified: operation === "modified" ? [record] : [],
    removed: operation === "removed" ? [record] : [],
    has_more: false,
    next_cursor: null,
  };
}

function plaidAdapter(connection, credentials, request) {
  requireFields(credentials, ["client_id", "secret", "access_token"]);
  const base =
    connection.environment === "production"
      ? "https://production.plaid.com"
      : "https://sandbox.plaid.com";
  return {
    async page(cursor) {
      const body = await request(`${base}/transactions/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: credentials.client_id,
          secret: credentials.secret,
          access_token: credentials.access_token,
          cursor: cursor || undefined,
          count: 500,
          options: { include_original_description: true },
        }),
      });
      return {
        added: (body.added || []).map((item) => plaidTransaction(item)),
        modified: (body.modified || []).map((item) => plaidTransaction(item)),
        removed: (body.removed || []).map((item) => ({
          object_type: "bank_transaction",
          external_id: providerId(item.transaction_id),
          normalized: {},
          source: item,
        })),
        has_more: Boolean(body.has_more),
        next_cursor: z.string().max(256).parse(body.next_cursor),
      };
    },
  };
}

function stripeAdapter(connection, credentials, request) {
  const token = credentials.access_token || credentials.api_key;
  if (!token) throw providerError("INVALID_CREDENTIAL", "Stripe credential is incomplete");
  const resource = connection.settings.resource || "invoices";
  if (!stripeResources.has(resource))
    throw providerError("INVALID_CONFIGURATION", "Stripe resource is not supported");
  const headers = { Authorization: `Bearer ${token}` };
  if (credentials.account_id) headers["Stripe-Account"] = credentials.account_id;
  return {
    async page(cursorValue) {
      const cursor = opaqueCursor(cursorValue);
      const query = new URLSearchParams({ limit: "100" });
      if (cursor.starting_after) query.set("starting_after", cursor.starting_after);
      if (!cursor.starting_after && cursor.watermark) query.set("created[gte]", cursor.watermark);
      const body = await request(`https://api.stripe.com/v1/${resource}?${query}`, {
        headers,
      });
      const data = z.array(z.record(z.string(), z.unknown())).parse(body.data || []);
      const payoutTransactions =
        resource === "payouts" ? await stripePayoutTransactions(data, request, headers) : [];
      const watermark = data.reduce(
        (latest, item) => Math.max(latest, Number(item.created || 0)),
        Number(cursor.watermark || 0),
      );
      const hasMore = Boolean(body.has_more) && data.length > 0;
      return {
        added: [
          ...data.map((item) => stripeObject(resource, item)),
          ...payoutTransactions.map((item) => stripeObject("balance_transactions", item)),
        ],
        modified: [],
        removed: [],
        has_more: hasMore,
        next_cursor: encodeCursor(
          hasMore
            ? { starting_after: String(data.at(-1).id), watermark }
            : { watermark: String(watermark) },
        ),
      };
    },
  };
}

async function stripePayoutTransactions(payouts, request, headers) {
  const records = [];
  for (const payout of payouts) {
    let startingAfter = null;
    for (let page = 0; page < 100; page++) {
      const query = new URLSearchParams({ limit: "100", payout: providerId(payout.id) });
      if (startingAfter) query.set("starting_after", startingAfter);
      const body = await request(`https://api.stripe.com/v1/balance_transactions?${query}`, {
        headers,
      });
      const data = z.array(z.record(z.string(), z.unknown())).parse(body.data || []);
      if (records.length + data.length > 9_900)
        throw providerError(
          "PAYOUT_COMPONENT_LIMIT",
          "Stripe payout component batch exceeds the bounded ingestion limit",
        );
      records.push(...data.map((item) => ({ ...item, payout: payout.id })));
      if (!body.has_more) break;
      if (!data.length)
        throw providerError("INVALID_RESPONSE", "Stripe payout component page did not advance");
      startingAfter = providerId(data.at(-1).id);
      if (page === 99)
        throw providerError(
          "PAGINATION_LIMIT",
          "Stripe payout component pagination exceeded its safety limit",
        );
    }
  }
  return records;
}

function gustoAdapter(connection, credentials, request) {
  requireFields(credentials, ["access_token"]);
  const companyId = connection.external_account_id || connection.settings.company_id;
  if (!companyId) throw providerError("INVALID_CONFIGURATION", "Gusto company ID is required");
  const base =
    connection.environment === "production"
      ? "https://api.gusto.com"
      : "https://api.gusto-demo.com";
  return {
    async page(cursorValue) {
      const cursor = opaqueCursor(cursorValue);
      const page = Number(cursor.page || 1);
      const query = new URLSearchParams({
        page: String(page),
        per: "100",
        processing_statuses: "processed",
        payroll_types: "regular,off_cycle,external",
        include: "totals,taxes,payroll_status_meta,reversals",
      });
      if (cursor.watermark) query.set("start_date", String(cursor.watermark).slice(0, 10));
      const response = await request.raw(
        `${base}/v1/companies/${encodeURIComponent(companyId)}/payrolls?${query}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            "X-Gusto-API-Version": apiVersion(connection.settings.api_version, "2026-06-15"),
          },
        },
      );
      const data = z.array(z.record(z.string(), z.unknown())).parse(response.body || []);
      const totalPages = Number(response.headers.get("x-total-pages") || page);
      const watermark = data.reduce(
        (latest, item) => latestDate(latest, item.processed_date || item.check_date),
        cursor.watermark || "",
      );
      const hasMore = page < totalPages;
      return {
        added: data.map(gustoPayroll),
        modified: [],
        removed: [],
        has_more: hasMore,
        next_cursor: encodeCursor(hasMore ? { page: page + 1, watermark } : { watermark }),
      };
    },
  };
}

function hubspotAdapter(connection, credentials, request) {
  requireFields(credentials, ["access_token"]);
  const configuredResource = connection.settings.resource || null;
  if (configuredResource && !hubspotResources.has(configuredResource))
    throw providerError("INVALID_CONFIGURATION", "HubSpot resource is not supported");
  const resources = configuredResource
    ? [configuredResource]
    : ["companies", "products", "line_items", "deals"];
  return {
    async page(cursorValue) {
      const cursor = opaqueCursor(cursorValue);
      const resourceIndex = configuredResource ? 0 : Number(cursor.resource_index || 0);
      const resource = resources[resourceIndex] || resources[0];
      const resourceCursor = configuredResource ? cursor : cursor.resources?.[resource] || {};
      const properties =
        Array.isArray(connection.settings.properties) && configuredResource
          ? connection.settings.properties.slice(0, 50)
          : defaultHubSpotProperties(resource);
      const body = {
        limit: 200,
        properties,
        sorts: [{ propertyName: "hs_lastmodifieddate", direction: "ASCENDING" }],
      };
      if (resourceCursor.after) body.after = String(resourceCursor.after);
      if (resourceCursor.watermark)
        body.filterGroups = [
          {
            filters: [
              {
                propertyName: "hs_lastmodifieddate",
                operator: "GTE",
                value: String(resourceCursor.watermark),
              },
            ],
          },
        ];
      const version = apiVersion(connection.settings.api_version, "2026-03");
      const result = await request(
        `https://api.hubapi.com/crm/objects/${version}/${resource}/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const data = z.array(z.record(z.string(), z.unknown())).parse(result.results || []);
      const associations =
        !configuredResource || connection.settings.include_associations === true
          ? await hubspotAssociations(resource, data, version, credentials, request)
          : new Map();
      const after = result.paging?.next?.after;
      const watermark = data.reduce(
        (latest, item) =>
          latestDate(latest, item.updatedAt || item.properties?.hs_lastmodifieddate),
        resourceCursor.watermark || "",
      );
      if (configuredResource)
        return {
          added: data.map((item) =>
            hubspotObject(resource, item, associations.get(String(item.id))),
          ),
          modified: [],
          removed: [],
          has_more: after !== undefined && after !== null,
          next_cursor: encodeCursor(after ? { after: String(after), watermark } : { watermark }),
        };
      const resourceState = { ...(cursor.resources || {}), [resource]: { watermark } };
      const hasResourcePage = after !== undefined && after !== null;
      if (hasResourcePage) resourceState[resource].after = String(after);
      const nextIndex = hasResourcePage ? resourceIndex : resourceIndex + 1;
      const hasMore = nextIndex < resources.length;
      return {
        added: data.map((item) => hubspotObject(resource, item, associations.get(String(item.id)))),
        modified: [],
        removed: [],
        has_more: hasMore,
        next_cursor: encodeCursor({
          resource_index: hasMore ? nextIndex : 0,
          resources: resourceState,
        }),
      };
    },
  };
}

async function hubspotAssociations(resource, items, version, credentials, request) {
  const targets =
    resource === "deals"
      ? ["companies", "line_items"]
      : resource === "line_items"
        ? ["products"]
        : [];
  const output = new Map(items.map((item) => [String(item.id), {}]));
  if (!items.length) return output;
  for (const target of targets) {
    const result = await request(
      `https://api.hubapi.com/crm/associations/${version}/${resource}/${target}/batch/read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: items.map((item) => ({ id: String(item.id) })) }),
      },
    );
    if (Number(result.numErrors || 0) > 0 || (result.errors || []).length)
      throw providerError(
        "ASSOCIATION_PARTIAL_FAILURE",
        "HubSpot returned a partial association batch",
      );
    for (const association of result.results || []) {
      if (association.paging?.next)
        throw providerError(
          "ASSOCIATION_PAGE_LIMIT",
          "HubSpot association results exceeded one batch page",
        );
      const from = String(association.from?.id || association.fromObjectId || "");
      if (!output.has(from)) continue;
      const ids = (association.to || [])
        .map((item) => String(item.toObjectId || item.id || ""))
        .filter(Boolean);
      output.get(from)[target] = ids;
    }
  }
  return output;
}

function providerRequest(fetchImpl, retry = {}) {
  const attempts = Math.max(1, Math.min(Number(retry.attempts || 4), 8));
  const sleep =
    retry.sleep || ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  async function raw(url, init = {}) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      let response;
      try {
        response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(30_000) });
      } catch (error) {
        if (attempt === attempts)
          throw providerError("NETWORK_ERROR", "Provider could not be reached", error);
        await sleep(backoff(attempt));
        continue;
      }
      let body;
      try {
        body = response.status === 204 ? null : await response.json();
      } catch {
        throw providerError("INVALID_RESPONSE", "Provider returned invalid JSON");
      }
      if (response.ok) return { body, headers: response.headers, status: response.status };
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < attempts) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await sleep(
          Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 30_000) : backoff(attempt),
        );
        continue;
      }
      throw providerError(
        response.status === 429
          ? "RATE_LIMIT"
          : String(body?.error_code || body?.code || `HTTP_${response.status}`),
        `Provider request failed with HTTP ${response.status}`,
      );
    }
  }
  const request = async (url, init) => (await raw(url, init)).body;
  request.raw = raw;
  return request;
}

function plaidTransaction(item) {
  return {
    object_type: "bank_transaction",
    external_id: providerId(item.transaction_id),
    effective_at: providerDate(item.datetime || item.date),
    source: item,
    normalized: {
      account_external_id: item.account_id || null,
      occurred_on: item.date || null,
      authorized_on: item.authorized_date || null,
      description: item.original_description || item.name || "Bank transaction",
      merchant_name: item.merchant_name || null,
      cash_amount_cents: Math.round(Number(item.amount || 0) * -100),
      currency: item.iso_currency_code || item.unofficial_currency_code || null,
      pending: Boolean(item.pending),
      pending_external_id: item.pending_transaction_id || null,
    },
  };
}

function stripeObject(resource, item) {
  const amount = item.amount_paid ?? item.amount ?? item.total ?? item.amount_due ?? 0;
  const idOf = (value) => (typeof value === "string" ? value : value?.id || null);
  const unixDate = (value) =>
    value ? new Date(Number(value) * 1000).toISOString().slice(0, 10) : null;
  return {
    object_type: `stripe_${resource.replace(/s$/, "")}`,
    external_id: providerId(item.id),
    effective_at: item.created ? new Date(Number(item.created) * 1000).toISOString() : null,
    source: item,
    normalized: {
      customer_external_id:
        typeof item.customer === "string" ? item.customer : item.customer?.id || null,
      amount_cents: Math.round(Number(amount || 0)),
      currency: item.currency || null,
      status: item.status || null,
      livemode: Boolean(item.livemode),
      customer_name: item.name || item.customer_name || null,
      customer_email: item.email || item.customer_email || null,
      subscription_external_id: idOf(item.subscription),
      invoice_external_id: idOf(item.invoice),
      charge_external_id: idOf(item.charge),
      payment_intent_external_id: idOf(item.payment_intent),
      balance_transaction_external_id: idOf(item.balance_transaction),
      payout_external_id: idOf(item.payout),
      source_external_id: idOf(item.source),
      invoice_number: item.number || null,
      amount_due_cents: integerCents(item.amount_due),
      amount_paid_cents: integerCents(item.amount_paid),
      amount_remaining_cents: integerCents(item.amount_remaining),
      amount_refunded_cents: integerCents(item.amount_refunded),
      fee_cents: integerCents(item.fee),
      net_cents: integerCents(item.net),
      paid: item.paid === undefined ? null : Boolean(item.paid),
      disputed: item.disputed === undefined ? null : Boolean(item.disputed),
      refunded: item.refunded === undefined ? null : Boolean(item.refunded),
      due_on: unixDate(item.due_date),
      arrival_on: unixDate(item.arrival_date),
      period_start_on: unixDate(item.current_period_start || item.period_start),
      period_end_on: unixDate(item.current_period_end || item.period_end),
      transaction_type: item.type || null,
      metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : {},
    },
  };
}

function integerCents(value) {
  return value === undefined || value === null ? null : Math.round(Number(value));
}

function gustoPayroll(item) {
  const id = item.payroll_uuid || item.uuid;
  return {
    object_type: "payroll_run",
    external_id: providerId(id),
    effective_at: providerDate(item.processed_date || item.check_date),
    source: item,
    normalized: {
      company_external_id: item.company_uuid || null,
      check_date: item.check_date || null,
      period_start: item.pay_period?.start_date || null,
      period_end: item.pay_period?.end_date || null,
      payroll_type: item.payroll_type || null,
      currency: String(item.currency || "USD").toUpperCase(),
      processed: item.processed === undefined ? true : Boolean(item.processed),
      gross_pay_cents: decimalCents(item.totals?.gross_pay || item.totals?.gross_payroll),
      net_pay_cents: decimalCents(item.totals?.net_pay || item.totals?.net_payroll),
      employer_taxes_cents: decimalCents(item.totals?.employer_taxes),
      employee_taxes_cents: decimalCents(item.totals?.employee_taxes),
      employee_benefits_cents: decimalCents(item.totals?.employee_benefits_deductions),
      employer_benefits_cents: decimalCents(item.totals?.benefits),
      reimbursements_cents: decimalCents(item.totals?.reimbursements),
      company_debit_cents: decimalCents(
        item.totals?.company_debit || item.totals?.total_debit_amount,
      ),
      net_pay_debit_cents: decimalCents(item.totals?.net_pay_debit),
      tax_debit_cents: decimalCents(item.totals?.tax_debit),
      reimbursement_debit_cents: decimalCents(item.totals?.reimbursement_debit),
      child_support_debit_cents: decimalCents(item.totals?.child_support_debit),
      reversal_external_ids: Array.isArray(item.reversals)
        ? item.reversals.map((value) => value?.payroll_uuid || value?.uuid).filter(Boolean)
        : [],
    },
  };
}

function hubspotObject(resource, item, associations = {}) {
  const properties = item.properties || {};
  const normalized =
    resource === "companies"
      ? {
          name: properties.name || null,
          domain: properties.domain || null,
          industry: properties.industry || null,
          country: properties.country || null,
          archived: Boolean(item.archived),
        }
      : resource === "products"
        ? {
            name: properties.name || null,
            sku: properties.hs_sku || null,
            price: properties.price || null,
            currency: properties.hs_price_currency_code || null,
            recurring_period: properties.hs_recurring_billing_period || null,
            archived: Boolean(item.archived),
          }
        : resource === "line_items"
          ? {
              name: properties.name || null,
              sku: properties.hs_sku || null,
              quantity: properties.quantity || null,
              unit_price: properties.price || null,
              amount: properties.amount || null,
              discount: properties.hs_discount_percentage || null,
              billing_start_date: properties.hs_billing_start_date || null,
              recurring_period: properties.hs_recurring_billing_period || null,
              product_external_ids: associations.products || [],
              archived: Boolean(item.archived),
            }
          : {
              name: properties.dealname || null,
              amount: properties.amount || null,
              currency: properties.deal_currency_code || properties.hs_currency || "USD",
              stage: properties.dealstage || null,
              close_date: properties.closedate || null,
              is_closed_won: String(properties.hs_is_closed_won).toLowerCase() === "true",
              company_external_ids: associations.companies || [],
              line_item_external_ids: associations.line_items || [],
              archived: Boolean(item.archived),
            };
  return {
    object_type: `hubspot_${resource.replace(/ies$/, "y").replace(/s$/, "")}`,
    external_id: providerId(item.id),
    effective_at: providerDate(item.updatedAt || item.properties?.hs_lastmodifieddate),
    source: item,
    normalized,
  };
}

function parseCredentials(value) {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw providerError("INVALID_CREDENTIAL", "Credential secret must contain JSON");
    }
  }
  const result = credentialSchema.safeParse(parsed);
  if (!result.success) throw providerError("INVALID_CREDENTIAL", "Credential secret is incomplete");
  return result.data;
}

function requireFields(value, names) {
  if (names.some((name) => !value[name]))
    throw providerError("INVALID_CREDENTIAL", "Provider credential is incomplete");
}

function opaqueCursor(value) {
  if (!value) return {};
  try {
    const result = JSON.parse(value);
    return result && typeof result === "object" && !Array.isArray(result) ? result : {};
  } catch {
    return {};
  }
}

function encodeCursor(value) {
  return JSON.stringify(value);
}

function latestDate(first, second) {
  if (!second) return first;
  if (!first) return String(second);
  return Date.parse(second) > Date.parse(first) ? String(second) : String(first);
}

function providerDate(value) {
  if (!value) return null;
  const text = String(value);
  const date = new Date(text.length === 10 ? `${text}T00:00:00.000Z` : text);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function decimalCents(value) {
  if (value === undefined || value === null || value === "") return null;
  return Math.round(Number(value) * 100);
}

function providerId(value) {
  if (typeof value !== "string" || !value.trim())
    throw providerError("INVALID_RESPONSE", "Provider record is missing its identifier");
  return value;
}

function apiVersion(value, fallback) {
  const version = String(value || fallback);
  if (!/^\d{4}-\d{2}(?:-\d{2})?$/.test(version))
    throw providerError("INVALID_CONFIGURATION", "Provider API version is invalid");
  return version;
}

function defaultHubSpotProperties(resource) {
  if (resource === "deals")
    return [
      "dealname",
      "amount",
      "dealstage",
      "closedate",
      "hs_is_closed_won",
      "deal_currency_code",
      "hs_lastmodifieddate",
    ];
  if (resource === "companies")
    return ["name", "domain", "industry", "country", "hs_lastmodifieddate"];
  if (resource === "products")
    return [
      "name",
      "price",
      "hs_sku",
      "hs_price_currency_code",
      "hs_recurring_billing_period",
      "hs_lastmodifieddate",
    ];
  return [
    "name",
    "hs_sku",
    "price",
    "quantity",
    "amount",
    "hs_discount_percentage",
    "hs_billing_start_date",
    "hs_recurring_billing_period",
    "hs_lastmodifieddate",
  ];
}

function backoff(attempt) {
  return Math.min(250 * 2 ** (attempt - 1), 5_000);
}

function safeErrorCode(error) {
  return String(error?.code || "PROVIDER_ERROR")
    .replace(/[^A-Z0-9_]/gi, "_")
    .toUpperCase()
    .slice(0, 80);
}

function safeErrorMessage(error) {
  const message = String(error?.safeMessage || "Provider synchronization failed");
  return message.slice(0, 500);
}

function providerError(code, message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.code = code;
  error.safeMessage = message;
  return error;
}

export function fixtureDigest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
