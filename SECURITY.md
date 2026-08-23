# Security policy

## Reporting a vulnerability

Do not open a public issue containing vulnerability details, credentials, tenant data, or exploit
material. Report the issue privately to the repository owner through a GitHub security advisory or
another established private channel. Include the affected commit, reproduction conditions, impact,
and any suggested mitigation. Do not access data belonging to another tenant or run disruptive tests
against a live environment.

The maintainer should acknowledge a complete report within five business days, classify its severity,
record an owner, and coordinate remediation and disclosure. Confirmed incidents follow
[`docs/incident-response.md`](docs/incident-response.md).

## Supported versions

Only the current `main` branch and the most recent published release receive security fixes. This
repository is pre-production; a release is not approved for live financial data until the gates in
[`docs/production-readiness.md`](docs/production-readiness.md) are satisfied.

## Security gates

Every proposed change must pass authentication, authorization, tenant-isolation, CSRF, integrity,
backup/restore, dependency-audit, production-image, and monitoring-configuration checks. The
production image is scanned for fixed high and critical vulnerabilities. Credentialed penetration
testing and independent review are separate release gates and cannot be replaced by repository tests.
