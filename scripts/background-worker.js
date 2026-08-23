import { resolve } from "node:path";
import { processNextBackgroundJob, purgeExpiredJobArtifacts } from "../lib/background-worker.js";
import { createPlatform } from "../lib/platform.js";
import { secret } from "../lib/secrets.js";

const once = process.argv.includes("--once");
const pollMilliseconds = boundedNumber(process.env.BACKGROUND_WORKER_POLL_MS, 100, 60_000, 1_000);
const leaseSeconds = boundedNumber(process.env.BACKGROUND_WORKER_LEASE_SECONDS, 10, 3_600, 120);
const platform = createPlatform(process.env.PLATFORM_DB_PATH, process.env.TENANT_DB_DIR);
const artifactDir = resolve(process.env.JOB_ARTIFACT_DIR || "data/job-artifacts");
const artifactRetentionDays = boundedNumber(process.env.JOB_ARTIFACT_RETENTION_DAYS, 1, 3_650, 30);
const artifactSweepMilliseconds =
  boundedNumber(process.env.JOB_ARTIFACT_SWEEP_MINUTES, 1, 1_440, 60) * 60_000;
let stopping = false;
let nextArtifactSweep = 0;

for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => (stopping = true));

try {
  do {
    if (Date.now() >= nextArtifactSweep) {
      const purge = purgeExpiredJobArtifacts(platform, artifactDir);
      if (purge.candidates)
        process.stdout.write(`${JSON.stringify({ event: "artifact_purge", ...purge })}\n`);
      nextArtifactSweep = Date.now() + artifactSweepMilliseconds;
    }
    const result = await processNextBackgroundJob(platform, {
      leaseSeconds,
      artifactDir,
      artifactRetentionDays,
      credentialResolver: (reference) => secret(reference, { required: true }),
    });
    if (result) writeJob(result.job);
    if (once) break;
    if (!result && !stopping) await delay(pollMilliseconds);
  } while (!stopping);
} finally {
  platform.close();
}

function boundedNumber(value, minimum, maximum, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.trunc(parsed)));
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function writeJob(job) {
  process.stdout.write(
    `${JSON.stringify({ event: "background_job", job_id: job.id, kind: job.kind, status: job.status, attempts: job.attempts })}\n`,
  );
}
