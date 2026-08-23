# Durable background jobs

Folio moves report exports and provider pulls off the HTTP request lifecycle through a platform-level,
tenant-scoped queue. `POST /api/jobs/reports` and `POST /api/jobs/provider-syncs` require `operate`,
CSRF protection, and an `Idempotency-Key`. Submission returns HTTP 202; it does not claim the work
has completed.

## Lifecycle and invariants

`queued → processing → completed` is the success path. A failed attempt becomes `retry` with capped
exponential delay and becomes `dead_letter` after its job-specific attempt limit. A processing lease
that expires is reclaimed as a retry. Operators may cancel only queued/retrying jobs and may explicitly
retry only dead letters; both actions are audited. Completion, retry, cancellation, and tenant lookup
use conditional SQL updates so stale workers and cross-tenant identifiers fail closed.

Report workers validate the report type, output format, and date bounds again, open the verified
tenant database, generate the artifact under `JOB_ARTIFACT_DIR/<org>/<job>/`, and atomically rename it
into place. The API checks both job tenancy and artifact-root containment before download. Provider
jobs resolve the connection inside that tenant ledger and use the existing provider adapter,
credential reference, cursor, source-record staging, and integration-exception semantics.

Run a worker with:

```sh
npm run jobs:worker
```

Production Compose runs it as a separate, read-only-root service. Provider credential secret files
must be mounted into that worker and their reference variables added through the deployment-specific
Compose overlay; Folio never stores credential values in the job request or platform database.

## API

- `GET /api/jobs?status=&kind=&limit=` lists only the authenticated organization.
- `GET /api/jobs/:id` returns safe lifecycle/result metadata without request payloads or filesystem paths.
- `GET /api/jobs/:id/download` streams only a completed artifact for the current organization.
- `POST /api/jobs/:id/cancel` cancels queued/retrying work.
- `POST /api/jobs/:id/retry` requeues a reviewed dead letter and resets its attempts.

Prometheus exposes queue counts by bounded status and the oldest unfinished age. It never labels jobs
by organization, user, connection, or job ID.

## Scope boundary

CSV/PDF financial-statement exports and provider synchronization are durable background jobs. Import
stage/apply and the compatibility `/api/reports/*.(csv|pdf)` endpoints remain synchronous and retain
admission limits. The queue is backed by the single platform SQLite writer; horizontal worker scale
and regional failover require the production-database migration described in ADR-001. Job artifacts
are derived but contain financial information: the deployment owner must define retention, encrypted
storage, backup/exclusion, and defensible deletion. Automatic artifact retention deletion is not
implemented in this release.
