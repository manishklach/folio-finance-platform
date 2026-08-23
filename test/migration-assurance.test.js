import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { migratePlatform, platformMigrationStatus } from "../lib/platform.js";

test("platform migration history rejects unknown, renamed, and noncontiguous versions", () => {
  const db = new DatabaseSync(":memory:");
  migratePlatform(db, "up", 1);
  db.prepare("UPDATE schema_migrations SET name='tampered' WHERE version=1").run();
  assert.equal(platformMigrationStatus(db).valid, false);
  assert.throws(() => migratePlatform(db), /name mismatch/);
  db.prepare("UPDATE schema_migrations SET name='identity_and_tenants' WHERE version=1").run();
  db.prepare("INSERT INTO schema_migrations(version,name) VALUES(99,'unrecognized')").run();
  assert.throws(() => migratePlatform(db), /unknown applied version 99/);
  db.close();
});

test("oldest supported platform schema upgrades, rolls back, and re-upgrades with data", () => {
  const db = new DatabaseSync(":memory:");
  assert.deepEqual(migratePlatform(db, "up", 1), [1]);
  const orgId = randomUUID();
  const userId = randomUUID();
  db.prepare("INSERT INTO organizations(id,name,slug,database_path) VALUES(?,?,?,?)").run(
    orgId,
    "Oldest Schema",
    "oldest-schema",
    "/tmp/oldest-schema.db",
  );
  db.prepare("INSERT INTO users(id,email,password_hash) VALUES(?,?,?)").run(
    userId,
    "controller@example.test",
    "test-hash",
  );
  db.prepare("INSERT INTO memberships(user_id,org_id,role) VALUES(?,?,'admin')").run(userId, orgId);

  assert.deepEqual(migratePlatform(db), [2, 3, 4, 5, 6, 7]);
  assert.equal(db.prepare("SELECT name FROM users WHERE id=?").get(userId).name, "controller");
  assert.deepEqual(migratePlatform(db, "down"), [7]);
  assert.equal(
    db
      .prepare("PRAGMA table_info(background_jobs)")
      .all()
      .some(({ name }) => name === "source_path"),
    false,
  );
  assert.deepEqual(migratePlatform(db, "down"), [6]);
  assert.equal(
    db
      .prepare("PRAGMA table_info(background_jobs)")
      .all()
      .some(({ name }) => name === "artifact_expires_at"),
    false,
  );
  assert.deepEqual(migratePlatform(db, "down"), [5]);
  assert.equal(
    db
      .prepare("SELECT 1 present FROM sqlite_master WHERE type='table' AND name='background_jobs'")
      .get(),
    undefined,
  );
  assert.deepEqual(migratePlatform(db, "down"), [4]);
  assert.equal(
    db
      .prepare(
        "SELECT 1 present FROM sqlite_master WHERE type='table' AND name='webhook_deliveries'",
      )
      .get(),
    undefined,
  );
  assert.deepEqual(migratePlatform(db, "down"), [3]);
  assert.equal(
    db
      .prepare("PRAGMA table_info(users)")
      .all()
      .some(({ name }) => name === "name"),
    false,
  );
  assert.deepEqual(migratePlatform(db), [3, 4, 5, 6, 7]);
  assert.equal(
    db.prepare("SELECT email FROM users WHERE id=?").get(userId).email,
    "controller@example.test",
  );
  assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  db.close();
});

test("failed platform migration is atomic and can be resumed", () => {
  const db = new DatabaseSync(":memory:");
  migratePlatform(db, "up", 2);
  const orgId = randomUUID();
  const userId = randomUUID();
  db.prepare("INSERT INTO organizations(id,name,slug,database_path) VALUES(?,?,?,?)").run(
    orgId,
    "Interrupted Migration",
    "interrupted-migration",
    "/tmp/interrupted.db",
  );
  db.prepare("INSERT INTO users(id,email,password_hash) VALUES(?,?,?)").run(
    userId,
    "interrupted@example.test",
    "test-hash",
  );
  db.exec(
    "CREATE TRIGGER simulate_migration_interruption BEFORE UPDATE ON users BEGIN SELECT RAISE(ABORT,'simulated interruption'); END",
  );
  assert.throws(() => migratePlatform(db), /simulated interruption/);
  assert.deepEqual(platformMigrationStatus(db).pending, [3, 4, 5, 6, 7]);
  assert.equal(
    db
      .prepare("PRAGMA table_info(users)")
      .all()
      .some(({ name }) => name === "name"),
    false,
  );
  db.exec("DROP TRIGGER simulate_migration_interruption");
  assert.deepEqual(migratePlatform(db), [3, 4, 5, 6, 7]);
  assert.equal(db.prepare("SELECT name FROM users WHERE id=?").get(userId).name, "interrupted");
  db.close();
});

test("platform rollback refuses to discard durable import jobs", () => {
  const db = new DatabaseSync(":memory:");
  migratePlatform(db);
  const orgId = randomUUID();
  const userId = randomUUID();
  db.prepare("INSERT INTO organizations(id,name,slug,database_path) VALUES(?,?,?,?)").run(
    orgId,
    "Rollback Guard",
    "rollback-guard",
    "/tmp/rollback-guard.db",
  );
  db.prepare("INSERT INTO users(id,email,password_hash,name) VALUES(?,?,?,?)").run(
    userId,
    "rollback@example.test",
    "test-hash",
    "Rollback",
  );
  db.prepare("INSERT INTO memberships(user_id,org_id,role) VALUES(?,?,'admin')").run(userId, orgId);
  db.prepare(
    `INSERT INTO background_jobs(
      id,org_id,requested_by,kind,request_json,request_hash,idempotency_key
    ) VALUES(?,?,?,?,?,?,?)`,
  ).run(randomUUID(), orgId, userId, "import_apply", "{}", "hash", "rollback-guard");
  assert.throws(() => migratePlatform(db, "down"), /CHECK constraint failed/);
  const status = platformMigrationStatus(db);
  assert.equal(status.valid, true);
  assert.equal(status.applied.at(-1), 7);
  assert.equal(db.prepare("SELECT COUNT(*) count FROM background_jobs").get().count, 1);
  db.close();
});
