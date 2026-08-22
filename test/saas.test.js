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

test("receivables supports partial payments, credits, write-offs, refunds, disputes and collections", () => {
  const ledger=createLedger(":memory:",{seed:true});
  const payment=ledger.recordPayment({customer_id:1,entity_id:1,payment_number:"PAY-TEST-1",payment_date:"2026-08-10",amount_cents:6_000_000,method:"ach",reference:"BANK-991",applications:[{invoice_id:1,amount_cents:5_000_000}]});
  assert.equal(payment.applied_cents,5_000_000);
  const journalsAfterPayment=ledger.listJournals().length;
  assert.throws(()=>ledger.recordPayment({customer_id:2,payment_number:"PAY-BAD",payment_date:"2026-08-10",amount_cents:100_000,applications:[{invoice_id:1,amount_cents:100_000}]}),/same customer/);
  assert.throws(()=>ledger.recordPayment({customer_id:1,payment_number:"PAY-TEST-1",payment_date:"2026-08-10",amount_cents:100_000}),/already exists/);
  assert.equal(ledger.listJournals().length,journalsAfterPayment,"invalid receipts do not leave orphan journals");
  assert.equal(ledger.listInvoices("2026-08-22").find(i=>i.id===1).balance_cents,10_500_000);
  assert.throws(()=>ledger.applyPayment({payment_id:payment.id,invoice_id:1,amount_cents:1_500_000,applied_date:"2026-08-10"}),/unapplied payment balance/);

  ledger.createCreditMemo({invoice_id:1,credit_number:"CM-TEST-1",credit_date:"2026-08-12",amount_cents:1_000_000,reason:"Service-level credit"});
  ledger.writeOffInvoice({invoice_id:1,write_off_date:"2026-08-13",amount_cents:500_000,reason:"Approved immaterial balance"});
  ledger.openDispute({invoice_id:1,opened_date:"2026-08-14",amount_cents:2_000_000,reason:"Customer contests usage"});
  ledger.addCollectionActivity({customer_id:1,invoice_id:1,activity_date:"2026-08-15",activity_type:"call",notes:"CFO promised supporting detail",next_action_date:"2026-08-20"});
  let ar=ledger.receivables("2026-08-22");
  let invoice=ar.invoices.find(i=>i.id===1);
  assert.equal(invoice.balance_cents,9_000_000);
  assert.equal(invoice.status,"disputed");
  assert.equal(ar.collections.length,1);
  assert.equal(ar.aging.days_31_60_cents,9_000_000);
  assert.equal(ar.reconciliation.ar_difference_cents,1_000_000,"direct EU GL receivable is correctly surfaced as an exception");
  assert.equal(ar.reconciliation.unapplied_difference_cents,0);

  ledger.refundPayment({payment_id:payment.id,invoice_id:1,refund_number:"RF-TEST-1",refund_date:"2026-08-18",amount_cents:1_000_000,reason:"Duplicate remittance returned"});
  invoice=ledger.listInvoices("2026-08-22").find(i=>i.id===1);
  assert.equal(invoice.balance_cents,10_000_000);
  const dispute=ledger.receivables("2026-08-22").disputes.find(d=>d.invoice_id===1&&d.status==="open");
  ledger.resolveDispute({dispute_id:dispute.id,resolved_date:"2026-08-21",resolution:"Usage evidence accepted"});
  assert.equal(ledger.listInvoices("2026-08-22").find(i=>i.id===1).status,"partially_paid");
  assert.equal(ledger.getAccounts().reduce((s,a)=>s+(a.type==="asset"||a.type==="expense"?a.balance_cents:-a.balance_cents),0),0);
  ledger.close();
});

test("payment and invoice voids reverse subledger and general-ledger effects", () => {
  const ledger=createLedger(":memory:",{seed:true});
  const before=ledger.listInvoices("2026-08-22").find(i=>i.id===2).balance_cents;
  const payment=ledger.recordPayment({customer_id:2,payment_number:"PAY-VOID-1",payment_date:"2026-08-10",amount_cents:2_000_000,applications:[{invoice_id:2,amount_cents:1_000_000}]});
  assert.equal(ledger.listInvoices("2026-08-22").find(i=>i.id===2).balance_cents,before-1_000_000);
  assert.equal(ledger.voidPayment({payment_id:payment.id,void_date:"2026-08-11"}).status,"void");
  assert.equal(ledger.listInvoices("2026-08-22").find(i=>i.id===2).balance_cents,before);

  const invoice=ledger.createInvoice({contract_id:2,invoice_number:"INV-VOID-1",invoice_date:"2026-08-12",due_date:"2026-09-11",amount_cents:300_000});
  const voided=ledger.voidInvoice({invoice_id:invoice.id,void_date:"2026-08-13",reason:"Duplicate invoice"});
  assert.equal(voided.status,"void");
  assert.equal(voided.balance_cents,0);
  assert.equal(ledger.getAccounts().reduce((s,a)=>s+(a.type==="asset"||a.type==="expense"?a.balance_cents:-a.balance_cents),0),0);
  ledger.close();
});

test("AR aging and billed-unbilled reconciliation retain customer and contract lineage", () => {
  const ledger=createLedger(":memory:",{seed:true});
  const historical=ledger.receivables("2026-06-15");
  assert.equal(historical.invoices.length,1);
  assert.equal(historical.aging.current_cents,15_500_000);
  assert.equal(historical.reconciliation.ar_difference_cents,0);
  ledger.recognizeThrough("2026-08-22");
  const ar=ledger.receivables("2026-08-22");
  assert.equal(ar.aging.total_cents,22_700_000);
  assert.equal(ar.aging.days_31_60_cents,15_500_000);
  assert.equal(ar.aging.current_cents,7_200_000);
  assert.equal(ar.customers.find(c=>c.name==="Acme Robotics").outstanding_cents,15_500_000);
  const acme=ar.contracts.find(c=>c.contract_number==="ACME-2026-001");
  assert.equal(acme.billed_cents,15_500_000);
  assert.ok(acme.recognized_cents>0);
  assert.equal(acme.deferred_cents,acme.net_billed_cents-acme.recognized_cents);
  assert.equal(ar.reconciliation.gl_ar_cents-ar.reconciliation.subledger_ar_cents,1_000_000);
  ledger.close();
});
