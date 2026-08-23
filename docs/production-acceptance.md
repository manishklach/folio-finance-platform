# Production acceptance specification

This document is the authoritative launch contract for Folio. A repository feature is not
"production ready" merely because code exists or a unit test passes. Each gate below requires the
named product behavior, automated evidence, operational evidence, and—where stated—independent
approval against the exact release commit.

## Release classes

| Class                | Meaning                                                 | Required evidence                                                                                       |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Engineering complete | Implemented with repository tests and documented scope  | Passing CI and traceable test cases                                                                     |
| Pilot ready          | Safe for synthetic or de-identified design-partner data | Engineering gates, migration rehearsal, operator runbooks, no unresolved critical security findings     |
| Production ready     | Approved for live financial data                        | Every applicable gate below plus named security, accounting, deployment, privacy, and support approvals |

Folio v0.2.0 is an engineering-complete MVP. It is not yet pilot ready or production ready.

## 1. Transactional product experience

### Required daily journeys

1. Sign in, switch an authorized organization, inspect current close status, and sign out.
2. Create a balanced journal draft, attach evidence, submit it, approve/post it with a distinct
   authorized role, and see immutable audit lineage.
3. Create and modify a customer contract, bill it, recognize revenue, inspect the waterfall, and
   reconcile contract assets/deferred revenue to the GL.
4. Import or synchronize cash, match it, apply and unapply receipts, issue credits/refunds/write-offs,
   manage disputes/collections, and resolve AR-to-GL exceptions.
5. Complete investment and fixed-asset lifecycle transactions using guided forms with review steps.
6. Run the close checklist, resolve assigned exceptions, lock the period, and export all statements.
7. Configure users, policies, mappings, connectors, fiscal settings, and evidence references with
   server-enforced permissions.

### Acceptance criteria

- No primary module is a raw JSON/object renderer.
- Every mutation uses a labeled form, field help, client and server validation, confirmation for
  irreversible actions, disabled/loading states, and an accessible success/error result.
- Tables support empty, loading, error, filter, sort, pagination or bounded result states as relevant.
- Keyboard navigation, focus restoration, semantic headings, form labels, status announcements, and
  WCAG 2.2 AA contrast are verified by automated checks and a manual keyboard/screen-reader pass.
- Responsive layouts are verified at 360, 768, 1280, and 1440 CSS pixels.
- Client-side permissions are presentation only; every action remains authorized on the server.

## 2. Integration platform and initial connectors

### Common connector contract

Every connector must implement encrypted or secret-manager-backed credentials, least-privilege scopes,
connection health, cursor-based incremental synchronization, bounded retries with jitter, rate-limit
handling, idempotency, webhook signature verification where available, replay protection, normalized
records, source payload hashes, audit events, per-run metrics, pause/resume, disconnect and deletion.
No third-party secret or refresh token may be delivered to the browser or written to application logs.

### Initial target matrix

| Domain   | Initial target                                       | Required production behavior                                                                       | Explicit first-release boundary                                              |
| -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Bank     | Plaid Transactions plus CSV fallback                 | Account linking handoff, incremental transaction sync, removals/modifications, bank reconciliation | Payments initiation and treasury movement excluded                           |
| Billing  | Stripe Billing                                       | Customers, subscriptions, invoices, credits, taxes, lifecycle webhooks and backfill                | Stripe remains source for operational billing; Folio remains accounting book |
| Payroll  | Gusto or an approved provider-neutral journal import | Payroll runs, taxes, benefits, departments and cash/liability mapping                              | Payroll calculation, filing and employee self-service excluded               |
| CRM      | HubSpot                                              | Companies, deals, products and contract handoff with stage/mapping controls                        | CRM does not create posted accounting entries                                |
| Payments | Stripe Payments                                      | Charges, refunds, disputes, fees, payouts and payout reconciliation                                | Card data never enters Folio; Stripe-hosted collection only                  |

Provider selection may change only through a recorded architecture decision. Live acceptance requires
provider sandbox contract tests and a credentialed staging sync; mocks alone do not prove production
connector readiness.

Repository acceptance includes connection-specific versioned mappings into a validated journal-draft
shape, server-recomputed preview fingerprints, explicit approval notes, idempotent application and
record-linked mapping exceptions. No provider record posts a journal automatically, and the actor who
approves the provider application cannot post its resulting draft. Removed records fail closed until a
provider/domain-specific reversal policy exists. Production acceptance additionally requires native
subledger application and reconciliation fixtures for each approved provider object family.

Repository acceptance for Plaid bank transactions now includes an administrator-controlled
provider-account-to-cash-account binding, currency validation, immutable source-version lineage,
explicit operator application, exact unique matching against unused posted cash lines, pending and
exception states, idempotent replay, and modification/removal handling that invalidates a prior match
without changing a posted journal. Unmatched, ambiguous, changed-matched and removed-matched activity
is routed to the close exception queue, and unresolved activity blocks the applicable bank close
sign-off. Multiple exact candidates require an operator-selected, commit-time-revalidated match with
a retained rationale. Tolerance/date-window matching, hosted Plaid Link/token exchange, signed Plaid
webhooks and credentialed sandbox evidence remain production acceptance gates.

