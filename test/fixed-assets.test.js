import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";

const policy =
  "Controller-approved PP&E policy supported by invoice, receiving, and intended-use evidence.";

function acquireComputer(ledger, overrides = {}) {
  return ledger.acquireFixedAsset({
    asset_number: "FA-001",
    class_code: "COMPUTER",
    description: "Production compute cluster",
    acquisition_date: "2026-01-15",
    placed_in_service_date: "2026-01-15",
    cost_cents: 1_200_000,
    useful_life_months: 12,
    residual_value_cents: 0,
    depreciation_method: "straight_line",
    depreciation_convention: "full_month",
    location: "Seattle DC",
    custodian: "Infrastructure",
    department: "Engineering",
    qualifying_ppe: true,
    policy_basis: policy,
    ...overrides,
  });
}

test("capitalization policy expenses below-threshold property and capitalizes qualifying assets", () => {
  const ledger = createLedger(":memory:");
  ledger.setFixedAssetPolicy({
    effective_date: "2026-01-01",
    capitalization_threshold_cents: 100_000,
    group_purchase_threshold_cents: 500_000,
    default_convention: "full_month",
    policy_basis: policy,
  });
  const expensed = ledger.acquireFixedAsset({
    asset_number: "FA-SMALL",
    class_code: "FURNITURE",
    description: "Single office chair",
    acquisition_date: "2026-01-10",
    placed_in_service_date: "2026-01-10",
    cost_cents: 40_000,
    policy_basis: policy,
  });
  assert.equal(expensed.status, "expensed");
  assert.equal(expensed.original_cost_cents, 0);
  const asset = acquireComputer(ledger);
  assert.equal(asset.status, "in_service");
  assert.equal(asset.schedule.length, 12);
  assert.equal(
    asset.schedule.reduce((sum, row) => sum + row.depreciation_cents, 0),
    1_200_000,
  );
  ledger.close();
});

test("monthly depreciation posts exactly and reconciles the asset register to the GL", () => {
  const ledger = createLedger(":memory:");
  const asset = acquireComputer(ledger);
  const posted = ledger.recognizeDepreciationThrough("2026-03-31");
  assert.equal(posted.length, 3);
  const refreshed = ledger.fixedAsset(asset.id);
  assert.equal(refreshed.accumulated_depreciation_cents, 300_000);
  assert.equal(refreshed.net_book_value_cents, 900_000);
  assert.equal(ledger.fixedAssetReconciliation("2026-03-31").reconciled, true);
  assert.equal(ledger.verifyIntegrity().valid, true);
  ledger.close();
});

test("half-month convention and units-of-production both preserve exact depreciable basis", () => {
  const ledger = createLedger(":memory:");
  const half = acquireComputer(ledger, {
    asset_number: "FA-HALF",
    cost_cents: 1_000_001,
    useful_life_months: 4,
    depreciation_convention: "half_month",
  });
  assert.equal(half.schedule.length, 5);
  assert.equal(
    half.schedule.reduce((sum, row) => sum + row.depreciation_cents, 0),
    1_000_001,
  );
  const machine = ledger.acquireFixedAsset({
    asset_number: "FA-UOP",
    class_code: "MACHINERY",
    description: "Test appliance",
    acquisition_date: "2026-01-01",
    placed_in_service_date: "2026-01-01",
    cost_cents: 900_000,
    residual_value_cents: 100_000,
    depreciation_method: "units_of_production",
    useful_life_months: 60,
    production_capacity: 10_000,
    qualifying_ppe: true,
    policy_basis: policy,
  });
  const usage = ledger.recordAssetUsage({
    asset_id: machine.id,
    period_end: "2026-01-31",
    units: 2_500,
  });
  assert.equal(usage.amount_cents, 200_000);
  assert.equal(ledger.fixedAsset(machine.id).net_book_value_cents, 700_000);
  ledger.close();
});

test("improvements, estimate changes, and class/location transfers retain prospective history", () => {
  const ledger = createLedger(":memory:");
  const item = acquireComputer(ledger);
  ledger.recognizeDepreciationThrough("2026-02-28");
  const improvement = ledger.addFixedAssetImprovement({
    asset_id: item.id,
    date: "2026-03-01",
    amount_cents: 300_000,
    increases_capacity: true,
    new_remaining_life_months: 15,
    estimate_change_reason: "Capacity expansion extends expected service",
    policy_basis: policy,
  });
  assert.equal(improvement.asset.capitalized_improvements_cents, 300_000);
  const estimate = ledger.changeFixedAssetEstimate({
    asset_id: item.id,
    effective_date: "2026-04-01",
    new_remaining_life_months: 18,
    new_residual_value_cents: 50_000,
    reason: "Updated engineering maintenance forecast",
    policy_basis: policy,
  });
  assert.equal(estimate.new_remaining_life_months, 18);
  const transfer = ledger.transferFixedAsset({
    asset_id: item.id,
    transfer_date: "2026-04-02",
    new_class_code: "MACHINERY",
    location: "Portland Lab",
    custodian: "Hardware QA",
    policy_basis: policy,
  });
  assert.equal(transfer.transaction_type, "transfer");
  assert.equal(ledger.fixedAsset(item.id).class_code, "MACHINERY");
  assert.equal(ledger.fixedAssetReconciliation("2026-04-02").reconciled, true);
  ledger.close();
});

