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
npm run dev
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the architecture, accounting invariants, and change
workflow. See [`ROADMAP.md`](ROADMAP.md) for the ordered path from this engineering MVP to a
production financial system.

## Test

```sh
npm test
```

The automated suite covers ledger balance and period controls, ASC 606 allocation and recognition, SaaS metrics, capitalized software, FX and consolidations, contract modifications, AR aging, cash application, credits, write-offs, refunds, disputes, collections, and invoice/payment void reversals.

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

This is an engineering MVP, not production accounting software. Before real financial use it needs authentication, authorization, encrypted secrets, backups, production migrations, idempotent external connectors, attachment storage, configurable fiscal calendars, tax/localization rules, formal security review, auditor validation, and review by a qualified accountant. ASC conclusions depend on the facts of each arrangement; the included policy engines demonstrate controlled workflows and are not professional accounting advice.

The OpenAI integration follows the official Responses API pattern: the model returns a schema-constrained proposal, while application code performs validation and controls posting.
