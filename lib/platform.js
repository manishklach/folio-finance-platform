import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import argon2 from "argon2";
import { z } from "zod";

const ROLES = ["admin", "bookkeeper", "approver", "read_only"];
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(12).max(256).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);
const orgSchema = z.string().trim().min(2).max(120);
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,p=1,t=3$NZiK4yeiYXG5PNcdkH5lBQ$ObEIpARdd9wZ3xqFCP6CP777UmYzx9KEFRuE+vB8Pts";

const PLATFORM_MIGRATIONS = [
  {
    version: 1,
    name: "identity_and_tenants",
    up: `
      CREATE TABLE organizations (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,database_path TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deleted')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','locked','disabled')),failed_attempts INTEGER NOT NULL DEFAULT 0,locked_until TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_login_at TEXT);
      CREATE TABLE memberships (user_id TEXT NOT NULL REFERENCES users(id),org_id TEXT NOT NULL REFERENCES organizations(id),role TEXT NOT NULL CHECK(role IN ('admin','bookkeeper','approver','read_only')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,org_id));
      CREATE TABLE sessions (id TEXT PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE,user_id TEXT NOT NULL REFERENCES users(id),org_id TEXT NOT NULL REFERENCES organizations(id),csrf_hash TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,ip_hash TEXT,user_agent_hash TEXT);
      CREATE TABLE login_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL,ip_hash TEXT NOT NULL,succeeded INTEGER NOT NULL,attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE platform_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,org_id TEXT,user_id TEXT,action TEXT NOT NULL,request_id TEXT,payload TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE INDEX idx_sessions_token ON sessions(token_hash,expires_at);
      CREATE INDEX idx_login_attempts ON login_attempts(email,ip_hash,attempted_at);
    `,
    down: `DROP TABLE IF EXISTS platform_audit;DROP TABLE IF EXISTS login_attempts;DROP TABLE IF EXISTS sessions;DROP TABLE IF EXISTS memberships;DROP TABLE IF EXISTS users;DROP TABLE IF EXISTS organizations;`,
  },
  {
    version: 2,
    name: "governance_and_integrations",
    up: `
      CREATE TABLE idempotency_keys (org_id TEXT NOT NULL,key TEXT NOT NULL,route TEXT NOT NULL,request_hash TEXT NOT NULL,status_code INTEGER,response_json TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(org_id,key,route));
      CREATE TABLE ai_usage (id TEXT PRIMARY KEY,org_id TEXT NOT NULL,user_id TEXT NOT NULL,period TEXT NOT NULL,proposal_json TEXT NOT NULL,rationale TEXT,confidence TEXT,provider TEXT,disposition TEXT CHECK(disposition IN ('pending','accepted','edited','rejected')),journal_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,decided_at TEXT);
      CREATE TABLE webhook_events (provider TEXT NOT NULL,event_id TEXT NOT NULL,org_id TEXT NOT NULL,payload_hash TEXT NOT NULL,status TEXT NOT NULL,result_json TEXT,received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(provider,event_id));
      CREATE TABLE privacy_requests (id TEXT PRIMARY KEY,org_id TEXT NOT NULL,requested_by TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('export','delete')),status TEXT NOT NULL DEFAULT 'pending',evidence_path TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT);
    `,
    down: `DROP TABLE IF EXISTS privacy_requests;DROP TABLE IF EXISTS webhook_events;DROP TABLE IF EXISTS ai_usage;DROP TABLE IF EXISTS idempotency_keys;`,
  },
  {
    version: 3,
    name: "user_profile_name",
    up: `ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT '';UPDATE users SET name=substr(email,1,instr(email,'@')-1) WHERE name='';`,
    down: `ALTER TABLE users DROP COLUMN name;`,
  },
  {
    version: 4,
    name: "durable_webhook_delivery_queue",
    up: `
      CREATE TABLE webhook_deliveries (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        event_id TEXT NOT NULL,
        org_id TEXT NOT NULL REFERENCES organizations(id),
        connection_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','retry','completed','dead_letter')),
        attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
        available_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        locked_at TEXT,
        last_error TEXT,
        result_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider,event_id)
      );
      CREATE INDEX idx_webhook_deliveries_claim ON webhook_deliveries(status,available_at,created_at);
      CREATE INDEX idx_webhook_deliveries_org ON webhook_deliveries(org_id,status,created_at);
    `,
    down: `DROP TABLE IF EXISTS webhook_deliveries;`,
  },
  {
    version: 5,
    name: "durable_background_jobs",
    up: `
      CREATE TABLE background_jobs (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id),
        requested_by TEXT NOT NULL REFERENCES users(id),
        kind TEXT NOT NULL CHECK(kind IN ('report_export','provider_sync')),
        request_json TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        idempotency_key TEXT,
        status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','retry','completed','dead_letter','cancelled')),
        attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
        max_attempts INTEGER NOT NULL DEFAULT 5 CHECK(max_attempts BETWEEN 1 AND 20),
        available_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        locked_at TEXT,
        last_error TEXT,
        result_json TEXT,
        artifact_path TEXT,
        artifact_content_type TEXT,
        artifact_filename TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        UNIQUE(org_id,kind,idempotency_key)
      );
      CREATE INDEX idx_background_jobs_claim ON background_jobs(status,available_at,created_at);
      CREATE INDEX idx_background_jobs_org ON background_jobs(org_id,status,created_at);
    `,
    down: `DROP TABLE IF EXISTS background_jobs;`,
  },
  {
    version: 6,
    name: "background_job_artifact_retention",
    up: `
      ALTER TABLE background_jobs ADD COLUMN artifact_expires_at TEXT;
      ALTER TABLE background_jobs ADD COLUMN artifact_deleted_at TEXT;
      CREATE INDEX idx_background_jobs_artifact_expiry ON background_jobs(artifact_expires_at,artifact_deleted_at);
    `,
    down: `
      DROP INDEX IF EXISTS idx_background_jobs_artifact_expiry;
      ALTER TABLE background_jobs DROP COLUMN artifact_deleted_at;
      ALTER TABLE background_jobs DROP COLUMN artifact_expires_at;
    `,
  },
  {
    version: 7,
    name: "durable_import_jobs",
    up: `
      DROP INDEX idx_background_jobs_claim;
      DROP INDEX idx_background_jobs_org;
      DROP INDEX idx_background_jobs_artifact_expiry;
      ALTER TABLE background_jobs RENAME TO background_jobs_v6;
      CREATE TABLE background_jobs (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id),
        requested_by TEXT NOT NULL REFERENCES users(id),
        kind TEXT NOT NULL CHECK(kind IN ('report_export','provider_sync','import_stage','import_apply')),
        request_json TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        idempotency_key TEXT,
        status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','retry','completed','dead_letter','cancelled')),
        attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
        max_attempts INTEGER NOT NULL DEFAULT 5 CHECK(max_attempts BETWEEN 1 AND 20),
        available_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        locked_at TEXT,
        last_error TEXT,
        result_json TEXT,
        artifact_path TEXT,
        artifact_content_type TEXT,
        artifact_filename TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        artifact_expires_at TEXT,
        artifact_deleted_at TEXT,
        source_path TEXT,
        source_sha256 TEXT,
        source_expires_at TEXT,
        source_deleted_at TEXT,
        UNIQUE(org_id,kind,idempotency_key)
      );
      INSERT INTO background_jobs(
        id,org_id,requested_by,kind,request_json,request_hash,idempotency_key,status,attempts,
        max_attempts,available_at,locked_at,last_error,result_json,artifact_path,
        artifact_content_type,artifact_filename,created_at,updated_at,completed_at,
        artifact_expires_at,artifact_deleted_at
      ) SELECT
        id,org_id,requested_by,kind,request_json,request_hash,idempotency_key,status,attempts,
        max_attempts,available_at,locked_at,last_error,result_json,artifact_path,
        artifact_content_type,artifact_filename,created_at,updated_at,completed_at,
        artifact_expires_at,artifact_deleted_at
      FROM background_jobs_v6;
      DROP TABLE background_jobs_v6;
      CREATE INDEX idx_background_jobs_claim ON background_jobs(status,available_at,created_at);
      CREATE INDEX idx_background_jobs_org ON background_jobs(org_id,status,created_at);
      CREATE INDEX idx_background_jobs_artifact_expiry ON background_jobs(artifact_expires_at,artifact_deleted_at);
      CREATE INDEX idx_background_jobs_source_cleanup ON background_jobs(status,source_expires_at,source_deleted_at);
    `,
    down: `
      DROP INDEX idx_background_jobs_claim;
      DROP INDEX idx_background_jobs_org;
      DROP INDEX idx_background_jobs_artifact_expiry;
      DROP INDEX idx_background_jobs_source_cleanup;
      ALTER TABLE background_jobs RENAME TO background_jobs_v7;
      CREATE TABLE background_jobs (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id),
        requested_by TEXT NOT NULL REFERENCES users(id),
        kind TEXT NOT NULL CHECK(kind IN ('report_export','provider_sync')),
        request_json TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        idempotency_key TEXT,
        status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','retry','completed','dead_letter','cancelled')),
        attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
        max_attempts INTEGER NOT NULL DEFAULT 5 CHECK(max_attempts BETWEEN 1 AND 20),
        available_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        locked_at TEXT,
        last_error TEXT,
        result_json TEXT,
        artifact_path TEXT,
        artifact_content_type TEXT,
        artifact_filename TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        artifact_expires_at TEXT,
        artifact_deleted_at TEXT,
        UNIQUE(org_id,kind,idempotency_key)
      );
      INSERT INTO background_jobs(
        id,org_id,requested_by,kind,request_json,request_hash,idempotency_key,status,attempts,
        max_attempts,available_at,locked_at,last_error,result_json,artifact_path,
        artifact_content_type,artifact_filename,created_at,updated_at,completed_at,
        artifact_expires_at,artifact_deleted_at
      ) SELECT
        id,org_id,requested_by,kind,request_json,request_hash,idempotency_key,status,attempts,
        max_attempts,available_at,locked_at,last_error,result_json,artifact_path,
        artifact_content_type,artifact_filename,created_at,updated_at,completed_at,
        artifact_expires_at,artifact_deleted_at
      FROM background_jobs_v7;
      DROP TABLE background_jobs_v7;
      CREATE INDEX idx_background_jobs_claim ON background_jobs(status,available_at,created_at);
      CREATE INDEX idx_background_jobs_org ON background_jobs(org_id,status,created_at);
      CREATE INDEX idx_background_jobs_artifact_expiry ON background_jobs(artifact_expires_at,artifact_deleted_at);
    `,
  },
];

