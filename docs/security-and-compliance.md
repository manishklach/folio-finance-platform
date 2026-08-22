# Security and compliance readiness

## Implemented engineering controls

- Argon2id passwords, server-side expiring sessions, secure cookie options, CSRF tokens, login throttling and lockout.
- Server-side admin/bookkeeper/approver/read-only authorization and physically separated organization databases. Organization selection comes only from a verified membership.
- SQLite foreign keys, WAL/busy timeout, posted-entry immutability triggers, journal hash verification, backups with SHA-256 manifests, and a restore verifier.
- Request/body limits, CSP and defensive headers, signed/idempotent webhooks, attachment type/size checks and non-public storage.
- Request/user/org correlated JSON logs, readiness latency, metrics, and optional Sentry error capture without default PII.
- Production secret-file enforcement for secrets mounted by a cloud vault, Kubernetes Secret, Docker secret, or equivalent manager.
- Organization data export and confirmed deletion tooling for privacy operations.

## SOC 2 evidence map

| Control area            | Repository evidence                                                              | Operational evidence still required                   |
| ----------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Logical access          | Roles, memberships, sessions, CSRF and auth integration tests                    | Quarterly access review and termination samples       |
| Change management       | Pull-request CI, pinned runtime, migrations                                      | Protected branch settings and approval records        |
| Processing integrity    | Double entry validation, immutable postings, hash verifier, reconciliation queue | Monthly close and exception-resolution samples        |
| Availability            | Health, metrics, backup/restore tooling                                          | Uptime reports, restore drills, on-call records       |
| Confidentiality/privacy | Tenant databases, safe attachments, secret mounts, export/delete tool            | Retention schedule, DPA inventory, completed requests |
| Incident response       | Runbook and structured diagnostics                                               | Tabletop exercise and incident/postmortem records     |

## Required external launch gates

These cannot be manufactured or self-attested by a coding agent and remain blocking before production financial data:

1. A named independent penetration-testing firm completes an authenticated, multi-tenant web/API test. Critical and high findings must be remediated and retested; retain the signed report and retest letter.
2. A named CPA or qualified accounting firm tests representative real contracts, including variable consideration, modifications, usage, refunds, collectability, commissions, FX and presentation. Retain their signed scope, fact patterns, conclusions and exceptions.
3. The deployment owner selects a secrets manager, configures secret-file mounts, confirms TLS termination and encrypted storage, and records key rotation evidence.
4. Legal counsel approves privacy notice, retention/deletion policy, subprocessors, DPA and breach procedures for the served jurisdictions.
5. The company assigns control owners and completes a SOC 2 readiness assessment before setting an audit period.

Until sign-off contains real parties, dates and attached evidence, Folio must be described as production-engineered but not externally certified or accountant-approved.
