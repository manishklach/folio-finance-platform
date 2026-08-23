# Accounting edge and invariant test catalog

This catalog maps the Phase 19 accounting and failure-mode requirements to executable evidence. A
category is **direct** only when a named automated test exercises it; documentation or implementation
alone is not counted as proof.

| Category                  | Status   | Direct evidence                                                                                                                             |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal processing         | Direct   | ledger posting, ASC 606 allocation, billing/recognition, investment purchase/yield and fixed-asset acquisition tests                        |
| Boundary and rounding     | Direct   | `property: relative-SSP allocations are exact, deterministic, and never negative`; half-month and units-of-production depreciation tests    |
| Reversals                 | Direct   | invoice/payment void, refunds, investment sale, asset disposal and ARO settlement tests                                                     |
| Contract modifications    | Direct   | usage, milestone, extension, cancellation and renewal test; prospective modification schedules                                              |
| Partial processing        | Direct   | partial payments, credits, write-offs, partial asset disposals and approved valid-row import subsets                                        |
| Foreign currency          | Direct   | FX revaluation, idempotent rerun, OCI and intercompany elimination tests                                                                    |
| Closed periods            | Direct   | `prevents posting into a closed period`; close checklist and period lock tests                                                              |
| Concurrent actions        | Direct   | concurrent cash application and first-administrator bootstrap tests                                                                         |
| Duplicate/replayed inputs | Direct   | HTTP idempotency, signed webhook replay, import file/row duplicate and generated tenant-bound idempotency tests                             |
| Corrupted input/history   | Direct   | formula-like import rejection, journal hash tampering, migration-history corruption and interrupted-migration tests                         |
| Balanced journals         | Property | 500 generated validator cases and 40 generated posted batches with database integrity verification                                          |
| ASC 606 conservation      | Property | 100 generated multi-obligation contracts; allocation and revenue schedules conserve every cent                                              |
| Residual floors           | Property | 1,000 generated weighted allocations, including the formerly negative `[2; 3,3,3,1]` rounding boundary                                      |
| Tenant isolation          | Property | 25 generated tenant identity pairs plus full HTTP cross-tenant negative tests                                                               |
| Idempotency               | Property | 100 generated request/tenant combinations prove exact replay and reject cross-request reuse                                                 |
| Provider failures         | Partial  | retry, pagination, cursor and fixture contracts exist; live throttling, partial outage and stale-cursor sandbox evidence remains            |
| Representative load/soak  | Partial  | CI gates 250 posted journals plus stage/apply/reindex/candidate lookup at the 10,000-row import ceiling; deployed multi-tenant soak remains |

Generated tests use deterministic failure seeds and shrinking from `fast-check`; a failing CI result
prints the seed and minimized counterexample needed for exact replay. This catalog does not replace CPA
review of fact patterns or live provider and deployment exercises.