export function createPlatform(
  dbPath = resolve("data", "platform.db"),
  tenantDir = resolve("data", "tenants"),
) {
  mkdirSync(dirname(dbPath), { recursive: true });
  mkdirSync(tenantDir, { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;");
  migratePlatform(db);

  function status() {
    return { needs_setup: db.prepare("SELECT COUNT(*) count FROM users").get().count === 0 };
  }

  async function setup(input, meta = {}) {
    if (!status().needs_setup) throw problem("Setup has already been completed", 409);
    const name = orgSchema.parse(input.organization_name);
    const email = emailSchema.parse(input.email);
    const password = passwordSchema.parse(input.password);
    const userName = z
      .string()
      .trim()
      .min(1)
      .max(120)
      .parse(input.name || email.split("@")[0]);
    const orgId = randomUUID();
    const userId = randomUUID();
    const databasePath = join(tenantDir, `${orgId}.db`);
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 3,
      parallelism: 1,
    });
    db.exec("BEGIN IMMEDIATE");
    try {
      // The bootstrap decision must be repeated while holding the write lock. Password hashing
      // yields to other requests, so the earlier check alone cannot prevent two first admins.
      if (!status().needs_setup) throw problem("Setup has already been completed", 409);
      const slug = uniqueSlug(name);
      db.prepare("INSERT INTO organizations(id,name,slug,database_path) VALUES(?,?,?,?)").run(
        orgId,
        name,
        slug,
        databasePath,
      );
      db.prepare("INSERT INTO users(id,email,password_hash,name) VALUES(?,?,?,?)").run(
        userId,
        email,
        hash,
        userName,
      );
      db.prepare("INSERT INTO memberships(user_id,org_id,role) VALUES(?,?, 'admin')").run(
        userId,
        orgId,
      );
      audit("initial_setup", { orgId, userId, requestId: meta.requestId }, { email });
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return createSession(userId, orgId, meta);
  }

  async function login(input, meta = {}) {
    const email = emailSchema.parse(input.email);
    const ipHash = digest(meta.ip || "unknown");
    enforceLoginRate(email, ipHash);
    const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    // Always perform one Argon2 verification so unknown accounts do not have a cheap timing path.
    const passwordValid = await argon2.verify(
      user?.password_hash || DUMMY_PASSWORD_HASH,
      String(input.password || ""),
    );
    const valid = Boolean(
      user &&
      user.status !== "disabled" &&
      (!user.locked_until || user.locked_until <= now()) &&
      passwordValid,
    );
    db.prepare("INSERT INTO login_attempts(email,ip_hash,succeeded) VALUES(?,?,?)").run(
      email,
      ipHash,
      valid ? 1 : 0,
    );
    if (!valid) {
      if (user) {
        const failures = user.failed_attempts + 1;
        const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
        db.prepare(
          "UPDATE users SET failed_attempts=?,locked_until=?,status=CASE WHEN ? IS NULL THEN status ELSE 'locked' END WHERE id=?",
        ).run(failures, lockedUntil, lockedUntil, user.id);
      }
      throw problem("Invalid credentials", 401);
    }
    const memberships = db
      .prepare(
        "SELECT m.*,o.name org_name,o.slug FROM memberships m JOIN organizations o ON o.id=m.org_id WHERE m.user_id=? AND o.status='active'",
      )
      .all(user.id);
    const selected = input.org_id
      ? memberships.find((item) => item.org_id === input.org_id)
      : memberships[0];
    if (!selected) throw problem("No active organization membership", 403);
    db.prepare(
      "UPDATE users SET failed_attempts=0,locked_until=NULL,status='active',last_login_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(user.id);
    audit("login", { orgId: selected.org_id, userId: user.id, requestId: meta.requestId }, {});
    return createSession(user.id, selected.org_id, meta);
  }

  function createSession(userId, orgId, meta) {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(24).toString("base64url");
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    db.prepare("DELETE FROM sessions WHERE expires_at<=?").run(now());
    db.prepare(
      "INSERT INTO sessions(id,token_hash,user_id,org_id,csrf_hash,expires_at,ip_hash,user_agent_hash) VALUES(?,?,?,?,?,?,?,?)",
    ).run(
      id,
      digest(token),
      userId,
      orgId,
      digest(csrf),
      expiresAt,
      digest(meta.ip || "unknown"),
      digest(meta.userAgent || "unknown"),
    );
    return { token, csrf, expires_at: expiresAt, session: sessionById(id) };
  }

  function resolveSession(token) {
    if (!token) return null;
    const session = db
      .prepare(
        `SELECT s.*,u.email,u.name,m.role,o.name org_name,o.slug,o.database_path FROM sessions s JOIN users u ON u.id=s.user_id JOIN memberships m ON m.user_id=s.user_id AND m.org_id=s.org_id JOIN organizations o ON o.id=s.org_id WHERE s.token_hash=? AND s.expires_at>? AND u.status='active' AND o.status='active'`,
      )
      .get(digest(token), now());
    if (session)
      db.prepare("UPDATE sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=?").run(session.id);
    return session || null;
  }

  function verifyCsrf(session, token) {
    if (!session || !token) return false;
    return safeEqual(session.csrf_hash, digest(token));
  }

  function issueCsrf(sessionId) {
    const csrf = randomBytes(24).toString("base64url");
    db.prepare("UPDATE sessions SET csrf_hash=? WHERE id=?").run(digest(csrf), sessionId);
    return csrf;
  }

  function logout(sessionId) {
    db.prepare("DELETE FROM sessions WHERE id=?").run(sessionId);
  }

  async function invite(input, actor) {
    const email = emailSchema.parse(input.email);
    const role = z.enum(ROLES).parse(input.role);
    const password = passwordSchema.parse(input.temporary_password);
    const name = input.name
      ? z.string().trim().min(1).max(120).parse(input.name)
      : email.split("@")[0];
    let user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    if (!user) {
      const userId = randomUUID();
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 3,
        parallelism: 1,
      });
      db.prepare("INSERT INTO users(id,email,password_hash,name) VALUES(?,?,?,?)").run(
        userId,
        email,
        hash,
        name,
      );
      user = db.prepare("SELECT * FROM users WHERE id=?").get(userId);
    }
    db.prepare(
      "INSERT INTO memberships(user_id,org_id,role) VALUES(?,?,?) ON CONFLICT(user_id,org_id) DO UPDATE SET role=excluded.role",
    ).run(user.id, actor.org_id, role);
    audit(
      "membership_upserted",
      { orgId: actor.org_id, userId: actor.user_id, requestId: actor.request_id },
      { subject: user.id, role },
    );
    return { id: user.id, email, role };
  }

  async function resetPassword(userId, passwordValue, actor) {
    const password = passwordSchema.parse(passwordValue);
    const membership = db
      .prepare("SELECT 1 ok FROM memberships WHERE user_id=? AND org_id=?")
      .get(userId, actor.org_id);
    if (!membership) throw problem("User not found", 404);
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 3,
      parallelism: 1,
    });
    db.prepare(
      "UPDATE users SET password_hash=?,failed_attempts=0,locked_until=NULL,status='active' WHERE id=?",
    ).run(hash, userId);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(userId);
    audit(
      "password_reset_by_admin",
      { orgId: actor.org_id, userId: actor.user_id, requestId: actor.request_id },
      { subject: userId },
    );
    return { id: userId, password_reset: true, sessions_revoked: true };
  }

  function createOrganization(input, actor) {
    const name = orgSchema.parse(input.name);
    const orgId = randomUUID();
    const slug = uniqueSlug(name);
    const databasePath = join(tenantDir, `${orgId}.db`);
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO organizations(id,name,slug,database_path) VALUES(?,?,?,?)").run(
        orgId,
        name,
        slug,
        databasePath,
      );
      db.prepare("INSERT INTO memberships(user_id,org_id,role) VALUES(?,?, 'admin')").run(
        actor.user_id,
        orgId,
      );
      audit(
        "organization_created",
        { orgId, userId: actor.user_id, requestId: actor.request_id },
        { name, slug },
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { id: orgId, name, slug, database_path: databasePath };
  }

  function switchOrganization(session, orgId, meta = {}) {
    const membership = db
      .prepare(
        "SELECT 1 ok FROM memberships m JOIN organizations o ON o.id=m.org_id WHERE m.user_id=? AND m.org_id=? AND o.status='active'",
      )
      .get(session.user_id, orgId);
    if (!membership) throw problem("Organization membership not found", 403);
    logout(session.id);
    return createSession(session.user_id, orgId, meta);
  }

  function listMemberships(userId) {
    return db
      .prepare(
        "SELECT m.org_id,m.role,o.name,o.slug FROM memberships m JOIN organizations o ON o.id=m.org_id WHERE m.user_id=? AND o.status='active' ORDER BY o.name",
      )
      .all(userId);
  }

  function idempotencyLookup(orgId, route, key, requestHash) {
    const row = db
      .prepare("SELECT * FROM idempotency_keys WHERE org_id=? AND route=? AND key=?")
      .get(orgId, route, key);
    if (!row) return null;
    if (row.request_hash !== requestHash)
      throw problem("Idempotency key was reused with a different request", 409);
    return row.response_json
      ? { status: row.status_code, body: JSON.parse(row.response_json) }
      : null;
  }

  function idempotencyReserve(orgId, route, key, requestHash) {
    try {
      db.prepare("INSERT INTO idempotency_keys(org_id,route,key,request_hash) VALUES(?,?,?,?)").run(
        orgId,
        route,
        key,
        requestHash,
      );
      return true;
    } catch (error) {
      if (!String(error.message).includes("UNIQUE")) throw error;
      const existing = db
        .prepare("SELECT request_hash FROM idempotency_keys WHERE org_id=? AND route=? AND key=?")
        .get(orgId, route, key);
      if (existing?.request_hash !== requestHash)
        throw problem("Idempotency key was reused with a different request", 409);
      return false;
    }
  }

  function idempotencyComplete(orgId, route, key, statusCode, body) {
    db.prepare(
      "UPDATE idempotency_keys SET status_code=?,response_json=? WHERE org_id=? AND route=? AND key=?",
    ).run(statusCode, JSON.stringify(body), orgId, route, key);
  }

  function aiQuota(orgId, userId, monthlyLimit = 200) {
    const period = now().slice(0, 7);
    const used = db
      .prepare("SELECT COUNT(*) count FROM ai_usage WHERE org_id=? AND user_id=? AND period=?")
      .get(orgId, userId, period).count;
    if (used >= monthlyLimit) throw problem("Monthly AI draft quota exceeded", 429);
    return { period, used, remaining: monthlyLimit - used };
  }

  function logAiProposal(orgId, userId, proposal) {
    const id = randomUUID();
    db.prepare(
      "INSERT INTO ai_usage(id,org_id,user_id,period,proposal_json,rationale,confidence,provider,disposition) VALUES(?,?,?,?,?,?,?,?, 'pending')",
    ).run(
      id,
      orgId,
      userId,
      now().slice(0, 7),
      JSON.stringify(proposal),
      proposal.rationale || null,
      proposal.confidence || null,
      proposal.provider || null,
    );
    return id;
  }

  function decideAiProposal(id, orgId, disposition, journalId = null) {
    if (!["accepted", "edited", "rejected"].includes(disposition))
      throw problem("Invalid AI disposition");
    const result = db
      .prepare(
        "UPDATE ai_usage SET disposition=?,journal_id=?,decided_at=CURRENT_TIMESTAMP WHERE id=? AND org_id=? AND disposition='pending'",
      )
      .run(disposition, journalId, id, orgId);
    if (!result.changes) throw problem("Pending AI proposal not found", 404);
  }

  function aiHistory(orgId) {
    return db
      .prepare(
        "SELECT id,user_id,period,rationale,confidence,provider,disposition,journal_id,created_at,decided_at FROM ai_usage WHERE org_id=? ORDER BY created_at DESC LIMIT 500",
      )
      .all(orgId);
  }

  function createPrivacyRequest(orgId, userId, kind) {
    if (!["export", "delete"].includes(kind)) throw problem("Invalid privacy request kind");
    const id = randomUUID();
    db.prepare("INSERT INTO privacy_requests(id,org_id,requested_by,kind) VALUES(?,?,?,?)").run(
      id,
      orgId,
      userId,
      kind,
    );
    audit("privacy_request_created", { orgId, userId }, { id, kind });
    return db.prepare("SELECT * FROM privacy_requests WHERE id=?").get(id);
  }

  function privacyRequests(orgId) {
    return db
      .prepare("SELECT * FROM privacy_requests WHERE org_id=? ORDER BY created_at DESC")
      .all(orgId);
  }

  function databasePath(orgId) {
    const row = db
      .prepare("SELECT database_path FROM organizations WHERE id=? AND status='active'")
      .get(orgId);
    if (!row) throw problem("Organization not found", 404);
    return row.database_path;
  }

  function organizationBySlug(slug) {
    return (
      db
        .prepare(
          "SELECT id,name,slug,database_path FROM organizations WHERE slug=? AND status='active'",
        )
        .get(slug) || null
    );
  }

  function organizationById(id) {
    return (
      db
        .prepare(
          "SELECT id,name,slug,database_path FROM organizations WHERE id=? AND status='active'",
        )
        .get(id) || null
    );
  }

  function enqueueWebhookDelivery({
    provider,
    eventId,
    orgId,
    connectionId,
    payload,
    payloadHash,
  }) {
    if (!/^[a-f0-9]{64}$/.test(String(payloadHash || "")))
      throw problem("Invalid webhook payload hash");
    if (![provider, eventId, orgId, connectionId].every((value) => String(value || "").length > 0))
      throw problem("Webhook delivery identity is required");
    const id = randomUUID();
    const payloadJson = JSON.stringify(payload);
    const change = db
      .prepare(
        `INSERT OR IGNORE INTO webhook_deliveries(id,provider,event_id,org_id,connection_id,payload_json,payload_hash)
         VALUES(?,?,?,?,?,?,?)`,
      )
      .run(id, provider, eventId, orgId, connectionId, payloadJson, payloadHash);
    const row = db
      .prepare("SELECT * FROM webhook_deliveries WHERE provider=? AND event_id=?")
      .get(provider, eventId);
    if (
      !row ||
      row.org_id !== orgId ||
      row.connection_id !== connectionId ||
      row.payload_hash !== payloadHash
    )
      throw problem("Webhook event identifier was reused across a tenant or payload", 409);
    return { ...publicWebhookDelivery(row), duplicate: !change.changes };
  }

  function claimWebhookDelivery({ leaseSeconds = 60 } = {}) {
    const lease = Math.max(10, Math.min(3600, Number(leaseSeconds) || 60));
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        `UPDATE webhook_deliveries
         SET status='retry',locked_at=NULL,available_at=CURRENT_TIMESTAMP,last_error='Worker lease expired',updated_at=CURRENT_TIMESTAMP
         WHERE status='processing' AND locked_at<=datetime('now',?)`,
      ).run(`-${lease} seconds`);
      const candidate = db
        .prepare(
          `SELECT id FROM webhook_deliveries
           WHERE status IN ('pending','retry') AND available_at<=CURRENT_TIMESTAMP
           ORDER BY available_at,created_at LIMIT 1`,
        )
        .get();
      if (!candidate) {
        db.exec("COMMIT");
        return null;
      }
      db.prepare(
        `UPDATE webhook_deliveries
         SET status='processing',attempts=attempts+1,locked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND status IN ('pending','retry')`,
      ).run(candidate.id);
      const row = db.prepare("SELECT * FROM webhook_deliveries WHERE id=?").get(candidate.id);
      db.exec("COMMIT");
      return parseWebhookDelivery(row);
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function completeWebhookDelivery(id, result) {
    const change = db
      .prepare(
        `UPDATE webhook_deliveries
         SET status='completed',result_json=?,locked_at=NULL,last_error=NULL,updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND status='processing'`,
      )
      .run(JSON.stringify(result), id);
    if (!change.changes) throw problem("Processing webhook delivery not found", 409);
    return publicWebhookDelivery(db.prepare("SELECT * FROM webhook_deliveries WHERE id=?").get(id));
  }

  function failWebhookDelivery(id, errorMessage, { maxAttempts = 8 } = {}) {
    const delivery = db.prepare("SELECT * FROM webhook_deliveries WHERE id=?").get(id);
    if (!delivery || delivery.status !== "processing")
      throw problem("Processing webhook delivery not found", 409);
    const dead = delivery.attempts >= Math.max(1, Number(maxAttempts) || 8);
    const delay = Math.min(300, 2 ** Math.max(0, delivery.attempts - 1));
    db.prepare(
      `UPDATE webhook_deliveries
       SET status=?,available_at=datetime('now',?),locked_at=NULL,last_error=?,updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND status='processing'`,
    ).run(
      dead ? "dead_letter" : "retry",
      dead ? "+0 seconds" : `+${delay} seconds`,
      String(errorMessage || "Webhook processing failed").slice(0, 500),
      id,
    );
    return publicWebhookDelivery(db.prepare("SELECT * FROM webhook_deliveries WHERE id=?").get(id));
  }

  function webhookDelivery(id) {
    const row = db.prepare("SELECT * FROM webhook_deliveries WHERE id=?").get(id);
    return row ? parseWebhookDelivery(row) : null;
  }

  function retryWebhookDelivery(id) {
    const existing = db.prepare("SELECT * FROM webhook_deliveries WHERE id=?").get(id);
    if (!existing || existing.status !== "dead_letter")
      throw problem("Dead-letter webhook delivery not found", 404);
    db.prepare(
      `UPDATE webhook_deliveries
       SET status='retry',attempts=0,available_at=CURRENT_TIMESTAMP,locked_at=NULL,last_error=NULL,updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND status='dead_letter'`,
    ).run(id);
    audit(
      "webhook_delivery_retried",
      { orgId: existing.org_id },
      { id, provider: existing.provider, event_id: existing.event_id },
    );
    return publicWebhookDelivery(db.prepare("SELECT * FROM webhook_deliveries WHERE id=?").get(id));
  }

  function webhookQueueMetrics() {
    const counts = Object.fromEntries(
      db
        .prepare("SELECT status,COUNT(*) count FROM webhook_deliveries GROUP BY status")
        .all()
        .map((row) => [row.status, row.count]),
    );
    const oldest = db
      .prepare(
        `SELECT CAST((julianday('now')-julianday(MIN(created_at)))*86400 AS INTEGER) seconds
         FROM webhook_deliveries WHERE status IN ('pending','retry','processing')`,
      )
      .get().seconds;
    return { counts, oldest_unfinished_seconds: oldest || 0 };
  }

  function enqueueBackgroundJob({
    orgId,
    userId,
    kind,
    request,
    idempotencyKey,
    maxAttempts = 5,
    source = null,
  }) {
    if (!["report_export", "provider_sync", "import_stage", "import_apply"].includes(kind))
      throw problem("Unknown job kind");
    const requestJson = JSON.stringify(request);
    const requestHash = digest(requestJson);
    const key = String(idempotencyKey || randomUUID()).slice(0, 200);
    const id = randomUUID();
    const changes = db
      .prepare(
        `INSERT OR IGNORE INTO background_jobs(
           id,org_id,requested_by,kind,request_json,request_hash,idempotency_key,max_attempts,
           source_path,source_sha256,source_expires_at
         ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        orgId,
        userId,
        kind,
        requestJson,
        requestHash,
        key,
        Math.max(1, Math.min(20, maxAttempts)),
        source?.path || null,
        source?.sha256 || null,
        source?.expiresAt || null,
      );
    const row = db
      .prepare("SELECT * FROM background_jobs WHERE org_id=? AND kind=? AND idempotency_key=?")
      .get(orgId, kind, key);
    if (!row || row.request_hash !== requestHash)
      throw problem("Job idempotency key was reused with a different request", 409);
    if (changes.changes)
      audit("background_job_enqueued", { orgId, userId }, { id, kind, idempotency_key: key });
    return { ...publicBackgroundJob(row), duplicate: !changes.changes };
  }

  function backgroundJobs(orgId, { status = null, kind = null, limit = 100 } = {}) {
    return db
      .prepare(
        `SELECT * FROM background_jobs
         WHERE org_id=? AND (? IS NULL OR status=?) AND (? IS NULL OR kind=?)
         ORDER BY created_at DESC LIMIT ?`,
      )
      .all(orgId, status, status, kind, kind, Math.max(1, Math.min(200, Number(limit) || 100)))
      .map(publicBackgroundJob);
  }

  function backgroundJob(id, orgId, { internal = false } = {}) {
    const row = db.prepare("SELECT * FROM background_jobs WHERE id=? AND org_id=?").get(id, orgId);
    if (!row) return null;
    return internal ? parseBackgroundJob(row) : publicBackgroundJob(row);
  }

  function claimBackgroundJob({ leaseSeconds = 120 } = {}) {
    const lease = Math.max(10, Math.min(3600, Number(leaseSeconds) || 120));
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        `UPDATE background_jobs SET status='retry',locked_at=NULL,available_at=CURRENT_TIMESTAMP,
         last_error='Worker lease expired',updated_at=CURRENT_TIMESTAMP
         WHERE status='processing' AND locked_at<=datetime('now',?)`,
      ).run(`-${lease} seconds`);
      const candidate = db
        .prepare(
          `SELECT id FROM background_jobs WHERE status IN ('queued','retry') AND available_at<=CURRENT_TIMESTAMP
           ORDER BY available_at,created_at LIMIT 1`,
        )
        .get();
      if (!candidate) {
        db.exec("COMMIT");
        return null;
      }
      db.prepare(
        `UPDATE background_jobs SET status='processing',attempts=attempts+1,locked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND status IN ('queued','retry')`,
      ).run(candidate.id);
      const row = db.prepare("SELECT * FROM background_jobs WHERE id=?").get(candidate.id);
      db.exec("COMMIT");
      return parseBackgroundJob(row);
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function completeBackgroundJob(id, { result = null, artifact = null } = {}) {
    const change = db
      .prepare(
        `UPDATE background_jobs SET status='completed',result_json=?,artifact_path=?,artifact_content_type=?,artifact_filename=?,artifact_expires_at=?,
         locked_at=NULL,last_error=NULL,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND status='processing'`,
      )
      .run(
        result === null ? null : JSON.stringify(result),
        artifact?.path || null,
        artifact?.contentType || null,
        artifact?.filename || null,
        artifact?.expiresAt || null,
        id,
      );
    if (!change.changes) throw problem("Processing background job not found", 409);
    return publicBackgroundJob(db.prepare("SELECT * FROM background_jobs WHERE id=?").get(id));
  }

  function failBackgroundJob(id, errorMessage) {
    const job = db.prepare("SELECT * FROM background_jobs WHERE id=?").get(id);
    if (!job || job.status !== "processing")
      throw problem("Processing background job not found", 409);
    const dead = job.attempts >= job.max_attempts;
    const delay = Math.min(300, 2 ** Math.max(0, job.attempts - 1));
    db.prepare(
      `UPDATE background_jobs SET status=?,available_at=datetime('now',?),locked_at=NULL,last_error=?,updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND status='processing'`,
    ).run(
      dead ? "dead_letter" : "retry",
      dead ? "+0 seconds" : `+${delay} seconds`,
      String(errorMessage || "Background job failed").slice(0, 500),
      id,
    );
    return publicBackgroundJob(db.prepare("SELECT * FROM background_jobs WHERE id=?").get(id));
  }

  function cancelBackgroundJob(id, orgId, userId) {
    const change = db
      .prepare(
        `UPDATE background_jobs SET status='cancelled',updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND org_id=? AND status IN ('queued','retry')`,
      )
      .run(id, orgId);
    if (!change.changes) throw problem("Queued background job not found", 409);
    audit("background_job_cancelled", { orgId, userId }, { id });
    return publicBackgroundJob(db.prepare("SELECT * FROM background_jobs WHERE id=?").get(id));
  }

  function retryBackgroundJob(id, orgId, userId) {
    const existing = db
      .prepare("SELECT kind,source_path FROM background_jobs WHERE id=? AND org_id=?")
      .get(id, orgId);
    if (existing?.kind === "import_stage" && !existing.source_path)
      throw problem("Import source is no longer available; submit the file again", 409);
    const change = db
      .prepare(
        `UPDATE background_jobs SET status='retry',attempts=0,available_at=CURRENT_TIMESTAMP,locked_at=NULL,last_error=NULL,updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND org_id=? AND status='dead_letter'`,
      )
      .run(id, orgId);
    if (!change.changes) throw problem("Dead-letter background job not found", 404);
    audit("background_job_retried", { orgId, userId }, { id });
    return publicBackgroundJob(db.prepare("SELECT * FROM background_jobs WHERE id=?").get(id));
  }

  function backgroundJobMetrics() {
    const counts = Object.fromEntries(
      db
        .prepare("SELECT status,COUNT(*) count FROM background_jobs GROUP BY status")
        .all()
        .map((row) => [row.status, row.count]),
    );
    const oldest = db
      .prepare(
        `SELECT CAST((julianday('now')-julianday(MIN(created_at)))*86400 AS INTEGER) seconds
         FROM background_jobs WHERE status IN ('queued','retry','processing')`,
      )
      .get().seconds;
    return { counts, oldest_unfinished_seconds: oldest || 0 };
  }

  function expiredBackgroundJobArtifacts(limit = 100) {
    return db
      .prepare(
        `SELECT id,org_id,artifact_path FROM background_jobs
         WHERE artifact_path IS NOT NULL AND artifact_deleted_at IS NULL
           AND artifact_expires_at IS NOT NULL AND artifact_expires_at<=CURRENT_TIMESTAMP
         ORDER BY artifact_expires_at,id LIMIT ?`,
      )
      .all(Math.max(1, Math.min(1000, Number(limit) || 100)));
  }

  function markBackgroundJobArtifactDeleted(id) {
    const row = db
      .prepare("SELECT id,org_id,artifact_path FROM background_jobs WHERE id=?")
      .get(id);
    if (!row?.artifact_path) return false;
    const change = db
      .prepare(
        `UPDATE background_jobs SET artifact_path=NULL,artifact_content_type=NULL,artifact_filename=NULL,
         artifact_deleted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
         WHERE id=? AND artifact_path IS NOT NULL AND artifact_expires_at<=CURRENT_TIMESTAMP`,
      )
      .run(id);
    if (change.changes) audit("background_job_artifact_deleted", { orgId: row.org_id }, { id });
    return Boolean(change.changes);
  }

  function backgroundJobSourcesForCleanup(limit = 100) {
    return db
      .prepare(
        `SELECT id,org_id,status,source_path FROM background_jobs
         WHERE source_path IS NOT NULL AND source_deleted_at IS NULL
           AND (status IN ('completed','dead_letter','cancelled')
             OR (status IN ('queued','retry') AND source_expires_at<=CURRENT_TIMESTAMP))
         ORDER BY source_expires_at,id LIMIT ?`,
      )
      .all(Math.max(1, Math.min(1000, Number(limit) || 100)));
  }

  function markBackgroundJobSourceDeleted(id, { expired = false } = {}) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const row = db
        .prepare("SELECT id,org_id,status,source_path FROM background_jobs WHERE id=?")
        .get(id);
      if (!row?.source_path) {
        db.exec("COMMIT");
        return false;
      }
      if (expired && ["queued", "retry"].includes(row.status))
        db.prepare(
          `UPDATE background_jobs SET status='dead_letter',last_error='Import source expired before processing',
           locked_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('queued','retry')`,
        ).run(id);
      const change = db
        .prepare(
          `UPDATE background_jobs SET source_path=NULL,source_sha256=NULL,source_deleted_at=CURRENT_TIMESTAMP,
           updated_at=CURRENT_TIMESTAMP WHERE id=? AND source_path IS NOT NULL`,
        )
        .run(id);
      if (change.changes)
        audit("background_job_source_deleted", { orgId: row.org_id }, { id, expired });
      db.exec("COMMIT");
      return Boolean(change.changes);
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function knownBackgroundJobSourcePaths() {
    return db
      .prepare("SELECT source_path FROM background_jobs WHERE source_path IS NOT NULL")
      .all()
      .map(({ source_path: path }) => path);
  }

  function recordOrphanedBackgroundJobSourceDeletion(orgId, filenameHash) {
    if (!db.prepare("SELECT 1 FROM organizations WHERE id=?").get(orgId)) return false;
    audit("background_job_orphan_source_deleted", { orgId }, { filename_hash: filenameHash });
    return true;
  }

  function webhookLookup(provider, eventId, orgId, payloadHash) {
    const row = db
      .prepare("SELECT * FROM webhook_events WHERE provider=? AND event_id=?")
      .get(provider, eventId);
    if (row && (row.org_id !== orgId || row.payload_hash !== payloadHash))
      throw problem("Webhook event identifier was reused across a tenant or payload", 409);
    return row ? { ...row, result: row.result_json ? JSON.parse(row.result_json) : null } : null;
  }

  function webhookRecord(provider, eventId, orgId, payloadHash, status, result) {
    const change = db
      .prepare(
        `INSERT INTO webhook_events(provider,event_id,org_id,payload_hash,status,result_json)
         VALUES(?,?,?,?,?,?)
         ON CONFLICT(provider,event_id) DO UPDATE SET status=excluded.status,result_json=excluded.result_json
         WHERE webhook_events.org_id=excluded.org_id AND webhook_events.payload_hash=excluded.payload_hash`,
      )
      .run(provider, eventId, orgId, payloadHash, status, JSON.stringify(result));
    if (!change.changes)
      throw problem("Webhook event identifier was reused across a tenant or payload", 409);
  }

  function sessionById(id) {
    return db
      .prepare(
        `SELECT s.*,u.email,u.name,m.role,o.name org_name,o.slug,o.database_path FROM sessions s JOIN users u ON u.id=s.user_id JOIN memberships m ON m.user_id=s.user_id AND m.org_id=s.org_id JOIN organizations o ON o.id=s.org_id WHERE s.id=?`,
      )
      .get(id);
  }

  function enforceLoginRate(email, ipHash) {
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const byIdentity = db
      .prepare(
        "SELECT COUNT(*) count FROM login_attempts WHERE email=? AND ip_hash=? AND succeeded=0 AND attempted_at>=?",
      )
      .get(email, ipHash, since).count;
    const byIp = db
      .prepare(
        "SELECT COUNT(*) count FROM login_attempts WHERE ip_hash=? AND succeeded=0 AND attempted_at>=?",
      )
      .get(ipHash, since).count;
    if (byIdentity >= 5 || byIp >= 20)
      throw problem("Too many login attempts; try again later", 429);
  }

  function uniqueSlug(name) {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "organization";
    let slug = base;
    while (db.prepare("SELECT 1 FROM organizations WHERE slug=?").get(slug))
      slug = `${base}-${randomBytes(3).toString("hex")}`;
    return slug;
  }

  function audit(action, context, payload) {
    db.prepare(
      "INSERT INTO platform_audit(org_id,user_id,action,request_id,payload) VALUES(?,?,?,?,?)",
    ).run(
      context.orgId || null,
      context.userId || null,
      action,
      context.requestId || null,
      JSON.stringify(payload),
    );
  }

  return {
    db,
    status,
    setup,
    login,
    resolveSession,
    verifyCsrf,
    issueCsrf,
    logout,
    invite,
    resetPassword,
    createOrganization,
    switchOrganization,
    listMemberships,
    idempotencyLookup,
    idempotencyReserve,
    idempotencyComplete,
    aiQuota,
    logAiProposal,
    decideAiProposal,
    aiHistory,
    createPrivacyRequest,
    privacyRequests,
    databasePath,
    organizationBySlug,
    organizationById,
    webhookLookup,
    webhookRecord,
    enqueueWebhookDelivery,
    claimWebhookDelivery,
    completeWebhookDelivery,
    failWebhookDelivery,
    webhookDelivery,
    retryWebhookDelivery,
    webhookQueueMetrics,
    enqueueBackgroundJob,
    backgroundJobs,
    backgroundJob,
    claimBackgroundJob,
    completeBackgroundJob,
    failBackgroundJob,
    cancelBackgroundJob,
    retryBackgroundJob,
    backgroundJobMetrics,
    expiredBackgroundJobArtifacts,
    markBackgroundJobArtifactDeleted,
    backgroundJobSourcesForCleanup,
    markBackgroundJobSourceDeleted,
    knownBackgroundJobSourcePaths,
    recordOrphanedBackgroundJobSourceDeletion,
    audit,
    close: () => db.close(),
  };
}

function parseWebhookDelivery(row) {
  return {
    ...publicWebhookDelivery(row),
    payload: JSON.parse(row.payload_json),
    result: row.result_json ? JSON.parse(row.result_json) : null,
  };
}

function publicWebhookDelivery(row) {
  const safe = { ...row };
  delete safe.payload_json;
  delete safe.result_json;
  return safe;
}

function parseBackgroundJob(row) {
  return {
    ...publicBackgroundJob(row),
    request: JSON.parse(row.request_json),
    result: row.result_json ? JSON.parse(row.result_json) : null,
    artifact_path: row.artifact_path,
    source_path: row.source_path,
    source_sha256: row.source_sha256,
  };
}

function publicBackgroundJob(row) {
  const safe = { ...row };
  delete safe.request_json;
  delete safe.result_json;
  delete safe.request_hash;
  delete safe.artifact_path;
  delete safe.source_path;
  delete safe.source_sha256;
  delete safe.idempotency_key;
  safe.has_artifact = Boolean(row.artifact_path);
  safe.result = row.result_json ? JSON.parse(row.result_json) : null;
  return safe;
}

export function migratePlatform(db, direction = "up", target = null) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  const status = platformMigrationStatus(db, target);
  if (!status.valid) throw problem(`Invalid migration history: ${status.issues.join("; ")}`, 500);
  if (direction === "down") {
    const applied = status.applied.at(-1);
    if (!applied) return [];
    const migration = PLATFORM_MIGRATIONS.find((item) => item.version === applied);
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(migration.down);
      db.prepare("DELETE FROM schema_migrations WHERE version=?").run(migration.version);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return [migration.version];
  }
  if (direction !== "up") throw problem(`Invalid migration direction: ${direction}`);
  if (status.applied.some((version) => version > status.target))
    throw problem("Target is below the applied schema; use an explicit down migration", 409);
  const applied = new Set(status.applied);
  const completed = [];
  for (const migration of PLATFORM_MIGRATIONS) {
    if (applied.has(migration.version) || migration.version > status.target) continue;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(migration.up);
      db.prepare("INSERT INTO schema_migrations(version,name) VALUES(?,?)").run(
        migration.version,
        migration.name,
      );
      db.exec("COMMIT");
      completed.push(migration.version);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return completed;
}

export function platformMigrationStatus(db, target = null) {
  const latest = PLATFORM_MIGRATIONS.at(-1)?.version || 0;
  const normalizedTarget = target === null ? latest : Number(target);
  if (
    !Number.isSafeInteger(normalizedTarget) ||
    normalizedTarget < 0 ||
    (normalizedTarget !== 0 &&
      !PLATFORM_MIGRATIONS.some(({ version }) => version === normalizedTarget))
  )
    throw problem(`Unsupported migration target: ${target}`);
  const hasTable = db
    .prepare("SELECT 1 present FROM sqlite_master WHERE type='table' AND name='schema_migrations'")
    .get();
  const rows = hasTable
    ? db.prepare("SELECT version,name FROM schema_migrations ORDER BY version").all()
    : [];
  const issues = [];
  for (const row of rows) {
    const expected = PLATFORM_MIGRATIONS.find(({ version }) => version === row.version);
    if (!expected) issues.push(`unknown applied version ${row.version}`);
    else if (row.name !== expected.name)
      issues.push(`version ${row.version} name mismatch (${row.name} != ${expected.name})`);
  }
  const applied = rows.map(({ version }) => version);
  const knownApplied = applied.filter((version) => version <= latest);
  const expectedPrefix = PLATFORM_MIGRATIONS.slice(0, knownApplied.length).map(
    ({ version }) => version,
  );
  if (knownApplied.some((version, index) => version !== expectedPrefix[index]))
    issues.push("applied versions are not a contiguous migration prefix");
  return {
    valid: issues.length === 0,
    issues,
    applied,
    pending: PLATFORM_MIGRATIONS.filter(
      ({ version }) => version <= normalizedTarget && !applied.includes(version),
    ).map(({ version }) => version),
    target: normalizedTarget,
    latest,
  };
}

export function permissionsFor(role) {
  const common = ["read"];
  if (role === "read_only") return common;
  if (role === "bookkeeper") return [...common, "draft", "operate"];
  if (role === "approver") return [...common, "draft", "operate", "post", "close"];
  if (role === "admin") return [...common, "draft", "operate", "post", "close", "admin"];
  return [];
}

export function digest(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}
function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function now() {
  return new Date().toISOString();
}
function problem(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
