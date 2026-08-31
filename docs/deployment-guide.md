# Folio Finance Platform: end-to-end deployment guide

This guide deploys Folio's production-engineered, single-node reference topology on a Linux host.
It covers DNS, TLS, immutable images, secret files, migrations, first-administrator setup, workers,
monitoring, backups, validation, upgrades, rollback, and disaster recovery.

> **Scope boundary:** a successful deployment proves that the software is running and its engineering
> checks pass. It does not constitute a CPA opinion, security certification, legal approval, or
> authorization to process live financial data. Complete the independent launch gates in
> [production-acceptance.md](production-acceptance.md) before using production financial data.

## 1. Reference architecture and constraints

The supplied [`compose.production.yml`](../compose.production.yml) starts:

- **Caddy** as the only public service on TCP 80/443 and UDP 443, with automatic TLS.
- **Folio** as the single API/UI writer on the private Docker network.
- **Webhook worker** for leased, retryable provider webhook processing.
- **Background worker** for report exports and provider synchronization.
- **Prometheus and Alertmanager** on the private network.
- **Operations-profile jobs** for schema migration and encrypted backup.

Folio currently uses one platform SQLite database plus one SQLite ledger per tenant. Run exactly one
Folio application replica and do not place its database on NFS, SMB, or another shared filesystem.
Horizontal application scaling requires the PostgreSQL migration described in
[adr-001-production-database.md](adr-001-production-database.md).

## 2. Deployment inputs

Gather these values before starting. Keep credentials and personal operational data outside Git.

| Input                 | Example                                 | Requirement                                                   |
| --------------------- | --------------------------------------- | ------------------------------------------------------------- |
| Domain                | `folio.example.com`                     | Public DNS name dedicated to Folio                            |
| Host                  | Linux VM or bare-metal host             | Static public IP, persistent encrypted disk, outbound HTTPS   |
| Image                 | `registry.example.com/folio@sha256:...` | Registry digest, never `latest` or a mutable tag              |
| Backup key ID         | `backup-key-2026-08`                    | Non-secret rotation label                                     |
| Provider-token key ID | `provider-token-2026-08`                | Non-secret rotation label                                     |
| Alert webhook         | `https://...`                           | HTTPS receiver tested with the on-call system                 |
| Sentry DSN            | `https://public-key@host/project`       | Separate production project; must be a valid HTTPS DSN        |
| OpenAI key            | optional                                | Empty file disables AI-assisted journal drafting              |
| Bootstrap token       | generated secret                        | One-time first-administrator authorization, at least 32 bytes |

Recommended operational targets for the initial single-node deployment are at least 4 vCPU, 8 GB
RAM, and 100 GB of encrypted SSD storage. Size from staging load tests, attachment growth, backup
retention, and provider volume rather than treating these values as a guarantee.

## 3. Prepare the host

1. Install a supported Docker Engine and the Docker Compose v2 plugin from Docker's official
   instructions. Install Git, OpenSSL, curl, and the Node version pinned in [`.nvmrc`](../.nvmrc).
2. Create a non-root deployment operator with narrowly scoped `sudo` and Docker access. Harden SSH,
   disable password login, enable security updates, and configure host time synchronization.
3. Permit inbound TCP 22 only from the administration network. Permit public TCP 80/443 and UDP 443.
   Do not expose Folio port 4310, Prometheus, Alertmanager, or Docker's daemon socket.
4. Point the domain's A record (and AAAA only when IPv6 is correctly routed) to the host. Wait for DNS
   to resolve before starting Caddy so certificate issuance can succeed.
5. Create the deployment directories:

```sh
sudo install -d -m 0750 -o "$USER" -g "$USER" /opt/folio
sudo install -d -m 0700 -o "$USER" -g "$USER" /opt/folio/secrets
cd /opt/folio
git clone https://github.com/manishklach/folio-finance-platform.git app
cd app
git checkout <approved-release-tag-or-commit>
npm ci
```

Never deploy from an unreviewed moving branch. Record the exact Git commit and CI run in the release
ticket.

## 4. Build and pin the production image

Build in CI or on a trusted builder, push to the chosen registry, and resolve the immutable digest.
The following is an illustrative registry-neutral flow:

