# Migration assurance

Folio treats application rollback and data rollback as separate decisions. Platform schema version 1
is the oldest supported upgrade source for the v0.2 line. Tenant databases currently use additive,
idempotent schema creation; destructive tenant-schema rollback is not supported. Restore an encrypted,
verified pre-deployment backup when a tenant data rollback is authorized.

## Automated evidence

- `npm run migrate -- --check` validates applied version numbers and canonical migration names without
  changing the database.
- `npm run migrate -- --target=N` upgrades to a supported numbered target. A lower target is rejected;
  operators must use one reviewed `--down` step at a time.
- `npm run migrate:rehearse` creates the oldest supported platform schema, loads 1,000 linked users,
  upgrades it to the latest version, checks the backfill and database integrity, rolls the latest
  migration back, and applies it again.
- The migration assurance tests corrupt history deliberately, inject a failure during a transactional
  migration, prove that schema and history roll back together, and then resume successfully.

CI runs both the clean-database migration and the oldest-schema rehearsal. Before a real deployment,
operators must still rehearse against a restored, de-identified production-shaped copy, record elapsed
time and storage growth, validate the application against that copy, and retain the backup and evidence
identifiers in the approved operations system.
