import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  processNextBackgroundJob,
  purgeBackgroundJobSources,
  purgeExpiredJobArtifacts,
  purgeOrphanedImportSources,
} from "../lib/background-worker.js";
import { createLedger } from "../lib/db.js";
import { createPlatform } from "../lib/platform.js";
import { createFolioServer } from "../server.js";

async function fixture(t, name) {
  const root = mkdtempSync(join(tmpdir(), `${name}-`));
  const artifactDir = join(root, "artifacts");
  const platform = createPlatform(join(root, "platform.db"), join(root, "tenants"));
  const setup = await platform.setup({
    organization_name: "Background Work Test",
    name: "Controller",
    email: `${name}@example.test`,
    password: "StrongPassword123",
  });
  const ledger = createLedger(setup.session.database_path, {
    seed: true,
    orgId: setup.session.org_id,
  });
  ledger.close();
  t.after(() => {
    platform.close();
    rmSync(root, { recursive: true, force: true });
  });
  return { root, artifactDir, platform, setup };
}

test("durable report jobs are idempotent, tenant-bound, leased, and artifact-backed", async (t) => {
  const { artifactDir, platform, setup } = await fixture(t, "report-job");
  const input = {
    orgId: setup.session.org_id,
    userId: setup.session.user_id,
    kind: "report_export",
    request: {
      type: "trial_balance",
      format: "csv",
      as_of: "2026-08-31",
      from: "2026-01-01",
    },
    idempotencyKey: "report-2026-08",
  };
  const queued = platform.enqueueBackgroundJob(input);
  assert.equal(queued.status, "queued");
  assert.equal(platform.enqueueBackgroundJob(input).duplicate, true);
  assert.throws(
    () =>
      platform.enqueueBackgroundJob({
        ...input,
        request: { ...input.request, format: "pdf" },
      }),
    /different request/,
  );
  assert.equal(platform.backgroundJob(queued.id, "another-org"), null);

  const result = await processNextBackgroundJob(platform, { artifactDir });
  assert.equal(result.job.status, "completed", result.cause?.stack);
  assert.equal(result.job.has_artifact, true);
  const internal = platform.backgroundJob(queued.id, setup.session.org_id, { internal: true });
  assert.match(readFileSync(internal.artifact_path, "utf8"), /code,account,debit_cents/);
  assert.equal(internal.result.report, "trial_balance");
  assert.equal(platform.backgroundJobMetrics().counts.completed, 1);
  platform.db
    .prepare("UPDATE background_jobs SET status='retry',completed_at=NULL WHERE id=?")
    .run(queued.id);
  const recovered = await processNextBackgroundJob(platform, { artifactDir });
  assert.equal(
    recovered.job.status,
    "completed",
    "a renamed artifact is reusable after lease recovery",
  );
  const recoveredInternal = platform.backgroundJob(queued.id, setup.session.org_id, {
    internal: true,
  });
  assert.ok(recoveredInternal.artifact_expires_at);
  platform.db
    .prepare(
      "UPDATE background_jobs SET artifact_expires_at=datetime('now','-1 second') WHERE id=?",
    )
    .run(queued.id);
  assert.deepEqual(purgeExpiredJobArtifacts(platform, artifactDir), {
    candidates: 1,
    deleted: 1,
  });
  assert.equal(existsSync(recoveredInternal.artifact_path), false);
  const purged = platform.backgroundJob(queued.id, setup.session.org_id);
  assert.equal(purged.has_artifact, false);
  assert.ok(purged.artifact_deleted_at);
  assert.equal(
    platform.db
      .prepare("SELECT action FROM platform_audit WHERE action='background_job_artifact_deleted'")
      .get().action,
    "background_job_artifact_deleted",
  );
});

