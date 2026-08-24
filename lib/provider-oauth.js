import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { secret } from "./secrets.js";

const oauthProviders = new Set(["stripe", "gusto", "hubspot"]);
const clientSchema = z.object({
  client_id: z.string().trim().min(3).max(500),
  client_secret: z.string().trim().min(8).max(2000),
});

export function createProviderOAuthService(
  platform,
  {
    environment = process.env,
    encryptionKey,
    keyId = environment.PROVIDER_TOKEN_KEY_ID || "provider-token-v1",
    credentialResolver = (reference) => secret(reference, { required: true, environment }),
    fetchImpl = globalThis.fetch,
    clock = () => new Date(),
  } = {},
) {
  const db = platform.db;

  function authorizationStart({ session, connection, redirect_uri }) {
    assertOAuthConnection(connection);
    const redirectUri = redirectUriSchema(environment).parse(redirect_uri);
    const client = clientCredentials(connection);
    const state = randomBytes(32).toString("base64url");
    const expiresAt = new Date(clock().valueOf() + 10 * 60 * 1000).toISOString();
    db.prepare(
      "DELETE FROM provider_oauth_attempts WHERE expires_at<=? OR consumed_at IS NOT NULL",
    ).run(clock().toISOString());
    db.prepare(
      `INSERT INTO provider_oauth_attempts(id,state_hash,org_id,user_id,connection_id,provider,redirect_uri,expires_at)
       VALUES(?,?,?,?,?,?,?,?)`,
    ).run(
      randomUUID(),
      hash(state),
      session.org_id,
      session.user_id,
      connection.id,
      connection.provider,
      redirectUri,
      expiresAt,
    );
    const profile = providerProfile(connection.provider, connection.environment);
    const url = new URL(profile.authorize_url);
    url.searchParams.set("client_id", client.client_id);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    const scopes = approvedScopes(connection);
    if (connection.provider === "stripe") url.searchParams.set("scope", scopes[0] || "read_write");
    if (connection.provider === "hubspot") url.searchParams.set("scope", scopes.join(" "));
    platform.audit(
      "provider_oauth_started",
      { orgId: session.org_id, userId: session.user_id },
      { connection_id: connection.id, provider: connection.provider, expires_at: expiresAt },
    );
    return { authorization_url: url.toString(), expires_at: expiresAt };
  }

  async function authorizationCallback({ session, provider, state, code, connection }) {
    if (!oauthProviders.has(provider)) throw bad("OAuth provider is not supported");
    const cleanState = z.string().min(32).max(200).parse(state);
    const cleanCode = z.string().trim().min(3).max(4000).parse(code);
    const now = clock().toISOString();
    let attempt;
    db.exec("BEGIN IMMEDIATE");
    try {
      attempt = db
        .prepare("SELECT * FROM provider_oauth_attempts WHERE state_hash=?")
        .get(hash(cleanState));
      if (!attempt || attempt.provider !== provider)
        throw bad("OAuth state is invalid or does not match the provider", 401);
      if (
        attempt.org_id !== session.org_id ||
        attempt.user_id !== session.user_id ||
        attempt.connection_id !== connection.id
      )
        throw bad("OAuth state does not belong to this tenant session", 401);
      if (attempt.consumed_at || attempt.expires_at <= now)
        throw bad("OAuth state is expired or already consumed", 409);
      db.prepare("UPDATE provider_oauth_attempts SET consumed_at=? WHERE id=?").run(
        now,
        attempt.id,
      );
      db.exec("COMMIT");
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
    const client = clientCredentials(connection);
    const profile = providerProfile(provider, connection.environment);
    const token = await tokenRequest(profile, {
      grant_type: "authorization_code",
      client_id: client.client_id,
      client_secret: client.client_secret,
      redirect_uri: attempt.redirect_uri,
      code: cleanCode,
    });
    const normalized = normalizeToken(provider, token, approvedScopes(connection), clock());
    if (
      connection.external_account_id &&
      normalized.external_account_id &&
      connection.external_account_id !== normalized.external_account_id
    )
      throw bad("OAuth account does not match the configured provider account", 409);
    storeCredential({
      session,
      connection,
      token: normalized,
      key: tokenKey(),
      keyId,
      redirectUri: attempt.redirect_uri,
    });
    platform.audit(
      "provider_oauth_authorized",
      { orgId: session.org_id, userId: session.user_id },
      {
        connection_id: connection.id,
        provider,
        external_account_id: normalized.external_account_id,
        scopes: normalized.scopes,
        expires_at: normalized.expires_at,
      },
    );
    return credentialMetadata(connection.id, session.org_id);
  }

  function pendingAuthorization({ session, provider, state }) {
    if (!oauthProviders.has(provider)) throw bad("OAuth provider is not supported");
    const cleanState = z.string().min(32).max(200).parse(state);
    const attempt = db
      .prepare(
        "SELECT connection_id,org_id,user_id,provider,expires_at,consumed_at FROM provider_oauth_attempts WHERE state_hash=?",
      )
      .get(hash(cleanState));
    if (
      !attempt ||
      attempt.provider !== provider ||
      attempt.org_id !== session.org_id ||
      attempt.user_id !== session.user_id
    )
      throw bad("OAuth state does not belong to this tenant session", 401);
    if (attempt.consumed_at || attempt.expires_at <= clock().toISOString())
      throw bad("OAuth state is expired or already consumed", 409);
    return { connection_id: attempt.connection_id };
  }

  async function resolveCredential(reference, connection) {
    if (!connection?.id || !connection.org_id) return credentialResolver(reference);
    let row = credentialRow(connection.id, connection.org_id);
    if (!row) return credentialResolver(reference);
    if (row.status !== "active") throw safeError("Provider OAuth credential is not active");
    let stored = decryptToken(row, tokenKey());
    const app = clientCredentials(connection);
    if (connection.provider === "stripe")
      return {
        api_key: app.client_secret,
        account_id: row.external_account_id || connection.external_account_id,
      };
    if (!needsRefresh(row.token_expires_at, clock())) return { ...app, ...stored };
    const leaseId = acquireRefreshLease(row, clock());
    try {
      const profile = providerProfile(connection.provider, connection.environment);
      if (!stored.refresh_token) throw safeError("Provider refresh token is unavailable");
      const refreshed = await tokenRequest(profile, {
        grant_type: "refresh_token",
        client_id: app.client_id,
        client_secret: app.client_secret,
        refresh_token: stored.refresh_token,
        ...(profile.refresh_uses_redirect ? { redirect_uri: stored.redirect_uri } : {}),
      });
      const normalized = normalizeToken(
        connection.provider,
        { ...refreshed, refresh_token: refreshed.refresh_token || stored.refresh_token },
        JSON.parse(row.scopes_json),
        clock(),
      );
      stored = {
        ...stored,
        access_token: normalized.access_token,
        refresh_token: normalized.refresh_token,
        token_type: normalized.token_type,
      };
      const cipher = encryptToken(stored, tokenKey(), aad(row), keyId);
      db.prepare(
        `UPDATE provider_credentials SET ciphertext=?,key_id=?,token_expires_at=?,version=version+1,
         refresh_lease_id=NULL,refresh_lease_until=NULL,last_error=NULL,refreshed_at=CURRENT_TIMESTAMP,
         updated_at=CURRENT_TIMESTAMP WHERE connection_id=? AND org_id=? AND refresh_lease_id=?`,
      ).run(cipher, keyId, normalized.expires_at, row.connection_id, row.org_id, leaseId);
      return { ...app, ...stored };
    } catch (error) {
      db.prepare(
        `UPDATE provider_credentials SET status='error',refresh_lease_id=NULL,refresh_lease_until=NULL,
         last_error=?,updated_at=CURRENT_TIMESTAMP WHERE connection_id=? AND org_id=? AND refresh_lease_id=?`,
      ).run(safeMessage(error), row.connection_id, row.org_id, leaseId);
      throw safeError("Provider OAuth token refresh failed", error);
    }
  }

  async function revoke({ session, connection }) {
    assertOAuthConnection(connection);
    const row = credentialRow(connection.id, session.org_id);
    if (!row) throw bad("Provider OAuth credential not found", 404);
    if (row.status === "revoked") return credentialMetadata(connection.id, session.org_id);
    const stored = decryptToken(row, tokenKey());
    const client = clientCredentials(connection);
    const profile = providerProfile(connection.provider, connection.environment);
    let remoteRevoked = false;
    if (profile.revoke_url) {
      const fields =
        connection.provider === "stripe"
          ? { client_id: client.client_id, stripe_user_id: row.external_account_id }
          : {
              client_id: client.client_id,
              client_secret: client.client_secret,
              token: stored.refresh_token || stored.access_token,
              token_type_hint: stored.refresh_token ? "refresh_token" : "access_token",
            };
      await rawRequest(profile.revoke_url, fields, profile.revoke_format || "form");
      remoteRevoked = true;
    }
    db.prepare(
      `UPDATE provider_credentials SET status='revoked',ciphertext=?,token_expires_at=NULL,
       refresh_lease_id=NULL,refresh_lease_until=NULL,revoked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
       WHERE connection_id=? AND org_id=?`,
    ).run(
      encryptToken({ revoked: true }, tokenKey(), aad(row), keyId),
      connection.id,
      session.org_id,
    );
    platform.audit(
      "provider_oauth_revoked",
      { orgId: session.org_id, userId: session.user_id },
      {
        connection_id: connection.id,
        provider: connection.provider,
        remote_revoked: remoteRevoked,
      },
    );
    return {
      ...credentialMetadata(connection.id, session.org_id),
      remote_revoked: remoteRevoked,
    };
  }

  function credentialMetadata(connectionId = null, orgId = null) {
    const where =
      connectionId && orgId
        ? "WHERE connection_id=? AND org_id=?"
        : orgId
          ? "WHERE org_id=?"
          : "WHERE 0";
    const args = connectionId && orgId ? [connectionId, orgId] : orgId ? [orgId] : [];
    const rows = db
      .prepare(
        `SELECT connection_id,org_id,provider,key_id,token_expires_at,external_account_id,scopes_json,status,
         version,last_error,authorized_by,authorized_at,refreshed_at,revoked_at,updated_at
         FROM provider_credentials ${where} ORDER BY provider,authorized_at DESC`,
      )
      .all(...args)
      .map((row) => ({ ...row, scopes: JSON.parse(row.scopes_json) }));
    return connectionId ? rows[0] || null : rows;
  }

  function credentialRow(connectionId, orgId) {
    return credentialRowFrom(db, connectionId, orgId);
  }

  function storeCredential({
    session,
    connection,
    token,
    key,
    keyId: credentialKeyId,
    redirectUri,
  }) {
    const row = {
      connection_id: connection.id,
      org_id: session.org_id,
      provider: connection.provider,
    };
    const ciphertext = encryptToken(
      {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_type: token.token_type,
        redirect_uri: redirectUri,
      },
      key,
      aad(row),
      credentialKeyId,
    );
    db.prepare(
      `INSERT INTO provider_credentials(
        connection_id,org_id,provider,ciphertext,key_id,token_expires_at,external_account_id,
        scopes_json,status,version,last_error,authorized_by,authorized_at,refreshed_at,revoked_at,updated_at
      ) VALUES(?,?,?,?,?,?,?,?, 'active',1,NULL,?,CURRENT_TIMESTAMP,NULL,NULL,CURRENT_TIMESTAMP)
      ON CONFLICT(connection_id,org_id) DO UPDATE SET
        org_id=excluded.org_id,provider=excluded.provider,ciphertext=excluded.ciphertext,
        key_id=excluded.key_id,token_expires_at=excluded.token_expires_at,
        external_account_id=excluded.external_account_id,scopes_json=excluded.scopes_json,
        status='active',version=provider_credentials.version+1,refresh_lease_id=NULL,
        refresh_lease_until=NULL,last_error=NULL,authorized_by=excluded.authorized_by,
        authorized_at=CURRENT_TIMESTAMP,refreshed_at=NULL,revoked_at=NULL,updated_at=CURRENT_TIMESTAMP`,
    ).run(
      connection.id,
      session.org_id,
      connection.provider,
      ciphertext,
      credentialKeyId,
      token.expires_at,
      token.external_account_id || connection.external_account_id || null,
      JSON.stringify(token.scopes),
      session.user_id,
    );
  }

  function acquireRefreshLease(row, currentTime) {
    return acquireRefreshLeaseFrom(db, row, currentTime);
  }

  function clientCredentials(connection) {
    let value = credentialResolver(connection.credential_secret_ref);
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        throw safeError("Provider OAuth client secret is invalid");
      }
    }
    const result = clientSchema.safeParse(value);
    if (!result.success) throw safeError("Provider OAuth client credentials are incomplete");
    return result.data;
  }

  async function tokenRequest(profile, fields) {
    const body = await rawRequest(profile.token_url, fields, profile.token_format);
    if (!body?.access_token) throw safeError("Provider token response is incomplete");
    return body;
  }

  async function rawRequest(url, fields, format) {
    const init = { method: "POST", headers: {} };
    if (format === "json") {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(fields);
    } else {
      init.headers["Content-Type"] = "application/x-www-form-urlencoded";
      init.body = new URLSearchParams(
        Object.entries(fields).filter(([, value]) => value),
      ).toString();
    }
    const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(30_000) });
    let body;
    try {
      body = response.status === 204 ? {} : await response.json();
    } catch {
      throw safeError("Provider OAuth endpoint returned invalid JSON");
    }
    if (!response.ok)
      throw safeError(`Provider OAuth endpoint rejected the request (${response.status})`);
    return body;
  }

  function tokenKey() {
    const value =
      encryptionKey || secret("PROVIDER_TOKEN_ENCRYPTION_KEY", { required: true, environment });
    return parseKey(value);
  }

  return {
    authorizationStart,
    pendingAuthorization,
    authorizationCallback,
    resolveCredential,
    revoke,
    credentialMetadata,
  };
}

