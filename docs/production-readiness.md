# Production readiness matrix

| Phase                     | Engineering status | Verification                                                                             |
| ------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| 0 Repo hygiene            | Complete           | lint/format scripts, cross-platform docs, pinned Node                                    |
| 1 Auth/authz              | Complete           | API tests cover auth, CSRF and role denial                                               |
| 2 Multi-tenancy           | Complete           | separate tenant DBs; explicit cross-org isolation test                                   |
| 3 Data safety             | Complete           | versioned control migrations, backup/restore, triggers, integrity test                   |
| 4 Ledger completeness     | Complete           | fiscal calendars, bank CSV matching, attachments, tax, PDF/CSV, close controls           |
| 5 Subledger hardening     | Complete           | idempotency, signed connectors, immediate write transactions, exception queue            |
| 6 AI controls             | Complete           | org/user quota, rationale/confidence and decision history                                |
| 7 Frontend                | Complete           | React module workspace, role-aware routes, full overview surfaces, accessible navigation |
| 8 QA/CI                   | Complete           | unit/integration tests, GitHub Actions, migration and load checks                        |
| 9 Operations              | Complete           | correlated logs, readiness, metrics, Sentry, incident runbook                            |
| 10 Compliance engineering | Complete           | secret mounts, privacy requests/export/delete, SOC 2 evidence map                        |
| External launch approvals | Pending            | independent pen test and named accountant sign-off required                              |

“Complete” means the repository contains and tests the engineering capability. It does not claim an external audit, certification, legal opinion, or professional accounting opinion.

Authentication fast-follows intentionally excluded from the current scope are SSO/OAuth and automated password-reset email delivery. Administrators can perform a manual password reset through `POST /api/admin/users/:id/password`; that operation revokes the subject's active sessions.
