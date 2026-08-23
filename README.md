# Folio — Codex Ledger

A working accounting-system MVP built around a deterministic double-entry ledger and an optional OpenAI-assisted journal-drafting workflow.

## What works

- Double-entry journal validation in integer cents
- Draft → human approval → posted workflow
- Immutable posted entries with SHA-256 integrity hashes
- Closed-period posting controls
- Chart of accounts and posted balances
- Live income statement and balance sheet
- Audit log for journal creation and posting
- AI-assisted draft generation through the OpenAI Responses API
- Safe local rules fallback when no API key is configured
- Seeded example company and accounting activity

### SaaS, cloud, and software accounting

- ASC 606 customer contracts and five-step control view
- Performance obligations with relative-SSP allocation
- Constrained variable consideration
- Separate billing and revenue-recognition subledgers
- Straight-line, usage, milestone, and point-in-time recognition
- Deferred revenue, contract assets, revenue waterfalls, and RPO
- Contract cancellations, prospective extensions, price changes, renewals, and cumulative catch-up treatment
- ASC 340-40 commission capitalization and amortization
- ASC 350-40 internal-use software stage decisions and amortization
- ASC 985-20 external software feasibility decisions
- Customer, product, contract, invoice, usage, and subscription subledgers
- Invoice lifecycle with due dates, open/overdue/partial/paid/disputed/void status, and reversing journals
- Customer receipts, unapplied cash, invoice-level cash application, payment voids, and customer refunds
- Credit memos split between deferred revenue and contra-revenue based on recognition to date
- Approved AR write-offs, dispute opening/resolution, and collection activity with next-action queues
- AR aging in current, 1–30, 31–60, 61–90, and 90+ day buckets
- Customer and contract-level billed, credited, net billed, recognized, unbilled, deferred, and outstanding reconciliation
- General-ledger-to-AR-subledger and unapplied-cash reconciliation with visible exceptions
- ARR, MRR, NRR, GRR, churn, expansion, contraction, bookings, billings, and ACV
- Gross margin, CAC, LTV, burn multiple, magic number, and Rule of 40
- Operating, investing, and financing cash-flow classification
- Multi-entity and multi-currency reporting, FX revaluation, and intercompany eliminations

### U.S. GAAP compliance engine

- ASC 842 lease classification, present-value measurement, ROU assets, lease liabilities, and operating/finance schedules
- ASC 718 grant-date share-based compensation schedules for equity- and liability-classified awards
- ASC 740 current/deferred tax provisions, temporary differences, valuation allowances, and effective tax rates
- ASC 326 pooled lifetime credit-loss estimates with historical, forecast, and qualitative factors
- ASC 450 loss contingency accrual and disclosure decisions
- ASC 820 fair-value hierarchy, valuation inputs, recurring status, and remeasurement journals
- ASC 470 effective-interest debt schedules and ASC 480 liability/equity assessments
- ASC 805 acquisition-method residuals, identifiable net assets, goodwill, and bargain gains
- ASC 810 VIE/primary-beneficiary, voting-interest, consolidation, and NCI assessments
- ASC 260 basic and diluted EPS, ASC 220 OCI/AOCI, ASC 350/360 impairment, ASC 460 guarantees, ASC 205-40 going concern, and ASC 855 subsequent events
- Effective-dated policy elections, persisted facts, conclusions, disclosures, approver identity, journal lineage, and tenant isolation across every engine table

### Investments

- Separate ASC 305/320/321/323/325/326/820 instrument, position, lot, and transaction subledger
- Trading, AFS, HTM, fair-value equity, measurement-alternative, equity-method, tax-credit, cash-equivalent, and other classifications
- Effective-yield debt schedules, interest/dividend income, specific-lot/FIFO sales, realized results, and AFS AOCI recycling
- Fair-value-through-earnings, AFS OCI, HTM/AFS credit-loss allowances, equity-method periods and impairment, and proportional amortization
- Accounting-model transitions, GL reconciliation, maturity/model/Level 3/credit-loss disclosures, secured APIs, UI workspace, and immutable journal lineage

The detailed classification matrix, system flow, API inventory, and scope boundaries are in [`docs/investments.md`](docs/investments.md).

### Fixed assets

