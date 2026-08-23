# Folio — Path to Production

The accounting engine is Folio's strongest layer. Production work should wrap, secure, and operate
that engine without weakening its deterministic ledger controls.

## Delivery order

| Phase                                | Status   | Outcome                                                                       |
| ------------------------------------ | -------- | ----------------------------------------------------------------------------- |
| 0. Repository hygiene                | Complete | Portable setup, pinned tooling, lint/format gate, architecture guide          |
| 1. Authentication and authorization  | Complete | Real users, sessions, CSRF, lockout, and server-enforced roles                |
| 2. Multi-tenancy                     | Complete | Organizations, memberships, isolated tenant databases, onboarding             |
| 3. Migrations, backups, immutability | Complete | Versioned migrations, restore drills, DB guards, hash verification            |
| 4. Core ledger completeness          | Complete | Fiscal calendars, bank reconciliation, files, tax, exports, close checklist   |
| 5. Receivables hardening             | Complete | Idempotency, signed webhooks, concurrency controls, exception queue           |
| 6. AI hardening                      | Complete | Quotas, decision history, evaluation data, calibrated uncertainty             |
| 7. Frontend foundation               | Complete | React shell and role-aware read surfaces                                      |
| 8. Testing and CI/CD                 | Complete | HTTP tests, auth isolation tests, CI gates, migration and load checks         |
| 9. Observability foundation          | Complete | Structured logs, request IDs, health, metrics, errors, incident process       |
| 10. Compliance engineering           | Complete | Secret mounts, SOC 2 evidence map, privacy tools and external gate templates  |
| 11. SaaS GAAP compliance engine      | Complete | Applicable Topic engines, judgments, disclosures, statements, APIs and tests  |
| 12. Investments subledger            | Complete | ASC 305/320/321/323/325/326/820 positions, accounting, APIs, UI and tests     |
| 13. Fixed assets subledger           | Complete | PP&E, depreciation, CIP, ASC 360/410/835-20, controls, APIs, UI and tests     |
| 14. Transactional product UX         | Active   | Guided daily workflows, accessibility, responsive tables/forms, design system |
| 15. External integrations            | Pending  | Bank, billing, payroll, CRM and payments connector platform                   |
| 16. Import and exception operations  | Pending  | Mapping, validation, idempotent apply, reconciliation workbench               |
| 17. Production operations            | Pending  | Hosting, SLOs, monitoring, DR exercises, release/rollback and support         |
| 18. Security hardening               | Pending  | Threat model, abuse tests, scanning, remediation and independent retest       |
| 19. Edge and migration assurance     | Pending  | Complex accounting, upgrades, failure injection, load and provider contracts  |
| 20. Accounting validation            | Pending  | CPA/controller test packs, findings, remediation and signed evidence          |
| Independent launch approvals         | Pending  | Pen test, accounting, legal/privacy, deployment and support sign-off          |

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

The authoritative acceptance criteria are in `docs/production-acceptance.md`. Folio remains an
engineering system until every applicable launch gate has current independent security and accounting
validation against the exact release candidate.
