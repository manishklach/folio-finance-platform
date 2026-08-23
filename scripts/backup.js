import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createBackup } from "../lib/backup.js";

const key = backupKey();
if (process.env.NODE_ENV === "production" && !process.env.BACKUP_ENCRYPTION_KEY_FILE)
  throw new Error("Production backups require BACKUP_ENCRYPTION_KEY_FILE");
if (process.env.NODE_ENV === "production" && !process.env.BACKUP_KEY_ID)
  throw new Error("Production backups require BACKUP_KEY_ID");
const result = createBackup({
  platformPath: resolve(process.env.PLATFORM_DB_PATH || "data/platform.db"),
  backupRoot: resolve(process.env.BACKUP_DIR || "backups"),
  attachmentRoot: resolve(process.env.ATTACHMENT_DIR || "data/attachments"),
  encryptionKey: key,
  keyId: key ? process.env.BACKUP_KEY_ID || "development-key" : null,
});
process.stdout.write(`${JSON.stringify(result)}\n`);

function backupKey() {
  if (process.env.BACKUP_ENCRYPTION_KEY_FILE)
    return readFileSync(resolve(process.env.BACKUP_ENCRYPTION_KEY_FILE), "utf8").trim();
  return process.env.BACKUP_ENCRYPTION_KEY || null;
}