```sh
export REGISTRY_IMAGE=registry.example.com/folio
export RELEASE_TAG=<release-tag-or-commit>

docker buildx build \
  --platform linux/amd64 \
  --tag "${REGISTRY_IMAGE}:${RELEASE_TAG}" \
  --push .

docker pull "${REGISTRY_IMAGE}:${RELEASE_TAG}"
docker image inspect "${REGISTRY_IMAGE}:${RELEASE_TAG}" \
  --format '{{index .RepoDigests 0}}'
```

Record the returned `repository@sha256:<64 hex characters>` value as `FOLIO_IMAGE`. Retain the image
SBOM and vulnerability-scan evidence for the same digest. The repository CI already tests the image,
but the deployment owner must verify the published artifact and registry permissions.

## 5. Create production secret files

Create secrets on the host or materialize them from the selected secrets manager. The files below are
Compose inputs; never add them to the repository or image.

```sh
cd /opt/folio
umask 077

openssl rand -base64 32 > secrets/backup-encryption-key
openssl rand -base64 32 > secrets/provider-token-encryption-key
openssl rand -base64 48 > secrets/bootstrap-token

printf '%s' 'https://alerts.example.com/replace-with-real-secret-path' > secrets/alert-webhook-url
printf '%s' 'https://public-key@errors.example.com/project-id' > secrets/sentry-dsn

# Optional. Leave empty to disable OpenAI-assisted draft proposals.
: > secrets/openai-api-key
chmod 0600 secrets/*
```

The two encryption-key files must contain 32 random bytes encoded as base64. Store their recovery
copies in the approved key vault. Losing a backup key makes its backups unrecoverable. Changing the
provider-token key requires the documented reauthorization/rotation procedure; do not silently replace
it on a running system.

## 6. Create the deployment environment file

Create `/opt/folio/app/.env.production` with non-secret values and absolute secret-file paths:

```dotenv
NODE_ENV=production
HOST=0.0.0.0
SESSION_COOKIE_SECURE=true

FOLIO_DOMAIN=folio.example.com
PUBLIC_ORIGIN=https://folio.example.com
FOLIO_IMAGE=registry.example.com/folio@sha256:<64-hex-digest>

BACKUP_KEY_ID=backup-key-2026-08
BACKUP_ENCRYPTION_KEY_FILE=/opt/folio/secrets/backup-encryption-key
PROVIDER_TOKEN_KEY_ID=provider-token-2026-08
PROVIDER_TOKEN_ENCRYPTION_KEY_FILE=/opt/folio/secrets/provider-token-encryption-key
ALERT_WEBHOOK_URL_FILE=/opt/folio/secrets/alert-webhook-url
SENTRY_DSN_FILE=/opt/folio/secrets/sentry-dsn
OPENAI_API_KEY_FILE=/opt/folio/secrets/openai-api-key
BOOTSTRAP_TOKEN_FILE=/opt/folio/secrets/bootstrap-token

AI_MONTHLY_DRAFT_LIMIT=200
ADMISSION_GLOBAL_CONCURRENCY=64
ADMISSION_TENANT_CONCURRENCY=8
ADMISSION_HEAVY_TENANT_CONCURRENCY=2
ADMISSION_USER_REQUESTS_PER_MINUTE=240
ADMISSION_HEAVY_TENANT_REQUESTS_PER_MINUTE=30
ADMISSION_MAX_TRACKED_PRINCIPALS=10000

JOB_ARTIFACT_RETENTION_DAYS=30
IMPORT_SOURCE_RETENTION_DAYS=7
```

Load it without printing its values:

```sh
set -a
. ./.env.production
set +a
```

Protect the file with mode `0600`. It contains paths and operational settings even though secret
values remain in separate files.

## 7. Run preflight and inspect the resolved topology

```sh
cd /opt/folio/app
set -a; . ./.env.production; set +a

npm run ops:preflight
docker compose -f compose.production.yml config --quiet
docker compose -f compose.production.yml config --images
```

Preflight must return JSON with `"status":"ready"`. It rejects unsafe production cookies/origins,
loopback binding, mutable image tags, malformed encryption keys, missing files, invalid alert/Sentry
URLs, weak bootstrap tokens, and domain/origin mismatch. Stop on any failure; do not bypass preflight.

## 8. Back up and migrate

For an upgrade, first create a pre-release encrypted backup and copy it off-host. For a first install,
the backup job establishes that the secret and destination work.

```sh
docker compose -f compose.production.yml --profile operations run --rm backup

docker compose -f compose.production.yml --profile operations run --rm migrate
```

Before a live upgrade, rehearse the migration against a restored staging copy and retain the result.
Never run migration against an unidentified volume or allow two migration jobs to overlap.

