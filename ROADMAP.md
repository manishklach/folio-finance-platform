# Folio — Path to Production

The accounting engine is Folio's strongest layer. Production work should wrap, secure, and operate
that engine without weakening its deterministic ledger controls.

## Delivery order

| Phase                                | Status   | Outcome                                                                     |
| ------------------------------------ | -------- | --------------------------------------------------------------------------- |
| 0. Repository hygiene                | Complete | Portable setup, pinned tooling, lint/format gate, architecture guide        |
| 1. Authentication and authorization  | Next     | Real users, sessions, CSRF, lockout, and server-enforced roles              |
| 2. Multi-tenancy                     | Planned  | Organizations, memberships, tenant-scoped repositories, onboarding          |
| 3. Migrations, backups, immutability | Planned  | Versioned migrations, restore drills, DB guards, hash verification          |
| 4. Core ledger completeness          | Planned  | Fiscal calendars, bank reconciliation, files, tax, exports, close checklist |
| 5. Receivables hardening             | Planned  | Idempotency, signed webhooks, concurrency controls, exception queue         |
| 6. AI hardening                      | Planned  | Quotas, decision history, evaluation data, calibrated uncertainty           |
| 7. Frontend rebuild                  | Planned  | Routed components, role-aware UX, full API coverage, accessibility          |
| 8. Testing and CI/CD                 | Planned  | HTTP tests, auth isolation tests, CI gates, migration and load checks       |
| 9. Observability and operations      | Planned  | Structured logs, request IDs, health, metrics, errors, incident process     |
| 10. Compliance and launch            | Planned  | Secrets management, pen test, accountant validation, SOC 2 and privacy      |

## Dependency rules

1. Complete Phases 1 → 2 → 3 sequentially. They modify the same identity and core-data boundaries.
2. Start CI coverage during Phase 1 and expand it with every phase.
3. After Phase 3, Phases 4–7 can proceed in parallel on separate code paths.
4. Complete operational and compliance readiness only against the architecture that will launch.

## Acceptance gates

### Phase 1 — Authentication and authorization

- Every API route requires a valid authenticated session.
- Roles include `admin`, `bookkeeper`, `approver`, and `read_only`.
- Draft and posting authority are distinct; posting requires an approver or administrator.
- Cookie sessions have CSRF protection; authentication has rate limiting and lockout.
- Audit evidence records actual user identities, never demo literals.

### Phase 2 — Multi-tenancy

- Organizations and memberships determine the trusted tenant context.
- Every financial table and repository query is scoped by organization.
- Client-supplied organization identifiers never override session membership.
- Multi-entity accounting remains a substructure within a tenant.
- Automated tests prove two organizations cannot read or mutate each other's data.

### Phase 3 — Data safety

- Numbered migrations apply and roll back on a clean database.
- The production database decision—SQLite or PostgreSQL—is recorded explicitly.
- Posted journal entries and lines reject updates and deletes at the database layer.
- Scheduled verification recomputes journal hashes and surfaces mismatches.
- Backup and restore procedures are documented and successfully exercised.

### Phases 4–7 — Product completion

- Bank statements reconcile to cash ledger lines and close controls require completed evidence.
- Documents attach to invoices, contracts, and journals through production-grade object storage.
- GAAP statements export to CSV and PDF; the supported tax scope is explicit.
- External writes are idempotent, signed webhooks are traceable, and concurrent cash cannot over-apply.
- AI use has per-tenant controls and every proposal retains its human disposition.
- The frontend exposes every supported overview and receivables field with accessible, role-aware UX.

### Phase 8 — Quality gates

- Pull requests run lint, formatting, tests, and migration checks.
- HTTP integration tests cover the real server boundary.
- Authentication, authorization, and tenant isolation have explicit negative tests.
- Load tests exercise journal creation, posting, and cash application.

### Phases 9–10 — Launch gates

- Health checks, structured logs, metrics, and error tracking support incident diagnosis.
- Production secrets use a secrets manager and are never stored in source or plaintext deployment files.
- A qualified accountant validates revenue conclusions against real contract fact patterns.
- A third-party penetration test has no unresolved critical findings.
- Applicable SOC 2, GDPR, and CCPA controls have named owners and evidence.

Folio remains an engineering system until every applicable launch gate has independent security and
accounting validation.
