# GAAP engine API

All routes require an authenticated organization session. `GET` requires read access. Mutations require operator access, CSRF protection, and inherit the signed-in user as the accounting actor. Amounts ending in `_cents` are integer U.S. cents; rates are decimal values (`0.21` means 21%).

## Read model

`GET /api/gaap/overview?as_of=YYYY-MM-DD` returns policies, leases, awards, provisions, CECL pools, contingencies, fair-value measurements, debt, classification decisions, combinations, consolidation assessments, EPS, OCI, and topic judgments through the requested date.

`GET /api/gaap/disclosures?as_of=YYYY-MM-DD` returns ASC 606 rollforwards and judgments, lease and debt maturities, unrecognized compensation, the latest tax and CECL provisions, disclosed contingencies, fair-value hierarchy totals, combinations, consolidation conclusions, OCI, policies, and other judgment records.

## Engines

| Route                                      | Purpose                                        | Essential inputs                                                                          |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `POST /api/gaap/policies`                  | Effective-dated election                       | `topic`, `policy_key`, `value`, `effective_date`                                          |
| `POST /api/gaap/leases`                    | ASC 842 classification and initial measurement | lease identity, commencement, term, payments, discount rate, indicators, policy basis     |
| `POST /api/gaap/leases/recognize`          | Post due lease periods                         | `as_of`                                                                                   |
| `POST /api/gaap/stock-awards`              | ASC 718 measurement/schedule                   | award, recipient, grant date, shares, fair value/share, service months, classification    |
| `POST /api/gaap/stock-awards/recognize`    | Post due compensation                          | `as_of`                                                                                   |
| `POST /api/gaap/stock-awards/remeasure`    | Remeasure liability awards and true up expense | award, measurement date, fair value/share, elapsed service months                         |
| `POST /api/gaap/tax-provisions`            | ASC 740 provision                              | period, pretax/taxable income, statutory rate, temporary differences, valuation allowance |
| `POST /api/gaap/credit-losses`             | ASC 326 allowance                              | date and pools with exposure/loss/forecast/qualitative inputs                             |
| `POST /api/gaap/contingencies`             | ASC 450 decision                               | matter, likelihood, estimability, range and best estimate                                 |
| `POST /api/gaap/fair-value`                | ASC 820 measurement                            | key, date, carrying/fair value, hierarchy level, technique and inputs                     |
| `POST /api/gaap/debt`                      | ASC 470 issuance and schedule                  | face, proceeds, dates, stated/effective rates and frequency                               |
| `POST /api/gaap/debt/recognize`            | Post due interest/principal                    | `as_of`                                                                                   |
| `POST /api/gaap/classification`            | ASC 480 conclusion                             | instrument facts and policy basis                                                         |
| `POST /api/gaap/business-combinations`     | ASC 805 acquisition residual                   | consideration, NCI/prior interest, net identifiable amounts and measurement evidence      |
| `POST /api/gaap/consolidation-assessments` | ASC 810 conclusion                             | VIE, power, economics and voting/economic interests                                       |
| `POST /api/gaap/eps`                       | ASC 260 EPS                                    | income, preferred dividends, weighted shares and potential common shares                  |
| `POST /api/gaap/oci`                       | ASC 220 OCI/AOCI                               | category, pretax, tax and reclassification amounts                                        |
| `POST /api/gaap/impairment`                | ASC 350/360 test                               | model and carrying/fair-value or recoverability inputs                                    |
| `POST /api/gaap/going-concern`             | ASC 205-40 assessment                          | substantial-doubt and mitigation-plan facts                                               |
| `POST /api/gaap/guarantees`                | ASC 460 inception entry                        | fair value, maximum exposure, term and basis                                              |
| `POST /api/gaap/subsequent-events`         | ASC 855 assessment                             | balance-sheet/event dates, existing condition and materiality                             |
| `POST /api/gaap/assessments`               | Supported Topic judgment record                | Topic, key, date, facts, conclusion, policy basis and disclosure data                     |

## Reporting cutoffs

Financial exports accept `as_of`. Income statement and cash flow exports also accept `from`:

`GET /api/reports/income_statement.csv?from=2026-01-01&as_of=2026-12-31`

`GET /api/reports/cash_flow.pdf?from=2026-01-01&as_of=2026-12-31`

The same route supports `comprehensive_income` and `changes_in_equity` report names in CSV or PDF.

The server never accepts an organization identifier in a GAAP payload; organization scope comes only from the verified session.
