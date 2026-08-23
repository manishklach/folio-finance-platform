import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { resolve, sep } from "node:path";
import { z } from "zod";
import { createLedger } from "./db.js";
import { synchronizeProviderConnection } from "./provider-adapters.js";
import { financialReport, reportCsv, reportPdf } from "./reports.js";
import { runWithRequestContext } from "./request-context.js";

const reportRequest = z.object({
  type: z.enum([
    "trial_balance",
    "income_statement",
    "balance_sheet",
    "cash_flow",
    "comprehensive_income",
    "changes_in_equity",
  ]),
  format: z.enum(["csv", "pdf"]),
  as_of: z.iso.date(),
  from: z.iso.date(),
});

const providerRequest = z.object({
  connection_id: z.string().min(1).max(200),
  trigger: z.enum(["manual", "scheduled"]).default("manual"),
});

export async function processNextBackgroundJob(
  platform,
  {
    leaseSeconds = 120,
    artifactDir = resolve("data", "job-artifacts"),
    credentialResolver,
    fetchImpl = globalThis.fetch,
    artifactRetentionDays = 30,
  } = {},
) {
  const job = platform.claimBackgroundJob({ leaseSeconds });
  if (!job) return null;
  let ledger;
  try {
    const organization = platform.organizationById(job.org_id);
    if (!organization)
      throw Object.assign(new Error("Background job organization is unavailable"), {
        safe: true,
      });
    ledger = createLedger(organization.database_path, { seed: false, orgId: organization.id });
    const result = await runWithRequestContext(
      {
        actor: `background.${job.kind}`,
        orgId: organization.id,
        userId: job.requested_by,
        role: "system",
        requestId: `background-job:${job.id}`,
      },
      async () => {
        if (job.kind === "report_export")
          return executeReportJob(job, ledger, organization.id, artifactDir, artifactRetentionDays);
        if (job.kind === "provider_sync") {
          const input = providerRequest.parse(job.request);
          const sync = await synchronizeProviderConnection({
            ledger,
            connectionId: input.connection_id,
            trigger: input.trigger,
            credentialResolver,
            fetchImpl,
          });
          return { result: { sync_run_id: sync.id, status: sync.status } };
        }
        throw new Error("Unsupported background job kind");
      },
    );
    const completed = platform.completeBackgroundJob(job.id, result);
    return { job: completed, result };
  } catch (error) {
    const failed = platform.failBackgroundJob(job.id, safeJobError(error));
    return { job: failed, error: safeJobError(error), cause: error };
  } finally {
    ledger?.close();
  }
}

async function executeReportJob(job, ledger, orgId, artifactRoot, retentionDays) {
  const input = reportRequest.parse(job.request);
  if (input.from > input.as_of)
    throw Object.assign(new Error("Report start date must not follow its as-of date"), {
      safe: true,
    });
  const report = financialReport(ledger, input.type, input.as_of, input.from);
  const content = input.format === "pdf" ? await reportPdf(report) : Buffer.from(reportCsv(report));
  const root = resolve(artifactRoot);
  const directory = resolve(root, orgId, job.id);
  if (directory !== root && !directory.startsWith(`${root}${sep}`))
    throw new Error("Unsafe artifact path");
  mkdirSync(directory, { recursive: true });
  const filename = `${input.type}-${input.as_of}.${input.format}`;
  const target = resolve(directory, filename);
  const temporary = `${target}.tmp`;
  if (existsSync(target)) {
    if (!readFileSync(target).equals(content))
      throw new Error("Existing job artifact does not match");
  } else {
    if (existsSync(temporary)) unlinkSync(temporary);
    writeFileSync(temporary, content, { flag: "wx", mode: 0o600 });
    renameSync(temporary, target);
  }
  return {
    result: {
      report: input.type,
      format: input.format,
      as_of: input.as_of,
      rows: report.rows.length,
    },
    artifact: {
      path: target,
      contentType: input.format === "pdf" ? "application/pdf" : "text/csv; charset=utf-8",
      filename,
      expiresAt: new Date(
        Date.now() + boundedRetentionDays(retentionDays) * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  };
}

export function purgeExpiredJobArtifacts(platform, artifactDir, { limit = 100 } = {}) {
  const root = resolve(artifactDir);
  const candidates = platform.expiredBackgroundJobArtifacts(limit);
  let deleted = 0;
  for (const candidate of candidates) {
    const target = resolve(candidate.artifact_path);
    const containment = target === root ? "" : target.slice(root.length + 1);
    if (!containment || !target.startsWith(`${root}${sep}`))
      throw new Error("Expired artifact path escapes configured root");
    if (existsSync(target)) {
      const stat = lstatSync(target);
      if (!stat.isFile() || stat.isSymbolicLink())
        throw new Error("Expired artifact is not a regular file");
      const realRoot = realpathSync(root);
      const realTarget = realpathSync(target);
      if (!realTarget.startsWith(`${realRoot}${sep}`))
        throw new Error("Expired artifact resolves outside configured root");
      unlinkSync(target);
    }
    if (platform.markBackgroundJobArtifactDeleted(candidate.id)) deleted += 1;
  }
  return { candidates: candidates.length, deleted };
}

function boundedRetentionDays(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(1, Math.min(3650, Math.trunc(parsed)));
}

function safeJobError(error) {
  if (error?.safe || (error?.statusCode && error.statusCode < 500))
    return String(error.message).slice(0, 500);
  if (error instanceof z.ZodError) return "Background job request is invalid";
  return "Background job processing failed";
}
