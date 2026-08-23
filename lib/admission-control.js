const REASONS = [
  "global_concurrency",
  "tenant_concurrency",
  "heavy_tenant_concurrency",
  "user_rate",
  "heavy_tenant_rate",
  "tracking_capacity",
];

const HEAVY_ROUTES = [
  /^\/api\/reports\//,
  /^\/api\/imports\/stage$/,
  /^\/api\/imports\/batches\/[^/]+\/apply$/,
  /^\/api\/integrations\/sync-runs$/,
  /^\/api\/ai\/draft$/,
];

export function admissionConfig(environment = process.env) {
  return {
    globalConcurrency: integer(environment.ADMISSION_GLOBAL_CONCURRENCY, 64, 1, 10_000),
    tenantConcurrency: integer(environment.ADMISSION_TENANT_CONCURRENCY, 8, 1, 1_000),
    heavyTenantConcurrency: integer(environment.ADMISSION_HEAVY_TENANT_CONCURRENCY, 2, 1, 100),
    userRequestsPerMinute: integer(environment.ADMISSION_USER_REQUESTS_PER_MINUTE, 240, 1, 100_000),
    heavyTenantRequestsPerMinute: integer(
      environment.ADMISSION_HEAVY_TENANT_REQUESTS_PER_MINUTE,
      30,
      1,
      10_000,
    ),
    maxTrackedPrincipals: integer(
      environment.ADMISSION_MAX_TRACKED_PRINCIPALS,
      10_000,
      100,
      1_000_000,
    ),
  };
}

export function admissionClass(method, pathname) {
  return HEAVY_ROUTES.some((pattern) => pattern.test(pathname)) ? "heavy" : "standard";
}

export function createAdmissionController(environment = process.env, options = {}) {
  const config = options.config || admissionConfig(environment);
  const now = options.now || Date.now;
  const windowMs = 60_000;
  const users = new Map();
  const heavyTenants = new Map();
  const tenantActive = new Map();
  const heavyActive = new Map();
  const rejected = Object.fromEntries(REASONS.map((reason) => [reason, 0]));
  let globalActive = 0;

  function reject(reason, retryAfter = 1) {
    rejected[reason] += 1;
    throw Object.assign(new Error("Request limit exceeded"), {
      statusCode: 429,
      retryAfter: Math.max(1, Math.ceil(retryAfter)),
      admissionReason: reason,
    });
  }

  function consume(map, key, limit, timestamp) {
    let value = map.get(key);
    if (!value || timestamp - value.startedAt >= windowMs) {
      if (!value && totalTracked() >= config.maxTrackedPrincipals) reject("tracking_capacity", 60);
      value = { startedAt: timestamp, count: 0 };
      map.set(key, value);
    }
    if (value.count >= limit) reject("user_rate", (value.startedAt + windowMs - timestamp) / 1000);
    value.count += 1;
  }

  function consumeHeavy(key, timestamp) {
    let value = heavyTenants.get(key);
    if (!value || timestamp - value.startedAt >= windowMs) {
      if (!value && totalTracked() >= config.maxTrackedPrincipals) reject("tracking_capacity", 60);
      value = { startedAt: timestamp, count: 0 };
      heavyTenants.set(key, value);
    }
    if (value.count >= config.heavyTenantRequestsPerMinute)
      reject("heavy_tenant_rate", (value.startedAt + windowMs - timestamp) / 1000);
    value.count += 1;
  }

  function totalTracked() {
    return users.size + heavyTenants.size;
  }

  function prune(timestamp) {
    for (const map of [users, heavyTenants])
      for (const [key, value] of map) if (timestamp - value.startedAt >= windowMs) map.delete(key);
  }

  function enter({ orgId, userId, category = "standard" }) {
    const timestamp = now();
    prune(timestamp);
    consume(users, userId, config.userRequestsPerMinute, timestamp);
    if (category === "heavy") consumeHeavy(orgId, timestamp);
    if (globalActive >= config.globalConcurrency) reject("global_concurrency");
    if ((tenantActive.get(orgId) || 0) >= config.tenantConcurrency) reject("tenant_concurrency");
    if (category === "heavy" && (heavyActive.get(orgId) || 0) >= config.heavyTenantConcurrency)
      reject("heavy_tenant_concurrency");

    globalActive += 1;
    tenantActive.set(orgId, (tenantActive.get(orgId) || 0) + 1);
    if (category === "heavy") heavyActive.set(orgId, (heavyActive.get(orgId) || 0) + 1);
    let released = false;
    return {
      release() {
        if (released) return;
        released = true;
        globalActive = Math.max(0, globalActive - 1);
        decrement(tenantActive, orgId);
        if (category === "heavy") decrement(heavyActive, orgId);
      },
    };
  }

  function snapshot() {
    return {
      active: globalActive,
      activeTenants: tenantActive.size,
      activeHeavy: [...heavyActive.values()].reduce((total, value) => total + value, 0),
      trackedPrincipals: totalTracked(),
      rejected: { ...rejected },
      config: { ...config },
    };
  }

  return { enter, snapshot };
}

function decrement(map, key) {
  const next = (map.get(key) || 1) - 1;
  if (next <= 0) map.delete(key);
  else map.set(key, next);
}

function integer(value, fallback, minimum, maximum) {
  const parsed = value === undefined || value === "" ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum)
    throw new Error(
      `Admission-control value must be an integer from ${minimum} through ${maximum}`,
    );
  return parsed;
}
