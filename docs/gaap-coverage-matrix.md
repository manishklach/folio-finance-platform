# U.S. GAAP coverage matrix for SaaS, cloud, and software entities

## Scope and meaning

Folio targets recurring topics ordinarily applicable to a U.S. business entity selling SaaS, cloud, and software. The FASB Accounting Standards Codification is the authoritative source of nongovernmental U.S. GAAP. “Automated” below means Folio performs deterministic calculations and creates controlled journals. “Workflow” means Folio records facts, an accountable conclusion, policy basis, disclosures, and approval evidence for a judgment that cannot safely be inferred by software.

This matrix does not claim coverage of industry-specific banking, insurance, investment-company, utility, government, not-for-profit, pension-plan, broker-dealer, or extractive-industry guidance. SEC reporting, XBRL filing, state/local/international tax returns, statutory accounting, and audit opinions are outside scope.

| Topic               | Coverage             | Implemented result                                                                                                                                                                                                     |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ASC 105             | Control              | Policy elections are effective-dated and approved; the Codification remains the governing source.                                                                                                                      |
| ASC 205/210         | Automated + workflow | As-of balance sheet, current-period earnings, cutoff-aware trial balance, going-concern conclusion and disclosures.                                                                                                    |
| ASC 220             | Automated            | Pretax, tax, reclassification and net OCI persisted; journal posts to AOCI.                                                                                                                                            |
| ASC 230             | Automated            | Date-bounded operating, investing, financing, and net cash change from posted entries.                                                                                                                                 |
| ASC 250/275         | Workflow             | Policy/estimate facts, changes, uncertainty and disclosure conclusions are retained through policy and assessment records.                                                                                             |
| ASC 260             | Automated            | Basic EPS and treasury-stock-method incremental shares with antidilution handling for loss periods.                                                                                                                    |
| ASC 326             | Automated + judgment | Pool exposure, historical loss rate, reasonable/supportable forecast factor, qualitative factor, lifetime expected loss, and allowance true-up.                                                                        |
| ASC 340-40          | Automated            | Incremental contract acquisition cost capitalization and amortization.                                                                                                                                                 |
| ASC 350-40 / 985-20 | Automated + judgment | Software stage/feasibility policy, capitalization, useful life, amortization; cloud-implementation policy assessments.                                                                                                 |
| ASC 350 / 360       | Automated + judgment | Goodwill reporting-unit test and long-lived-asset recoverability/fair-value impairment with journals.                                                                                                                  |
| ASC 450             | Automated + judgment | Probable/estimable accrual; reasonably possible/probable disclosure flag and estimate range.                                                                                                                           |
| ASC 460             | Automated + judgment | Guarantee inception fair value, liability journal, term and maximum-exposure disclosure.                                                                                                                               |
| ASC 470             | Automated            | Debt issuance and effective-interest amortized-cost schedule with cash interest, accretion and principal journals.                                                                                                     |
| ASC 480             | Workflow             | Mandatory redemption, repurchase, variable-share obligation, temporary-equity and equity conclusions.                                                                                                                  |
| ASC 606             | Automated + judgment | Contract, performance obligations, relative SSP, variable-consideration constraint, over-time/point-in-time/usage/milestone recognition, modifications, licenses and other edge-case assessments.                      |
| ASC 718             | Automated + judgment | Grant-date award measurement, forfeiture estimate, service-period schedule, equity/liability classification, and journals. Complex market/performance condition valuation remains an external valuation input.         |
| ASC 740             | Automated + judgment | Current provision, DTA/DTL, enacted-rate inputs, valuation allowance, total tax expense and ETR. Tax return preparation and uncertain-tax-position legal conclusions remain outside scope.                             |
| ASC 805             | Automated + judgment | Acquisition-method consideration, NCI, prior interest, identifiable net assets, goodwill/bargain residual, measurement evidence and optional journal.                                                                  |
| ASC 810             | Automated + judgment | VIE indicators, power, significant economics, primary beneficiary, voting control, consolidation conclusion and NCI.                                                                                                   |
| ASC 820             | Automated + judgment | Level 1/2/3 hierarchy, valuation technique, inputs, recurring status, carrying-to-fair-value delta and optional journal. Valuation models are controlled inputs, not invented estimates.                               |
| ASC 830             | Automated            | Entity currency, transaction exchange rates, balance revaluation and translation/equity accounts.                                                                                                                      |
| ASC 842             | Automated + judgment | Short-term election, finance indicators, discounted liability, ROU asset, operating/finance expense patterns and payment schedules. Modifications and reassessments require a new approved assessment in this release. |
| ASC 855             | Workflow             | Recognized versus nonrecognized subsequent-event decision and material disclosure data.                                                                                                                                |

## Control guarantees

- Every engine amount is stored in integer cents; every posted entry must balance.
- Posted entries and lines are immutable and carry a SHA-256 content hash.
- Closed periods reject posting.
- Engine-created journals retain the signed-in actor and source Topic.
- Every GAAP table carries a non-null organization identifier in its physically isolated tenant database.
- Calculations retain their significant assumptions, policy basis, date, and journal identifier.
- As-of reports exclude later posted activity; income statements and cash flows accept a period start.

## Authoritative implementation references

- [FASB standards overview and Codification authority](https://www.fasb.org/standards)
- [FASB Topic 842 leases project](https://fasb.org/projects/current-projects/leases-398331)
- [FASB Topic 326 credit-loss transition guidance](https://fasb.org/page/PageContent?pageId=%2Fstandards%2FTransition%2Fcredit-losses-transition.html)
- [FASB Topic 326 staff Q&A on estimation methods](https://fasb.org/page/PageContent?pageId=%2Fprojects%2Fother-staff-projects%2Ffasb-staff-qatopic-326-no-1whether-the-weightedaverage.html)
- [FASB ASU 2018-07 on Topic 718 nonemployee awards](https://fasb.org/page/PageContent?pageId=%2Farchive%2Ffasb-staff-issuances%2Ffifjune2018asu-201807compensastock-comp-topic-718.html)
- [FASB Topic 740 Taxonomy implementation guide](https://xbrl.fasb.org/impdocs/IT_TIG/incometaxes.htm)
- [FASB ASU 2025-06 on internal-use software](https://storage.fasb.org/ASU%202025-06.pdf)
- [FASB Topic 805/810 accounting-acquirer update](https://fasb.org/news-and-meetings/in-the-news/business-combinations-%28topic-805%29-and-consolidation-%28topic-810%29%3A-determining-the-accounting-acquirer-in-the-acquisition-of-a-variable-interest-entity-421871)
- [FASB Topic 810 VIE targeted improvements](https://fasb.org/page/PageContent?bcpath=tff&pageId=%2Farchive%2Ffasb-staff-issuances%2Ffifoct-2018asu-201817consolidation-topic-810targeted.html)

## Required external validation

Before relying on Folio for issued financial statements, a qualified accountant must validate the configured elections, materiality, contract and award fact patterns, discount rates, useful lives, forecast support, tax conclusions, valuation inputs, consolidation scope, presentation, and disclosures. Record that approval using `docs/external-signoff-template.md` and the exact tested commit.
