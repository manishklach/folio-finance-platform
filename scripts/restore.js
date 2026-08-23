import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { restoreBackup } from "../lib/backup.js";

const sourceArg = process.argv.find((value) => value.startsWith("--source="));
const targetArg = process.argv.find((value) => value.startsWith("--target="));
if (!sourceArg || !targetArg)
  throw new Error("Usage: npm run restore -- --source=/backup/path --target=/empty/restore/path");
if (process.env.NODE_ENV === "production" && !process.env.BACKUP_ENCRYPTION_KEY_FILE)
  throw new Error("Production restores require BACKUP_ENCRYPTION_KEY_FILE");
const result = restoreBackup({
  source: resolve(sourceArg.slice("--source=".length)),
  target: resolve(targetArg.slice("--target=".length)),
  encryptionKey: backupKey(),
});
process.stdout.write(`${JSON.stringify(result)}\n`);

function backupKey() {
  if (process.env.BACKUP_ENCRYPTION_KEY_FILE)
    return readFileSync(resolve(process.env.BACKUP_ENCRYPTION_KEY_FILE), "utf8").trim();
  return process.env.BACKUP_ENCRYPTION_KEY || null;
}
