import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createBackup, restoreBackup } from "../lib/backup.js";
import { createLedger } from "../lib/db.js";
import { createPlatform } from "../lib/platform.js";
import { validateOperationsConfig } from "../lib/operations-config.js";
import { validateBootstrapRequest, validateBrowserOrigin } from "../lib/runtime-config.js";
import { createFolioServer, validateProductionConfig } from "../server.js";

test("encrypted backup and restore authenticate files, rebase tenant paths, and emit drill evidence", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-dr-"));
  const platformPath = join(root, "live", "platform.db");
  const tenantDir = join(root, "live", "tenants");
  const platform = createPlatform(platformPath, tenantDir);
  const setup = await platform.setup({
    organization_name: "Recovery Test",
    name: "Recovery Controller",
    email: "recovery@example.com",
    password: "StrongPassword123",
  });
  const liveLedger = createLedger(setup.session.database_path, {
    orgId: setup.session.org_id,
  });
  liveLedger.close();
  platform.close();
  const key = randomBytes(32);
  const attachmentRoot = join(root, "live", "attachments");
  mkdirSync(join(attachmentRoot, setup.session.org_id), { recursive: true });
  writeFileSync(join(attachmentRoot, setup.session.org_id, "evidence.pdf"), "%PDF-test-evidence");
  const backup = createBackup({
    platformPath,
    backupRoot: join(root, "backups"),
    attachmentRoot,
    encryptionKey: key,
    keyId: "test-key-2026-08",
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const manifestPath = join(backup.backup, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.encryption.algorithm, "AES-256-GCM");
  assert.equal(
    manifest.files.every((file) => file.backup.endsWith(".enc")),
    true,
  );
  assert.equal(
    manifest.files.some((file) => "source" in file),
    false,
  );

  const restoredRoot = join(root, "restore");
  const restored = restoreBackup({
    source: backup.backup,
    target: restoredRoot,
    encryptionKey: key,
  });
  assert.equal(restored.databases, 2);
  assert.equal(restored.attachments, 1);
  assert.equal(
    restored.evidence.results.every((item) => item.integrity === "ok"),
    true,
  );
  const restoredControl = new DatabaseSync(join(restoredRoot, "platform.db"), { readOnly: true });
  const organization = restoredControl
    .prepare("SELECT id,database_path FROM organizations WHERE id=?")
    .get(setup.session.org_id);
  restoredControl.close();
  assert.equal(organization.database_path, join(restoredRoot, "tenants", `${organization.id}.db`));
  const ledger = createLedger(organization.database_path, { seed: false, orgId: organization.id });
  assert.equal(ledger.verifyIntegrity().valid, true);
  ledger.close();
  assert.equal(
    readFileSync(join(restoredRoot, "attachments", setup.session.org_id, "evidence.pdf"), "utf8"),
    "%PDF-test-evidence",
  );
  assert.equal(
    JSON.parse(readFileSync(join(restoredRoot, "restore-evidence.json"))).backup_id,
    backup.backup_id,
  );

  manifest.files[0].org_id = "tampered";
  writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.throws(
    () =>
      restoreBackup({ source: backup.backup, target: join(root, "tampered"), encryptionKey: key }),
    /authentication failed/,
  );
});

test("liveness, dependency readiness, bounded Prometheus labels, and shutdown readiness are separate", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-health-"));
  const app = createFolioServer({
    platformDbPath: join(root, "platform.db"),
    tenantDir: join(root, "tenants"),
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    app.runtime.accepting = true;
    await new Promise((resolve) => app.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });
  assert.equal((await fetch(`${origin}/livez`)).status, 200);
  assert.equal((await fetch(`${origin}/readyz`)).status, 200);
  await fetch(`${origin}/api/journals/123`);
  const metrics = await (await fetch(`${origin}/metrics`)).text();
  assert.match(metrics, /folio_ready 1/);
  assert.match(metrics, /folio_webhook_deliveries\{status="pending"\} 0/);
  assert.match(metrics, /folio_webhook_oldest_unfinished_seconds 0/);
  assert.match(metrics, /folio_background_jobs\{status="queued"\} 0/);
  assert.match(metrics, /folio_background_job_oldest_unfinished_seconds 0/);
  assert.match(metrics, /folio_http_request_duration_seconds_bucket\{/);
  assert.match(metrics, /folio_admission_active_requests 0/);
  assert.match(metrics, /folio_admission_rejections_total\{reason="user_rate"\} 0/);
  assert.match(metrics, /route="\/api\/journals\/:id"/);
  assert.doesNotMatch(metrics, /\/api\/journals\/123/);
  const samples = metrics
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.slice(0, line.lastIndexOf(" ")));
  assert.equal(new Set(samples).size, samples.length);
  app.runtime.accepting = false;
  assert.equal((await fetch(`${origin}/livez`)).status, 200);
  assert.equal((await fetch(`${origin}/readyz`)).status, 503);
});

test("production startup fails closed without HTTPS, secure cookies, a safe bind, or bootstrap secret", (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-runtime-config-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bootstrap = join(root, "bootstrap-token");
  writeFileSync(bootstrap, randomBytes(32).toString("base64"));
  assert.throws(
    () => validateProductionConfig({ NODE_ENV: "production", PUBLIC_ORIGIN: "https://folio.test" }),
    /SESSION_COOKIE_SECURE/,
  );
  assert.throws(
    () =>
      validateProductionConfig({
        NODE_ENV: "production",
        SESSION_COOKIE_SECURE: "true",
        PUBLIC_ORIGIN: "http://folio.test",
      }),
    /HTTPS origin/,
  );
  assert.throws(
    () =>
      validateProductionConfig({
        NODE_ENV: "production",
        SESSION_COOKIE_SECURE: "true",
        PUBLIC_ORIGIN: "https://folio.test",
        HOST: "127.0.0.1",
      }),
    /HOST/,
  );
  assert.equal(
    validateProductionConfig({
      NODE_ENV: "production",
      SESSION_COOKIE_SECURE: "true",
      PUBLIC_ORIGIN: "https://folio.test",
      HOST: "0.0.0.0",
      PORT: "4310",
      BOOTSTRAP_TOKEN_FILE: bootstrap,
    }),
    true,
  );
  assert.throws(
    () =>
      validateProductionConfig({
        NODE_ENV: "production",
        SESSION_COOKIE_SECURE: "true",
        PUBLIC_ORIGIN: "https://folio.test",
        HOST: "0.0.0.0",
        BOOTSTRAP_TOKEN_FILE: bootstrap,
        STRIPE_WEBHOOK_TOLERANCE_SECONDS: "0",
      }),
    /STRIPE_WEBHOOK_TOLERANCE_SECONDS/,
  );
  assert.equal(
    validateBootstrapRequest(
      { "x-folio-bootstrap-token": readFileSync(bootstrap, "utf8") },
      { NODE_ENV: "production", BOOTSTRAP_TOKEN_FILE: bootstrap },
    ),
    true,
  );
  assert.equal(
    validateBootstrapRequest(
      { "x-folio-bootstrap-token": "incorrect-token-that-is-definitely-long-enough" },
      { NODE_ENV: "production", BOOTSTRAP_TOKEN_FILE: bootstrap },
    ),
    false,
  );
});

test("production preflight requires immutable images, mounted secrets, encryption, and routed alerts", (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-preflight-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const paths = {
    backup: join(root, "backup-key"),
    providerToken: join(root, "provider-token-key"),
    alert: join(root, "alert-url"),
    sentry: join(root, "sentry-dsn"),
    openai: join(root, "openai-key"),
    bootstrap: join(root, "bootstrap-token"),
  };
  writeFileSync(paths.backup, randomBytes(32).toString("base64"));
  writeFileSync(paths.providerToken, randomBytes(32).toString("base64"));
  writeFileSync(paths.alert, "https://alerts.example.test/folio");
  writeFileSync(paths.sentry, "https://public@example.test/1");
  writeFileSync(paths.openai, "");
  writeFileSync(paths.bootstrap, randomBytes(32).toString("base64"));
  const environment = {
    NODE_ENV: "production",
    HOST: "0.0.0.0",
    PORT: "4310",
    SESSION_COOKIE_SECURE: "true",
    FOLIO_DOMAIN: "folio.example.test",
    PUBLIC_ORIGIN: "https://folio.example.test",
    FOLIO_IMAGE: `registry.example.test/folio@sha256:${"a".repeat(64)}`,
    BACKUP_KEY_ID: "backup-key-2026-08",
    BACKUP_ENCRYPTION_KEY_FILE: paths.backup,
    PROVIDER_TOKEN_ENCRYPTION_KEY_FILE: paths.providerToken,
    PROVIDER_TOKEN_KEY_ID: "provider-token-2026-08",
    ALERT_WEBHOOK_URL_FILE: paths.alert,
    SENTRY_DSN_FILE: paths.sentry,
    OPENAI_API_KEY_FILE: paths.openai,
    BOOTSTRAP_TOKEN_FILE: paths.bootstrap,
  };
  assert.equal(validateOperationsConfig(environment).status, "ready");
  assert.throws(
    () => validateOperationsConfig({ ...environment, FOLIO_IMAGE: "folio:latest" }),
    /immutable registry image digest/,
  );
  assert.throws(
    () => validateOperationsConfig({ ...environment, ALERT_WEBHOOK_URL_FILE: paths.openai }),
    /must not be empty/,
  );
});

test("production browser state changes reject mismatched and cross-site origins", () => {
  assert.equal(
    validateBrowserOrigin(
      { origin: "https://folio.example.test", "sec-fetch-site": "same-origin" },
      "https://folio.example.test",
    ),
    true,
  );
  assert.throws(
    () =>
      validateBrowserOrigin(
        { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
        "https://folio.example.test",
      ),
    /origin is not allowed/,
  );
});
