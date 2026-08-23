import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function createBackup({
  platformPath,
  backupRoot,
  attachmentRoot = null,
  encryptionKey = null,
  keyId = null,
  now = new Date(),
}) {
  const platform = resolve(platformPath);
  if (!existsSync(platform)) throw new Error("Platform database was not found");
  const root = resolve(backupRoot);
  const stamp = now.toISOString().replaceAll(":", "-");
  const destination = join(root, `${stamp}-${randomUUID().slice(0, 8)}`);
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  const key = encryptionKey ? normalizeKey(encryptionKey) : null;
  if (key && !keyId) throw new Error("Encrypted backups require a non-secret key identifier");

  const control = new DatabaseSync(platform);
  control.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  const tenants = control
    .prepare("SELECT id,database_path FROM organizations WHERE status='active' ORDER BY id")
    .all();
  control.close();
  const sources = [{ kind: "platform", org_id: null, path: platform }];
  for (const tenant of tenants) {
    safeSegment(tenant.id, "organization id");
    if (!existsSync(tenant.database_path))
      throw new Error(`Tenant database was not found for organization ${tenant.id}`);
    const database = new DatabaseSync(tenant.database_path);
    database.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    database.close();
    sources.push({ kind: "tenant", org_id: tenant.id, path: resolve(tenant.database_path) });
  }
  if (attachmentRoot && existsSync(resolve(attachmentRoot)))
    for (const attachment of walkFiles(resolve(attachmentRoot)))
      sources.push({
        kind: "attachment",
        org_id: null,
        path: attachment.path,
        relative_path: attachment.relative,
      });

  const manifest = {
    schema_version: 2,
    backup_id: randomUUID(),
    created_at: now.toISOString(),
    encryption: key
      ? { algorithm: "AES-256-GCM", key_id: keyId }
      : { algorithm: "none", key_id: null },
    files: [],
  };
  for (const [index, source] of sources.entries()) {
    const plaintext = readFileSync(source.path);
    const stored = key ? encrypt(plaintext, key) : { payload: plaintext, iv: null, auth_tag: null };
    const name = `${index}-${source.kind}-${basename(source.path)}${key ? ".enc" : ""}`;
    writeFileSync(join(destination, name), stored.payload, { flag: "wx", mode: 0o600 });
    manifest.files.push({
      kind: source.kind,
      org_id: source.org_id,
      relative_path: source.relative_path || null,
      backup: name,
      size_bytes: stored.payload.length,
      sha256: sha256(stored.payload),
      plaintext_sha256: sha256(plaintext),
      iv: stored.iv,
      auth_tag: stored.auth_tag,
    });
  }
  const serialized = JSON.stringify(manifest);
  const output = {
    ...manifest,
    manifest_hmac_sha256: key ? createHmac("sha256", key).update(serialized).digest("hex") : null,
  };
  writeFileSync(join(destination, "manifest.json"), JSON.stringify(output, null, 2), {
    flag: "wx",
    mode: 0o600,
  });
  return {
    backup: destination,
    backup_id: manifest.backup_id,
    databases: manifest.files.filter((file) => file.kind !== "attachment").length,
    attachments: manifest.files.filter((file) => file.kind === "attachment").length,
    files: manifest.files.length,
  };
}