function providerProfile(provider, environment) {
  if (provider === "stripe")
    return {
      authorize_url: "https://connect.stripe.com/oauth/authorize",
      token_url: "https://connect.stripe.com/oauth/token",
      token_format: "form",
      revoke_url: "https://connect.stripe.com/oauth/deauthorize",
      revoke_format: "form",
    };
  if (provider === "gusto") {
    const host =
      environment === "production" ? "https://api.gusto.com" : "https://api.gusto-demo.com";
    return {
      authorize_url: `${host}/oauth/authorize`,
      token_url: `${host}/oauth/token`,
      token_format: "json",
    };
  }
  return {
    authorize_url: "https://app.hubspot.com/oauth/authorize",
    token_url: "https://api.hubapi.com/oauth/v3/token",
    token_format: "form",
    revoke_url: "https://api.hubapi.com/oauth/2026-03/token/revoke",
    revoke_format: "form",
  };
}

function normalizeToken(provider, response, fallbackScopes, clock) {
  const expires = Number(response.expires_in || 0);
  const scopes = Array.isArray(response.scopes)
    ? response.scopes.map(String)
    : typeof response.scope === "string"
      ? response.scope.split(/[ ,]+/).filter(Boolean)
      : fallbackScopes;
  return {
    access_token: z.string().min(8).max(8000).parse(response.access_token),
    refresh_token: response.refresh_token
      ? z.string().min(8).max(8000).parse(response.refresh_token)
      : null,
    token_type: String(response.token_type || "bearer"),
    expires_at:
      expires > 0
        ? new Date(clock.valueOf() + Math.max(60, expires - 60) * 1000).toISOString()
        : null,
    external_account_id:
      provider === "stripe"
        ? response.stripe_user_id || null
        : provider === "hubspot"
          ? response.hub_id
            ? String(response.hub_id)
            : null
          : response.company_uuid || null,
    scopes: [...new Set(scopes)],
  };
}