test("CIP accumulates qualifying costs and interest, suspends, and transfers completed cost", () => {
  const ledger = createLedger(":memory:");
  const project = ledger.createCipProject({
    project_number: "CIP-001",
    name: "Private cloud facility",
    description: "Build-out of owned compute facility",
    asset_class_code: "BUILDING",
    construction_start_date: "2026-01-01",
    qualifying_asset: true,
    policy_basis: policy,
  });
  ledger.addCipCost({
    project_id: project.id,
    cost_date: "2026-01-15",
    cost_type: "contractor",
    amount_cents: 2_000_000,
    description: "General contractor progress payment",
    policy_basis: policy,
  });
  ledger.capitalizeCipInterest({
    project_id: project.id,
    period_end: "2026-01-31",
    amount_cents: 50_000,
    interest_cost_incurred_cents: 70_000,
    avoidable_interest_cents: 50_000,
  });
  ledger.setCipStatus({
    project_id: project.id,
    status: "suspended",
    date: "2026-02-01",
    reason: "Construction paused",
  });
  const completed = ledger.placeCipInService({
    project_id: project.id,
    placed_in_service_date: "2026-03-01",
    asset_number: "FA-BLDG-1",
    description: "Private cloud facility",
    useful_life_months: 240,
    policy_basis: policy,
  });
  assert.equal(completed.asset.original_cost_cents, 2_050_000);
  assert.equal(completed.project.status, "placed_in_service");
  assert.equal(ledger.fixedAssetReconciliation("2026-03-01").reconciled, true);
  ledger.close();
});

test("ASC 360 impairment, held-for-sale remeasurement, and disposal clear carrying amounts", () => {
  const ledger = createLedger(":memory:");
  const item = acquireComputer(ledger, { cost_cents: 1_000_000, useful_life_months: 10 });
  ledger.recognizeDepreciationThrough("2026-01-31");
  const impairment = ledger.assessFixedAssetImpairment({
    asset_id: item.id,
    as_of: "2026-02-28",
    model: "held_and_used",
    undiscounted_cash_flows_cents: 700_000,
    fair_value_cents: 650_000,
    level: 3,
    valuation_technique: "Discounted cash flow",
    inputs: { forecast: "board-approved" },
    policy_basis: policy,
  });
  assert.equal(impairment.impairment_cents, 250_000);
  const held = ledger.assessFixedAssetImpairment({
    asset_id: item.id,
    as_of: "2026-03-31",
    model: "held_for_sale",
    fair_value_cents: 620_000,
    cost_to_sell_cents: 20_000,
    management_committed: true,
    available_for_immediate_sale: true,
    sale_probable_within_one_year: true,
    actively_marketed: true,
    unlikely_plan_changes: true,
    level: 2,
    valuation_technique: "Market approach",
    inputs: { broker_quote: true },
    policy_basis: policy,
  });
  assert.equal(held.impairment_cents, 50_000);
  ledger.remeasureHeldForSale({
    asset_id: item.id,
    as_of: "2026-04-30",
    fair_value_cents: 660_000,
    cost_to_sell_cents: 10_000,
  });
  const disposal = ledger.disposeFixedAsset({
    asset_id: item.id,
    disposal_date: "2026-05-01",
    proceeds_cents: 680_000,
    aro_treatment_documented: true,
  });
  assert.equal(disposal.gain_loss_cents, 30_000);
  assert.equal(ledger.fixedAsset(item.id).status, "disposed");
  assert.equal(ledger.fixedAssetReconciliation("2026-05-01").reconciled, true);
  ledger.close();
});

test("ASC 410 capitalizes, accretes, remeasures, and settles asset retirement obligations", () => {
  const ledger = createLedger(":memory:");
  const item = acquireComputer(ledger, {
    asset_number: "FA-ARO",
    cost_cents: 1_000_000,
    useful_life_months: 24,
  });
  const obligation = ledger.recognizeAssetRetirementObligation({
    asset_id: item.id,
    obligation_number: "ARO-001",
    recognition_date: "2026-01-15",
    expected_settlement_date: "2027-01-15",
    initial_fair_value_cents: 100_000,
    credit_adjusted_risk_free_rate: 0.12,
    legal_basis: "Contract requires equipment removal and site restoration",
    valuation_inputs: { expected_cash: 112_000 },
  });
  assert.equal(obligation.liability_cents, 100_000);
  assert.equal(ledger.recognizeAroAccretionThrough("2026-02-28").length, 1);
  const remeasured = ledger.remeasureAssetRetirementObligation({
    aro_id: obligation.id,
    as_of: "2026-03-01",
    new_liability_cents: 105_000,
    reason: "Updated restoration cost estimate",
  });
  assert.equal(remeasured.liability_cents, 105_000);
  const settled = ledger.settleAssetRetirementObligation({
    aro_id: obligation.id,
    settlement_date: "2026-03-15",
    settlement_cents: 103_000,
  });
  assert.equal(settled.status, "settled");
  assert.equal(ledger.fixedAssetReconciliation("2026-03-15").reconciled, true);
  ledger.close();
});

