import test from "node:test";
import assert from "node:assert/strict";
import { createLedger } from "../lib/db.js";

test("ASC 606 allocates constrained consideration by relative SSP exactly", () => {
  const ledger=createLedger(":memory:",{seed:true});
  const contract=ledger.getContract(1);
  assert.equal(contract.obligations.reduce((s,o)=>s+o.allocated_price_cents,0),15_500_000);
  const scheduled=ledger.revenueSchedules().filter(s=>contract.obligations.some(o=>o.id===s.obligation_id)).reduce((s,x)=>s+x.amount_cents,0);
  const usageAllocation=contract.obligations.find(o=>o.recognition_method==="usage").allocated_price_cents;
  assert.equal(scheduled,15_500_000-usageAllocation+620_000);
  ledger.close();
});

test("billing and recognition remain separate and produce an auditable waterfall", () => {
  const ledger=createLedger(":memory:",{seed:true});
  const before=ledger.deferredRollforward();
  assert.equal(before.billings_cents,22_700_000);
  assert.equal(before.revenue_cents,0);
  const result=ledger.recognizeThrough("2026-08-22");
  assert.ok(result.recognized_schedules>=6);
  const after=ledger.deferredRollforward();
  assert.ok(after.revenue_cents>0);
  assert.equal(ledger.revenueWaterfall().some(row=>row.recognized_cents>0),true);
  assert.equal(ledger.getAccounts().reduce((s,a)=>s+(a.type==="asset"||a.type==="expense"?a.balance_cents:-a.balance_cents),0),0);
  ledger.close();
});

test("SaaS metrics calculate ARR, retention, CAC, LTV and Rule of 40 inputs", () => {
  const ledger=createLedger(":memory:",{seed:true});
  const metrics=ledger.metrics();
  assert.equal(metrics.mrr_cents,2_150_000);
  assert.equal(metrics.arr_cents,25_800_000);
  assert.ok(metrics.nrr>1);
  assert.ok(metrics.grr>0 && metrics.grr<1);
  assert.ok(metrics.cac_cents>0);
  assert.ok(Number.isFinite(metrics.rule_of_40));
  ledger.close();
});

test("software policy capitalizes qualifying costs and expenses preliminary work", () => {
  const ledger=createLedger(":memory:",{seed:true});
  const projects=ledger.softwareProjects();
  const qualifying=projects.find(p=>p.stage==="application_development");
  const preliminary=projects.find(p=>p.stage==="preliminary");
  assert.equal(qualifying.capitalized_cents,qualifying.cost_cents);
  assert.equal(preliminary.expensed_cents,preliminary.cost_cents);
  ledger.close();
});

test("FX revaluation and intercompany elimination create balanced posted entries", () => {
  const ledger=createLedger(":memory:",{seed:true});
  ledger.db.prepare("INSERT INTO fx_rates(rate_date,currency,usd_rate) VALUES('2026-08-31','EUR',1.20)").run();
  const fx=ledger.revalueFx("2026-08-31");
  assert.ok(fx.journal_entry_ids.length>0);
  assert.equal(ledger.revalueFx("2026-08-31").journal_entry_ids.length,0);
  const elimination=ledger.postEliminations("2026-08-31");
  assert.equal(elimination.eliminated_cents,423729);
  assert.equal(ledger.getJournal(elimination.journal_entry_id).status,"posted");
  ledger.close();
});

test("usage, milestone, extension, cancellation and renewal workflows update schedules", () => {
  const ledger=createLedger(":memory:",{seed:true});
  const product=ledger.products()[0],customer=ledger.customers()[0];
  const milestone=ledger.createContract({customer_id:customer.id,entity_id:1,contract_number:"MILE-1",signed_date:"2026-08-01",start_date:"2026-08-01",end_date:"2026-12-31",transaction_price_cents:1_000_000,obligations:[{product_id:product.id,description:"Deployment milestone",ssp_cents:1_000_000,recognition_method:"milestone"}]});
  const progress=ledger.updateMilestone({obligation_id:milestone.obligations[0].id,event_date:"2026-08-20",progress:25});
  assert.equal(progress.amount_cents,250_000);
  const subscription=ledger.createContract({customer_id:customer.id,entity_id:1,contract_number:"EXT-1",signed_date:"2026-08-01",start_date:"2026-09-01",end_date:"2026-11-30",transaction_price_cents:900_000,obligations:[{product_id:product.id,description:"Short subscription",ssp_cents:900_000,recognition_method:"straight_line"}]});
  ledger.modifyContract({contract_id:subscription.id,effective_date:"2026-09-01",kind:"extension",description:"Extend two months",new_end_date:"2027-01-31"});
  const extendedSchedules=ledger.revenueSchedules().filter(s=>s.contract_number==="EXT-1"&&s.status==="pending");
  assert.equal(extendedSchedules.length,5);
  assert.equal(extendedSchedules.reduce((s,x)=>s+x.amount_cents,0),900_000);
  const renewal=ledger.createContract({customer_id:customer.id,entity_id:1,renewal_of:subscription.id,contract_number:"EXT-2",signed_date:"2027-01-15",start_date:"2027-02-01",end_date:"2028-01-31",transaction_price_cents:1_200_000,obligations:[{product_id:product.id,description:"Renewal",ssp_cents:1_200_000,recognition_method:"straight_line"}]});
  assert.equal(renewal.renewal_of,subscription.id);
  ledger.modifyContract({contract_id:subscription.id,effective_date:"2026-10-01",kind:"cancellation",description:"Customer terminated"});
  assert.equal(ledger.getContract(subscription.id).status,"cancelled");
  assert.equal(ledger.revenueSchedules().filter(s=>s.contract_number==="EXT-1"&&s.status==="pending").length,1);
  ledger.recognizeThrough("2026-09-30");
  assert.equal(ledger.revenueSchedules().filter(s=>s.contract_number==="EXT-1"&&s.status==="recognized").length,1);
  ledger.close();
});