## 9. Start the stack

```sh
docker compose -f compose.production.yml pull
docker compose -f compose.production.yml up -d --wait --no-build
docker compose -f compose.production.yml ps
```

`--no-build` prevents an accidental host-side rebuild from replacing the approved digest. Confirm that
`folio`, `webhook-worker`, `background-worker`, Caddy, Prometheus, and Alertmanager are running and that
the services with health checks are healthy.

## 10. Complete first-administrator setup

Keep public access restricted to the named setup operator until bootstrap is complete.

1. Open `https://<FOLIO_DOMAIN>` in a browser.
2. Enter the organization name, administrator details, strong password, and the deployment bootstrap
   token from `/opt/folio/secrets/bootstrap-token` when prompted.
3. Confirm the administrator can sign in and that `GET /setup/status` no longer reports that setup is
   required. A second setup attempt must be rejected.
4. Rotate or remove the mounted bootstrap token according to the operations policy, recreate the Folio
   service if the file changes, and record the operator, timestamp, request ID, and decision.

Transmit the bootstrap token out of band. Never paste it into tickets, shell history, chat, logs, or
the deployment prompt.

## 11. Validate the deployment

Run these checks from both the host and an external network:

```sh
curl --fail --silent --show-error https://folio.example.com/livez
curl --fail --silent --show-error https://folio.example.com/readyz
curl --fail --silent --show-error --output /dev/null https://folio.example.com/

# The edge must not expose metrics.
test "$(curl --silent --output /dev/null --write-out '%{http_code}' \
  https://folio.example.com/metrics)" = "404"

docker compose -f compose.production.yml logs --since=15m folio webhook-worker background-worker
docker compose -f compose.production.yml exec folio npm run verify-integrity
```

Also verify through the UI:

- Sign in, sign out, and organization authorization.
- Dashboard and a read-only income statement/balance sheet.
- A maker-checker journal draft and approval using distinct authorized accounts.
- Prometheus targets and alert rules on the private network.
- A synthetic Alertmanager notification and resolved notification.
- A synthetic Sentry event without PII.
- A sandbox provider synchronization and a background report export when those integrations are in
  release scope.
- Subledger-to-GL reconciliations, journal integrity, and the accounting validation gate.

Run repository gates for the exact release commit:

```sh
npm run lint
npm test
npm run build
npm run migrate:rehearse
npm run test:load
npm run accounting-validation -- check
```

## 12. Configure recurring operations

The Compose file provides the backup job but not the host scheduler or off-host replication. Configure
a systemd timer, cloud scheduler, or equivalent to run at least hourly:

```sh
cd /opt/folio/app
set -a; . ./.env.production; set +a
docker compose -f compose.production.yml --profile operations run --rm backup
```

After each successful backup, replicate the timestamped encrypted directory from the `folio_backups`
volume to immutable encrypted off-host storage and monitor both backup age and replication age.
Retain 35 daily and 12 monthly recovery points unless policy requires more.

Operational cadence:

- Weekly: automated checksum/integrity restore into an isolated empty target.
- Quarterly: named-operator restore drill and synthetic alert escalation exercise.
- Annually: regional-loss/tabletop exercise.
- Continuously: host/disk capacity, certificate renewal, service readiness, error ratio, latency,
  queue backlog/dead letters, provider freshness, backup age, and off-host replication.

Read [backup-restore-runbook.md](backup-restore-runbook.md),
[incident-response.md](incident-response.md), and [production-operations.md](production-operations.md)
before accepting on-call ownership.

## 13. Provider integrations

The base Compose file mounts the platform's shared provider-token encryption key. Live Plaid, Stripe,
Gusto, or HubSpot credentials must be added through an environment-specific Compose override or the
selected secret manager and mounted into every service that uses them, including the background
worker. Use least-privilege sandbox credentials first.

For each provider:

1. Register the exact public OAuth redirect/webhook URL.
2. Mount credentials as files; never place values in the browser, image, or Git.
3. Configure and verify webhook signatures and timestamp tolerance.
4. Complete OAuth/linking in sandbox, synchronize a bounded dataset, and resolve mapping exceptions.
5. Confirm no provider-originated event automatically posts an accounting entry.
6. Exercise token rotation, retry, dead-letter, and reconciliation flows before production enablement.

See [integrations.md](integrations.md) for the exact provider boundary and remaining launch evidence.

## 14. Release upgrade procedure

