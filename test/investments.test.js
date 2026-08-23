import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";

const policy = "Controller-approved classification memo with instrument terms and ASC analysis.";

function createDebt(ledger, overrides = {}) {
  return ledger.createInvestment({
    instrument_number: "UST-001",
    name: "US Treasury note",
    issuer: "United States Treasury",
    security_type: "debt",
    accounting_model: "held_to_maturity",
    acquisition_date: "2026-01-01",
    maturity_date: "2027-01-01",
    face_value_cents: 100_000,
    stated_rate: 0.04,
    effective_yield: 0.05,
    payment_frequency: 2,
    positive_intent_and_ability_to_hold: true,
    policy_basis: policy,
    ...overrides,
  });
}

test("investment classification validates cash equivalents and Topic 320 intent", () => {
  const ledger = createLedger(":memory:");
  assert.throws(
    () =>
      ledger.createInvestment({
        instrument_number: "BAD",
        name: "Long CD",
        issuer: "Bank",
        security_type: "cash_equivalent",
        accounting_model: "cash_equivalent",
        acquisition_date: "2026-01-01",
        original_maturity_days: 120,
        policy_basis: policy,
      }),
    /three months or less/,
  );
  assert.throws(
    () =>
      createDebt(ledger, {
        instrument_number: "BAD-HTM",
        positive_intent_and_ability_to_hold: false,
      }),
    /positive intent and ability/,
  );
  ledger.close();
});

test("HTM purchases create lots and effective-yield journals that reconcile", () => {
  const ledger = createLedger(":memory:");
  const debt = createDebt(ledger);
  const purchase = ledger.purchaseInvestment({
    instrument_id: debt.id,
    lot_number: "UST-001-A",
    trade_date: "2026-01-01",
    settlement_date: "2026-01-02",
    units: 100,
    purchase_price_cents: 98_000,
    transaction_cost_cents: 200,
  });
  assert.equal(purchase.instrument.amortized_cost_cents, 98_200);
  assert.equal(purchase.yield_schedule.length, 2);
  const accrual = ledger.accrueInvestmentInterest({
    instrument_id: debt.id,
    as_of: "2026-03-31",
    cash_interest_cents: 1_000,
    effective_interest_cents: 1_228,
  });
  assert.equal(accrual.amount_cents, 1_228);
  const recognized = ledger.recognizeInvestmentYieldThrough("2026-07-01");
  assert.equal(recognized.length, 1);
  assert.equal(ledger.investment(debt.id).yield_schedule[0].status, "posted");
  assert.equal(
    ledger.trialBalance("2026-07-01").find((row) => row.code === "1680").balance_cents,
    0,
  );
  assert.deepEqual(
    ledger.investmentReconciliation("2026-07-01").map((row) => row.difference_cents),
    [0],
  );
  assert.equal(ledger.verifyIntegrity().valid, true);
  ledger.close();
});

test("AFS debt records fair-value changes in AOCI and recycles OCI on sale", () => {
  const ledger = createLedger(":memory:");
  const afs = createDebt(ledger, {
    instrument_number: "CORP-AFS",
    name: "Corporate bond",
    issuer: "Acme Corp",
    accounting_model: "available_for_sale",
    positive_intent_and_ability_to_hold: false,
  });
  ledger.purchaseInvestment({
    instrument_id: afs.id,
    lot_number: "AFS-A",
    trade_date: "2026-01-01",
    units: 10,
    purchase_price_cents: 100_000,
  });
  const measurement = ledger.measureInvestment({
    instrument_id: afs.id,
    as_of: "2026-03-31",
    fair_value_cents: 106_000,
    level: 2,
    valuation_technique: "Matrix pricing",
    inputs: { benchmark: "observable credit spread" },
    policy_basis: policy,
  });
  assert.equal(measurement.oci_cents, 6_000);
  assert.equal(ledger.investment(afs.id).accumulated_oci_cents, 6_000);
  const sale = ledger.sellInvestment({
    instrument_id: afs.id,
    trade_date: "2026-04-01",
    units: 10,
    proceeds_cents: 107_000,
  });
  assert.equal(sale.realized_gain_loss_cents, 7_000);
  assert.equal(ledger.investment(afs.id).accumulated_oci_cents, 0);
  assert.equal(
    ledger.ociItems("2026-04-01").reduce((sum, item) => sum + item.net_cents, 0),
    0,
  );
  assert.equal(ledger.investmentReconciliation("2026-04-01")[0].reconciled, true);
  ledger.close();
});

