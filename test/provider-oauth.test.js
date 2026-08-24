import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createPlatform } from "../lib/platform.js";
import { createProviderOAuthService } from "../lib/provider-oauth.js";
import { createFolioServer } from "../server.js";

async function fixture(t, provider = "gusto") {
  const root = mkdtempSync(join(tmpdir(), "folio-oauth-"));
  const platform = createPlatform(join(root, "platform.db"), join(root, "tenants"));
  const setup = await platform.setup({
    organization_name: "OAuth Test",
    name: "OAuth Admin",
    email: "oauth@example.com",
    password: "StrongPassword123",
  });
  t.after(() => {
    platform.close();
    rmSync(root, { recursive: true, force: true });
  });
  const connection = {
    id: `${provider}-connection`,
    org_id: setup.session.org_id,
    provider,
    environment: "sandbox",
    status: "configured",
    external_account_id: null,
    credential_secret_ref: `${provider.toUpperCase()}_OAUTH_CLIENT`,
    scopes:
      provider === "hubspot"
        ? ["crm.objects.companies.read", "crm.objects.deals.read"]
        : provider === "stripe"
          ? ["read_write"]
          : [],
  };
  let now = new Date("2026-08-23T12:00:00.000Z");
  const requests = [];
  const responses = [];
  const service = createProviderOAuthService(platform, {
    environment: { NODE_ENV: "production", PUBLIC_ORIGIN: "https://folio.example" },
    encryptionKey: Buffer.alloc(32, 7),
    credentialResolver: () =>
      JSON.stringify({ client_id: "client-identifier", client_secret: "client-secret-value" }),
    clock: () => now,
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      const response = responses.shift();
      return new Response(response?.body ? JSON.stringify(response.body) : null, {
        status: response?.status || 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  return {
    platform,
    session: setup.session,
    connection,
    service,
    requests,
    responses,
    advance(milliseconds) {
      now = new Date(now.valueOf() + milliseconds);
    },
  };
}

test("OAuth state is hashed, session-bound, one-time, and tokens are encrypted", async (t) => {
  const value = await fixture(t);
  const redirect_uri = "https://folio.example/api/integrations/oauth/callback/gusto";
  const started = value.service.authorizationStart({
    session: value.session,
    connection: value.connection,
    redirect_uri,
  });
  const authorization = new URL(started.authorization_url);
  const state = authorization.searchParams.get("state");
  assert.equal(authorization.origin, "https://api.gusto-demo.com");
  assert.equal(authorization.searchParams.get("redirect_uri"), redirect_uri);
  const attempt = value.platform.db.prepare("SELECT * FROM provider_oauth_attempts").get();
  assert.notEqual(attempt.state_hash, state);
  assert.equal(JSON.stringify(attempt).includes(state), false);

  assert.throws(
    () =>
      value.service.pendingAuthorization({
        session: { ...value.session, user_id: "another-user" },
        provider: "gusto",
        state,
      }),
    /tenant session/,
  );
  value.responses.push({
    body: {
      access_token: "access-token-sensitive",
      refresh_token: "refresh-token-sensitive",
      token_type: "bearer",
      expires_in: 7200,
      company_uuid: "company-123",
    },
  });
  const result = await value.service.authorizationCallback({
    session: value.session,
    provider: "gusto",
    state,
    code: "authorization-code",
    connection: value.connection,
  });
  assert.equal(result.external_account_id, "company-123");
  assert.equal("ciphertext" in result, false);
  const row = value.platform.db.prepare("SELECT * FROM provider_credentials").get();
  assert.equal(row.ciphertext.includes("access-token-sensitive"), false);
  assert.equal(row.ciphertext.includes("refresh-token-sensitive"), false);
  assert.equal(
    JSON.stringify(value.service.credentialMetadata(null, value.session.org_id)).includes(
      "access-token-sensitive",
    ),
    false,
  );
  assert.equal(value.service.credentialMetadata(value.connection.id), null);
  const wrongKeyService = createProviderOAuthService(value.platform, {
    encryptionKey: Buffer.alloc(32, 8),
    credentialResolver: () =>
      JSON.stringify({ client_id: "client-identifier", client_secret: "client-secret-value" }),
  });
  await assert.rejects(
    wrongKeyService.resolveCredential("ignored", value.connection),
    /could not be decrypted/,
  );
  await assert.rejects(
    value.service.authorizationCallback({
      session: value.session,
      provider: "gusto",
      state,
      code: "authorization-code",
      connection: value.connection,
    }),
    /already consumed/,
  );
});

test("Gusto refresh rotates under a lease and persists only encrypted credentials", async (t) => {
  const value = await fixture(t);
  const started = value.service.authorizationStart({
    session: value.session,
    connection: value.connection,
    redirect_uri: "https://folio.example/api/integrations/oauth/callback/gusto",
  });
  const state = new URL(started.authorization_url).searchParams.get("state");
  value.responses.push({
    body: {
      access_token: "initial-access-token",
      refresh_token: "initial-refresh-token",
      expires_in: 120,
      company_uuid: "company-123",
    },
  });
  await value.service.authorizationCallback({
    session: value.session,
    provider: "gusto",
    state,
    code: "authorization-code",
    connection: value.connection,
  });
  value.advance(61_000);
  value.platform.db
    .prepare(
      "UPDATE provider_credentials SET refresh_lease_id='other-worker',refresh_lease_until='2026-08-23T12:10:00.000Z'",
    )
    .run();
  await assert.rejects(
    value.service.resolveCredential("ignored", value.connection),
    /already in progress/,
  );
  value.platform.db
    .prepare("UPDATE provider_credentials SET refresh_lease_id=NULL,refresh_lease_until=NULL")
    .run();
  value.responses.push({
    body: {
      access_token: "rotated-access-token",
      refresh_token: "rotated-refresh-token",
      expires_in: 7200,
    },
  });
  const resolved = await value.service.resolveCredential("ignored", value.connection);
  assert.equal(resolved.access_token, "rotated-access-token");
  assert.equal(resolved.refresh_token, "rotated-refresh-token");
  assert.equal(value.requests[1].url, "https://api.gusto-demo.com/oauth/token");
  assert.equal(JSON.parse(value.requests[1].init.body).grant_type, "refresh_token");
  const row = value.platform.db.prepare("SELECT * FROM provider_credentials").get();
  assert.equal(row.version, 2);
  assert.equal(row.refresh_lease_id, null);
  assert.equal(row.ciphertext.includes("rotated-access-token"), false);
});

test("Stripe uses the platform key plus bound account and revocation tombstones the vault", async (t) => {
  const value = await fixture(t, "stripe");
  const started = value.service.authorizationStart({
    session: value.session,
    connection: value.connection,
    redirect_uri: "https://folio.example/api/integrations/oauth/callback/stripe",
  });
  const state = new URL(started.authorization_url).searchParams.get("state");
  value.responses.push({
    body: {
      access_token: "legacy-stripe-access-token",
      stripe_user_id: "acct_connected",
      scope: "read_write",
    },
  });
  await value.service.authorizationCallback({
    session: value.session,
    provider: "stripe",
    state,
    code: "authorization-code",
    connection: value.connection,
  });
  assert.deepEqual(await value.service.resolveCredential("ignored", value.connection), {
    api_key: "client-secret-value",
    account_id: "acct_connected",
  });
  value.responses.push({ body: {} });
  const revoked = await value.service.revoke({
    session: value.session,
    connection: value.connection,
  });
  assert.equal(revoked.status, "revoked");
  assert.equal(revoked.remote_revoked, true);
  const body = new URLSearchParams(value.requests.at(-1).init.body);
  assert.equal(body.get("stripe_user_id"), "acct_connected");
  await assert.rejects(value.service.resolveCredential("ignored", value.connection), /not active/);
});

test("hosted API completes the admin authorization handoff without exposing tokens", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-oauth-http-"));
  const environment = { NODE_ENV: "test" };
  const app = createFolioServer({
    platformDbPath: join(root, "platform.db"),
    tenantDir: join(root, "tenants"),
    environment,
    providerTokenEncryptionKey: Buffer.alloc(32, 9),
    credentialResolver: () =>
      JSON.stringify({ client_id: "client-identifier", client_secret: "client-secret-value" }),
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          access_token: "hubspot-access-token",
          refresh_token: "hubspot-refresh-token",
          expires_in: 1800,
          hub_id: 456789,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  environment.PUBLIC_ORIGIN = origin;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });
  const registration = await fetch(`${origin}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({
      organization_name: "Hosted OAuth",
      name: "Hosted Admin",
      email: "hosted@example.com",
      password: "StrongPassword123",
    }),
  });
  assert.equal(registration.status, 201);
  const auth = await registration.json();
  const cookie = registration.headers.get("set-cookie").split(";")[0];
  const headers = {
    "content-type": "application/json",
    origin,
    cookie,
    "x-csrf-token": auth.csrf_token,
  };
  const configuredResponse = await fetch(`${origin}/api/integrations/connections`, {
    method: "POST",
    headers: { ...headers, "idempotency-key": "hosted-hubspot-connection" },
    body: JSON.stringify({
      provider: "hubspot",
      display_name: "Hosted HubSpot",
      environment: "sandbox",
      credential_secret_ref: "HUBSPOT_OAUTH_CLIENT",
      scopes: ["crm.objects.companies.read", "crm.objects.deals.read"],
      settings: {},
    }),
  });
  assert.equal(configuredResponse.status, 201);
  const connection = await configuredResponse.json();
  const startResponse = await fetch(`${origin}/api/integrations/oauth/${connection.id}/start`, {
    method: "POST",
    headers,
    body: "{}",
  });
  assert.equal(startResponse.status, 200);
  const started = await startResponse.json();
  const state = new URL(started.authorization_url).searchParams.get("state");
  const callback = await fetch(
    `${origin}/api/integrations/oauth/callback/hubspot?state=${encodeURIComponent(state)}&code=hosted-code`,
    { headers: { cookie }, redirect: "manual" },
  );
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get("location"), "/?oauth=hubspot_connected");
  const metadataResponse = await fetch(`${origin}/api/integrations/oauth`, {
    headers: { cookie },
  });
  const metadata = await metadataResponse.json();
  assert.equal(metadata[0].external_account_id, "456789");
  assert.equal(JSON.stringify(metadata).includes("hubspot-access-token"), false);
});