- Separate PP&E class, asset/component, depreciation, CIP, ARO, inventory-count, and transaction subledger
- Effective capitalization thresholds, below-threshold expense treatment, direct acquisitions, and placed-in-service controls
- Straight-line, declining-balance, double-declining and units-of-production depreciation with exact-cent conventions
- Prospective life/method/residual changes, capital improvements, class/location/custody transfers, and versioned schedules
- ASC 360 held-and-used impairment, held-for-sale measurement/recovery, return to use, and full/partial disposals
- ASC 835-20 qualifying CIP interest and ASC 410 ARO recognition, accretion, remeasurement, and settlement
- Physical counts, PP&E/accumulated-depreciation/CIP/ARO reconciliation, rollforwards, disclosures, APIs and UI

The detailed fixed-assets matrix, lifecycle flowchart, API inventory, and scope boundaries are in [`docs/fixed-assets.md`](docs/fixed-assets.md).

### Integration operations foundation

- Tenant-scoped connection lifecycle for Plaid, Stripe, Gusto, and HubSpot targets
- Secret-manager reference boundaries with no provider credential values in the browser or ledger
- Cursor-based synchronization runs with idempotent added, modified, and removed source records
- Concrete Plaid, Stripe, Gusto, and HubSpot HTTP adapters with bounded paging, throttling retries,
  normalized source outcomes, safe failures, and a tenant-scoped CLI synchronization worker
- Versioned mapping definitions, payload hashes, run metrics, and resolvable exception/dead-letter queues
- Transactional provider-record workbench with mapping previews, stale-preview protection, approval
  notes, record-linked exceptions, and idempotent draft-journal creation without automatic posting
- Administrator-only configuration and operator-scoped synchronization controls

The exact implemented boundary, provider matrix, flowchart, API inventory, and remaining live-provider
work are in [`docs/integrations.md`](docs/integrations.md).

### Controlled imports and exception operations

- Ten versioned templates spanning accounts, opening balances, customers, contracts, invoices,
  payments, bank transactions, journal drafts, investments, and fixed assets
- Target-to-source field mappings, typed normalization, previews, file/row hashes, and formula-injection
  protection
- Natural-key and exact-file duplicate prevention with repeat-safe application
- Explicit clean-batch or valid-row-subset approval and atomic rollback on any application failure
- Created-entity lineage, mapping versions, operator identity, row outcomes, and resolvable exceptions

The template matrix, workflow, permissions, validation controls, and remaining pilot boundaries are in
[`docs/imports.md`](docs/imports.md).

The exact supported and excluded scope is maintained in [`docs/gaap-coverage-matrix.md`](docs/gaap-coverage-matrix.md). The complete processing and close flow is illustrated in [`docs/gaap-system-flow.md`](docs/gaap-system-flow.md), and request contracts are in [`docs/gaap-api.md`](docs/gaap-api.md).

AI suggestions never post automatically. The server validates account IDs, amount shape, and debit/credit equality before saving a draft, then validates again before posting.

## Run

Folio pins Node.js in [`.nvmrc`](.nvmrc). From a fresh clone:

```sh
git clone https://github.com/manishklach/folio-saas-accounting.git
cd folio-saas-accounting
nvm install
nvm use
npm ci
cp .env.example .env
npm start
```

The `.env` copy is optional for the default local configuration. Windows users who do not use a
POSIX shell can copy `.env.example` to `.env` with File Explorer or PowerShell.

Open <http://127.0.0.1:4310>.

To enable OpenAI-generated drafts, set these values in `.env` or in your shell environment:

```sh
cp .env.example .env
# Edit .env and set OPENAI_API_KEY. OPENAI_MODEL is optional.
npm start
```

Without an API key, the same interface uses a deliberately narrow deterministic classifier for common revenue, payroll, cloud, software, marketing, prepaid, cash, and payable transactions.

## Development