test("expired job leases retry, dead letters are explicit, and operator retry/cancel is audited", async (t) => {
  const { artifactDir, platform, setup } = await fixture(t, "job-recovery");
  const enqueue = (key) =>
    platform.enqueueBackgroundJob({
      orgId: setup.session.org_id,
      userId: setup.session.user_id,
      kind: "provider_sync",
      request: { connection_id: "missing", trigger: "manual" },
      idempotencyKey: key,
      maxAttempts: 1,
    });
  const leased = enqueue("lease-expiry");
  platform.claimBackgroundJob({ leaseSeconds: 10 });
  platform.db
    .prepare("UPDATE background_jobs SET locked_at=datetime('now','-20 seconds') WHERE id=?")
    .run(leased.id);
  assert.equal(platform.claimBackgroundJob({ leaseSeconds: 10 }).attempts, 2);
  const dead = platform.failBackgroundJob(leased.id, "safe test failure");
  assert.equal(dead.status, "dead_letter");
  assert.equal(
    platform.retryBackgroundJob(dead.id, setup.session.org_id, setup.session.user_id).status,
    "retry",
  );
  platform.db.prepare("UPDATE background_jobs SET status='dead_letter' WHERE id=?").run(dead.id);
  platform.retryBackgroundJob(dead.id, setup.session.org_id, setup.session.user_id);
  const queued = enqueue("cancel-job");
  assert.equal(
    platform.cancelBackgroundJob(queued.id, setup.session.org_id, setup.session.user_id).status,
    "cancelled",
  );
  const expiredSource = platform.enqueueBackgroundJob({
    orgId: setup.session.org_id,
    userId: setup.session.user_id,
    kind: "import_stage",
    request: { source_sha256: "a".repeat(64) },
    idempotencyKey: "expired-import-source",
    source: {
      path: join(artifactDir, setup.session.org_id, "import-sources", "expired.json"),
      sha256: "a".repeat(64),
      expiresAt: "2000-01-01T00:00:00.000Z",
    },
  });
  assert.deepEqual(purgeBackgroundJobSources(platform, artifactDir), {
    candidates: 1,
    deleted: 1,
  });
  const expired = platform.backgroundJob(expiredSource.id, setup.session.org_id);
  assert.equal(expired.status, "dead_letter");
  assert.match(expired.last_error, /source expired/);
  assert.throws(
    () => platform.retryBackgroundJob(expired.id, setup.session.org_id, setup.session.user_id),
    /submit the file again/,
  );
  const sourceDirectory = join(artifactDir, setup.session.org_id, "import-sources");
  mkdirSync(sourceDirectory, { recursive: true });
  const orphanPath = join(sourceDirectory, "orphan.json");
  writeFileSync(orphanPath, "{}", { mode: 0o600 });
  utimesSync(orphanPath, new Date("2000-01-01"), new Date("2000-01-01"));
  assert.deepEqual(purgeOrphanedImportSources(platform, artifactDir), {
    candidates: 1,
    deleted: 1,
  });
  assert.equal(existsSync(orphanPath), false);
  const actions = platform.db
    .prepare("SELECT action FROM platform_audit WHERE action LIKE 'background_job_%'")
    .all()
    .map(({ action }) => action);
  assert.ok(actions.includes("background_job_retried"));
  assert.ok(actions.includes("background_job_cancelled"));
  assert.ok(actions.includes("background_job_source_deleted"));
  assert.ok(actions.includes("background_job_orphan_source_deleted"));
});

test("provider jobs run the connection adapter and persist cursor/source-run results", async (t) => {
  const { platform, setup } = await fixture(t, "provider-job");
  const ledger = createLedger(setup.session.database_path, {
    seed: false,
    orgId: setup.session.org_id,
  });
  const connection = ledger.configureIntegration({
    provider: "plaid",
    display_name: "Queued Plaid",
    environment: "sandbox",
    credential_secret_ref: "PLAID_QUEUED_CREDENTIALS",
    settings: {},
  });
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  ledger.close();
  const queued = platform.enqueueBackgroundJob({
    orgId: setup.session.org_id,
    userId: setup.session.user_id,
    kind: "provider_sync",
    request: { connection_id: connection.id, trigger: "manual" },
    idempotencyKey: "queued-plaid-sync",
  });
  const processed = await processNextBackgroundJob(platform, {
    credentialResolver: () => ({ client_id: "client", secret: "secret", access_token: "token" }),
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          added: [],
          modified: [],
          removed: [],
          next_cursor: "queued-complete",
          has_more: false,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });
  assert.equal(processed.job.id, queued.id);
  assert.equal(processed.job.status, "completed", processed.cause?.stack);
  const verified = createLedger(setup.session.database_path, {
    seed: false,
    orgId: setup.session.org_id,
  });
  assert.equal(verified.integrationConnection(connection.id).cursor, "queued-complete");
  assert.equal(verified.integrationSyncRun(processed.job.result.sync_run_id).status, "succeeded");
  verified.close();
});

