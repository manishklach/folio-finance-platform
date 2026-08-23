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
  return true;
}

export function validateBrowserOrigin(headers, publicOrigin = process.env.PUBLIC_ORIGIN) {
  if (!publicOrigin) return true;
  const expected = new URL(publicOrigin).origin;
  const supplied = headers.origin;
  if (supplied && supplied !== expected)
    throw Object.assign(new Error("Request origin is not allowed"), { statusCode: 403 });
  if (headers["sec-fetch-site"] === "cross-site")
    throw Object.assign(new Error("Cross-site state request is not allowed"), { statusCode: 403 });
  return true;
}