test("physical inventory captures custody evidence and reports exceptions", () => {
  const ledger = createLedger(":memory:");
  const first = acquireComputer(ledger);
  const second = acquireComputer(ledger, { asset_number: "FA-002", description: "Backup cluster" });
  acquireComputer(ledger, { asset_number: "FA-003", description: "Unscanned cluster" });
  const count = ledger.startFixedAssetInventoryCount({
    count_number: "COUNT-2026",
    count_date: "2026-06-30",
    location: "Seattle DC",
    instructions: "Scan tags and inspect condition",
  });
  ledger.observeFixedAsset({
    count_id: count.id,
    asset_id: first.id,
    result: "found",
    observed_location: "Seattle DC",
    observed_custodian: "Infrastructure",
  });
  ledger.observeFixedAsset({
    count_id: count.id,
    asset_id: second.id,
    result: "missing",
    condition_notes: "Tag not located; investigation opened",
    evidence: { ticket: "SEC-42" },
  });
  const completed = ledger.completeFixedAssetInventoryCount({ count_id: count.id });
  assert.equal(completed.status, "completed");
  assert.equal(ledger.fixedAssetDisclosures("2026-06-30").inventory_exceptions.length, 2);
  ledger.close();
});

test("component assets, partial disposals, and return from held for sale remain controlled", () => {
  const ledger = createLedger(":memory:");
  const parent = ledger.acquireFixedAsset({
    asset_number: "FA-PARENT",
    class_code: "BUILDING",
    description: "Owned operations building",
    acquisition_date: "2026-01-01",
    placed_in_service_date: "2026-01-01",
    cost_cents: 5_000_000,
    useful_life_months: 120,
    qualifying_ppe: true,
    policy_basis: policy,
  });
  const component = ledger.acquireFixedAsset({
    asset_number: "FA-COMP",
    parent_asset_id: parent.id,
    class_code: "MACHINERY",
    description: "Building cooling component",
    acquisition_date: "2026-01-01",
    placed_in_service_date: "2026-01-01",
    cost_cents: 1_000_000,
    useful_life_months: 60,
    quantity: 2,
    qualifying_ppe: true,
    policy_basis: policy,
  });
  assert.equal(ledger.fixedAsset(parent.id).components.length, 1);
  ledger.disposeFixedAsset({
    asset_id: component.id,
    disposal_date: "2026-02-01",
    portion_percent: 50,
    proceeds_cents: 400_000,
    aro_treatment_documented: true,
  });
  assert.equal(ledger.fixedAsset(component.id).quantity, 1);
  ledger.assessFixedAssetImpairment({
    asset_id: parent.id,
    as_of: "2026-03-01",
    model: "held_for_sale",
    fair_value_cents: 5_100_000,
    cost_to_sell_cents: 100_000,
    management_committed: true,
    available_for_immediate_sale: true,
    sale_probable_within_one_year: true,
    actively_marketed: true,
    unlikely_plan_changes: true,
    valuation_technique: "Market approach",
    policy_basis: policy,
  });
  ledger.returnAssetToHeldAndUsed({
    asset_id: parent.id,
    as_of: "2026-04-01",
    adjusted_carrying_without_held_for_sale_cents: 4_950_000,
    recoverable_amount_cents: 5_000_000,
    remaining_life_months: 117,
    reason: "Buyer withdrew and management resumed operating use",
  });
  assert.equal(ledger.fixedAsset(parent.id).status, "in_service");
  assert.equal(ledger.fixedAssetReconciliation("2026-04-01").reconciled, true);
  ledger.close();
});

test("abandoned CIP is written off with project evidence and reconciles to zero", () => {
  const ledger = createLedger(":memory:");
  const project = ledger.createCipProject({
    project_number: "CIP-ABANDON",
    name: "Cancelled lab",
    description: "Pre-construction lab work",
    asset_class_code: "BUILDING",
    construction_start_date: "2026-01-01",
    qualifying_asset: true,
    policy_basis: policy,
  });
  ledger.addCipCost({
    project_id: project.id,
    cost_date: "2026-01-15",
    cost_type: "contractor",
    amount_cents: 250_000,
    description: "Design-build mobilization",
  });
  const abandoned = ledger.abandonCipProject({
    project_id: project.id,
    date: "2026-02-01",
    reason: "Board cancelled the facility plan",
    evidence: { approval: "board-minutes" },
  });
  assert.equal(abandoned.status, "abandoned");
  assert.equal(abandoned.accumulated_cost_cents, 0);
  assert.equal(ledger.fixedAssetReconciliation("2026-02-01").reconciled, true);
  ledger.close();
});