test("authenticated import jobs stage source artifacts and apply approved batches durably", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "import-job-api-"));
  const artifactDir = join(root, "artifacts");
  const app = createFolioServer({
    platformDbPath: join(root, "platform.db"),
    tenantDir: join(root, "tenants"),
    environment: { JOB_ARTIFACT_DIR: artifactDir, IMPORT_SOURCE_RETENTION_DAYS: "7" },
  });
  const setup = await app.platform.setup({
    organization_name: "Import Job API Test",
    name: "Controller",
    email: "import-job-api@example.test",
    password: "StrongPassword123",
  });
  createLedger(setup.session.database_path, { seed: true, orgId: setup.session.org_id }).close();
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });
  const headers = {
    cookie: `folio_session=${setup.token}`,
    "content-type": "application/json",
    "x-csrf-token": setup.csrf,
  };
  const stagedResponse = await fetch(`${origin}/api/jobs/imports/stage`, {
    method: "POST",
    headers: { ...headers, "idempotency-key": "queued-import-stage-1" },
    body: JSON.stringify({
      template_key: "journals",
      filename: "queued-journals.csv",
      csv: "date,memo,debit_account_code,credit_account_code,amount_cents,external_id\n2026-08-23,Queued import,1000,3000,1250,queued-import-1",
      options: {},
    }),
  });
  assert.equal(stagedResponse.status, 202);
  const stagedJob = await stagedResponse.json();
  assert.equal("source_path" in stagedJob, false);
  const internal = app.platform.backgroundJob(stagedJob.id, setup.session.org_id, {
    internal: true,
  });
  assert.equal(existsSync(internal.source_path), true);
  const staged = await processNextBackgroundJob(app.platform, { artifactDir });
  assert.equal(staged.job.status, "completed", staged.cause?.stack);
  const batchId = staged.job.result.batch_id;
  assert.equal(staged.job.result.valid_count, 1);

  app.platform.db
    .prepare("UPDATE background_jobs SET status='retry',completed_at=NULL WHERE id=?")
    .run(stagedJob.id);
  const recovered = await processNextBackgroundJob(app.platform, { artifactDir });
  assert.equal(recovered.job.result.batch_id, batchId, "staging retry reuses the exact batch");

  const approval = await fetch(`${origin}/api/imports/batches/${batchId}/approve`, {
    method: "POST",
    headers: { ...headers, "idempotency-key": "queued-import-approve-1" },
    body: JSON.stringify({ apply_valid_rows: false }),
  });
  assert.equal(approval.status, 200);
  const applyResponse = await fetch(`${origin}/api/jobs/imports/apply`, {
    method: "POST",
    headers: { ...headers, "idempotency-key": "queued-import-apply-1" },
    body: JSON.stringify({ batch_id: batchId }),
  });
  assert.equal(applyResponse.status, 202);
  const applyJob = await applyResponse.json();
  const applied = await processNextBackgroundJob(app.platform, { artifactDir });
  assert.equal(applied.job.id, applyJob.id);
  assert.equal(applied.job.result.applied_count, 1);
  assert.equal(applied.job.status, "completed", applied.cause?.stack);

  assert.deepEqual(purgeBackgroundJobSources(app.platform, artifactDir), {
    candidates: 1,
    deleted: 1,
  });
  assert.equal(existsSync(internal.source_path), false);
  assert.equal(
    app.platform.backgroundJob(stagedJob.id, setup.session.org_id, { internal: true }).source_path,
    null,
  );
  const verified = createLedger(setup.session.database_path, {
    seed: false,
    orgId: setup.session.org_id,
  });
  assert.equal(verified.importBatch(batchId).status, "applied");
  verified.close();
});

test("authenticated report-job API queues, exposes status, and downloads only tenant artifacts", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "job-api-"));
  const artifactDir = join(root, "artifacts");
  const app = createFolioServer({
    platformDbPath: join(root, "platform.db"),
    tenantDir: join(root, "tenants"),
    environment: { JOB_ARTIFACT_DIR: artifactDir },
  });
  const setup = await app.platform.setup({
    organization_name: "Job API Test",
    name: "Controller",
    email: "job-api@example.test",
    password: "StrongPassword123",
  });
  createLedger(setup.session.database_path, { seed: true, orgId: setup.session.org_id }).close();
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });
  const headers = {
    cookie: `folio_session=${setup.token}`,
    "content-type": "application/json",
    "x-csrf-token": setup.csrf,
    "idempotency-key": "api-report-2026-08",
  };
  const response = await fetch(`${origin}/api/jobs/reports`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type: "income_statement", format: "csv", as_of: "2026-08-31" }),
  });
  assert.equal(response.status, 202);
  const queued = await response.json();
  assert.equal("idempotency_key" in queued, false);
  const invalid = await fetch(`${origin}/api/jobs/reports`, {
    method: "POST",
    headers: { ...headers, "idempotency-key": "invalid-report-request" },
    body: JSON.stringify({ type: "not-a-report", format: "csv", as_of: "2026-08-31" }),
  });
  assert.equal(invalid.status, 400);
  await processNextBackgroundJob(app.platform, { artifactDir });
  const status = await fetch(`${origin}/api/jobs/${queued.id}`, { headers });
  const statusBody = await status.json();
  assert.equal(statusBody.status, "completed", statusBody.last_error);
  const download = await fetch(`${origin}/api/jobs/${queued.id}/download`, { headers });
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-disposition"), /income_statement-2026-08-31.csv/);
  assert.match(await download.text(), /section,account,amount_cents/);
});
