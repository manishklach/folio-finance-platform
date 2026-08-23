# CPA/controller validation process

Folio's automated tests establish engineering behavior; they do not constitute an accounting opinion.
A named CPA or qualified controller must validate the exact release candidate before live financial
use. Confidential contracts, valuation reports, credentials, signatures and personal data remain in
the approved evidence system—only access-controlled references belong in the validation pack.

## Roles and segregation

| Role                      | Responsibility                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| Product accounting owner  | Defines entity scope, policies, elections, materiality and approved fact patterns               |
| Engineering owner         | Produces the immutable commit/image, calculation traces, journals and reconciliations           |
| CPA/controller reviewer   | Independently evaluates applicable guidance, inputs, calculations, presentation and disclosures |
| Finding owner             | Remediates or documents an authorized risk acceptance and supplies retest evidence              |
| Financial-statement owner | Makes the final reliance decision after all launch gates are satisfied                          |

The reviewer must record their qualification, license/jurisdiction or controller role, relationship to
the entity, and evidence-system location. The same person may not both implement a material accounting
change and independently approve that change without a documented compensating review.

## Pack lifecycle

1. Freeze a release candidate and record its full Git commit and immutable production image digest.
2. Generate the pack with `npm run accounting-validation -- init --version=<rc-version>
--image-digest=sha256:<digest> --output=<approved-working-path>`.
3. The product accounting owner marks genuinely inapplicable Topics `out_of_scope` and links the signed
   scope basis. All other cases receive de-identified fact patterns and expected accounting memos.
4. The reviewer traces inputs through policy/election, calculation, journal, subledger, GL
   reconciliation, statement line, cutoff and disclosure evidence. Each case is recorded as `pass`,
   `pass_with_configuration`, `defect`, or `policy_decision`.
5. Every defect receives a unique finding with severity, owner and status. Remediation requires a full
   commit, a passing independent retest and a retest evidence reference. Accepted critical/high
   accounting findings remain launch blockers.
6. Re-run `npm run accounting-validation -- check --input=<pack>` throughout review. The command checks
   structure and lineage without claiming readiness.
7. After the qualified reviewer approves the pack, run `npm run accounting-validation -- gate
--input=<pack>`. This fails unless every case has a final disposition, traceable evidence, complete
   reviewer identity, no blocking finding and approved sign-off.
8. Record the restricted pack/signature identifier in `external-signoff-template.md`; do not commit the
   completed confidential pack.

## Mandatory review coverage

The generator creates one case for every supported Topic in the GAAP coverage matrix and separate
cases for the trial balance, five primary statements, GAAP disclosures, AR/billed-unbilled,
investments and fixed-assets reconciliations. Each passing case requires references for its fact
pattern, policy, source evidence, expected memo, calculation trace, journal, subledger, GL
reconciliation, statement, disclosure and significant judgment.

Suggested fact patterns must include normal, cutoff, rounding, partial, reversal, modification,
foreign-currency, closed-period and disclosure-sensitive scenarios where applicable. Reviewers should
select entity-relevant material cases rather than rely only on repository fixtures.

## Finding severity and closure

| Severity | Meaning                                                                           | Release treatment                                    |
| -------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Critical | Could materially misstate statements broadly or defeat core ledger controls       | Must be remediated and independently retested        |
| High     | Could materially misstate a Topic, statement line or required disclosure          | Must be remediated and independently retested        |
| Medium   | Limited misstatement/control gap requiring scheduled correction                   | Remediate or obtain documented authorized acceptance |
| Low      | Presentation, usability or documentation issue without material accounting effect | Track to closure or authorized acceptance            |

The machine gate validates evidence lineage and status consistency. It cannot determine whether a CPA
license is genuine, the evidence is sufficient, the Codification conclusion is correct, or a signature
is authentic; those remain external governance responsibilities.
