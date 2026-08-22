import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const [, , action, orgId, argument] = process.argv;
const platformPath = resolve(process.env.PLATFORM_DB_PATH || "data/platform.db");
const tenantRoot = resolve(process.env.TENANT_DB_DIR || "data/tenants");
if (!["export", "delete"].includes(action) || !orgId)
  throw new Error(
    "Usage: node scripts/privacy.js export <org-id> <output.json> | delete <org-id> --confirm=<slug>",
  );
const platform = new DatabaseSync(platformPath);
platform.exec("PRAGMA foreign_keys=ON");
const org = platform.prepare("SELECT * FROM organizations WHERE id=?").get(orgId);
if (!org) throw new Error("Organization not found");
const tenantPath = resolve(org.database_path);
if (relative(tenantRoot, tenantPath).startsWith(".."))
  throw new Error("Tenant database is outside TENANT_DB_DIR");

function exportData(destination) {
  const tenant = new DatabaseSync(tenantPath, { readOnly: true });
  const tables = tenant
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all();
  const data = Object.fromEntries(
    tables.map(({ name }) => [name, tenant.prepare(`SELECT * FROM "${name}"`).all()]),
  );
  tenant.close();
  const payload = {
    exported_at: new Date().toISOString(),
    organization: { id: org.id, name: org.name, slug: org.slug },
    data,
  };
  const body = JSON.stringify(payload, null, 2);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, body, { flag: "wx", mode: 0o600 });
  return createHash("sha256").update(body).digest("hex");
}

if (action === "export") {
  if (!argument) throw new Error("Export destination is required");
  const destination = resolve(argument);
  const checksum = exportData(destination);
  process.stdout.write(
    `${JSON.stringify({ organization_id: org.id, destination, sha256: checksum })}\n`,
  );
} else {
  if (argument !== `--confirm=${org.slug}`)
    throw new Error(`Deletion requires --confirm=${org.slug}`);
  platform.exec("BEGIN IMMEDIATE");
  try {
    platform.prepare("DELETE FROM sessions WHERE org_id=?").run(org.id);
    platform.prepare("DELETE FROM memberships WHERE org_id=?").run(org.id);
    platform.prepare("UPDATE organizations SET status='deleted' WHERE id=?").run(org.id);
    platform.exec("COMMIT");
  } catch (error) {
    platform.exec("ROLLBACK");
    throw error;
  }
  for (const path of [tenantPath, `${tenantPath}-wal`, `${tenantPath}-shm`]) {
    try {
      readFileSync(path);
      unlinkSync(path);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  process.stdout.write(
    `${JSON.stringify({ organization_id: org.id, status: "deleted", recoverable: false })}\n`,
  );
}
platform.close();
