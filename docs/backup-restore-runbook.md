# Backup and restore runbook

Run backups from the application host with filesystem access to the control and tenant databases.
The backup command checkpoints each WAL, copies every database, and writes SHA-256 checksums.

```sh
npm run backup
```

Copy the resulting timestamped directory to encrypted off-host storage. Retention and scheduling are
deployment responsibilities; the recommended baseline is daily snapshots with 35 daily and 12
monthly restore points.

Restore into an **empty** directory; the command refuses to overwrite files and verifies every hash:

```sh
npm run restore -- --source=/secure/backups/2026-08-22T18-00-00.000Z --target=/tmp/folio-restore
```

Then start a disposable Folio process with `PLATFORM_DB_PATH` and `TENANT_DB_DIR` pointing at the
restored directory. Verify `/healthz`, authenticate with a test account, load the dashboard, and run
`npm run verify-integrity`. Record the date, operator, manifest hash, and outcome in the operations
evidence register. Never test a restore by overwriting the live database.

## Repository drill record

On 2026-08-22 the automated procedure checkpointed and backed up one control database and one tenant database, verified both SHA-256 manifest entries, and restored both into a new empty directory without overwriting the source. This proves the file and checksum workflow; production operators must repeat the drill against encrypted off-host storage and record their named operator and evidence identifier.
