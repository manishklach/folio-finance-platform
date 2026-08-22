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
- ARR, MRR, NRR, GRR, churn, expansion, contraction, bookings, billings, and ACV
- Gross margin, CAC, LTV, burn multiple, magic number, and Rule of 40
- Operating, investing, and financing cash-flow classification
- Multi-entity and multi-currency reporting, FX revaluation, and intercompany eliminations

AI suggestions never post automatically. The server validates account IDs, amount shape, and debit/credit equality before saving a draft, then validates again before posting.

## Run

Requires Node.js 22.5 or newer. No package installation is needed.

```powershell
cd C:\Users\ManishKL\Documents\Playground\codex-ledger
npm start
```

Open <http://127.0.0.1:4310>.

To enable OpenAI-generated drafts:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
$env:OPENAI_MODEL = "gpt-5.6" # optional
npm start
```

Without an API key, the same interface uses a deliberately narrow deterministic classifier for common revenue, payroll, cloud, software, marketing, prepaid, cash, and payable transactions.

## Test

```powershell
npm test
```

## Important scope boundary

This is an engineering MVP, not production accounting software. Before real financial use it needs authentication, authorization, encrypted secrets, backups, production migrations, idempotent external connectors, attachment storage, configurable fiscal calendars, tax/localization rules, formal security review, auditor validation, and review by a qualified accountant. ASC conclusions depend on the facts of each arrangement; the included policy engines demonstrate controlled workflows and are not professional accounting advice.

The OpenAI integration follows the official Responses API pattern: the model returns a schema-constrained proposal, while application code performs validation and controls posting.