```sh
npm run lint
npm test
npm run build
npm run dev
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the architecture, accounting invariants, and change
workflow. See [`ROADMAP.md`](ROADMAP.md) for the ordered path from this engineering MVP to a
production financial system. The completed engineering matrix and remaining independent launch gates are in [`docs/production-readiness.md`](docs/production-readiness.md), [`docs/security-and-compliance.md`](docs/security-and-compliance.md), and the evidence-based [`docs/security-best-practices-report.md`](docs/security-best-practices-report.md).
The daily-journey coverage, import workbench flow, interaction controls and unproven accessibility
gates are tracked in [`docs/transactional-ux.md`](docs/transactional-ux.md).
The repository-grounded trust boundaries, attacker model, abuse paths and prioritized mitigations are
in [`docs/codex-ledger-threat-model.md`](docs/codex-ledger-threat-model.md).

Operational commands include `npm run migrate`, `npm run migrate:rehearse`, `npm run backup`,
`npm run restore -- --source=<backup> --target=<empty-directory>`, `npm run ops:preflight`,
`npm run verify-integrity`, `npm run test:load`, `npm run accounting-validation -- init|check|gate`,
and `npm run privacy -- export|delete ...`.

The single-node TLS/container topology, production preflight, Prometheus/Alertmanager rules, encrypted
backup and restore drills, release/rollback steps, SLOs and remaining external operations gates are in
[`docs/production-operations.md`](docs/production-operations.md).
Authenticated workloads have configurable per-user rate limits plus process, tenant, and expensive-job
concurrency bulkheads. These are single-process safeguards; edge/WAF controls and shared scale-out
limiting remain deployment and architecture gates documented in the operations guide.
Report exports and provider synchronization have tenant-scoped durable jobs with leases, retries,
dead letters, audited operator actions, a separate worker, queue alerts, and a transactional Reports &
jobs UI. See [`docs/background-jobs.md`](docs/background-jobs.md) for APIs and residual scope.
Production first-administrator setup requires a secret-manager-mounted, 32-byte-or-longer bootstrap
token entered once in the setup screen; local development may omit it.
Platform upgrade, drift detection, rollback, and interrupted-migration guarantees are documented in
[`docs/migration-assurance.md`](docs/migration-assurance.md).
The qualified-accountant review pack, finding lifecycle and machine-enforced evidence gate are in
[`docs/accounting-validation-process.md`](docs/accounting-validation-process.md).

## Test

```sh
npm test
```

The automated suite covers ledger balance and period controls, ASC 606 allocation and recognition, SaaS metrics, capitalized software, leases, stock compensation, tax provisions, credit losses, contingencies, fair value, debt, classification, business combinations, VIEs, EPS, OCI, investments, fixed assets, depreciation, CIP, impairment, AROs, physical counts, reporting cutoffs, FX and consolidations, contract modifications, AR aging, cash application, credits, write-offs, refunds, disputes, collections, and invoice/payment void reversals. Generated property tests exercise cents rounding, journal balance, ASC 606 conservation, residual floors, idempotency, and tenant binding; see [`docs/accounting-edge-test-catalog.md`](docs/accounting-edge-test-catalog.md).

## Receivables API

- `GET /api/receivables?as_of=YYYY-MM-DD` — invoice register, aging, payments, collections, disputes, customer/contract rollups, and GL reconciliations
- `POST /api/invoices` — create and post an invoice
- `POST /api/receivables/payments` — receive cash, optionally applying it to an invoice
- `POST /api/receivables/applications` — apply existing unapplied cash
- `POST /api/receivables/credits` — post a credit memo
- `POST /api/receivables/write-offs` — post an approved AR write-off
- `POST /api/receivables/refunds` — refund applied or unapplied customer cash
- `POST /api/receivables/disputes` and `/disputes/resolve` — manage invoice disputes
- `POST /api/receivables/collections` and `/collections/complete` — manage collection follow-ups
- `POST /api/invoices/:id/void` and `/api/receivables/payments/:id/void` — post controlled reversals while preserving audit history

## Important scope boundary

This is an engineering system, not a CPA opinion or a substitute for professional judgment. Authentication, authorization, tenant isolation, encrypted-secret integration, backups, migrations, idempotency, attachment evidence, fiscal calendars, close controls, and audit trails are implemented. Real financial use still requires configuration to the entity's facts, valuation/tax evidence, a formal security review, deployment approval, and validation by a qualified accountant. ASC conclusions depend on the facts of each arrangement; the engines enforce calculations and retain accountable judgments but cannot determine whether source facts are complete or correct.

The OpenAI integration follows the official Responses API pattern: the model returns a schema-constrained proposal, while application code performs validation and controls posting.

## License

Folio is proprietary software. Copyright © 2026 ManishKL. All rights reserved. See [`LICENSE`](LICENSE).
