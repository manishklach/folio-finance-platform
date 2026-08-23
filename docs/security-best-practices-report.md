# Security best-practices review

Review date: 2026-08-23
Scope: React client, raw Node.js HTTP server, authentication and sessions, tenant database routing,
attachments, provider adapters, backups, container/deployment configuration, and CI.

## Executive summary

The review found no known critical vulnerability and no unresolved high-severity repository finding.
One high-severity concurrent-bootstrap defect, one medium availability defect, and three lower-severity
boundary/disclosure issues were reproduced and fixed with regression tests. The React client uses
escaped JSX and contains no raw-HTML, dynamic-code, browser-token-storage, third-party-script, service
worker, or cross-window messaging sink. The server has parameterized SQL, explicit authorization,
tenant-specific databases, CSRF tokens, strict cookies, body limits, safe error responses, and a
header-delivered CSP.

This is not a penetration-test attestation. Credentialed application testing, infrastructure review,
cloud/WAF validation, OAuth-provider certification, and independent testing remain production gates.

## Resolved findings

### SEC-001 — Concurrent initial-administrator claim

- Rule ID: EXPRESS-AUTH-001 / application bootstrap authorization
- Severity: High
- Status: Resolved
- Location: `lib/platform.js`, `setup`, lines 87–90; regression in
  `test/security-hardening.test.js`, initial bootstrap test
- Evidence: setup originally checked for an existing user before asynchronous Argon2 hashing and did
  not repeat the decision while holding a database write lock. Two requests with different identities
  could both observe an empty installation.
- Impact: two unauthenticated callers racing a new installation could each become an administrator.
- Fix: repeat the zero-user assertion inside `BEGIN IMMEDIATE`; the losing transaction rolls back with
  HTTP 409. The regression test submits two concurrent, distinct bootstrap attempts and proves exactly
  one user, organization, and membership exist.
- Mitigation: keep an uninitialized deployment inaccessible except to the commissioning operator and
  complete bootstrap immediately.
- False-positive notes: sequential testing could not expose this defect; the concurrent regression is
  the authoritative reproduction.

### SEC-002 — Unbounded Prometheus route-label cardinality

- Rule ID: EXPRESS-DOS-001
- Severity: Medium
- Status: Resolved
- Location: `server.js`, metrics initialization and recording, lines 29 and 114–121; regression in
  `test/security-hardening.test.js`, bounded-series test
- Evidence: every distinct request path previously created a permanent key in `metrics.by_request`.
- Impact: an unauthenticated client could send continually unique paths, increasing process memory and
  Prometheus series cardinality until service degradation.
- Fix: cap detailed series at 512 and aggregate later observations into a fixed overflow route while
  retaining HTTP status class. The adversarial test submits 540 unique paths and asserts the series
  remain bounded.
- Mitigation: the TLS proxy and production network should also apply connection/request rate controls.
- False-positive notes: UUID and numeric normalization reduced ordinary cardinality but did not cover
  arbitrary alphabetic paths.

### SEC-003 — Incomplete production Origin requirement

- Rule ID: EXPRESS-CSRF-001 / REACT-CSRF-001
- Severity: Low
- Status: Resolved
- Location: `lib/runtime-config.js`, `validateBrowserOrigin`, line 25
- Evidence: mismatched and explicitly cross-site requests were rejected, but a state-changing request
  with an omitted `Origin` header passed the defense-in-depth origin check.
- Impact: CSRF tokens and `SameSite=Strict` already protected authenticated actions, but unauthenticated
  setup/login and unusual clients had a weaker origin boundary than the production policy stated.
- Fix: production state-changing API requests now require the exact configured HTTPS origin. Provider
  webhooks remain on a separate signature-verified route.
- Mitigation: retain CSRF tokens, strict cookies, Fetch Metadata evaluation, and edge TLS controls.
- False-positive notes: command-line clients must now supply the configured Origin; this is intentional
  for the browser-oriented API.

### SEC-004 — Internal deployment metadata returned by APIs

