import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { financialReport } from "../lib/reports.js";

const balanced = (ledger) =>
  ledger
    .getAccounts()
    .reduce(
      (sum, account) =>
        sum +
        (["asset", "expense"].includes(account.type)
          ? account.balance_cents
          : -account.balance_cents),
      0,
    );

test("ASC 842 classifies, measures, schedules, and posts an operating lease", () => {
  const ledger = createLedger(":memory:");
  const lease = ledger.createLease({
    lease_number: "HQ-001",
    description: "Headquarters",
    commencement_date: "2026-09-01",
    term_months: 24,
    monthly_payment_cents: 100_000,
    annual_discount_rate: 0.06,
    classification_indicators: {},
    policy_basis: "No finance-lease classification criterion is met.",
  });
  assert.equal(lease.classification, "operating");
  assert.equal(lease.schedule.length, 24);
  assert.ok(lease.initial_liability_cents < 2_400_000);
  assert.equal(ledger.recognizeLeaseThrough("2026-10-01").recognized_periods, 1);
  assert.equal(balanced(ledger), 0);
  ledger.close();
});

test("ASC 718 measures an equity award and recognizes grant-date compensation", () => {
  const ledger = createLedger(":memory:");
  const award = ledger.createStockAward({
    award_number: "OPT-001",
    recipient: "Employee group A",
    grant_date: "2026-08-01",
    shares: 10_000,
    fair_value_per_share_cents: 250,
    service_months: 10,
    forfeiture_rate: 0.1,
    classification: "equity",
    policy_basis: "Grant-date fair value recognized over the requisite service period.",
  });
  assert.equal(award.total_compensation_cents, 2_250_000);
  assert.equal(
    award.schedule.reduce((sum, row) => sum + row.amount_cents, 0),
    2_250_000,
  );
  assert.equal(ledger.recognizeStockCompThrough("2026-09-01").recognized_periods, 1);
  assert.equal(balanced(ledger), 0);
  ledger.close();
});

test("ASC 718 remeasures liability-classified awards through cumulative compensation", () => {
  const ledger = createLedger(":memory:");
  const award = ledger.createStockAward({
    award_number: "CASH-RSU-1",
    recipient: "Executive A",
    grant_date: "2026-01-01",
    shares: 1_000,
    fair_value_per_share_cents: 500,
    service_months: 10,
    classification: "liability",
    policy_basis: "Cash-settled award remeasured through settlement.",
  });
  ledger.recognizeStockCompThrough("2026-02-01");
  const measurement = ledger.remeasureStockAward({
    award_id: award.id,
    measurement_date: "2026-02-28",
    fair_value_per_share_cents: 700,
    service_months_elapsed: 1,
  });
  assert.equal(measurement.cumulative_compensation_cents, 70_000);
  assert.equal(measurement.adjustment_cents, 20_000);
  assert.equal(ledger.stockAward(award.id).total_compensation_cents, 700_000);
  assert.equal(balanced(ledger), 0);
  ledger.close();
});

test("ASC 740 records current and deferred tax with a valuation allowance", () => {
  const ledger = createLedger(":memory:");
  const provision = ledger.calculateTaxProvision({
    period_end: "2026-12-31",
    pretax_income_cents: 10_000_000,
    taxable_income_cents: 8_000_000,
    statutory_rate: 0.21,
    temporary_differences: [
      { kind: "deductible", amount_cents: 2_000_000 },
      { kind: "taxable", amount_cents: 500_000 },
    ],
    valuation_allowance_cents: 100_000,
    assumptions: { jurisdiction: "US federal" },
    policy_basis: "Temporary differences measured using enacted rates.",
  });
  assert.equal(provision.current_tax_cents, 1_680_000);
  assert.equal(provision.deferred_tax_asset_cents, 420_000);
  assert.equal(provision.deferred_tax_liability_cents, 105_000);
  assert.equal(provision.total_tax_expense_cents, 1_465_000);
  assert.equal(balanced(ledger), 0);
  ledger.close();
});

