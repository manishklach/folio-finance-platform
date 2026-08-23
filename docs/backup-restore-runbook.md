# Backup and restore runbook

Run backups from the application host with read access to control, tenant and attachment volumes.
The backup command checkpoints each WAL, encrypts every database and attachment independently with
AES-256-GCM, records ciphertext and plaintext SHA-256 hashes, and authenticates the complete manifest
with HMAC-SHA-256. Production refuses a backup unless the encryption key is supplied through a secret
file and a non-secret rotation key ID is recorded.

```sh
npm run backup
```

Copy the resulting timestamped directory to encrypted, immutable off-host storage and verify its
object checksum. The production baseline is hourly control/ledger/attachment backups, with 35 daily
and 12 monthly recovery points. Monitor backup age and off-host replication outside the Folio process.

Restore into an **empty** directory; the command refuses to overwrite files and verifies every hash:

```sh
npm run restore -- --source=/secure/backups/2026-08-22T18-00-00.000Z --target=/tmp/folio-restore
```

Restore authenticates the manifest before trusting filenames, verifies encrypted and plaintext hashes,
refuses path traversal and non-empty targets, validates SQLite integrity and tenant identity, restores
attachments, rewrites organization database paths to the new restore directory, and emits
`restore-evidence.json`. The path rewrite prevents a rehearsal from reconnecting to live tenant files.

Then start a disposable Folio process with `PLATFORM_DB_PATH` and `TENANT_DB_DIR` pointing at the
restored directory. Verify `/livez` and `/readyz`, authenticate with an approved recovery account, load
the dashboard, and run `npm run verify-integrity`. Reconcile each subledger to the GL and compare
statement control totals to the backup evidence. Record the operator, off-host object version,
manifest hash, recovery duration, recovery point and outcome. Never overwrite the live or failed
database files.

## Repository drill record

Repository automation now creates an encrypted platform/tenant/attachment backup, rejects a tampered
manifest, restores into an empty directory, rebases tenant paths, verifies tenant identities and
journal hashes, and records restore evidence. This is engineering evidence only; production operators
must repeat the drill against the actual encrypted off-host store and record their named evidence ID.
