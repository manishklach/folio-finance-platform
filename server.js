import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createLedger } from "./lib/db.js";
import { ACCOUNT_TYPES } from "./lib/accounting.js";
import { proposeJournal } from "./lib/ai.js";
import { createPlatform, digest, permissionsFor } from "./lib/platform.js";
import { runWithRequestContext } from "./lib/request-context.js";
import { financialReport, reportCsv, reportPdf } from "./lib/reports.js";
import * as Sentry from "@sentry/node";
import { secret } from "./lib/secrets.js";
import {
  validateBootstrapRequest,
  validateBrowserOrigin,
  validateProductionConfig,
} from "./lib/runtime-config.js";
import { verifyWebhookSignature } from "./lib/webhook-verification.js";
import { apiRoutePolicy } from "./lib/api-route-policies.js";
import { applyWebhookEvent } from "./lib/webhook-application.js";
export { validateProductionConfig } from "./lib/runtime-config.js";

const sentryDsn = secret("SENTRY_DSN");
if (sentryDsn)
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || "development",
    sendDefaultPii: false,
  });

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const stateMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const tenantCacheBinding = Symbol("folioTenantCacheBinding");
const latencyBuckets = [0.05, 0.1, 0.25, 0.5, 0.75, 1, 2, 5, 10];
const maxMetricSeries = 512;
const idempotentRoutes = new Set([
  "/api/invoices",
  "/api/receivables/payments",
  "/api/receivables/credits",
  "/api/receivables/write-offs",
  "/api/receivables/refunds",
  "/api/integrations/connections",
  "/api/integrations/sync-runs",
  "/api/imports/stage",
]);

export function createFolioServer(options = {}) {
  const environment = options.environment || process.env;
  const platform =
    options.platform ||
    createPlatform(
      options.platformDbPath || process.env.PLATFORM_DB_PATH,
      options.tenantDir || process.env.TENANT_DB_DIR,
    );
  const ledgers = new Map();
  const runtime = { accepting: true };
  const metrics = {
    started_at: new Date().toISOString(),
    requests: 0,
    errors: 0,
    latency_ms: 0,
    inflight: 0,
    series: 0,
    by_request: {},
  };
  const server = http.createServer(async (req, res) => {
    const requestId = safeRequestId(req.headers["x-request-id"]);
    const started = performance.now();
    res.setHeader("X-Request-Id", requestId);
    securityHeaders(res);
    metrics.requests += 1;
    metrics.inflight += 1;
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname === "/livez")
        return json(res, 200, {
          status: "alive",
          uptime_seconds: Math.round(process.uptime()),
          time: new Date().toISOString(),
        });
      if (url.pathname === "/readyz" || url.pathname === "/healthz") {
        const readiness = health(platform, ledgers, runtime);
        return json(res, readiness.status === "ok" ? 200 : 503, readiness);
      }
      if (req.method === "GET" && url.pathname === "/setup/status")
        return json(res, 200, platform.status());
      if (url.pathname === "/metrics") return prometheus(res, metrics, platform, ledgers, runtime);
      if (url.pathname.startsWith("/webhooks/"))
        return await webhook(req, res, url, platform, ledgers, requestId, environment);
      if (url.pathname.startsWith("/api/"))
        return await apiRequest(req, res, url, platform, ledgers, requestId, environment);
      return await staticFile(res, url.pathname);
    } catch (error) {
      metrics.errors += 1;
      if (sentryDsn)
        Sentry.captureException(error, {
          tags: {
            request_id: requestId,
            org_id: req.folioContext?.orgId || "anonymous",
            user_id: req.folioContext?.userId || "anonymous",
          },
        });
      log("error", {
        request_id: requestId,
        method: req.method,
        path: safePath(req.url),
        error: error.statusCode ? error.message : "internal_error",
      });
      json(res, error.statusCode || 500, {
        error: error.statusCode ? error.message : "Unexpected server error",
        request_id: requestId,
      });
    } finally {
      const latency = Math.round((performance.now() - started) * 100) / 100;
      metrics.latency_ms += latency;
      metrics.inflight = Math.max(0, metrics.inflight - 1);
      let route = metricRoute(safePath(req.url));
      let method = metricMethod(req.method);
      let status = res.statusCode;
      let metricKey = `${method}|${route}|${status}`;
      if (!metrics.by_request[metricKey] && metrics.series >= maxMetricSeries) {
        route = "/_overflow";
        method = "OTHER";
        status = `${Math.floor(res.statusCode / 100)}00`;
        metricKey = `${method}|${route}|${status}`;
      }
      const requestMetric = metrics.by_request[metricKey] || {
        count: 0,
        latency_ms: 0,
        buckets: Object.fromEntries(latencyBuckets.map((bound) => [bound, 0])),
      };
      if (!metrics.by_request[metricKey]) metrics.series += 1;
      requestMetric.count += 1;
      requestMetric.latency_ms += latency;
      for (const bound of latencyBuckets)
        if (latency / 1000 <= bound) requestMetric.buckets[bound] += 1;
      metrics.by_request[metricKey] = requestMetric;
      log("request", {
        request_id: requestId,
        method: req.method,
        path: safePath(req.url),
        status: res.statusCode,
        latency_ms: latency,
        org_id: req.folioContext?.orgId || null,
        user_id: req.folioContext?.userId || null,
      });
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.on("clientError", (_error, socket) => socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"));
  function close(callback) {
    runtime.accepting = false;
    for (const ledger of ledgers.values()) ledger.close();
    platform.close();
    server.close(callback);
  }
  return { server, platform, ledgers, runtime, close };
}

async function apiRequest(req, res, url, platform, ledgers, requestId, environment) {
  const routePolicy = apiRoutePolicy(req.method, url.pathname);
  if (stateMethods.has(req.method)) validateBrowserOrigin(req.headers);
  const meta = { requestId, ip: clientIp(req), userAgent: req.headers["user-agent"] || "unknown" };
  if (
    req.method === "POST" &&
    url.pathname === "/api/auth/register" &&
    platform.status().needs_setup
  ) {
    if (!validateBootstrapRequest(req.headers, environment))
      throw problem("Invalid deployment bootstrap token", 403);
    const body = await readJson(req);
    const result = await platform.setup(
      {
        organization_name: body.organization_name,
        name: body.name,
        email: body.email,
        password: body.password,
      },
      meta,
    );
    setSessionCookie(res, result.token);
    return json(res, 201, authPayload(platform, result.session, result.csrf));
  }
  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const result = await platform.login(await readJson(req), meta);
    setSessionCookie(res, result.token);
    return json(res, 200, authPayload(platform, result.session, result.csrf));
  }
  const token = parseCookies(req.headers.cookie || "").folio_session;
  const session = platform.resolveSession(token);
  if (!session) throw problem("Authentication required", 401);
  if (!routePolicy) throw problem("Not found", 404);
  const context = {
    actor: session.email,
    userId: session.user_id,
    orgId: session.org_id,
    role: session.role,
    requestId,
  };
  req.folioContext = context;
  return runWithRequestContext(context, async () => {
    if (routePolicy.csrf && !platform.verifyCsrf(session, req.headers["x-csrf-token"]))
      throw problem("Invalid CSRF token", 403);
    if (routePolicy.permission) requirePermission(session, routePolicy.permission);
    if (req.method === "GET" && url.pathname === "/api/auth/me")
      return json(res, 200, authPayload(platform, session, platform.issueCsrf(session.id)));
    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      platform.logout(session.id);
      clearSessionCookie(res);
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/api/auth/switch-org") {
      const result = platform.switchOrganization(session, (await readJson(req)).org_id, meta);
      setSessionCookie(res, result.token);
      return json(res, 200, authPayload(platform, result.session, result.csrf));
    }
    if (req.method === "POST" && url.pathname === "/api/admin/users") {
      return json(
        res,
        201,
        await platform.invite(await readJson(req), { ...session, request_id: requestId }),
      );
    }
    if (req.method === "POST" && url.pathname === "/api/auth/register") {
      const body = await readJson(req);
      return json(
        res,
        201,
        await platform.invite(
          {
            email: body.email,
            name: body.name,
            role: body.role,
            temporary_password: body.password,
          },
          { ...session, request_id: requestId },
        ),
      );
    }
    const resetPasswordMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/password$/);
    if (req.method === "POST" && resetPasswordMatch) {
      return json(
        res,
        200,
        await platform.resetPassword(resetPasswordMatch[1], (await readJson(req)).password, {
          ...session,
          request_id: requestId,
        }),
      );
    }
    if (req.method === "POST" && url.pathname === "/api/admin/organizations") {
      const organization = platform.createOrganization(await readJson(req), {
        ...session,
        request_id: requestId,
      });
      tenantLedger(ledgers, { org_id: organization.id, database_path: organization.database_path });
      return json(res, 201, publicOrganization(organization));
    }
    if (routePolicy.scope !== "tenant") throw problem("Not found", 404);
    const ledger = tenantLedger(ledgers, session);
    if (stateMethods.has(req.method) && idempotentRoutes.has(url.pathname)) {
      const replayed = await prepareIdempotency(req, res, platform, session, url.pathname);
      if (replayed) return;
    }
    return await api(req, res, url, ledger, platform, session);
  });
}

