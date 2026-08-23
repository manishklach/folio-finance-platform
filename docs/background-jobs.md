# Durable background jobs

Folio moves report exports, provider pulls, import validation and approved import application off the
HTTP request lifecycle through a platform-level, tenant-scoped queue. The `/api/jobs/*` submission
routes require `operate`, CSRF protection, and an `Idempotency-Key`. Submission returns HTTP 202; it
does not claim the work has completed.

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

Import-stage submissions write a mode-0600 JSON source artifact below the authenticated tenant's
artifact directory and put only its path and SHA-256 digest in the private queue row; CSV content is
never copied into the platform database or returned by a job API. The worker rechecks tenant binding,
regular-file/real-path containment and the digest before parsing. A retry after the tenant batch was
committed reuses that exact file/template batch instead of duplicating it. Approved application jobs
reuse the tenant repository's whole-batch transaction and already-applied idempotency behavior.
Terminal source artifacts are deleted and audited by the worker sweep. A queued source that exceeds
`IMPORT_SOURCE_RETENTION_DAYS` (1–30; default 7) is deleted and the job becomes a dead letter rather
than processing without its evidence. The sweep also removes source files older than
`IMPORT_ORPHAN_GRACE_MINUTES` (10–1,440; default 60) that have no queue row—for example, after a
process stops between the filesystem write and database enqueue—and audits only a hash of the orphan
filename.

Report artifacts receive a deletion deadline when the worker completes the job. The worker sweeps
expired artifacts on startup and periodically thereafter, rejects paths or symbolic links outside the
configured root, removes the file, clears its download metadata, and records
`background_job_artifact_deleted` in the platform audit log. Configure the policy with
`JOB_ARTIFACT_RETENTION_DAYS` (1–3,650; default 30) and the sweep interval with
`JOB_ARTIFACT_SWEEP_MINUTES` (1–1,440; default 60). A missing file is treated as an idempotent purge;
the database evidence is still finalized.

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
- `POST /api/jobs/imports/stage` secures a source and queues mapping/validation/staging.
- `POST /api/jobs/imports/apply` queues application of an already-approved batch.

Prometheus exposes queue counts by bounded status and the oldest unfinished age. It never labels jobs
by organization, user, connection, or job ID.

## Scope boundary

CSV/PDF financial-statement exports, provider synchronization and the transactional import UI are
durable background jobs. The compatibility `/api/imports/stage`, `/api/imports/batches/:id/apply`, and
`/api/reports/*.(csv|pdf)` endpoints remain synchronous for existing API clients and retain admission
limits. The queue is backed by the single platform SQLite writer; horizontal worker scale
and regional failover require the production-database migration described in ADR-001. Job artifacts
are derived but contain financial information: the deployment owner must define retention, encrypted
storage, and backup/exclusion policy. Folio enforces the configured application-level expiry, while
storage snapshots and backups must independently honor the approved retention schedule.