## 3. Imports, mappings and exception operations

Repository acceptance now includes versioned tenant fuzzy-match policies for one configured text field,
an indexed 70–99% trigram similarity search across current-file and applied-import history, retained
candidate evidence, and an operator-only accept-as-distinct action requiring a rationale. Exact natural
keys remain non-overridable and Folio never auto-merges entities. CI stages and applies the 10,000-row
maximum, rebuilds the index and proves a historical candidate lookup. Production acceptance still
requires controller-selected thresholds, manually-created/provider-native master coverage decisions,
and a deployed multi-tenant soak.

- Supported templates are versioned for chart of accounts, opening balances, customers, vendors,
  contracts, invoices, payments, bank transactions, journals, investments, and fixed assets.
- Import sequence is upload → parse → map → validate → preview → approve → idempotent apply → reconcile.
- The original file hash, template version, mapping version, actor, timestamps, row result, created object,
  and reversal/correction lineage are retained.
- Duplicate detection combines source ID, provider, tenant, payload hash, natural keys, and user-reviewed
  possible-match rules. Re-running the same approved batch cannot duplicate financial effects.
- Invalid rows never partially post. Approved valid-row subsets must be explicit and auditable.
- Exceptions have type, severity, source, amount, due date, owner, status, notes, evidence, SLA breach,
  resolution and reopen history. Material exceptions block the applicable close checklist item.

## 4. Reliability, deployment and support

### Service objectives

| Measure                  | Pilot target        | Production target                                   |
| ------------------------ | ------------------- | --------------------------------------------------- |
| Monthly availability     | 99.5%               | 99.9%, excluding announced maintenance              |
| Interactive API latency  | p95 under 750 ms    | p95 under 500 ms for non-report endpoints           |
| Webhook acknowledgement  | p95 under 2 seconds | p95 under 1 second, durable processing asynchronous |
| Connector freshness      | Under 30 minutes    | Under 15 minutes where provider permits             |
| Recovery point objective | 24 hours            | 1 hour for ledger/control data                      |
| Recovery time objective  | 8 hours             | 4 hours                                             |
| SEV-1 acknowledgement    | 30 minutes          | 15 minutes                                          |

Production evidence must include infrastructure-as-code review, isolated environments, protected
deployment credentials, migration preflight, zero-secret artifacts, health/readiness separation,
central logs/metrics/traces, alert routing, on-call schedule, status communication, daily encrypted
off-site backups, quarterly restore drills, annual regional-loss exercise, rollback rehearsal, capacity
test, dependency inventory and customer support escalation runbooks.

## 5. Security acceptance

- A repository threat model covers identity, tenants, connectors, imports, files, accounting actions,
  deployment, operators and third parties.
- CI runs lockfile installs, dependency audit, static analysis, secret scanning, migration tests,
  authorization/tenant negative tests and production build checks.
- Sessions, CSRF, authorization, object references, rate limits, webhook replay, upload content,
  formula/CSV injection, SSRF, XSS, injection, path handling and log redaction have explicit abuse tests.
- Production uses TLS, secure cookies, a secrets manager, encrypted storage/backups, key rotation,
  least-privilege service identities, protected branches, reviewed deployments and vulnerability SLAs.
- A named independent firm performs authenticated multi-tenant penetration testing. Production has no
  unresolved critical/high findings; remediation is independently retested.

## 6. Accounting, migration and failure testing

- Topic test catalogs cover normal, boundary, reversal, modification, partial, foreign-currency,
  closed-period, concurrent, duplicate and corrupted-input cases.
- Property-based invariants prove balanced journals, subledger/GL conservation, residual floors,
  idempotency and tenant isolation across generated cases.
- Every numbered migration is tested from the oldest supported release, on representative volume, with
  preflight, backup, forward verification, rollback policy and interrupted-migration recovery.
- Contract tests cover provider schema changes, pagination, duplicated/out-of-order events, throttling,
  partial outages and stale cursors.
- Load and soak tests establish supported tenant, transaction, report and connector volumes.

## 7. CPA/controller validation pack

For each applicable Topic and statement line, the reviewer receives:

1. Effective policy/election register and scope conclusion.
2. Representative fact pattern, source evidence index and expected accounting memo.
3. Input-to-calculation trace, journal entries, subledger rollforward and GL reconciliation.
4. Statement mapping, cutoff behavior, disclosure output and significant-judgment record.
5. Reviewer result: pass, pass with configuration, defect, policy decision or out of scope.
6. Finding owner, severity, remediation commit, retest result and evidence-system identifier.

A named CPA or qualified controller must validate the exact release candidate. All material defects and
policy gaps must be resolved or formally accepted by the authorized financial-statement owner. Private
contracts, credentials, signatures and reports stay in the approved evidence system, not Git.

## 8. Reserved

Workstream 8 is intentionally undefined. It is not a launch gate until the product owner supplies its
scope and acceptance criteria.

## Final release decision

The release candidate must have a requirements-to-evidence matrix with one row per criterion above.
Unknown, indirect, mocked-only, stale, or self-attested external evidence is not a pass. The named
security, accounting, deployment, privacy/legal and support owners make the production decision and
record it using `docs/external-signoff-template.md`.
