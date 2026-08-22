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
    const slug = uniqueSlug(name);
    const databasePath = join(tenantDir, `${orgId}.db`);
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 3,
      parallelism: 1,
    });
    db.exec("BEGIN IMMEDIATE");
    try {
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
    const valid =
      user &&
      user.status !== "disabled" &&
      (!user.locked_until || user.locked_until <= now()) &&
      (await argon2.verify(user.password_hash, String(input.password || "")));
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

  function webhookLookup(provider, eventId) {
    const row = db
      .prepare("SELECT * FROM webhook_events WHERE provider=? AND event_id=?")
      .get(provider, eventId);
    return row ? { ...row, result: row.result_json ? JSON.parse(row.result_json) : null } : null;
  }

  function webhookRecord(provider, eventId, orgId, payloadHash, status, result) {
    db.prepare(
      "INSERT INTO webhook_events(provider,event_id,org_id,payload_hash,status,result_json) VALUES(?,?,?,?,?,?)",
    ).run(provider, eventId, orgId, payloadHash, status, JSON.stringify(result));
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
    webhookLookup,
    webhookRecord,
    audit,
    close: () => db.close(),
  };
}

export function migratePlatform(db, direction = "up", target = null) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  if (direction === "down") {
    const applied = db
      .prepare("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1")
      .get();
    if (!applied) return [];
    const migration = PLATFORM_MIGRATIONS.find((item) => item.version === applied.version);
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
  const applied = new Set(
    db
      .prepare("SELECT version FROM schema_migrations")
      .all()
      .map((row) => row.version),
  );
  const completed = [];
  for (const migration of PLATFORM_MIGRATIONS) {
    if (applied.has(migration.version) || (target && migration.version > target)) continue;
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