export function restoreBackup({ source, target, encryptionKey = null, now = new Date() }) {
  const backup = resolve(source);
  const destinationRoot = resolve(target);
  const manifestPath = join(backup, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error("Backup manifest not found");
  mkdirSync(destinationRoot, { recursive: true, mode: 0o700 });
  if (readdirSync(destinationRoot).length) throw new Error("Restore target must be empty");
  const manifestBytes = readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  validateManifest(manifest);
  const key = manifest.encryption.algorithm === "AES-256-GCM" ? normalizeKey(encryptionKey) : null;
  if (key) verifyManifestHmac(manifest, key);

  const restored = [];
  for (const file of manifest.files) {
    if (basename(file.backup) !== file.backup)
      throw new Error("Unsafe backup filename in manifest");
    const stored = readFileSync(join(backup, file.backup));
    if (stored.length !== file.size_bytes || sha256(stored) !== file.sha256)
      throw new Error(`Backup checksum mismatch: ${file.backup}`);
    const plaintext = key ? decrypt(stored, key, file.iv, file.auth_tag) : stored;
    if (sha256(plaintext) !== file.plaintext_sha256)
      throw new Error(`Plaintext checksum mismatch: ${file.backup}`);
    const relative =
      file.kind === "platform"
        ? "platform.db"
        : file.kind === "tenant"
          ? join("tenants", `${safeSegment(file.org_id, "organization id")}.db`)
          : join("attachments", safeRelative(file.relative_path));
    const destination = join(destinationRoot, relative);
    mkdirSync(dirname(destination), { recursive: true, mode: 0o700 });
    writeFileSync(destination, plaintext, { flag: "wx", mode: 0o600 });
    restored.push({ ...file, destination });
  }

  const platformFile = restored.find((file) => file.kind === "platform");
  if (!platformFile) throw new Error("Manifest has no platform database");
  const platform = new DatabaseSync(platformFile.destination);
  platform.exec("PRAGMA foreign_keys=ON");
  for (const file of restored.filter((item) => item.kind === "tenant"))
    platform
      .prepare("UPDATE organizations SET database_path=? WHERE id=? AND status='active'")
      .run(file.destination, file.org_id);
  const platformIntegrity = integrity(platform);
  platform.close();

  const results = [{ kind: "platform", org_id: null, integrity: platformIntegrity }];
  for (const file of restored.filter((item) => item.kind === "tenant")) {
    const tenant = new DatabaseSync(file.destination, { readOnly: true });
    const metadata = tenant.prepare("SELECT org_id FROM tenant_metadata LIMIT 1").get();
    const result = integrity(tenant);
    tenant.close();
    if (metadata?.org_id !== file.org_id)
      throw new Error(`Tenant identity mismatch for organization ${file.org_id}`);
    results.push({ kind: "tenant", org_id: file.org_id, integrity: result });
  }
  if (results.some((item) => item.integrity !== "ok"))
    throw new Error("Restored database integrity check failed");
  const evidence = {
    schema_version: 1,
    restored_at: now.toISOString(),
    backup_id: manifest.backup_id,
    manifest_sha256: sha256(manifestBytes),
    encryption_key_id: manifest.encryption.key_id,
    target: destinationRoot,
    results,
  };
  writeFileSync(join(destinationRoot, "restore-evidence.json"), JSON.stringify(evidence, null, 2), {
    flag: "wx",
    mode: 0o600,
  });
  return {
    restored_to: destinationRoot,
    databases: restored.filter((file) => file.kind !== "attachment").length,
    attachments: restored.filter((file) => file.kind === "attachment").length,
    files: restored.length,
    evidence,
  };
}

export function normalizeKey(value) {
  if (!value) throw new Error("Backup encryption key is required");
  const key = Buffer.isBuffer(value) ? value : Buffer.from(String(value).trim(), "base64");
  if (key.length !== 32) throw new Error("Backup encryption key must decode to exactly 32 bytes");
  return key;
}

function encrypt(plaintext, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    payload,
    iv: iv.toString("base64"),
    auth_tag: cipher.getAuthTag().toString("base64"),
  };
}
function decrypt(payload, key, ivValue, tagValue) {
  const iv = Buffer.from(ivValue, "base64");
  const tag = Buffer.from(tagValue, "base64");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid backup encryption metadata");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(payload), decipher.final()]);
}
function verifyManifestHmac(manifest, key) {
  if (!/^[a-f0-9]{64}$/.test(manifest.manifest_hmac_sha256 || ""))
    throw new Error("Encrypted backup manifest authentication is missing");
  const { manifest_hmac_sha256: supplied, ...unsigned } = manifest;
  const expected = createHmac("sha256", key).update(JSON.stringify(unsigned)).digest("hex");
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(supplied, "hex");
  if (left.length !== right.length || !timingSafeEqual(left, right))
    throw new Error("Backup manifest authentication failed");
}
function validateManifest(manifest) {
  if (manifest.schema_version !== 2 || !Array.isArray(manifest.files) || !manifest.files.length)
    throw new Error("Unsupported or invalid backup manifest");
  if (!manifest.encryption || !["none", "AES-256-GCM"].includes(manifest.encryption.algorithm))
    throw new Error("Unsupported backup encryption metadata");
  if (manifest.files.filter((file) => file.kind === "platform").length !== 1)
    throw new Error("Manifest must contain exactly one platform database");
  const organizations = new Set();
  for (const file of manifest.files) {
    if (!/^[a-f0-9]{64}$/.test(file.sha256) || !/^[a-f0-9]{64}$/.test(file.plaintext_sha256))
      throw new Error("Manifest contains an invalid checksum");
    if (file.kind === "tenant") {
      safeSegment(file.org_id, "organization id");
      if (organizations.has(file.org_id)) throw new Error("Manifest contains a duplicate tenant");
      organizations.add(file.org_id);
    } else if (file.kind === "attachment") safeRelative(file.relative_path);
    else if (file.kind !== "platform")
      throw new Error("Manifest contains an unknown database kind");
  }
}
function integrity(database) {
  const rows = database.prepare("PRAGMA integrity_check").all();
  return rows.length === 1 && Object.values(rows[0])[0] === "ok" ? "ok" : "failed";
}
function safeSegment(value, label) {
  const segment = String(value || "");
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(segment)) throw new Error(`Unsafe ${label}`);
  return segment;
}
function safeRelative(value) {
  const parts = String(value || "")
    .replaceAll("\\", "/")
    .split("/");
  if (
    !parts.length ||
    parts.some(
      (part) => !part || part === "." || part === ".." || !/^[A-Za-z0-9._ -]{1,180}$/.test(part),
    )
  )
    throw new Error("Unsafe attachment path in manifest");
  return join(...parts);
}
function walkFiles(root, relative = "") {
  const files = [];
  for (const entry of readdirSync(join(root, relative), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error("Backup attachment roots cannot contain symlinks");
    const next = relative ? join(relative, entry.name) : entry.name;
    if (entry.isDirectory()) files.push(...walkFiles(root, next));
    else if (entry.isFile()) files.push({ path: join(root, next), relative: next });
  }
  return files;
}
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