1. Approve an exact commit and immutable image digest; retain CI, image scan, accounting regression,
   migration, security, and external approval evidence.
2. Test the digest in staging with synthetic/de-identified data.
3. Announce the controlled restart window and assign release and rollback owners.
4. Run preflight, inspect disk headroom, send a test alert, create an encrypted backup, replicate it
   off-host, and verify its checksum.
5. Rehearse migrations against a restored copy, then run the production migration once.
6. Change only `FOLIO_IMAGE` to the approved new digest, pull it, and run
   `docker compose ... up -d --wait --no-build`.
7. Repeat health, login, statement, worker, monitoring, integrity, and reconciliation checks. Record
   the resulting evidence and close the maintenance window.

This topology has a short controlled restart and does not claim zero downtime.

## 15. Rollback and disaster recovery

Application rollback and data rollback are separate decisions. Never point old code at an incompatible
new schema.

### Compatible code rollback

1. Stop mutations and preserve logs/request IDs.
2. Set `FOLIO_IMAGE` to the prior approved digest.
3. Run preflight, pull the digest, and recreate the stack.
4. Verify readiness, journal integrity, statements, workers, and reconciliations.

### Data/schema recovery

1. Stop Folio and preserve the failed volume as evidence; do not overwrite it.
2. Restore the pre-release encrypted backup into a new empty directory/volume:

```sh
npm run restore -- \
  --source=/secure/backups/<timestamp> \
  --target=/tmp/folio-restore
```

3. Verify `restore-evidence.json`, SQLite integrity, tenant identity, attachments, and journal hashes.
4. Start the prior compatible image against the restored copy in isolation, validate it, then perform
   the approved cutover.
5. Reconcile through the recovery point. Accounting approves re-entered transactions; operators must
   not silently manufacture corrective journals.

The baseline objectives are a one-hour RPO and four-hour RTO, subject to measured deployment evidence.

## 16. Troubleshooting

### Caddy cannot issue a certificate

- Confirm DNS resolves to this host, ports 80/443 are reachable, and no other process owns them.
- Confirm `FOLIO_DOMAIN` contains only the hostname and `PUBLIC_ORIGIN` is its matching HTTPS origin.
- Inspect `docker compose logs caddy` without copying sensitive values into tickets.

### Folio is unhealthy or not ready

- Inspect `docker compose ps` and the Folio logs using request IDs.
- Confirm the persistent volume is writable, has disk headroom, and is mounted only by this stack.
- Run the migration job once and `verify-integrity`; do not edit SQLite files manually.
- Verify all required secret files exist, are readable by Docker, and have valid content.

### Preflight rejects the image

- `FOLIO_IMAGE` must be a registry reference containing `@sha256:` followed by exactly 64 lowercase
  hexadecimal characters. Resolve the digest after push; do not substitute a tag.

### Worker backlog or dead letters

- Correct the provider, credential, mapping, schema, or downstream condition first.
- Retry from the supported UI/worker command. Never edit queue rows or stored provider payloads.
- Confirm the eventual accounting effect is idempotent and reconciliation remains balanced.

### Disk pressure

- Stop nonessential imports/exports, verify backup replication, and expand the encrypted disk.
- Do not delete live SQLite WAL files, tenant databases, attachments, or job artifacts by hand.
- Apply approved retention through the application and backup/object-store policies.

## 17. Production handoff checklist

- [ ] Exact commit, image digest, SBOM, scan, CI, and migration evidence recorded.
- [ ] DNS, TLS, firewall, encrypted storage, least privilege, and patching verified.
- [ ] Secret files supplied from the approved manager; recovery keys escrowed and rotations tested.
- [ ] First administrator created once; bootstrap route closed; token handling recorded.
- [ ] API, webhook worker, background worker, monitoring, alerts, logs, and error tracking verified.
- [ ] Hourly encrypted backup and immutable off-host replication monitored.
- [ ] Restore drill meets measured RPO/RTO; rollback owner and procedure tested.
- [ ] Provider sandbox, webhook, mapping, retry, and reconciliation tests completed where applicable.
- [ ] Independent security, CPA/controller, privacy/legal, support, and deployment approvals attached.
- [ ] No unresolved critical/high security finding or blocking accounting validation finding remains.

The detailed reusable agent prompt is supplied in `Folio-Deployment-Agent-Prompt.docx` in this
directory. Replace its bracketed deployment inputs, then paste the prompt into an authorized coding or
operations agent that has access to the target host and registry.
