import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const platformPath = resolve(process.env.PLATFORM_DB_PATH || "data/platform.db");
const backupRoot = resolve(process.env.BACKUP_DIR || "backups");
const stamp = new Date().toISOString().replaceAll(":", "-");
const destination = join(backupRoot, stamp);
mkdirSync(destination, { recursive: true });

const control = new DatabaseSync(platformPath);
control.exec("PRAGMA wal_checkpoint(TRUNCATE)");
const tenantPaths = control
  .prepare("SELECT id,database_path FROM organizations WHERE status='active'")
  .all();
control.close();

const files = [{ kind: "platform", org_id: null, path: platformPath }];
for (const tenant of tenantPaths) {
  const database = new DatabaseSync(tenant.database_path);
  database.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  database.close();
  files.push({ kind: "tenant", org_id: tenant.id, path: tenant.database_path });
}

const manifest = { created_at: new Date().toISOString(), files: [] };
for (const [index, file] of files.entries()) {
  const targetName = `${index}-${file.kind}-${basename(file.path)}`;
  const target = join(destination, targetName);
  copyFileSync(file.path, target);
  const sha256 = createHash("sha256").update(readFileSync(target)).digest("hex");
  manifest.files.push({
    kind: file.kind,
    org_id: file.org_id,
    source: file.path,
    backup: targetName,
    sha256,
  });
}
writeFileSync(join(destination, "manifest.json"), JSON.stringify(manifest, null, 2));
process.stdout.write(
  `${JSON.stringify({ backup: destination, databases: manifest.files.length })}\n`,
);