function redirectUriSchema(environment) {
  return z
    .string()
    .url()
    .superRefine((value, context) => {
      const url = new URL(value);
      if (url.username || url.password || url.hash)
        context.addIssue({
          code: "custom",
          message: "OAuth redirect URI contains forbidden components",
        });
      if (environment.NODE_ENV === "production" && url.protocol !== "https:")
        context.addIssue({
          code: "custom",
          message: "Production OAuth redirect URI must use HTTPS",
        });
      if (environment.PUBLIC_ORIGIN && url.origin !== new URL(environment.PUBLIC_ORIGIN).origin)
        context.addIssue({
          code: "custom",
          message: "OAuth redirect URI must use the public application origin",
        });
    });
}

function approvedScopes(connection) {
  const scopes = Array.isArray(connection.scopes) ? connection.scopes.map(String) : [];
  if (connection.provider === "hubspot" && !scopes.length)
    throw bad("HubSpot OAuth requires explicitly approved scopes");
  if (
    connection.provider === "stripe" &&
    scopes.some((scope) => !["read_only", "read_write"].includes(scope))
  )
    throw bad("Stripe OAuth scope must be read_only or read_write");
  return scopes;
}

function assertOAuthConnection(connection) {
  if (!connection || !oauthProviders.has(connection.provider))
    throw bad("This connection does not support hosted OAuth");
  if (["disconnected"].includes(connection.status))
    throw bad("Disconnected connections cannot authorize", 409);
}

