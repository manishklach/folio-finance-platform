# Contributing to Folio

Folio is a small HTTP application wrapped around a deterministic accounting engine. Preserve the
accounting invariants first; UI and integration code should call the repositories rather than
reimplementing accounting rules.

## Architecture

```text
server.js
  ├─ HTTP routing, JSON parsing, and static-file delivery
  ├─ lib/db.js
  │    ├─ SQLite schema and seeded demo ledger
  │    ├─ journal drafts, posting, periods, reports, and audit log
  │    └─ lib/accounting.js
  │         ├─ journal validation and normal-balance rules
  │         └─ canonical hashes for posted journals
  ├─ lib/saas.js
  │    ├─ ASC 606 and ASC 340-40 subledgers
  │    ├─ receivables, cash application, aging, and reconciliation
  │    └─ SaaS metrics, software costs, FX, and consolidation
  ├─ lib/ai.js
  │    └─ schema-constrained journal proposals with a local fallback
  └─ public/
       ├─ index.html
       ├─ app.js
       └─ styles.css / saas.css
```

`server.js` is the transport boundary. `lib/db.js` owns the base ledger, while `lib/saas.js` owns
domain subledgers that post through the base ledger. `public/` consumes only HTTP APIs.

## Accounting invariants

- Store money as integer cents; never use floating-point dollars in ledger logic.
- Every journal must balance before it is saved and again before it is posted.
- Posted journals are immutable from the application workflow and retain a canonical SHA-256 hash.
- Billing, cash collection, and revenue recognition are separate events.
- Every automated financial event must retain its source, journal ID, actor, and audit evidence.
- Never hide a subledger-to-general-ledger difference. Surface it as a reconciliation exception.

## Local setup

1. Install the Node version in `.nvmrc` with `nvm install` and select it with `nvm use`.
2. Run `npm ci`.
3. Optionally copy `.env.example` to `.env` and configure local values.
4. Run `npm start` and open <http://127.0.0.1:4310>.

The default database is `data/ledger.db`. The entire `data/` directory is ignored by Git. Use
`LEDGER_DB_PATH=:memory:` in tests or a task-specific path for manual QA.

## Change workflow

Before opening a pull request:

```sh
npm run lint
npm test
```

Use `npm run format` for mechanical formatting. Add `node:test` coverage for accounting behavior,
especially failure paths and GL/subledger reconciliation. API or UI changes should be tested through
their public boundary in addition to repository-level tests when practical.

Keep commits scoped. Do not commit databases, `.env` files, API keys, logs, or generated coverage.
Call out schema changes and their compatibility implications in the pull-request description.
