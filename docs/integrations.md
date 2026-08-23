# Integration platform and initial connector design

This document describes the engineering foundation introduced after v0.2.0. Provider HTTP adapters
and a tenant-scoped synchronization worker are implemented and contract-tested against versioned
fixtures. This does not claim that live Plaid, Stripe, Gusto, or HubSpot OAuth connections are
production-ready: hosted authorization handoffs, verified provider-specific webhooks, scheduling,
provider sandbox certification and credentialed staging evidence remain required before a connector
can carry live financial data.

## Initial matrix

| Provider | Domain               | Folio-owned normalized scope                                                              | Cursor model                           | Current implementation                                                                                    | Still required for live use                                                                                    |
| -------- | -------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Plaid    | Bank                 | Accounts, transaction additions, modifications and removals                               | `transactions_sync` cursor             | Versioned request/normalization adapter, full pagination restart, staged outcomes, retries and exceptions | Link handoff/token exchange, JWT webhook verification, sandbox certification and credentialed staging evidence |
| Stripe   | Billing and payments | Customers, subscriptions, invoices, credits, charges, refunds, disputes, fees and payouts | Created-time/ID pagination plus events | Resource adapter with ID paging, created watermark, normalization, retries and staged outcomes            | OAuth/restricted-key exchange, raw-body signature verification, event replay and payout reconciliation         |
| Gusto    | Payroll              | Companies, payroll runs, taxes, benefits and departments                                  | Processed-date watermark plus page     | Versioned payroll adapter, header-driven paging, total normalization, retries and staged outcomes         | OAuth lifecycle, verified events, detailed payroll receipts, GL mappings and sandbox certification             |
| HubSpot  | CRM                  | Companies, deals, products and line items                                                 | Updated-after watermark plus `after`   | Versioned search adapter, property normalization, updated watermark, retries and staged outcomes          | OAuth lifecycle, signed webhooks, association expansion and contract-handoff review                            |

The provider behavior assumptions above follow the vendors' current official documentation:
[Plaid transaction sync](https://plaid.com/docs/transactions/sync-migration/),
[Plaid webhook verification](https://plaid.com/docs/api/webhooks/webhook-verification/),
[Stripe webhook signatures](https://docs.stripe.com/webhooks/signature),
[Gusto authentication](https://docs.gusto.com/embedded-payroll/docs/authentication), and
[HubSpot request signatures](https://developers.hubspot.com/docs/apps/legacy-apps/authentication/validating-requests).
They must be revalidated when a provider adapter is certified.

## Common state and security contract

Connections move through `configured → active → paused/error → active`, with terminal
`disconnected`. Configuration stores only secret-manager reference names; secret-looking keys are
rejected from general settings. Production configuration also requires the provider's external
account/company identifier. Tokens and provider secrets must never be sent to the browser or written
to Folio tables or logs.

Configuration, mapping and connection-state changes require the administrator role. Reads require an
authenticated tenant member. Synchronization and exception operations require accounting-operator
access. Existing tenant database isolation, session authorization and CSRF controls apply to every
route.

## Data flow

```mermaid
flowchart LR
  P[Provider adapter or signed webhook] --> V[Verify identity, scope and replay key]
  V --> R[Start tenant-scoped sync run]
  R --> N[Normalize added, modified and removed records]
  N --> D{Unique source version?}
  D -->|Yes| S[Stage immutable source outcome and payload hash]
  D -->|Replay| I[Count duplicate without another financial effect]
  S --> M[Apply versioned mappings and domain validation]
  M -->|Valid and approved| A[Create auditable Folio transaction]
  M -->|Failure| E[Exception/dead-letter queue]
  A --> C[Subledger-to-GL reconciliation]
  E --> O[Owner resolves, ignores or retries]
  C --> X[Close controls and run metrics]
  O --> X
```

The provider adapters resolve JSON credentials only through the configured secret reference, never
through connection settings or browser payloads. They enforce bounded pages, 30-second request
timeouts, capped exponential retries for throttling and transient server failures, sanitized error
messages, immutable source hashes and idempotent replay. Plaid's documented mutation-during-paging
condition restarts the entire update from the original persisted cursor; already-staged records are
deduplicated. The CLI worker can be run for one tenant connection with:

```sh
npm run integrations:sync -- --database=data/tenants/<tenant>.db --connection=<connection-id>
```

The scheduler must supply one JSON credential secret file/environment reference for the selected
connection. Automatic mapping application and hosted authorization remain separate controlled
workflows.

## API inventory

| Method and route                                | Purpose                                          | Permission |
| ----------------------------------------------- | ------------------------------------------------ | ---------- |
| `GET /api/integrations/catalog`                 | Approved provider capabilities                   | Read       |
| `GET /api/integrations/overview`                | Connections, recent runs, exceptions and metrics | Read       |
| `GET /api/integrations/connections`             | Tenant connector register                        | Read       |
| `POST /api/integrations/connections`            | Configure a reference-only connection            | Admin      |
| `POST /api/integrations/connections/status`     | Activate, pause or disconnect                    | Admin      |
| `POST /api/integrations/sync-runs`              | Open a bounded sync run                          | Operate    |
| `POST /api/integrations/sync-runs/:id/page`     | Idempotently stage a cursor page                 | Operate    |
| `POST /api/integrations/sync-runs/:id/fail`     | Fail a run and create an exception               | Operate    |
| `GET /api/integrations/connections/:id/records` | Inspect staged normalized records                | Read       |
| `POST /api/integrations/mappings`               | Create a versioned mapping                       | Admin      |
| `GET /api/integrations/exceptions`              | Inspect integration dead letters                 | Read       |
| `POST /api/integrations/exceptions/status`      | Retry, resolve or ignore an exception            | Operate    |

## Verification in this increment

Automated tests cover the four-provider catalog, secret-reference boundary, production account-ID
requirement, legal state changes, cursor advancement, added/modified/removed records, replay
idempotency, failed-run exception creation, operator resolution, provider schema fixtures, paging,
Plaid cursor mutation recovery, rate-limit retry and secret-safe failures. Live acceptance additionally
requires provider-hosted sandbox contract tests, webhook tamper/replay tests, worker crash recovery and
a credentialed staging synchronization.