test("Topic 321 equity securities remeasure through earnings and support specific-lot disposal", () => {
  const ledger = createLedger(":memory:");
  const equity = ledger.createInvestment({
    instrument_number: "EQ-001",
    name: "Listed shares",
    issuer: "Public SaaS",
    security_type: "equity",
    accounting_model: "equity_fair_value",
    acquisition_date: "2026-01-01",
    readily_determinable_fair_value: true,
    fair_value_level: 1,
    policy_basis: policy,
  });
  ledger.purchaseInvestment({
    instrument_id: equity.id,
    lot_number: "EQ-A",
    trade_date: "2026-01-02",
    units: 100,
    purchase_price_cents: 50_000,
    transaction_cost_cents: 500,
  });
  const measured = ledger.measureInvestment({
    instrument_id: equity.id,
    as_of: "2026-03-31",
    fair_value_cents: 55_000,
    level: 1,
    valuation_technique: "Quoted market price",
    inputs: { exchange: "NASDAQ" },
    policy_basis: policy,
  });
  assert.equal(measured.earnings_cents, 5_000);
  const sale = ledger.sellInvestment({
    instrument_id: equity.id,
    trade_date: "2026-04-01",
    units: 25,
    proceeds_cents: 14_000,
  });
  assert.equal(sale.realized_gain_loss_cents, 1_500);
  assert.equal(ledger.investment(equity.id).lots[0].remaining_units, 75);
  ledger.close();
});

test("equity-method earnings, basis amortization, and dividends adjust carrying value", () => {
  const ledger = createLedger(":memory:");
  const investee = ledger.createInvestment({
    instrument_number: "EM-001",
    name: "Strategic affiliate",
    issuer: "Affiliate LLC",
    security_type: "partnership",
    accounting_model: "equity_method",
    acquisition_date: "2026-01-01",
    ownership_percent: 30,
    significant_influence: true,
    policy_basis: policy,
  });
  ledger.purchaseInvestment({
    instrument_id: investee.id,
    lot_number: "EM-A",
    trade_date: "2026-01-01",
    units: 30,
    purchase_price_cents: 300_000,
  });
  const period = ledger.recordEquityMethodPeriod({
    instrument_id: investee.id,
    period_end: "2026-03-31",
    investee_income_cents: 100_000,
    basis_difference_amortization_cents: 2_000,
    dividends_cents: 5_000,
    dividend_return_of_capital_cents: 2_000,
    policy_basis: policy,
  });
  assert.equal(period.investor_share_cents, 30_000);
  assert.equal(period.carrying_value_after_cents, 323_000);
  assert.deepEqual(ledger.cashFlow("2026-03-31", "2026-03-31"), {
    operating_cents: 3_000,
    investing_cents: 2_000,
    financing_cents: 0,
    net_change_cents: 5_000,
  });
  assert.equal(ledger.investmentReconciliation("2026-03-31")[0].difference_cents, 0);
  ledger.close();
});

test("ASC 326 limits AFS allowance and records HTM lifetime expected credit losses", () => {
  const ledger = createLedger(":memory:");
  const htm = createDebt(ledger);
  ledger.purchaseInvestment({
    instrument_id: htm.id,
    lot_number: "HTM-A",
    trade_date: "2026-01-01",
    units: 1,
    purchase_price_cents: 98_000,
  });
  const estimate = ledger.assessInvestmentCreditLoss({
    instrument_id: htm.id,
    as_of: "2026-03-31",
    fair_value_cents: 94_000,
    expected_loss_cents: 3_500,
    method: "PD/LGD discounted cash flow",
    assumptions: { forecast_years: 2 },
  });
  assert.equal(estimate.allowance_after_cents, 3_500);
  const allowance = ledger.trialBalance("2026-03-31").find((row) => row.code === "1660");
  assert.equal(allowance.balance_cents, -3_500);

  const afs = createDebt(ledger, {
    instrument_number: "AFS-LOSS",
    accounting_model: "available_for_sale",
    positive_intent_and_ability_to_hold: false,
  });
  ledger.purchaseInvestment({
    instrument_id: afs.id,
    lot_number: "AFS-LOSS-A",
    trade_date: "2026-01-01",
    units: 1,
    purchase_price_cents: 100_000,
  });
  const limited = ledger.assessInvestmentCreditLoss({
    instrument_id: afs.id,
    as_of: "2026-03-31",
    fair_value_cents: 98_000,
    expected_loss_cents: 8_000,
    method: "Discounted cash flows",
    assumptions: {},
  });
  assert.equal(limited.allowance_after_cents, 2_000);
  ledger.close();
});

