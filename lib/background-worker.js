import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
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

const importStageRequest = z.object({ source_sha256: z.string().regex(/^[a-f0-9]{64}$/) });
const importApplyRequest = z.object({ batch_id: z.string().uuid() });

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
            credentialResolver: (reference, connection) =>
              credentialResolver(reference, { ...connection, org_id: organization.id }),
            fetchImpl,
          });
          return { result: { sync_run_id: sync.id, status: sync.status } };
        }
        if (job.kind === "import_stage") return executeImportStageJob(job, ledger, artifactDir);
        if (job.kind === "import_apply") {
          const input = importApplyRequest.parse(job.request);
          const batch = ledger.applyImport(input.batch_id);
          return {
            result: {
              batch_id: batch.id,
              status: batch.status,
              applied_count: batch.applied_count,
            },
          };
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

function executeImportStageJob(job, ledger, artifactRoot) {
  const input = importStageRequest.parse(job.request);
  if (!job.source_path || job.source_sha256 !== input.source_sha256)
    throw new Error("Import source metadata is unavailable");
  assertContainedRegularFile(artifactRoot, job.source_path, "Import source");
  const content = readFileSync(job.source_path);
  const digest = createHash("sha256").update(content).digest("hex");
  if (digest !== input.source_sha256) throw new Error("Import source integrity check failed");
  let source;
  try {
    source = JSON.parse(content.toString("utf8"));
  } catch {
    throw Object.assign(new Error("Import source is not valid JSON"), { safe: true });
  }
  const batch = ledger.stageImport(source, { returnExisting: true });
  return {
    result: {
      batch_id: batch.id,
      status: batch.status,
      row_count: batch.row_count,
      valid_count: batch.valid_count,
      error_count: batch.error_count,
      duplicate_count: batch.duplicate_count,
    },
  };
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
    deleteContainedRegularFile(root, candidate.artifact_path, "Expired artifact");
    if (platform.markBackgroundJobArtifactDeleted(candidate.id)) deleted += 1;
  }
  return { candidates: candidates.length, deleted };
}

export function purgeBackgroundJobSources(platform, artifactDir, { limit = 100 } = {}) {
  const root = resolve(artifactDir);
  const candidates = platform.backgroundJobSourcesForCleanup(limit);
  let deleted = 0;
  for (const candidate of candidates) {
    deleteContainedRegularFile(root, candidate.source_path, "Background job source");
    const expired = ["queued", "retry"].includes(candidate.status);
    if (platform.markBackgroundJobSourceDeleted(candidate.id, { expired })) deleted += 1;
  }
  return { candidates: candidates.length, deleted };
}

export function purgeOrphanedImportSources(
  platform,
  artifactDir,
  { olderThanSeconds = 3_600 } = {},
) {
  const root = resolve(artifactDir);
  if (!existsSync(root)) return { candidates: 0, deleted: 0 };
  const known = new Set(platform.knownBackgroundJobSourcePaths().map((path) => resolve(path)));
  const cutoff = Date.now() - Math.max(600, Number(olderThanSeconds) || 3_600) * 1000;
  let candidates = 0;
  let deleted = 0;
  for (const organization of readdirSync(root, { withFileTypes: true })) {
    if (!organization.isDirectory() || organization.isSymbolicLink()) continue;
    const directory = resolve(root, organization.name, "import-sources");
    if (!existsSync(directory)) continue;
    assertContainedDirectory(root, directory, "Import source directory");
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile() || entry.isSymbolicLink()) continue;
      const path = resolve(directory, entry.name);
      if (known.has(path) || lstatSync(path).mtimeMs > cutoff) continue;
      candidates += 1;
      deleteContainedRegularFile(root, path, "Orphaned import source");
      const filenameHash = createHash("sha256").update(entry.name).digest("hex");
      if (platform.recordOrphanedBackgroundJobSourceDeletion(organization.name, filenameHash))
        deleted += 1;
    }
  }
  return { candidates, deleted };
}

function deleteContainedRegularFile(root, path, label) {
  const target = resolve(path);
  if (target === root || !target.startsWith(`${root}${sep}`))
    throw new Error(`${label} path escapes configured root`);
  if (!existsSync(target)) return;
  assertContainedRegularFile(root, target, label);
  unlinkSync(target);
}

function assertContainedRegularFile(rootPath, path, label) {
  const root = resolve(rootPath);
  const target = resolve(path);
  if (target === root || !target.startsWith(`${root}${sep}`))
    throw new Error(`${label} path escapes configured root`);
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} is not a regular file`);
  const realRoot = realpathSync(root);
  const realTarget = realpathSync(target);
  if (!realTarget.startsWith(`${realRoot}${sep}`))
    throw new Error(`${label} resolves outside configured root`);
}

function assertContainedDirectory(rootPath, path, label) {
  const root = resolve(rootPath);
  const target = resolve(path);
  if (target === root || !target.startsWith(`${root}${sep}`))
    throw new Error(`${label} path escapes configured root`);
  const stat = lstatSync(target);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error(`${label} is not a regular directory`);
  const realRoot = realpathSync(root);
  const realTarget = realpathSync(target);
  if (!realTarget.startsWith(`${realRoot}${sep}`))
    throw new Error(`${label} resolves outside configured root`);
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
