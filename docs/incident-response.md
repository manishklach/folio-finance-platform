# Incident response and on-call

## Severity and ownership

- SEV-1: suspected data exposure, journal corruption, cross-tenant access, or complete outage. Page the primary on-call immediately; incident commander and security lead join within 15 minutes.
- SEV-2: material workflow degradation, delayed webhooks, reports unavailable, or close blocked. Respond within 30 minutes.
- SEV-3: isolated defect with a workaround. Triage the next business day.

The production owner must maintain a named primary and secondary on-call in the deployment system. Customer communication, security, accounting, and engineering leads are assigned in the incident ticket; do not put personal contact details in this repository.

## First 30 minutes

1. Open an incident record and preserve the request ID, organization ID, time range, and affected workflow.
2. Check `/healthz`, `/metrics`, structured application logs, and Sentry. Never paste passwords, session cookies, raw webhook bodies, or customer documents into the ticket.
3. Contain before repairing: disable the affected connector, suspend the tenant, or make the service read-only if integrity or isolation is in doubt.
4. Run `npm run verify-integrity` against a snapshot, not the live file when corruption is suspected.
5. Notify affected customers after scope is confirmed; meet contractual and statutory breach-notification timelines.

Restore using `docs/backup-restore-runbook.md`, reconcile the restored subledger to the GL, and require an approver to validate any corrective entry. Within five business days publish a blameless review containing timeline, root cause, impact, detection gap, corrective owners, and due dates.