async function api(req, res, url, ledger, platform, session) {
  if (req.method === "GET" && url.pathname === "/api/fiscal-config")
    return json(res, 200, ledger.fiscalConfig());
  if (req.method === "POST" && url.pathname === "/api/fiscal-config")
    return json(res, 200, ledger.configureFiscal(await readJson(req)));
  if (req.method === "GET" && url.pathname === "/api/bank-statements")
    return json(res, 200, ledger.bankStatements());
  if (req.method === "POST" && url.pathname === "/api/bank-statements/import")
    return json(res, 201, ledger.importBankStatement(await readJson(req)));
  const bankMatch = url.pathname.match(/^\/api\/bank-statements\/([^/]+)\/reconcile$/);
  if (req.method === "POST" && bankMatch) return json(res, 200, ledger.reconcileBank(bankMatch[1]));
  if (req.method === "GET" && url.pathname === "/api/tax-rates")
    return json(res, 200, ledger.taxRates());
  if (req.method === "POST" && url.pathname === "/api/tax-rates")
    return json(res, 201, ledger.createTaxRate(await readJson(req)));
  const attachmentList = url.pathname.match(
    /^\/api\/attachments\/(invoice|contract|journal)\/([^/]+)$/,
  );
  if (req.method === "GET" && attachmentList)
    return json(res, 200, ledger.attachments(attachmentList[1], attachmentList[2]));
  if (req.method === "POST" && url.pathname === "/api/attachments")
    return json(res, 201, ledger.addAttachment(await readJson(req)));
  const attachmentFile = url.pathname.match(/^\/api\/attachments\/([^/]+)\/download$/);
  if (req.method === "GET" && attachmentFile) {
    const file = ledger.attachment(attachmentFile[1]);
    res.writeHead(200, {
      "Content-Type": file.metadata.mime_type,
      "Content-Disposition": `attachment; filename="${file.metadata.filename.replaceAll('"', "")}"`,
      "Cache-Control": "private, no-store",
    });
    return res.end(file.content);
  }
  const closeMatch = url.pathname.match(/^\/api\/close\/([^/]+)$/);
  if (req.method === "GET" && closeMatch)
    return json(res, 200, ledger.closeChecklist(closeMatch[1]));
  if (req.method === "PATCH" && closeMatch)
    return json(
      res,
      200,
      ledger.completeCloseItem({ ...(await readJson(req)), period: closeMatch[1] }),
    );
  if (req.method === "POST" && url.pathname === "/api/close")
    return json(res, 200, ledger.closePeriod((await readJson(req)).period));
  if (req.method === "GET" && url.pathname === "/api/reconciliation-exceptions")
    return json(
      res,
      200,
      ledger.syncReconciliationExceptions(url.searchParams.get("as_of") || today()),
    );
  const exceptionMatch = url.pathname.match(/^\/api\/reconciliation-exceptions\/([^/]+)$/);
  if (req.method === "PATCH" && exceptionMatch)
    return json(
      res,
      200,
      ledger.updateException({ ...(await readJson(req)), id: exceptionMatch[1] }),
    );
  const reportMatch = url.pathname.match(
    /^\/api\/reports\/(trial_balance|income_statement|balance_sheet|cash_flow|comprehensive_income|changes_in_equity)\.(csv|pdf)$/,
  );
  if (req.method === "GET" && reportMatch) {
    const report = financialReport(
      ledger,
      reportMatch[1],
      url.searchParams.get("as_of") || today(),
      url.searchParams.get("from") || undefined,
    );
    const pdf = reportMatch[2] === "pdf";
    const body = pdf ? await reportPdf(report) : reportCsv(report);
    res.writeHead(200, {
      "Content-Type": pdf ? "application/pdf" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportMatch[1]}-${report.as_of}.${reportMatch[2]}"`,
      "Cache-Control": "private, no-store",
    });
    return res.end(body);
  }
  if (req.method === "GET" && url.pathname === "/api/dashboard")
    return json(res, 200, ledger.dashboard());
  if (req.method === "GET" && url.pathname === "/api/accounts")
    return json(res, 200, ledger.getAccounts());
  if (req.method === "GET" && url.pathname === "/api/journals")
    return json(res, 200, ledger.listJournals());
  if (req.method === "GET" && url.pathname === "/api/trial-balance")
    return json(res, 200, ledger.trialBalance());
  if (req.method === "GET" && url.pathname === "/api/audit-log")
    return json(res, 200, ledger.auditLog());
  if (req.method === "GET" && url.pathname === "/api/integrity")
    return json(res, 200, ledger.verifyIntegrity());
  if (req.method === "GET" && url.pathname === "/api/ai/history")
    return json(res, 200, platform.aiHistory(session.org_id));
  if (req.method === "GET" && url.pathname === "/api/admin/privacy-requests") {
    requirePermission(session, "admin");
    return json(res, 200, platform.privacyRequests(session.org_id));
  }
  if (req.method === "POST" && url.pathname === "/api/admin/privacy-requests") {
    requirePermission(session, "admin");
    const body = await readJson(req);
    return json(
      res,
      201,
      platform.createPrivacyRequest(session.org_id, session.user_id, body.kind),
    );
  }
  if (req.method === "GET" && url.pathname === "/api/saas/overview")
    return json(res, 200, overview(ledger, url));
  if (req.method === "GET" && url.pathname === "/api/gaap/overview")
    return json(res, 200, ledger.gaapOverview(url.searchParams.get("as_of") || today()));
  if (req.method === "GET" && url.pathname === "/api/gaap/disclosures")
    return json(res, 200, ledger.gaapDisclosures(url.searchParams.get("as_of") || today()));
  if (req.method === "GET" && url.pathname === "/api/investments/overview")
    return json(res, 200, ledger.investmentsOverview(url.searchParams.get("as_of") || today()));
  if (req.method === "GET" && url.pathname === "/api/investments")
    return json(res, 200, ledger.listInvestments());
  if (req.method === "GET" && url.pathname === "/api/investments/disclosures")
    return json(res, 200, ledger.investmentDisclosures(url.searchParams.get("as_of") || today()));
  if (req.method === "GET" && url.pathname === "/api/investments/reconciliation")
    return json(
      res,
      200,
      ledger.investmentReconciliation(url.searchParams.get("as_of") || today()),
    );
  const investmentMatch = url.pathname.match(/^\/api\/investments\/(\d+)$/);
  if (req.method === "GET" && investmentMatch)
    return json(res, 200, ledger.investment(Number(investmentMatch[1])));
  if (req.method === "POST" && url.pathname === "/api/investments")
    return json(res, 201, ledger.createInvestment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/purchases")
    return json(res, 201, ledger.purchaseInvestment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/sales")
    return json(res, 201, ledger.sellInvestment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/income")
    return json(res, 201, ledger.recordInvestmentIncome(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/measurements")
    return json(res, 201, ledger.measureInvestment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/yield/recognize")
    return json(res, 200, ledger.recognizeInvestmentYieldThrough((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/investments/interest/accruals")
    return json(res, 201, ledger.accrueInvestmentInterest(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/equity-method")
    return json(res, 201, ledger.recordEquityMethodPeriod(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/equity-method/impairment")
    return json(res, 201, ledger.assessEquityMethodImpairment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/proportional-amortization")
    return json(res, 201, ledger.recordProportionalAmortizationPeriod(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/transitions")
    return json(res, 201, ledger.transitionInvestmentModel(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/investments/credit-losses")
    return json(res, 201, ledger.assessInvestmentCreditLoss(await readJson(req)));
  if (req.method === "GET" && url.pathname === "/api/integrations/catalog")
    return json(res, 200, ledger.providerCatalog());
  if (req.method === "GET" && url.pathname === "/api/integrations/overview")
    return json(res, 200, publicIntegrationOverview(ledger.integrationsOverview()));
  if (req.method === "GET" && url.pathname === "/api/integrations/connections")
    return json(res, 200, ledger.integrationConnections().map(publicIntegrationConnection));
  if (req.method === "GET" && url.pathname === "/api/integrations/sync-runs")
    return json(
      res,
      200,
      ledger.integrationSyncRuns(url.searchParams.get("connection_id") || null),
    );
  if (req.method === "GET" && url.pathname === "/api/integrations/exceptions")
    return json(res, 200, ledger.integrationDeadLetters());
  const integrationRecordsMatch = url.pathname.match(
    /^\/api\/integrations\/connections\/([^/]+)\/records$/,
  );
  if (req.method === "GET" && integrationRecordsMatch)
    return json(
      res,
      200,
      ledger.integrationRecords(integrationRecordsMatch[1], url.searchParams.get("status") || null),
    );
  if (req.method === "POST" && url.pathname === "/api/integrations/connections")
    return json(
      res,
      201,
      publicIntegrationConnection(ledger.configureIntegration(await readJson(req))),
    );
  if (req.method === "POST" && url.pathname === "/api/integrations/connections/status")
    return json(
      res,
      200,
      publicIntegrationConnection(ledger.setIntegrationStatus(await readJson(req))),
    );
  if (req.method === "POST" && url.pathname === "/api/integrations/sync-runs")
    return json(res, 201, ledger.startIntegrationSync(await readJson(req)));
  const integrationPageMatch = url.pathname.match(
    /^\/api\/integrations\/sync-runs\/([^/]+)\/page$/,
  );
  if (req.method === "POST" && integrationPageMatch)
    return json(
      res,
      200,
      ledger.ingestIntegrationPage({
        ...(await readJson(req)),
        sync_run_id: integrationPageMatch[1],
      }),
    );
  const integrationFailureMatch = url.pathname.match(
    /^\/api\/integrations\/sync-runs\/([^/]+)\/fail$/,
  );
  if (req.method === "POST" && integrationFailureMatch)
    return json(
      res,
      200,
      ledger.failIntegrationSync({
        ...(await readJson(req)),
        sync_run_id: integrationFailureMatch[1],
      }),
    );
  if (req.method === "POST" && url.pathname === "/api/integrations/mappings")
    return json(res, 201, ledger.createIntegrationMapping(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/integrations/exceptions/status")
    return json(res, 200, ledger.resolveIntegrationDeadLetter(await readJson(req)));
  if (req.method === "GET" && url.pathname === "/api/imports/templates")
    return json(res, 200, ledger.importTemplateCatalog());
  if (req.method === "GET" && url.pathname === "/api/imports/batches")
    return json(res, 200, ledger.importBatches());
  if (req.method === "GET" && url.pathname === "/api/imports/mapping-profiles")
    return json(res, 200, ledger.importMappingProfiles());
  if (req.method === "GET" && url.pathname === "/api/imports/exceptions")
    return json(res, 200, ledger.importExceptions());
  const importBatchMatch = url.pathname.match(/^\/api\/imports\/batches\/([^/]+)$/);
  if (req.method === "GET" && importBatchMatch)
    return json(res, 200, ledger.importBatch(importBatchMatch[1]));
  if (req.method === "POST" && url.pathname === "/api/imports/stage")
    return json(res, 201, ledger.stageImport(await readJson(req)));
  const importApproveMatch = url.pathname.match(/^\/api\/imports\/batches\/([^/]+)\/approve$/);
  if (req.method === "POST" && importApproveMatch)
    return json(
      res,
      200,
      ledger.approveImport({ ...(await readJson(req)), id: importApproveMatch[1] }),
    );
  const importApplyMatch = url.pathname.match(/^\/api\/imports\/batches\/([^/]+)\/apply$/);
  if (req.method === "POST" && importApplyMatch)
    return json(res, 200, ledger.applyImport(importApplyMatch[1]));
  if (req.method === "POST" && url.pathname === "/api/imports/mapping-profiles")
    return json(res, 201, ledger.createImportMappingProfile(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/imports/exceptions/status")
    return json(res, 200, ledger.resolveImportException(await readJson(req)));
  if (req.method === "GET" && url.pathname === "/api/fixed-assets/overview")
    return json(res, 200, ledger.fixedAssetsOverview(url.searchParams.get("as_of") || today()));
  if (req.method === "GET" && url.pathname === "/api/fixed-assets")
    return json(res, 200, ledger.listFixedAssets());
  if (req.method === "GET" && url.pathname === "/api/fixed-assets/classes")
    return json(res, 200, ledger.fixedAssetClasses());
  if (req.method === "GET" && url.pathname === "/api/fixed-assets/disclosures")
    return json(
      res,
      200,
      ledger.fixedAssetDisclosures(
        url.searchParams.get("as_of") || today(),
        url.searchParams.get("from") || "0000-01-01",
      ),
    );
  if (req.method === "GET" && url.pathname === "/api/fixed-assets/reconciliation")
    return json(
      res,
      200,
      ledger.fixedAssetReconciliation(url.searchParams.get("as_of") || today()),
    );
  if (req.method === "GET" && url.pathname === "/api/fixed-assets/cip")
    return json(res, 200, ledger.cipProjects());
  const fixedAssetMatch = url.pathname.match(/^\/api\/fixed-assets\/(\d+)$/);
  if (req.method === "GET" && fixedAssetMatch)
    return json(res, 200, ledger.fixedAsset(Number(fixedAssetMatch[1])));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/policies")
    return json(res, 201, ledger.setFixedAssetPolicy(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/classes")
    return json(res, 201, ledger.createFixedAssetClass(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets")
    return json(res, 201, ledger.acquireFixedAsset(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/place-in-service")
    return json(res, 200, ledger.placeAssetInService(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/depreciation/recognize")
    return json(res, 200, ledger.recognizeDepreciationThrough((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/usage")
    return json(res, 201, ledger.recordAssetUsage(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/estimate-changes")
    return json(res, 201, ledger.changeFixedAssetEstimate(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/improvements")
    return json(res, 201, ledger.addFixedAssetImprovement(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/transfers")
    return json(res, 201, ledger.transferFixedAsset(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/cip")
    return json(res, 201, ledger.createCipProject(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/cip/costs")
    return json(res, 201, ledger.addCipCost(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/cip/interest")
    return json(res, 201, ledger.capitalizeCipInterest(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/cip/status")
    return json(res, 200, ledger.setCipStatus(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/cip/place-in-service")
    return json(res, 201, ledger.placeCipInService(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/cip/abandon")
    return json(res, 200, ledger.abandonCipProject(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/impairments")
    return json(res, 201, ledger.assessFixedAssetImpairment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/held-for-sale/remeasure")
    return json(res, 201, ledger.remeasureHeldForSale(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/held-for-sale/return-to-use")
    return json(res, 201, ledger.returnAssetToHeldAndUsed(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/disposals")
    return json(res, 201, ledger.disposeFixedAsset(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/retirement-obligations")
    return json(res, 201, ledger.recognizeAssetRetirementObligation(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/retirement-obligations/accrete")
    return json(res, 200, ledger.recognizeAroAccretionThrough((await readJson(req)).as_of));
  if (
    req.method === "POST" &&
    url.pathname === "/api/fixed-assets/retirement-obligations/remeasure"
  )
    return json(res, 200, ledger.remeasureAssetRetirementObligation(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/retirement-obligations/settle")
    return json(res, 200, ledger.settleAssetRetirementObligation(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/inventory-counts")
    return json(res, 201, ledger.startFixedAssetInventoryCount(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/inventory-observations")
    return json(res, 201, ledger.observeFixedAsset(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fixed-assets/inventory-counts/complete")
    return json(res, 200, ledger.completeFixedAssetInventoryCount(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/policies")
    return json(res, 201, ledger.setGaapPolicy(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/assessments")
    return json(res, 201, ledger.recordGaapAssessment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/leases")
    return json(res, 201, ledger.createLease(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/leases/recognize")
    return json(res, 200, ledger.recognizeLeaseThrough((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/gaap/stock-awards")
    return json(res, 201, ledger.createStockAward(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/stock-awards/recognize")
    return json(res, 200, ledger.recognizeStockCompThrough((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/gaap/stock-awards/remeasure")
    return json(res, 200, ledger.remeasureStockAward(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/tax-provisions")
    return json(res, 201, ledger.calculateTaxProvision(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/credit-losses")
    return json(res, 201, ledger.estimateCreditLosses(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/contingencies")
    return json(res, 201, ledger.assessContingency(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/fair-value")
    return json(res, 201, ledger.recordFairValue(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/debt")
    return json(res, 201, ledger.createDebt(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/debt/recognize")
    return json(res, 200, ledger.recognizeDebtThrough((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/gaap/classification")
    return json(res, 201, ledger.assessClassification(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/business-combinations")
    return json(res, 201, ledger.recordBusinessCombination(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/consolidation-assessments")
    return json(res, 201, ledger.assessConsolidation(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/eps")
    return json(res, 201, ledger.calculateEps(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/oci")
    return json(res, 201, ledger.recordOci(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/impairment")
    return json(res, 201, ledger.assessImpairment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/going-concern")
    return json(res, 201, ledger.assessGoingConcern(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/guarantees")
    return json(res, 201, ledger.recordGuarantee(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/gaap/subsequent-events")
    return json(res, 201, ledger.assessSubsequentEvent(await readJson(req)));
  if (req.method === "GET" && url.pathname === "/api/contracts")
    return json(res, 200, ledger.listContracts());
  const contractMatch = url.pathname.match(/^\/api\/contracts\/(\d+)$/);
  if (req.method === "GET" && contractMatch) {
    const contract = ledger.getContract(Number(contractMatch[1]));
    if (!contract) throw problem("Contract not found", 404);
    return json(res, 200, contract);
  }
  if (req.method === "POST" && url.pathname === "/api/contracts")
    return json(res, 201, ledger.createContract(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/invoices")
    return json(res, 201, ledger.createInvoice(await readJson(req)));
  if (req.method === "GET" && url.pathname === "/api/receivables")
    return json(res, 200, ledger.receivables(url.searchParams.get("as_of") || today()));
  if (req.method === "POST" && url.pathname === "/api/receivables/payments")
    return json(res, 201, ledger.recordPayment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/applications")
    return json(res, 201, ledger.applyPayment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/credits")
    return json(res, 201, ledger.createCreditMemo(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/write-offs")
    return json(res, 201, ledger.writeOffInvoice(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/refunds")
    return json(res, 201, ledger.refundPayment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/disputes")
    return json(res, 201, ledger.openDispute(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/disputes/resolve")
    return json(res, 200, ledger.resolveDispute(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/collections")
    return json(res, 201, ledger.addCollectionActivity(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/collections/complete")
    return json(res, 200, ledger.completeCollectionActivity(await readJson(req)));
  const voidInvoice = url.pathname.match(/^\/api\/invoices\/(\d+)\/void$/);
  if (req.method === "POST" && voidInvoice)
    return json(
      res,
      200,
      ledger.voidInvoice({ ...(await readJson(req)), invoice_id: Number(voidInvoice[1]) }),
    );
  const voidPayment = url.pathname.match(/^\/api\/receivables\/payments\/(\d+)\/void$/);
  if (req.method === "POST" && voidPayment)
    return json(
      res,
      200,
      ledger.voidPayment({ ...(await readJson(req)), payment_id: Number(voidPayment[1]) }),
    );
  if (req.method === "POST" && url.pathname === "/api/revenue/recognize")
    return json(res, 200, ledger.recognizeThrough((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/revenue/usage")
    return json(res, 201, ledger.recordUsage(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/revenue/milestone")
    return json(res, 200, ledger.updateMilestone(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/contracts/modify")
    return json(res, 200, ledger.modifyContract(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/software-projects")
    return json(res, 201, ledger.addSoftwareProject(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fx/revalue")
    return json(res, 200, ledger.revalueFx((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/consolidation/eliminate")
    return json(res, 200, ledger.postEliminations((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/accounts") {
    const body = await readJson(req);
    if (!body.code?.trim() || !body.name?.trim() || !ACCOUNT_TYPES.includes(body.type))
      throw problem("Code, name, and a valid account type are required");
    return json(res, 201, ledger.createAccount(body));
  }
  if (req.method === "POST" && url.pathname === "/api/journals")
    return json(res, 201, ledger.createDraft(await readJson(req)));
  const postMatch = url.pathname.match(/^\/api\/journals\/(\d+)\/post$/);
  if (req.method === "POST" && postMatch)
    return json(res, 200, ledger.postJournal(Number(postMatch[1])));
  if (req.method === "POST" && url.pathname === "/api/ai/draft") {
    const quota = platform.aiQuota(
      session.org_id,
      session.user_id,
      Number(process.env.AI_MONTHLY_DRAFT_LIMIT || 200),
    );
    const proposal = await proposeJournal((await readJson(req)).description, ledger.getAccounts());
    const proposalId = platform.logAiProposal(session.org_id, session.user_id, proposal);
    return json(res, 200, { ...proposal, proposal_id: proposalId, quota });
  }
  if (req.method === "POST" && url.pathname === "/api/ai/disposition") {
    const body = await readJson(req);
    platform.decideAiProposal(
      body.proposal_id,
      session.org_id,
      body.disposition,
      body.journal_id || null,
    );
    return json(res, 200, { ok: true });
  }
  throw problem("Not found", 404);
}

function overview(ledger, url) {
  return {
    contracts: ledger.listContracts(),
    schedules: ledger.revenueSchedules(),
    waterfall: ledger.revenueWaterfall(),
    deferred: ledger.deferredRollforward(),
    rpo: ledger.rpo(),
    metrics: ledger.metrics(),
    cash_flow: ledger.cashFlow(),
    consolidation: ledger.consolidation(),
    commissions: ledger.commissions(),
    software_projects: ledger.softwareProjects(),
    customers: ledger.customers(),
    products: ledger.products(),
    entities: ledger.entities(),
    receivables: ledger.receivables(url.searchParams.get("as_of") || today()),
  };
}

async function webhook(req, res, url, platform, ledgers, requestId, environment) {
  if (req.method !== "POST") throw problem("Not found", 404);
  const match = url.pathname.match(
    /^\/webhooks\/(stripe|payroll|expenses)\/([a-z0-9-]+)(?:\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))?$/,
  );
  if (!match) throw problem("Not found", 404);
  const [, provider, slug, connectionId] = match;
  const org = platform.organizationBySlug(slug);
  if (!org) throw problem("Not found", 404);
  if (provider === "stripe" && environment.NODE_ENV === "production" && !connectionId)
    throw problem("Not found", 404);
  let ledger;
  let connection;
  if (connectionId) {
    ledger = tenantLedger(ledgers, { org_id: org.id, database_path: org.database_path });
    connection = ledger.integrationConnection(connectionId);
    if (connection.provider !== provider || connection.status !== "active")
      throw problem("Not found", 404);
  }
  const raw = await readBody(req, 1_000_000);
  const signingSecret = secret(
    connection?.webhook_secret_ref || `WEBHOOK_SECRET_${provider.toUpperCase()}`,
    { environment },
  );
  if (!signingSecret) throw problem("Webhook receiver is not configured", 503);
  if (
    !verifyWebhookSignature({
      provider,
      rawBody: raw,
      headers: req.headers,
      signingSecret,
      stripeToleranceSeconds: Number(environment.STRIPE_WEBHOOK_TOLERANCE_SECONDS || 300),
    })
  )
    throw problem("Invalid webhook signature", 401);
  let event;
  try {
    event = JSON.parse(raw.toString("utf8"));
  } catch {
    throw problem("Invalid webhook payload");
  }
  if (!event.id || !event.type || !event.data)
    throw problem("Webhook id, type, and data are required");
  if (
    connection?.external_account_id &&
    event.account &&
    event.account !== connection.external_account_id
  )
    throw problem("Webhook provider account does not match the connection", 401);
  const payloadHash = digest(raw);
  if (connection) {
    const delivery = platform.enqueueWebhookDelivery({
      provider,
      eventId: event.id,
      orgId: org.id,
      connectionId: connection.id,
      payload: event,
      payloadHash,
    });
    return json(res, 202, {
      queued: true,
      duplicate: delivery.duplicate,
      delivery_id: delivery.id,
      status: delivery.status,
    });
  }
  const existing = platform.webhookLookup(provider, event.id, org.id, payloadHash);
  if (existing) return json(res, 200, { duplicate: true, result: existing.result });
  ledger ||= tenantLedger(ledgers, { org_id: org.id, database_path: org.database_path });
  const application = await runWithRequestContext(
    { actor: `webhook.${provider}`, orgId: org.id, role: "system", requestId },
    () =>
      ledger.applyExternalEvent(provider, event.id, payloadHash, () =>
        applyWebhookEvent(provider, event, ledger, connection),
      ),
  );
  platform.webhookRecord(provider, event.id, org.id, payloadHash, "processed", application.result);
  return json(res, 200, application);
}

function tenantLedger(cache, session) {
  const orgId = String(session.org_id || "");
  const databasePath = resolve(String(session.database_path || ""));
  if (!orgId || !session.database_path) throw new Error("Invalid tenant database binding");
  if (!cache.has(orgId)) {
    const ledger = createLedger(databasePath, { seed: true, orgId });
    Object.defineProperty(ledger, tenantCacheBinding, {
      value: Object.freeze({ orgId, databasePath }),
      enumerable: false,
      configurable: false,
      writable: false,
    });
    cache.set(orgId, ledger);
  }
  const ledger = cache.get(orgId);
  const binding = ledger?.[tenantCacheBinding];
  if (binding?.orgId !== orgId || binding?.databasePath !== databasePath)
    throw new Error("Tenant ledger cache binding mismatch");
  return ledger;
}
async function prepareIdempotency(req, res, platform, session, route) {
  const key = String(req.headers["idempotency-key"] || "");
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key))
    throw problem("A valid Idempotency-Key header is required");
  const body = await readBody(req, 1_000_000);
  req.bodyCache = body;
  const requestHash = digest(body);
  const prior = platform.idempotencyLookup(session.org_id, route, key, requestHash);
  if (prior) {
    json(res, prior.status, prior.body);
    return true;
  }
  if (!platform.idempotencyReserve(session.org_id, route, key, requestHash))
    throw problem("An identical request with this idempotency key is still processing", 409);
  res.folioIdempotency = { platform, orgId: session.org_id, route, key };
  return false;
}
function requirePermission(session, permission) {
  if (!permissionsFor(session.role).includes(permission))
    throw problem(`Missing required permission: ${permission}`, 403);
}
function authPayload(platform, session, csrf) {
  return {
    user: { id: session.user_id, email: session.email, name: session.name },
    organization: { id: session.org_id, name: session.org_name, slug: session.slug },
    role: session.role,
    permissions: permissionsFor(session.role),
    organizations: platform.listMemberships(session.user_id),
    csrf_token: csrf,
  };
}
function publicOrganization(value) {
  return { id: value.id, name: value.name, slug: value.slug };
}
function publicIntegrationConnection(value) {
  const safe = { ...value };
  delete safe.credential_secret_ref;
  delete safe.webhook_secret_ref;
  return safe;
}
function publicIntegrationOverview(value) {
  return { ...value, connections: value.connections.map(publicIntegrationConnection) };
}
async function readJson(req) {
  const contentType = String(req.headers["content-type"] || "");
  if (!/^application\/json(?:\s*;|$)/i.test(contentType))
    throw problem("Content-Type must be application/json", 415);
  const body = req.bodyCache || (await readBody(req, 1_000_000));
  try {
    return JSON.parse(body.toString("utf8") || "{}");
  } catch {
    throw problem("Invalid JSON");
  }
}
async function readBody(req, limit) {
  if (req.bodyCache) return req.bodyCache;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw problem("Request too large", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function staticFile(res, pathname) {
  const assetPath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const safe = normalize(assetPath);
  const filePath = resolve(publicDir, safe);
  const containment = relativePath(publicDir, filePath);
  if (
    !containment ||
    containment.startsWith(`..${sep}`) ||
    containment === ".." ||
    isAbsolute(containment) ||
    containment.split(sep).some((segment) => segment.startsWith("."))
  )
    throw problem("Forbidden", 403);
  try {
    const body = await readFile(filePath);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".svg": "image/svg+xml",
    };
    res.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch (error) {
    if (error.code === "ENOENT") throw problem("Not found", 404);
    throw error;
  }
}
function json(res, status, value) {
  if (res.writableEnded) return;
  if (res.folioIdempotency && status < 500) {
    const item = res.folioIdempotency;
    item.platform.idempotencyComplete(item.orgId, item.route, item.key, status, value);
  }
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
}
function securityHeaders(res) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}
function setSessionCookie(res, token) {
  const secure =
    process.env.SESSION_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `folio_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure ? "; Secure" : ""}`,
  );
}
function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "folio_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
}
function parseCookies(value) {
  const result = {};
  for (const part of value.split(";")) {
    const item = part.trim();
    const index = item.indexOf("=");
    if (index < 1) continue;
    try {
      result[item.slice(0, index)] = decodeURIComponent(item.slice(index + 1));
    } catch {
      // Ignore malformed cookies instead of turning attacker-controlled syntax into a 500.
    }
  }
  return result;
}
function clientIp(req) {
  return req.socket.remoteAddress || "unknown";
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function safePath(value = "") {
  try {
    return new URL(value, "http://local").pathname;
  } catch {
    return "/invalid";
  }
}
function safeRequestId(value) {
  const supplied = Array.isArray(value) ? value[0] : value;
  return typeof supplied === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(supplied)
    ? supplied
    : randomUUID();
}
function metricMethod(value) {
  return ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].includes(value)
    ? value
    : "OTHER";
}
function relativePath(rootPath, targetPath) {
  return relative(rootPath, targetPath);
}
function health(platform, ledgers, runtime = { accepting: true }) {
  if (!runtime.accepting) return { status: "unhealthy", reason: "shutting_down" };
  try {
    const started = performance.now();
    platform.db.prepare("SELECT 1 ok").get();
    return {
      status: "ok",
      database: "ready",
      tenant_connections: ledgers.size,
      database_latency_ms: Math.round((performance.now() - started) * 100) / 100,
      time: new Date().toISOString(),
    };
  } catch {
    return { status: "unhealthy", database: "unavailable" };
  }
}
function prometheus(res, metrics, platform, ledgers, runtime) {
  const ready = health(platform, ledgers, runtime).status === "ok" ? 1 : 0;
  const webhookQueue = platform.webhookQueueMetrics();
  const lines = [
    "# HELP folio_up Whether the Folio process is running.",
    "# TYPE folio_up gauge",
    "folio_up 1",
    "# HELP folio_ready Whether Folio can accept accounting requests.",
    "# TYPE folio_ready gauge",
    `folio_ready ${ready}`,
    "# HELP folio_process_uptime_seconds Process uptime.",
    "# TYPE folio_process_uptime_seconds gauge",
    `folio_process_uptime_seconds ${process.uptime()}`,
    "# HELP folio_http_inflight_requests Requests currently executing.",
    "# TYPE folio_http_inflight_requests gauge",
    `folio_http_inflight_requests ${metrics.inflight}`,
    "# HELP folio_tenant_connections Open tenant ledger connections.",
    "# TYPE folio_tenant_connections gauge",
    `folio_tenant_connections ${ledgers.size}`,
    "# HELP folio_webhook_deliveries Webhook deliveries by durable queue status.",
    "# TYPE folio_webhook_deliveries gauge",
    ...["pending", "processing", "retry", "completed", "dead_letter"].map(
      (status) =>
        `folio_webhook_deliveries{status="${status}"} ${webhookQueue.counts[status] || 0}`,
    ),
    "# HELP folio_webhook_oldest_unfinished_seconds Age of the oldest unfinished delivery.",
    "# TYPE folio_webhook_oldest_unfinished_seconds gauge",
    `folio_webhook_oldest_unfinished_seconds ${webhookQueue.oldest_unfinished_seconds}`,
    "# HELP folio_http_requests_total HTTP requests by bounded route and status.",
    "# TYPE folio_http_requests_total counter",
    "# HELP folio_http_request_duration_seconds Request duration by bounded route.",
    "# TYPE folio_http_request_duration_seconds histogram",
  ];
  const durations = new Map();
  for (const [key, value] of Object.entries(metrics.by_request)) {
    const [method, route, status] = key.split("|");
    const labels = `method="${metricEscape(method)}",route="${metricEscape(route)}",status="${metricEscape(status)}"`;
    lines.push(`folio_http_requests_total{${labels}} ${value.count}`);
    const durationKey = `${method}|${route}`;
    const duration = durations.get(durationKey) || {
      count: 0,
      latency_ms: 0,
      buckets: Object.fromEntries(latencyBuckets.map((bound) => [bound, 0])),
    };
    duration.count += value.count;
    duration.latency_ms += value.latency_ms;
    for (const bound of latencyBuckets) duration.buckets[bound] += value.buckets[bound];
    durations.set(durationKey, duration);
  }
  for (const [key, value] of durations) {
    const [method, route] = key.split("|");
    const labels = `method="${metricEscape(method)}",route="${metricEscape(route)}"`;
    for (const bound of latencyBuckets)
      lines.push(
        `folio_http_request_duration_seconds_bucket{${labels},le="${bound}"} ${value.buckets[bound]}`,
      );
    lines.push(`folio_http_request_duration_seconds_bucket{${labels},le="+Inf"} ${value.count}`);
    lines.push(`folio_http_request_duration_seconds_sum{${labels}} ${value.latency_ms / 1000}`);
    lines.push(`folio_http_request_duration_seconds_count{${labels}} ${value.count}`);
  }
  res.writeHead(200, {
    "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    "Cache-Control": "no-store",
  });
  return res.end(`${lines.join("\n")}\n`);
}
function metricRoute(path) {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .slice(0, 160);
}
function metricEscape(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
}
function log(event, fields) {
  process.stdout.write(
    `${JSON.stringify({ timestamp: new Date().toISOString(), event, ...fields })}\n`,
  );
}
function problem(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  validateProductionConfig(process.env);
  const app = createFolioServer();
  const port = Number(process.env.PORT || 4310);
  const host = process.env.HOST || "127.0.0.1";
  app.server.listen(port, host, () => log("started", { host, port }));
  let stopping = false;
  const shutdown = (signal) => {
    if (stopping) return;
    stopping = true;
    app.runtime.accepting = false;
    log("shutdown_started", { signal });
    const timer = setTimeout(
      () => {
        log("shutdown_forced", { signal });
        process.exit(1);
      },
      Number(process.env.SHUTDOWN_TIMEOUT_MS || 20_000),
    );
    timer.unref();
    app.close(() => {
      clearTimeout(timer);
      log("shutdown_complete", { signal });
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