test("ASC 326 estimates pooled lifetime losses and adjusts the allowance", () => {
  const ledger = createLedger(":memory:");
  const estimate = ledger.estimateCreditLosses({
    as_of: "2026-08-31",
    pools: [
      {
        pool_key: "current-enterprise",
        exposure_cents: 10_000_000,
        historical_loss_rate: 0.01,
        forecast_adjustment: 1.5,
        qualitative_adjustment: 1.2,
        assumptions: { forecast: "slower collections" },
      },
    ],
  });
  assert.equal(estimate.required_allowance_cents, 180_000);
  assert.ok(estimate.journal_entry_id);
  assert.equal(balanced(ledger), 0);
  ledger.close();
});

test("ASC 450, 820, 470, and 480 persist conclusions and journal lineage", () => {
  const ledger = createLedger(":memory:");
  const contingency = ledger.assessContingency({
    matter_key: "CLAIM-1",
    as_of: "2026-08-31",
    description: "Customer claim",
    likelihood: "probable",
    estimable: true,
    low_estimate_cents: 200_000,
    high_estimate_cents: 500_000,
    best_estimate_cents: 350_000,
    policy_basis: "Probable and reasonably estimable loss.",
  });
  assert.equal(contingency.accrued_cents, 350_000);
  const fair = ledger.recordFairValue({
    measurement_key: "MMF-1",
    as_of: "2026-08-31",
    description: "Money market fund",
    fair_value_cents: 1_100_000,
    carrying_value_cents: 1_000_000,
    level: 1,
    valuation_technique: "Quoted market price",
    inputs: { ticker: "TEST" },
    asset_account_code: "1200",
    policy_basis: "Unadjusted quoted price in an active market.",
  });
  assert.ok(fair.journal_entry_id);
  const debt = ledger.createDebt({
    debt_number: "NOTE-1",
    description: "Term loan",
    issue_date: "2026-01-01",
    maturity_date: "2027-01-01",
    face_cents: 10_000_000,
    proceeds_cents: 9_800_000,
    stated_rate: 0.05,
    effective_rate: 0.071,
    payment_frequency: 2,
    policy_basis: "Amortized cost using the effective interest method.",
  });
  assert.equal(debt.schedule.length, 2);
  assert.equal(ledger.recognizeDebtThrough("2026-07-01").recognized_periods, 1);
  assert.equal(
    ledger.assessClassification({
      instrument_key: "PREF-A",
      as_of: "2026-08-31",
      instrument_type: "preferred shares",
      unconditional_redemption: true,
      policy_basis: "Mandatory redemption creates an unconditional obligation.",
    }).conclusion,
    "liability",
  );
  assert.equal(balanced(ledger), 0);
  ledger.close();
});

test("ASC 805, 810, 260, 220, and topic assessments support reporting judgments", () => {
  const ledger = createLedger(":memory:");
  const combination = ledger.recordBusinessCombination({
    acquisition_key: "ACQ-1",
    acquisition_date: "2026-08-01",
    acquiree: "Target Cloud",
    consideration_cents: 12_000_000,
    identifiable_assets_cents: 14_000_000,
    liabilities_assumed_cents: 5_000_000,
    measurement_basis: { valuation: "independent specialist" },
    policy_basis: "Acquisition method applied on the control date.",
  });
  assert.equal(combination.goodwill_cents, 3_000_000);
  const assessment = ledger.assessConsolidation({
    entity_key: "VIE-1",
    as_of: "2026-08-31",
    entity_name: "Hosting SPV",
    insufficient_equity: true,
    power: true,
    significant_economics: true,
    economic_interest_percent: 0.8,
    policy_basis: "Reporting entity has power and potentially significant economics.",
  });
  assert.equal(assessment.primary_beneficiary, 1);
  assert.equal(assessment.consolidate, 1);
  assert.equal(assessment.nci_percent, 0.2);
  const eps = ledger.calculateEps({
    period_end: "2026-12-31",
    net_income_cents: 50_000_000,
    weighted_average_shares: 1_000_000,
    potential_common_shares: [
      {
        kind: "options",
        shares: 100_000,
        exercise_price_cents: 500,
        average_market_price_cents: 1_000,
      },
    ],
  });
  assert.equal(eps.basic_eps, 0.5);
  assert.ok(eps.diluted_eps < eps.basic_eps);
  const oci = ledger.recordOci({
    item_key: "FX-OCI-1",
    period_end: "2026-08-31",
    description: "Foreign currency translation",
    category: "foreign_currency_translation",
    pretax_cents: 300_000,
  });
  assert.equal(oci.net_cents, 300_000);
  ledger.recordGaapAssessment({
    topic: "ASC 606",
    assessment_key: "LICENSE-1",
    as_of: "2026-08-31",
    facts: { functional_ip: true },
    conclusion: "Right-to-access license recognized over time.",
    policy_basis: "The entity undertakes activities that significantly affect the IP.",
    disclosure: { significant_judgment: true },
  });
  assert.equal(ledger.gaapOverview("2026-12-31").assessments.length, 1);
  assert.equal(balanced(ledger), 0);
  ledger.close();
});