- Rule ID: EXPRESS-ERROR-001 / least-information response design
- Severity: Low
- Status: Resolved
- Location: `server.js`, organization and integration response projections, lines 251 and 843–851
- Evidence: organization creation returned the tenant database's absolute host path, and connector
  responses returned secret-manager reference names.
- Impact: authenticated callers received deployment topology and secret inventory metadata unnecessary
  for their accounting workflow.
- Fix: public response projections now omit database paths and credential/webhook reference names.
- Mitigation: continue to ensure logs and error-tracking payloads contain reference IDs rather than
  secret values.
- False-positive notes: the references were not credential values, but removing them reduces useful
  reconnaissance without affecting the UI.

### SEC-005 — Request parsing and filesystem boundary robustness

- Rule ID: EXPRESS-INPUT-001 / EXPRESS-FILES-001 / EXPRESS-ERROR-001
- Severity: Low
- Status: Resolved
- Location: `server.js`, request-ID validation line 971, JSON media-type enforcement line 856, static
  containment line 879, and cookie parsing line 948
- Evidence: request IDs were reflected/logged without a length/character policy; JSON routes accepted
  ambiguous media types; static containment used a string prefix; malformed percent-encoded cookies
  produced an internal error.
- Impact: these behaviors enabled log/metric noise, ambiguous request handling, fragile filesystem
  assumptions, and avoidable 500 responses.
- Fix: request IDs are allowlisted and bounded, JSON requires `application/json`, static files use
  resolved relative containment and deny dot paths, and malformed cookies are ignored as invalid
  authentication material. HTTP adversarial tests cover each boundary.
- Mitigation: retain reverse-proxy header normalization, body limits, `nosniff`, and generic 500 output.
- False-positive notes: Node's parser already rejects many control characters; application validation
  provides a stable invariant across runtimes and proxies.

## Controls verified

- React renders remote/user strings through escaped JSX and does not use `dangerouslySetInnerHTML`,
  direct DOM HTML sinks, string-to-code execution, persistent auth storage, `postMessage`, dynamic
  scripts, or service workers.
- Session tokens are random, stored only as hashes server-side, sent in `HttpOnly`, `SameSite=Strict`
  cookies, and marked `Secure` in production. Password reset revokes all sessions.
- Passwords use Argon2id. Login attempts are limited by identity/IP and IP, accounts lock after repeated
  failure, and unknown identities perform a dummy Argon2 verification to reduce timing enumeration.
- State changes require a session, server authorization, a per-session CSRF token, and an exact
  production Origin. CORS is not enabled.
- SQLite calls that consume request-derived values use bound parameters. Dynamic schema identifiers are
  internal migration allowlists rather than request data.
- Attachments are size-limited, signature-checked against an allowlist, assigned random storage names,
  tenant-partitioned, and always downloaded as attachments.
- CSP blocks non-self scripts, objects, framing, foreign form actions, and foreign connections. Other
  security headers include `nosniff`, deny framing, a no-referrer policy, and a restricted permissions
  policy.
- Production fails closed on HTTPS origin and secure-cookie configuration; containers drop capabilities,
  use read-only filesystems, run without root privileges, and omit package-manager/build tooling from the
  runtime image.
- CI uses reproducible installs, dependency audit, all security regressions, a production image build,
  a pinned Trivy action for fixed high/critical image vulnerabilities, Compose validation, and
  Prometheus/Alertmanager configuration validation. Dependabot covers npm and GitHub Actions.

## Open external validation gates

These are evidence gaps, not claims of repository defects:

1. Independent authenticated penetration test across every role and two or more tenants.
2. Cloud network, DNS, certificate, firewall/WAF, secret-manager, IAM, and log-retention review.
3. Credentialed provider sandbox tests including genuine OAuth and webhook verification.
4. Off-host encrypted-backup execution and timed restore/failover exercises.
5. Load/soak and denial-of-service validation against the deployed topology.
6. GitHub private-repository CodeQL/secret protection if the repository receives GitHub Code Security;
   private repositories require that entitlement, so CI does not pretend it is currently available.

All external findings must be entered in the production-readiness evidence register with severity,
owner, due date, remediation commit, retest result, and approving reviewer.