test("tax-credit investments use proportional amortization in income-tax expense", () => {
  const ledger = createLedger(":memory:");
  const taxCredit = ledger.createInvestment({
    instrument_number: "TC-001",
    name: "Solar tax-credit fund",
    issuer: "Renewable Fund LP",
    security_type: "tax_credit",
    accounting_model: "proportional_amortization",
    acquisition_date: "2026-01-01",
    ownership_percent: 5,
    tax_credits_probable: true,
    substantially_all_benefits_are_tax: true,
    projected_yield_positive: true,
    limited_liability_and_capital_at_risk: true,
    proportional_amortization_elected: true,
    policy_basis: policy,
  });
  ledger.purchaseInvestment({
    instrument_id: taxCredit.id,
    lot_number: "TC-A",
    trade_date: "2026-01-01",
    units: 1,
    purchase_price_cents: 100_000,
  });
  const period = ledger.recordProportionalAmortizationPeriod({
    instrument_id: taxCredit.id,
    period_end: "2026-03-31",
    investment_amortization_cents: 12_000,
    tax_credits_cents: 15_000,
    other_tax_benefits_cents: 1_000,
    policy_basis: policy,
  });
  assert.equal(period.net_tax_expense_benefit_cents, -4_000);
  assert.equal(period.carrying_value_after_cents, 88_000);
  assert.equal(ledger.investmentReconciliation("2026-03-31")[0].reconciled, true);
  ledger.close();
});

test("equity-method impairment establishes a new basis and influence changes transition models", () => {
  const ledger = createLedger(":memory:");
  const investee = ledger.createInvestment({
    instrument_number: "EM-TRANS",
    name: "Strategic company",
    issuer: "Private Cloud Inc",
    security_type: "equity",
    accounting_model: "equity_method",
    acquisition_date: "2026-01-01",
    ownership_percent: 25,
    significant_influence: true,
    policy_basis: policy,
  });
  ledger.purchaseInvestment({
    instrument_id: investee.id,
    lot_number: "EM-T-A",
    trade_date: "2026-01-01",
    units: 25,
    purchase_price_cents: 200_000,
  });
  const impaired = ledger.assessEquityMethodImpairment({
    instrument_id: investee.id,
    as_of: "2026-03-31",
    fair_value_cents: 170_000,
    other_than_temporary: true,
    valuation_technique: "Discounted cash flow",
    inputs: { forecast: "board-approved" },
    policy_basis: policy,
  });
  assert.equal(impaired.impairment_cents, 30_000);
  const transition = ledger.transitionInvestmentModel({
    instrument_id: investee.id,
    transition_date: "2026-04-01",
    new_accounting_model: "equity_fair_value",
    fair_value_cents: 180_000,
    reason: "Board representation ended and significant influence was lost",
    policy_basis: policy,
  });
  assert.equal(transition.earnings_adjustment_cents, 10_000);
  assert.equal(ledger.investment(investee.id).accounting_model, "equity_fair_value");
  assert.equal(
    ledger.investmentReconciliation("2026-04-01").every((row) => row.reconciled),
    true,
  );
  ledger.close();
});

test("cash-flow reporting classifies securities as investing and excludes cash-equivalent transfers", () => {
  const ledger = createLedger(":memory:");
  const debt = createDebt(ledger);
  ledger.purchaseInvestment({
    instrument_id: debt.id,
    lot_number: "CF-HTM",
    trade_date: "2026-01-01",
    units: 1,
    purchase_price_cents: 98_000,
  });
  const cashEquivalent = ledger.createInvestment({
    instrument_number: "MMF-001",
    name: "Government money market instrument",
    issuer: "Treasury fund",
    security_type: "cash_equivalent",
    accounting_model: "cash_equivalent",
    acquisition_date: "2026-01-03",
    original_maturity_days: 30,
    readily_convertible_to_known_cash: true,
    insignificant_value_change_risk: true,
    policy_basis: policy,
  });
  ledger.purchaseInvestment({
    instrument_id: cashEquivalent.id,
    lot_number: "MMF-A",
    trade_date: "2026-01-03",
    units: 1,
    purchase_price_cents: 10_000,
  });
  const cashFlow = ledger.cashFlow("2026-01-31", "2026-01-01");
  assert.equal(cashFlow.investing_cents, -98_000);
  assert.equal(cashFlow.net_change_cents, -98_000);
  ledger.close();
});
