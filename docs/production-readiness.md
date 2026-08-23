# Production readiness matrix

| Phase                     | Engineering status | Verification                                                                                                                               |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 Repo hygiene            | Complete           | lint/format scripts, cross-platform docs, pinned Node                                                                                      |
| 1 Auth/authz              | Complete           | API tests cover auth, CSRF and role denial                                                                                                 |
| 2 Multi-tenancy           | Complete           | separate tenant DBs; explicit cross-org isolation test                                                                                     |
| 3 Data safety             | Complete           | versioned control migrations, backup/restore, triggers, integrity test                                                                     |
| 4 Ledger completeness     | Complete           | fiscal calendars, bank CSV matching, attachments, tax, PDF/CSV, close controls                                                             |
| 5 Subledger hardening     | Complete           | idempotency, signed connectors, immediate write transactions, exception queue                                                              |
| 6 AI controls             | Complete           | org/user quota, rationale/confidence and decision history                                                                                  |
| 7 Frontend foundation     | Complete           | React shell and role-aware read surfaces; transactional rebuild remains active                                                             |
| 8 QA/CI                   | Complete           | unit/integration tests, GitHub Actions, migration and load checks                                                                          |
| 9 Operations foundation   | Complete           | correlated logs, basic readiness/metrics, Sentry hook and incident runbook                                                                 |
| 10 Compliance engineering | Complete           | secret mounts, privacy requests/export/delete, SOC 2 evidence map                                                                          |
| 11 SaaS GAAP engine       | Complete           | ASC measurement subledgers, policy judgments, disclosures, six statements, cutoff tests                                                    |
| Transactional UX          | Active             | guided mutation workflows, design system and accessibility evidence required                                                               |
| Integration/import ops    | Active             | connector/run foundation and controlled ten-template imports shipped; live provider adapters, visual mapping and scale evidence remain     |
| Production operations     | Active             | hardened Compose/TLS topology, metrics/alerts and authenticated encrypted restore shipped; credentialed hosting and named exercises remain |
| Security assurance        | Active             | repository review, threat model, abuse regressions and image scan shipped; credentialed pen test and independent retest remain             |
| Accounting assurance      | Active             | migration/property suites and CPA pack/findings gate shipped; named reviewer execution and signed evidence remain                          |

“Complete” means the repository contains and tests the engineering capability. It does not claim an external audit, certification, legal opinion, or professional accounting opinion.

The complete and controlling gate definitions are in [`production-acceptance.md`](production-acceptance.md).
Earlier engineering phases remain useful foundations but do not prove pilot or production readiness.

Authentication fast-follows intentionally excluded from the current scope are SSO/OAuth and automated password-reset email delivery. Administrators can perform a manual password reset through `POST /api/admin/users/:id/password`; that operation revokes the subject's active sessions.
