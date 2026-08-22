import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createLedger } from "./lib/db.js";
import { ACCOUNT_TYPES } from "./lib/accounting.js";
import { proposeJournal } from "./lib/ai.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const ledger = createLedger(process.env.LEDGER_DB_PATH);
const port = Number(process.env.PORT || 4310);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    return await staticFile(res, url.pathname);
  } catch (error) {
    console.error(error);
    json(res, error.statusCode || 500, { error: error.statusCode ? error.message : "Unexpected server error" });
  }
});

async function api(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/dashboard") return json(res, 200, ledger.dashboard());
  if (req.method === "GET" && url.pathname === "/api/accounts") return json(res, 200, ledger.getAccounts());
  if (req.method === "GET" && url.pathname === "/api/journals") return json(res, 200, ledger.listJournals());
  if (req.method === "GET" && url.pathname === "/api/trial-balance") return json(res, 200, ledger.trialBalance());
  if (req.method === "GET" && url.pathname === "/api/audit-log") return json(res, 200, ledger.auditLog());
  if (req.method === "GET" && url.pathname === "/api/saas/overview") return json(res, 200, {
    contracts: ledger.listContracts(), schedules: ledger.revenueSchedules(), waterfall: ledger.revenueWaterfall(),
    deferred: ledger.deferredRollforward(), rpo: ledger.rpo(), metrics: ledger.metrics(), cash_flow: ledger.cashFlow(),
    consolidation: ledger.consolidation(), commissions: ledger.commissions(), software_projects: ledger.softwareProjects(),
    customers: ledger.customers(), products: ledger.products(), entities: ledger.entities(),
    receivables: ledger.receivables(url.searchParams.get("as_of") || new Date().toISOString().slice(0,10))
  });
  if (req.method === "GET" && url.pathname === "/api/contracts") return json(res, 200, ledger.listContracts());
  const contractMatch = url.pathname.match(/^\/api\/contracts\/(\d+)$/);
  if (req.method === "GET" && contractMatch) return json(res, 200, ledger.getContract(Number(contractMatch[1])) || { error: "Not found" });
  if (req.method === "POST" && url.pathname === "/api/contracts") return json(res, 201, ledger.createContract(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/invoices") return json(res, 201, ledger.createInvoice(await readJson(req)));
  if (req.method === "GET" && url.pathname === "/api/receivables") return json(res, 200, ledger.receivables(url.searchParams.get("as_of") || new Date().toISOString().slice(0,10)));
  if (req.method === "POST" && url.pathname === "/api/receivables/payments") return json(res, 201, ledger.recordPayment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/applications") return json(res, 201, ledger.applyPayment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/credits") return json(res, 201, ledger.createCreditMemo(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/write-offs") return json(res, 201, ledger.writeOffInvoice(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/refunds") return json(res, 201, ledger.refundPayment(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/disputes") return json(res, 201, ledger.openDispute(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/disputes/resolve") return json(res, 200, ledger.resolveDispute(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/collections") return json(res, 201, ledger.addCollectionActivity(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/receivables/collections/complete") return json(res, 200, ledger.completeCollectionActivity(await readJson(req)));
  const voidInvoiceMatch = url.pathname.match(/^\/api\/invoices\/(\d+)\/void$/);
  if (req.method === "POST" && voidInvoiceMatch) return json(res, 200, ledger.voidInvoice({...(await readJson(req)),invoice_id:Number(voidInvoiceMatch[1])}));
  const voidPaymentMatch = url.pathname.match(/^\/api\/receivables\/payments\/(\d+)\/void$/);
  if (req.method === "POST" && voidPaymentMatch) return json(res, 200, ledger.voidPayment({...(await readJson(req)),payment_id:Number(voidPaymentMatch[1])}));
  if (req.method === "POST" && url.pathname === "/api/revenue/recognize") return json(res, 200, ledger.recognizeThrough((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/revenue/usage") return json(res, 201, ledger.recordUsage(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/revenue/milestone") return json(res, 200, ledger.updateMilestone(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/contracts/modify") return json(res, 200, ledger.modifyContract(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/software-projects") return json(res, 201, ledger.addSoftwareProject(await readJson(req)));
  if (req.method === "POST" && url.pathname === "/api/fx/revalue") return json(res, 200, ledger.revalueFx((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/consolidation/eliminate") return json(res, 200, ledger.postEliminations((await readJson(req)).as_of));
  if (req.method === "POST" && url.pathname === "/api/accounts") {
    const body = await readJson(req);
    if (!body.code?.trim() || !body.name?.trim() || !ACCOUNT_TYPES.includes(body.type)) return json(res, 400, { error: "Code, name, and a valid account type are required" });
    return json(res, 201, ledger.createAccount(body));
  }
  if (req.method === "POST" && url.pathname === "/api/journals") return json(res, 201, ledger.createDraft(await readJson(req)));
  const postMatch = url.pathname.match(/^\/api\/journals\/(\d+)\/post$/);
  if (req.method === "POST" && postMatch) return json(res, 200, ledger.postJournal(Number(postMatch[1])));
  if (req.method === "POST" && url.pathname === "/api/ai/draft") {
    const body = await readJson(req);
    return json(res, 200, await proposeJournal(body.description, ledger.getAccounts()));
  }
  return json(res, 404, { error: "Not found" });
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw Object.assign(new Error("Request too large"), { statusCode: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
  catch { throw Object.assign(new Error("Invalid JSON"), { statusCode: 400 }); }
}

async function staticFile(res, pathname) {
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const safePath = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) return json(res, 403, { error: "Forbidden" });
  try {
    const body = await readFile(filePath);
    const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
    res.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch (error) {
    if (error.code === "ENOENT") return json(res, 404, { error: "Not found" });
    throw error;
  }
}

function json(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}

server.listen(port, "127.0.0.1", () => console.log(`Codex Ledger running at http://127.0.0.1:${port}`));

function shutdown() { server.close(() => { ledger.close(); process.exit(0); }); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