test("financial reports honor as-of and period boundaries", () => {
  const ledger = createLedger(":memory:");
  const historical = ledger.trialBalance("2026-06-30");
  assert.equal(historical.find((row) => row.code === "4000").balance_cents, 4_200_000);
  const julyOnly = ledger.trialBalance("2026-07-31", "2026-07-01");
  assert.equal(julyOnly.find((row) => row.code === "4000").balance_cents, 5_900_000);
  assert.equal(
    financialReport(ledger, "income_statement", "2026-07-31", "2026-07-01").rows.find(
      (row) => row.account === "Net income",
    ).amount_cents,
    4_050_000,
  );
  assert.equal(
    financialReport(ledger, "changes_in_equity", "2026-07-31", "2026-07-01").rows.at(-1).account,
    "Ending equity",
  );
  ledger.close();
});

test("judgment engines cover impairment, guarantees, going concern, subsequent events, and disclosures", () => {
  const ledger = createLedger(":memory:");
  const impairment = ledger.assessImpairment({
    model: "long_lived_asset",
    assessment_key: "SOFTWARE-CGU-1",
    as_of: "2026-08-31",
    carrying_value_cents: 1_000_000,
    undiscounted_cash_flows_cents: 800_000,
    fair_value_cents: 600_000,
    policy_basis: "The asset group failed recoverability and was measured at fair value.",
  });
  assert.ok(impairment.journal_entry_id);
  const guarantee = ledger.recordGuarantee({
    assessment_key: "GUARANTEE-1",
    inception_date: "2026-08-31",
    fair_value_cents: 75_000,
    maximum_exposure_cents: 500_000,
    term: "24 months",
    policy_basis: "Stand-ready obligation initially measured at fair value.",
  });
  assert.ok(guarantee.journal_entry_id);
  assert.match(
    ledger.assessGoingConcern({
      assessment_key: "GC-2026",
      as_of: "2026-12-31",
      conditions_raise_substantial_doubt: true,
      plans_probable_to_be_implemented: true,
      plans_probable_to_mitigate: false,
      policy_basis: "Forecast considers obligations due within one year after issuance.",
    }).conclusion,
    /not alleviated/,
  );
  assert.equal(
    JSON.parse(
      ledger.assessSubsequentEvent({
        assessment_key: "EVENT-1",
        balance_sheet_date: "2026-12-31",
        event_date: "2027-01-15",
        condition_existed_at_balance_sheet_date: false,
        material: true,
        estimated_effect_cents: 2_000_000,
        policy_basis: "The underlying condition arose after period end.",
      }).disclosure_json,
    ).required,
    true,
  );
  const disclosure = ledger.gaapDisclosures("2026-12-31");
  assert.equal(disclosure.other_judgments.length, 4);
  assert.equal(balanced(ledger), 0);
  ledger.close();
});
