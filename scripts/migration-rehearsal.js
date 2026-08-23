import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { migratePlatform, platformMigrationStatus } from "../lib/platform.js";

const path = join(tmpdir(), `folio-migration-rehearsal-${randomUUID()}.db`);
const volume = Math.max(1, Number(process.env.MIGRATION_REHEARSAL_USERS || 1000));
const db = new DatabaseSync(path);

try {
  db.exec("PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;");
  assert.deepEqual(migratePlatform(db, "up", 1), [1]);
  const organizationId = randomUUID();
  db.prepare("INSERT INTO organizations(id,name,slug,database_path) VALUES(?,?,?,?)").run(
    organizationId,
    "Migration Rehearsal",
    "migration-rehearsal",
    "/var/lib/folio/tenants/migration-rehearsal.db",
  );
  const insertUser = db.prepare("INSERT INTO users(id,email,password_hash) VALUES(?,?,?)");
  const insertMembership = db.prepare(
    "INSERT INTO memberships(user_id,org_id,role) VALUES(?,?,'read_only')",
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    for (let index = 0; index < volume; index += 1) {
      const userId = randomUUID();
      insertUser.run(userId, `migration-${index}@example.test`, "rehearsal-only-hash");
      insertMembership.run(userId, organizationId);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  assert.deepEqual(migratePlatform(db), [2, 3, 4]);
  assert.equal(db.prepare("SELECT COUNT(*) count FROM users WHERE name='' ").get().count, 0);
  assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  assert.deepEqual(migratePlatform(db, "down"), [4]);
  assert.deepEqual(migratePlatform(db), [4]);
  const status = platformMigrationStatus(db);
  assert.equal(status.valid, true);
  assert.deepEqual(status.pending, []);
  process.stdout.write(
    `${JSON.stringify({ database: "temporary", oldest_supported: 1, target: status.latest, rows: volume, rollback_reapplied: 4, integrity: "ok" })}\n`,
  );
} finally {
  db.close();
  rmSync(path, { force: true });
  rmSync(`${path}-shm`, { force: true });
  rmSync(`${path}-wal`, { force: true });
}