function parseKey(value) {
  if (Buffer.isBuffer(value) && value.length === 32) return value;
  const text = String(value || "").trim();
  const decoded = /^[a-f0-9]{64}$/i.test(text)
    ? Buffer.from(text, "hex")
    : Buffer.from(text, "base64");
  if (decoded.length !== 32)
    throw safeError("Provider token encryption key must contain exactly 32 bytes");
  return decoded;
}

function encryptToken(value, key, aadValue, keyId) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(aadValue));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return JSON.stringify({
    v: 1,
    kid: keyId,
    n: nonce.toString("base64"),
    c: ciphertext.toString("base64"),
    t: cipher.getAuthTag().toString("base64"),
  });
}

function decryptToken(row, key) {
  try {
    const value = JSON.parse(row.ciphertext);
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.n, "base64"));
    decipher.setAAD(Buffer.from(aad(row)));
    decipher.setAuthTag(Buffer.from(value.t, "base64"));
    return JSON.parse(
      Buffer.concat([decipher.update(Buffer.from(value.c, "base64")), decipher.final()]).toString(
        "utf8",
      ),
    );
  } catch (error) {
    throw safeError("Provider credential could not be decrypted", error);
  }
}

function aad(row) {
  return `folio:provider-token:v1:${row.org_id}:${row.connection_id}:${row.provider}`;
}

function credentialRowFrom(db, connectionId, orgId) {
  return db
    .prepare("SELECT * FROM provider_credentials WHERE connection_id=? AND org_id=?")
    .get(connectionId, orgId);
}

function needsRefresh(expiresAt, clock) {
  return Boolean(expiresAt && Date.parse(expiresAt) <= clock.valueOf() + 60_000);
}

function acquireRefreshLeaseFrom(db, row, clock) {
  const leaseId = randomUUID();
  const now = clock.toISOString();
  const until = new Date(clock.valueOf() + 60_000).toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = credentialRowFrom(db, row.connection_id, row.org_id);
    if (current.refresh_lease_until && current.refresh_lease_until > now)
      throw safeError("Provider OAuth token refresh is already in progress");
    db.prepare(
      "UPDATE provider_credentials SET refresh_lease_id=?,refresh_lease_until=?,updated_at=CURRENT_TIMESTAMP WHERE connection_id=? AND org_id=?",
    ).run(leaseId, until, row.connection_id, row.org_id);
    db.exec("COMMIT");
    return leaseId;
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}
function safeMessage(error) {
  return String(error?.safeMessage || "Provider OAuth operation failed").slice(0, 500);
}
function safeError(message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.safeMessage = message;
  return error;
}
function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
