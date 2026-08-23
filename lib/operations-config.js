import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeKey } from "./backup.js";
import { validateProductionConfig } from "./runtime-config.js";

export function validateOperationsConfig(environment = process.env) {
  validateProductionConfig(environment);
  if (environment.NODE_ENV !== "production")
    throw new Error("Operational preflight must run with NODE_ENV=production");
  if (
    !/^[A-Za-z0-9.-]+$/.test(environment.FOLIO_DOMAIN || "") ||
    !environment.FOLIO_DOMAIN.includes(".") ||
    environment.FOLIO_DOMAIN === "localhost"
  )
    throw new Error("FOLIO_DOMAIN is required and must be a hostname");
  if (new URL(environment.PUBLIC_ORIGIN).hostname !== environment.FOLIO_DOMAIN)
    throw new Error("PUBLIC_ORIGIN and FOLIO_DOMAIN must identify the same host");
  if (!/^.+@sha256:[a-f0-9]{64}$/.test(environment.FOLIO_IMAGE || ""))
    throw new Error("FOLIO_IMAGE must be an immutable registry image digest");
  if (!/^[A-Za-z0-9._-]{3,80}$/.test(environment.BACKUP_KEY_ID || ""))
    throw new Error("BACKUP_KEY_ID must be a non-secret rotation identifier");

  const backupKeyPath = requiredSecretFile(environment, "BACKUP_ENCRYPTION_KEY_FILE");
  normalizeKey(readFileSync(backupKeyPath, "utf8"));
  const alertPath = requiredSecretFile(environment, "ALERT_WEBHOOK_URL_FILE");
  let alertUrl;
  try {
    alertUrl = new URL(readFileSync(alertPath, "utf8").trim());
  } catch {
    throw new Error("Alert webhook secret must contain a valid URL");
  }
  if (alertUrl.protocol !== "https:") throw new Error("Alert webhook must use HTTPS");
  const sentryPath = requiredSecretFile(environment, "SENTRY_DSN_FILE");
  try {
    const sentry = new URL(readFileSync(sentryPath, "utf8").trim());
    if (sentry.protocol !== "https:" || !sentry.username) throw new Error("invalid");
  } catch {
    throw new Error("Sentry secret must contain a valid HTTPS DSN");
  }
  requiredSecretFile(environment, "OPENAI_API_KEY_FILE", { allowEmpty: true });
  requiredSecretFile(environment, "BOOTSTRAP_TOKEN_FILE");

  return {
    status: "ready",
    domain: environment.FOLIO_DOMAIN,
    image: environment.FOLIO_IMAGE,
    backup_key_id: environment.BACKUP_KEY_ID,
    secret_files: [
      "BACKUP_ENCRYPTION_KEY_FILE",
      "ALERT_WEBHOOK_URL_FILE",
      "SENTRY_DSN_FILE",
      "OPENAI_API_KEY_FILE",
      "BOOTSTRAP_TOKEN_FILE",
    ],
  };
}

function requiredSecretFile(environment, name, { allowEmpty = false } = {}) {
  const value = environment[name];
  if (!value) throw new Error(`${name} is required`);
  const path = resolve(value);
  if (!existsSync(path)) throw new Error(`${name} does not exist`);
  if (!allowEmpty && !readFileSync(path).length) throw new Error(`${name} must not be empty`);
  return path;
}
