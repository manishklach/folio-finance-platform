import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";

export function validateProductionConfig(environment = process.env) {
  const port = Number(environment.PORT || 4310);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be 1 through 65535");
  if (environment.NODE_ENV !== "production") return true;
  if (environment.SESSION_COOKIE_SECURE !== "true")
    throw new Error("Production requires SESSION_COOKIE_SECURE=true");
  let publicOrigin;
  try {
    publicOrigin = new URL(environment.PUBLIC_ORIGIN);
  } catch {
    throw new Error("Production requires a valid PUBLIC_ORIGIN");
  }
  if (publicOrigin.protocol !== "https:" || publicOrigin.pathname !== "/")
    throw new Error("Production PUBLIC_ORIGIN must be an HTTPS origin without a path");
  if (environment.HOST && environment.HOST !== "0.0.0.0" && environment.HOST !== "::")
    throw new Error("Production HOST must listen on 0.0.0.0 or :: behind the TLS proxy");
  bootstrapToken(environment, { required: true });
  return true;
}

export function validateBootstrapRequest(headers, environment = process.env) {
  const expected = bootstrapToken(environment, { required: environment.NODE_ENV === "production" });
  if (!expected) return true;
  const supplied = String(headers["x-folio-bootstrap-token"] || "");
  const expectedDigest = createHash("sha256").update(expected).digest();
  const suppliedDigest = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedDigest, suppliedDigest);
}

function bootstrapToken(environment, { required = false } = {}) {
  const file = environment.BOOTSTRAP_TOKEN_FILE;
  if (environment.NODE_ENV === "production" && environment.BOOTSTRAP_TOKEN)
    throw new Error("BOOTSTRAP_TOKEN must be provided through BOOTSTRAP_TOKEN_FILE in production");
  let value;
  try {
    value = file ? readFileSync(file, "utf8").trim() : environment.BOOTSTRAP_TOKEN?.trim();
  } catch {
    throw new Error("BOOTSTRAP_TOKEN_FILE cannot be read");
  }
  if (required && !file) throw new Error("Production requires BOOTSTRAP_TOKEN_FILE");
  if (required && !value) throw new Error("BOOTSTRAP_TOKEN_FILE must not be empty");
  if (value && Buffer.byteLength(value, "utf8") < 32)
    throw new Error("Bootstrap token must contain at least 32 bytes");
  return value || undefined;
}

export function validateBrowserOrigin(headers, publicOrigin = process.env.PUBLIC_ORIGIN) {
  if (!publicOrigin) return true;
  const expected = new URL(publicOrigin).origin;
  const supplied = headers.origin;
  if (!supplied) throw Object.assign(new Error("Request origin is required"), { statusCode: 403 });
  if (supplied !== expected)
    throw Object.assign(new Error("Request origin is not allowed"), { statusCode: 403 });
  if (headers["sec-fetch-site"] === "cross-site")
    throw Object.assign(new Error("Cross-site state request is not allowed"), { statusCode: 403 });
  return true;
}
