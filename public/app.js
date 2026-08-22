const state = { accounts: [], journals: [], dashboard: null, saas: null, currentView: "dashboard", proposal: null };
const view = document.querySelector("#view");
const money = cents => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format((cents || 0) / 100);
const pct = value => `${(Number(value || 0) * 100).toFixed(1)}%`;
const shortDate = value => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

async function api(path, options) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

async function load() {
  [state.dashboard, state.accounts, state.journals, state.saas] = await Promise.all([api("/api/dashboard"), api("/api/accounts"), api("/api/journals"), api("/api/saas/overview")]);
  render();
}

function setTitle(eyebrow, title) {
  document.querySelector("#eyebrow").textContent = eyebrow;
  document.querySelector("#page-title").textContent = title;
}

function render() {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === state.currentView));
  ({ dashboard: renderDashboard, journals: renderJournals, revenue: renderRevenue, receivables: renderReceivables, metrics: renderMetrics, accounts: renderAccounts, reports: renderReports, operations: renderOperations, entities: renderEntities, audit: renderAudit }[state.currentView] || renderDashboard)();
}

function renderDashboard() {
  setTitle("FINANCE OVERVIEW", "Good morning, Manish.");
  const d = state.dashboard;
  const max = Math.max(...d.monthly.flatMap(m => [m.revenue_cents, m.expense_cents]), 1);
  view.innerHTML = `<div class="kpis">
    ${kpi("Cash balance", money(d.cash_cents), "↗", "+18.4% from last month")}
    ${kpi("Revenue", money(d.revenue_cents), "⌁", "+40.5% across active periods")}
    ${kpi("Net income", money(d.net_income_cents), "◇", "Healthy operating margin")}
    ${kpi("Draft entries", d.drafts, "!", d.drafts ? "Waiting for your review" : "Nothing needs review", true)}
  </div>
  <div class="grid">
    <article class="card panel"><div class="panel-head"><div><h3>Revenue & operating expenses</h3><p>Posted ledger activity by month</p></div><button data-view-link="reports">View reports →</button></div>
      <div class="chart">${d.monthly.map(m => `<div class="bar-group"><i class="bar" style="height:${Math.max(3,m.revenue_cents/max*90)}%"></i><i class="bar expense" style="height:${Math.max(3,m.expense_cents/max*90)}%"></i><label>${m.month.slice(5)}</label></div>`).join("")}</div>
      <div class="legend"><span><i></i>Revenue</span><span><i class="gray"></i>Expenses</span></div>
    </article>
    <article class="card panel"><div class="panel-head"><div><h3>Needs attention</h3><p>Exceptions, not busywork</p></div></div>
      <div class="attention-list"><div class="attention"><span class="attention-icon">!</span><div><strong>${d.drafts} draft awaiting approval</strong><p>AI-created entry needs human review</p></div><b>Review →</b></div><div class="attention"><span class="attention-icon">↻</span><div><strong>Bank feed healthy</strong><p>All imported transactions matched</p></div><b>Clear</b></div><div class="attention"><span class="attention-icon">✓</span><div><strong>Ledger integrity passed</strong><p>Posted debits equal credits</p></div><b>Verified</b></div></div>
    </article>
  </div>
  <article class="card section-card" style="margin-top:14px"><div class="table-head"><h3>Recent journal activity</h3><button class="secondary" data-view-link="journals">View all</button></div>${journalTable(state.journals.slice(0,5))}</article>`;
  bindLinks();
}

function kpi(label, value, icon, note, neutral=false) { return `<article class="card kpi"><div class="kpi-top"><span>${label}</span><span class="kpi-icon">${icon}</span></div><strong>${value}</strong><span class="delta ${neutral ? "neutral" : ""}">${note}</span></article>`; }

function journalTable(rows) {
  if (!rows.length) return `<div class="empty">No journal entries yet.</div>`;
  return `<table class="table"><thead><tr><th>Date</th><th>Memo</th><th>Source</th><th>Status</th><th>Amount</th><th></th></tr></thead><tbody>${rows.map(j => `<tr><td>${shortDate(j.entry_date)}</td><td><strong>${escapeHtml(j.memo)}</strong></td><td>${escapeHtml(j.source)}</td><td><span class="badge ${j.status}">${j.status}</span></td><td class="amount">${money(j.total_cents)}</td><td class="amount">${j.status === "draft" ? `<button class="post-btn" data-post="${j.id}">Review & post</button>` : ""}</td></tr>`).join("")}</tbody></table>`;
}

function renderJournals() {
  setTitle("GENERAL LEDGER", "Journal entries");
  view.innerHTML = `<article class="card section-card"><div class="table-head"><div><h3>All entries</h3><p style="font-size:10px;color:var(--muted);margin-top:4px">Drafts require explicit approval. Posted entries are immutable.</p></div><span class="badge">${state.journals.length} entries</span></div>${journalTable(state.journals)}</article>`;
  document.querySelectorAll("[data-post]").forEach(b => b.addEventListener("click", () => postEntry(b.dataset.post)));
}

function renderRevenue() {
  setTitle("ASC 606 SUBLEDGER", "Revenue recognition");
  const s=state.saas, max=Math.max(...s.waterfall.map(x=>x.scheduled_cents),1);
  view.innerHTML=`<div class="kpis">${kpi("Transaction price",money(s.contracts.reduce((n,c)=>n+c.transaction_price_cents,0)),"§","Constrained consideration allocated by SSP")}${kpi("Deferred revenue",money(s.deferred.ending_cents),"◫","Billings less recognized revenue")}${kpi("Contract assets",money(s.deferred.contract_asset_cents),"◇","Recognized but not yet billed")}${kpi("Remaining obligations",money(s.rpo.total_cents),"⌛",`${money(s.rpo.next_12_months_cents)} expected in 12 months`,true)}</div>
  <div class="grid"><article class="card panel"><div class="panel-head"><div><h3>Revenue waterfall</h3><p>Scheduled and recognized by performance period</p></div><button id="recognize-revenue">Recognize through Aug 22 →</button></div><div class="waterfall">${s.waterfall.slice(0,14).map(r=>`<div class="waterfall-row"><span>${r.period}</span><div class="waterfall-track"><i class="waterfall-fill" style="display:block;width:${r.recognized_cents/r.scheduled_cents*100}%"></i></div><strong>${money(r.scheduled_cents)}</strong></div>`).join("")}</div></article>
  <article class="card panel"><div class="panel-head"><div><h3>ASC 606 control</h3><p>Contract-to-ledger reconciliation</p></div><span class="badge posted">Balanced</span></div><div class="attention-list"><div class="attention"><span class="attention-icon">1</span><div><strong>Identify contract</strong><p>${s.contracts.length} active customer arrangements</p></div><b>Complete</b></div><div class="attention"><span class="attention-icon">2</span><div><strong>Identify obligations</strong><p>${new Set(s.schedules.map(x=>x.obligation_id)).size} scheduled obligations</p></div><b>Complete</b></div><div class="attention"><span class="attention-icon">3</span><div><strong>Allocate transaction price</strong><p>Relative standalone selling price</p></div><b>Complete</b></div><div class="attention"><span class="attention-icon">4</span><div><strong>Recognize as satisfied</strong><p>Straight-line, usage, milestone and point-in-time</p></div><b>Controlled</b></div></div></article></div>
  <article class="card section-card" style="margin-top:14px"><div class="table-head"><div><h3>Customer contracts</h3><p style="font-size:10px;color:var(--muted);margin-top:4px">Billing and recognition are tracked independently</p></div><div class="action-row"><span class="badge">${s.contracts.length} contracts</span><button class="primary" id="new-contract">＋ New contract</button></div></div><table class="table"><thead><tr><th>Contract</th><th>Customer</th><th>Model</th><th>Allocated</th><th>Billed</th><th>Recognized</th><th>Status</th></tr></thead><tbody>${s.contracts.map(c=>`<tr><td class="code">${c.contract_number}</td><td><strong>${escapeHtml(c.customer_name)}</strong></td><td>${c.billing_model}</td><td class="amount">${money(c.allocated_cents)}</td><td class="amount">${money(c.billed_cents)}</td><td class="amount">${money(c.recognized_cents)}</td><td><span class="badge ${c.status==="active"?"posted":"draft"}">${c.status}</span></td></tr>`).join("")}</tbody></table></article>`;
  document.querySelector("#recognize-revenue").addEventListener("click",runRecognition);
  document.querySelector("#new-contract").addEventListener("click",openContractForm);
}

async function runRecognition(){
  try{const result=await api("/api/revenue/recognize",{method:"POST",body:JSON.stringify({as_of:"2026-08-22"})});await load();navigate("revenue");toast(`${result.recognized_schedules} revenue schedules posted with ASC 606 audit lineage.`)}catch(error){toast(error.message,true)}
}

function renderReceivables(){
  setTitle("ORDER TO CASH", "Accounts receivable");
  const ar=state.saas.receivables,a=ar.aging,r=ar.reconciliation,overdue=a.total_cents-a.current_cents;
  const agingRows=[["Current",a.current_cents],["1–30 days",a.days_1_30_cents],["31–60 days",a.days_31_60_cents],["61–90 days",a.days_61_90_cents],["90+ days",a.days_90_plus_cents]];
  const open=ar.invoices.filter(i=>i.status!=="void");
  view.innerHTML=`<div class="kpis">${kpi("Outstanding AR",money(a.total_cents),"▤",`${open.filter(i=>i.balance_cents>0).length} open invoices`)}${kpi("Past due",money(overdue),"!",`${money(a.disputed_cents)} disputed`,true)}${kpi("Unapplied cash",money(ar.payments.filter(p=>p.status==="received").reduce((s,p)=>s+p.unapplied_cents,0)),"◇","Ready for cash application",true)}${kpi("AR reconciliation",money(r.ar_difference_cents),r.balanced?"✓":"↻",r.balanced?"Subledger agrees to GL":"Exception requires review",!r.balanced)}</div>
  <div class="grid"><article class="card panel"><div class="panel-head"><div><h3>Invoice aging</h3><p>As of ${shortDate(ar.as_of)}</p></div><span class="badge ${overdue?"draft":"posted"}">${money(a.total_cents)} total</span></div><div class="aging-bars">${agingRows.map(([label,value])=>`<div><span>${label}</span><i><b style="width:${a.total_cents?Math.max(2,value/a.total_cents*100):0}%"></b></i><strong>${money(value)}</strong></div>`).join("")}</div></article>
  <article class="card panel"><div class="panel-head"><div><h3>Control reconciliation</h3><p>Subledgers tied to posted journal lines</p></div><span class="badge ${r.balanced?"posted":"draft"}">${r.balanced?"Balanced":"Exception"}</span></div><table class="table compact"><tbody><tr><td>General ledger AR</td><td class="amount">${money(r.gl_ar_cents)}</td></tr><tr><td>Invoice subledger</td><td class="amount">${money(r.subledger_ar_cents)}</td></tr><tr class="report-total"><td>AR difference</td><td class="amount ${r.ar_difference_cents?"negative":"success-zero"}">${money(r.ar_difference_cents)}</td></tr><tr><td>GL unapplied cash</td><td class="amount">${money(r.gl_unapplied_cents)}</td></tr><tr><td>Payment subledger</td><td class="amount">${money(r.subledger_unapplied_cents)}</td></tr></tbody></table></article></div>
  <article class="card section-card" style="margin-top:14px"><div class="table-head"><div><h3>Invoices</h3><p class="table-note">Billed, collected, credited, disputed, and outstanding at invoice level</p></div><div class="action-row"><button class="secondary" data-ar-open="payment">Record payment</button><button class="primary" data-ar-open="invoice">＋ New invoice</button></div></div><div class="table-scroll"><table class="table ar-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Due</th><th>Billed</th><th>Applied</th><th>Adjustments</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>${ar.invoices.map(i=>`<tr><td><strong>${escapeHtml(i.invoice_number)}</strong><small>${escapeHtml(i.contract_number)}</small></td><td>${escapeHtml(i.customer_name)}</td><td>${shortDate(i.due_date)}${i.days_past_due?`<small class="negative">${i.days_past_due} days late</small>`:""}</td><td class="amount">${money(i.amount_cents)}</td><td class="amount">${money(i.applied_cents)}</td><td class="amount">${money(i.credit_cents+i.write_off_cents)}</td><td class="amount"><strong>${money(i.balance_cents)}</strong></td><td><span class="badge ${i.status==="paid"?"posted":i.status==="disputed"?"draft":""}">${i.status.replaceAll("_"," ")}</span></td><td><div class="row-actions">${i.balance_cents&&i.status!=="void"?`<button data-ar-open="payment" data-invoice="${i.id}">Pay</button><button data-ar-open="credit" data-invoice="${i.id}">Credit</button><button data-ar-open="writeoff" data-invoice="${i.id}">Write off</button><button data-ar-open="dispute" data-invoice="${i.id}">Dispute</button><button data-ar-open="collection" data-invoice="${i.id}">Collect</button>${i.disputed_cents?`<button data-ar-open="resolve" data-dispute="${ar.disputes.find(d=>d.invoice_id===i.id&&d.status==="open")?.id}">Resolve</button>`:""}`:""}${i.status!=="void"&&!i.applied_cents&&!i.write_off_cents?`<button class="danger-link" data-void-invoice="${i.id}">Void</button>`:""}</div></td></tr>`).join("")}</tbody></table></div></article>
  <div class="grid" style="margin-top:14px"><article class="card section-card"><div class="table-head"><div><h3>Customer payments</h3><p class="table-note">Receipt, application, refund, and void lineage</p></div><span class="badge">${ar.payments.length} receipts</span></div><table class="table"><thead><tr><th>Payment</th><th>Customer</th><th>Received</th><th>Amount</th><th>Applied</th><th>Unapplied</th><th></th></tr></thead><tbody>${ar.payments.length?ar.payments.map(p=>`<tr><td><strong>${escapeHtml(p.payment_number)}</strong><small>${escapeHtml(p.method)}</small></td><td>${escapeHtml(p.customer_name)}</td><td>${shortDate(p.payment_date)}</td><td class="amount">${money(p.amount_cents)}</td><td class="amount">${money(p.applied_cents)}</td><td class="amount">${money(p.unapplied_cents)}</td><td><div class="row-actions">${p.status==="received"?`${p.unapplied_cents?`<button data-ar-open="application" data-payment="${p.id}">Apply</button>`:""}<button data-ar-open="refund" data-payment="${p.id}">Refund</button><button class="danger-link" data-void-payment="${p.id}">Void</button>`:`<span class="badge">void</span>`}</div></td></tr>`).join(""):`<tr><td colspan="7" class="empty">No payments recorded.</td></tr>`}</tbody></table></article>
  <article class="card section-card"><div class="table-head"><div><h3>Collections queue</h3><p class="table-note">Promises and next actions</p></div><span class="badge">${ar.collections.filter(c=>c.status==="open").length} open</span></div><table class="table"><thead><tr><th>Next action</th><th>Customer</th><th>Activity</th><th>Notes</th><th></th></tr></thead><tbody>${ar.collections.length?ar.collections.map(c=>`<tr><td>${shortDate(c.next_action_date||c.activity_date)}</td><td><strong>${escapeHtml(c.customer_name)}</strong><small>${escapeHtml(c.invoice_number||"Account level")}</small></td><td>${c.activity_type.replaceAll("_"," ")}</td><td>${escapeHtml(c.notes)}</td><td>${c.status==="open"?`<button data-complete-collection="${c.id}">Done</button>`:`<span class="badge posted">Done</span>`}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No collection activity.</td></tr>`}</tbody></table></article></div>
  <article class="card section-card" style="margin-top:14px"><div class="table-head"><div><h3>Billed and unbilled by contract</h3><p class="table-note">Invoice subledger reconciled to ASC 606 recognition</p></div><span class="badge posted">Contract lineage</span></div><div class="table-scroll"><table class="table"><thead><tr><th>Contract</th><th>Customer</th><th>Allocated</th><th>Gross billed</th><th>Credits</th><th>Net billed</th><th>Recognized</th><th>Unbilled</th><th>Deferred</th><th>AR</th></tr></thead><tbody>${ar.contracts.map(c=>`<tr><td class="code">${escapeHtml(c.contract_number)}</td><td><strong>${escapeHtml(c.customer_name)}</strong></td><td class="amount">${money(c.allocated_cents)}</td><td class="amount">${money(c.billed_cents)}</td><td class="amount">${money(c.credit_cents)}</td><td class="amount">${money(c.net_billed_cents)}</td><td class="amount">${money(c.recognized_cents)}</td><td class="amount">${money(c.unbilled_cents)}</td><td class="amount">${money(c.deferred_cents)}</td><td class="amount">${money(c.outstanding_cents)}</td></tr>`).join("")}</tbody></table></div></article>`;
  document.querySelectorAll("[data-ar-open]").forEach(button=>button.addEventListener("click",()=>openArForm(button.dataset.arOpen,{invoiceId:Number(button.dataset.invoice)||null,paymentId:Number(button.dataset.payment)||null,disputeId:Number(button.dataset.dispute)||null})));
  document.querySelectorAll("[data-void-invoice]").forEach(button=>button.addEventListener("click",()=>voidArObject("invoice",Number(button.dataset.voidInvoice))));
  document.querySelectorAll("[data-void-payment]").forEach(button=>button.addEventListener("click",()=>voidArObject("payment",Number(button.dataset.voidPayment))));
  document.querySelectorAll("[data-complete-collection]").forEach(button=>button.addEventListener("click",()=>completeCollection(Number(button.dataset.completeCollection))));
}

function renderMetrics(){
  setTitle("OPERATING ANALYTICS", "SaaS metrics that reconcile");
  const m=state.saas.metrics;
  const cards=[
    ["ARR",money(m.arr_cents),"MRR "+money(m.mrr_cents)],["Net revenue retention",pct(m.nrr),`GRR ${pct(m.grr)}`],["Gross margin",pct(m.gross_margin),"After cloud cost of revenue"],["Rule of 40",`${m.rule_of_40.toFixed(1)}`,`${pct(m.growth_rate)} growth + ${pct(m.operating_margin)} margin`],
    ["Bookings",money(m.bookings_cents),`Billings ${money(m.billings_cents)}`],["Average contract value",money(m.acv_cents),"Signed contract consideration"],["CAC",money(m.cac_cents),`LTV ${money(m.ltv_cents)}`],["Burn multiple",m.burn_multiple.toFixed(2),`Magic number ${m.magic_number.toFixed(2)}`]
  ];
  view.innerHTML=`<div class="metric-grid">${cards.map(([label,value,note],i)=>kpi(label,value,["↗","↻","%","40","✎","◇","◎","×"][i],note,true)).join("")}</div><div class="grid"><article class="card panel"><div class="panel-head"><div><h3>MRR movement</h3><p>${m.period} cohort bridge</p></div><span class="badge posted">GL linked</span></div><table class="table"><tbody><tr><td>New MRR</td><td class="amount">${money(m.new_mrr_cents)}</td></tr><tr><td>Expansion</td><td class="amount">${money(m.expansion_cents)}</td></tr><tr><td>Contraction</td><td class="amount negative">(${money(m.contraction_cents)})</td></tr><tr><td>Churn</td><td class="amount negative">(${money(m.churn_cents)})</td></tr><tr class="report-total"><td>Ending MRR</td><td class="amount">${money(m.mrr_cents)}</td></tr></tbody></table></article><article class="card panel"><div class="panel-head"><div><h3>Metric lineage</h3><p>No disconnected board spreadsheet</p></div></div><div class="coverage"><span>Contracts → Bookings</span><span>Invoices → Billings</span><span>Subscriptions → ARR/MRR</span><span>Customer cohorts → NRR/GRR</span><span>GL revenue → Margin</span><span>Sales spend → CAC</span><span>Churn → LTV</span><span>Growth + margin → Rule of 40</span></div></article></div>`;
}

function renderAccounts() {
  setTitle("LEDGER SETUP", "Chart of accounts");
  view.innerHTML = `<article class="card section-card"><div class="table-head"><div><h3>Accounts</h3><p style="font-size:10px;color:var(--muted);margin-top:4px">Balances include posted entries only</p></div><span class="badge">${state.accounts.length} active</span></div><table class="table"><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Balance</th></tr></thead><tbody>${state.accounts.map(a => `<tr><td class="code">${a.code}</td><td><strong>${escapeHtml(a.name)}</strong></td><td><span class="type-dot type-${a.type}"></span>${a.type}</td><td class="amount">${money(a.balance_cents)}</td></tr>`).join("")}</tbody></table></article>`;
}

function renderReports() {
  setTitle("FINANCIAL REPORTING", "Reports from the live ledger");
  const revenue = state.accounts.filter(a=>a.type==="revenue"), expenses=state.accounts.filter(a=>a.type==="expense"), assets=state.accounts.filter(a=>a.type==="asset"), liabilities=state.accounts.filter(a=>a.type==="liability"), equity=state.accounts.filter(a=>a.type==="equity");
  const sum = list => list.reduce((s,a)=>s+a.balance_cents,0);
  const earnings=sum(revenue)-sum(expenses), balanceCheck=sum(assets)-sum(liabilities)-sum(equity)-earnings;
  const cf=state.saas.cash_flow;
  view.innerHTML=`<div class="report-grid"><article class="card section-card"><div class="table-head"><h3>Income statement</h3><span class="badge posted">Live</span></div>${reportTable([...revenue,...expenses],"Net income",earnings)}</article><article class="card section-card"><div class="table-head"><h3>Balance sheet</h3><span class="badge posted">Live</span></div><table class="table"><tbody>${[...assets,...liabilities,...equity].map(a=>`<tr><td><span class="type-dot type-${a.type}"></span>${a.name}</td><td class="amount">${money(a.balance_cents)}</td></tr>`).join("")}<tr><td><span class="type-dot type-equity"></span>Current-period earnings</td><td class="amount">${money(earnings)}</td></tr><tr class="report-total"><td>Balance check</td><td class="amount ${balanceCheck===0?"success-zero":"negative"}">${money(balanceCheck)}</td></tr></tbody></table></article><article class="card section-card"><div class="table-head"><h3>Statement of cash flows</h3><span class="badge posted">Direct lineage</span></div><table class="table"><tbody><tr><td>Operating activities</td><td class="amount">${money(cf.operating_cents)}</td></tr><tr><td>Investing activities</td><td class="amount">${money(cf.investing_cents)}</td></tr><tr><td>Financing activities</td><td class="amount">${money(cf.financing_cents)}</td></tr><tr class="report-total"><td>Net change in cash</td><td class="amount">${money(cf.net_change_cents)}</td></tr></tbody></table></article><article class="card panel"><div class="panel-head"><div><h3>GAAP coverage</h3><p>Current deterministic policy engines</p></div></div><div class="coverage"><span>ASC 606 revenue</span><span>ASC 340-40 commissions</span><span>ASC 350-40 internal software</span><span>ASC 985-20 external software</span><span>Multi-currency translation</span><span>Intercompany elimination</span><span>Cash-flow classification</span></div></article></div>`;
}
function reportTable(accounts,label,total){return `<table class="table"><tbody>${accounts.map(a=>`<tr><td><span class="type-dot type-${a.type}"></span>${a.name}</td><td class="amount">${money(a.balance_cents)}</td></tr>`).join("")}<tr class="report-total"><td>${label}</td><td class="amount">${money(total)}</td></tr></tbody></table>`}

async function renderAudit() {
  setTitle("CONTROLS & EVIDENCE", "Audit trail");
  view.innerHTML=`<article class="card section-card"><div class="empty">Loading audit evidence…</div></article>`;
  const rows=await api("/api/audit-log");
  view.innerHTML=`<article class="card section-card"><div class="table-head"><div><h3>Immutable activity log</h3><p style="font-size:10px;color:var(--muted);margin-top:4px">Who did what, and when</p></div><span class="badge">${rows.length} events</span></div><table class="table"><thead><tr><th>Time</th><th>Action</th><th>Object</th><th>Actor</th><th>Evidence</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${new Date(r.created_at+"Z").toLocaleString()}</td><td><strong>${r.action.replaceAll("_"," ")}</strong></td><td>${r.entity_type} #${r.entity_id}</td><td>${r.actor}</td><td class="audit-payload" title="${escapeHtml(r.payload)}">${escapeHtml(r.payload)}</td></tr>`).join("")}</tbody></table></article>`;
}

function renderOperations(){
  setTitle("ACCOUNTING POLICIES", "Capitalized costs and subledgers");
  const s=state.saas, commissionTotal=s.commissions.reduce((n,c)=>n+c.amount_cents,0), capitalized=s.software_projects.reduce((n,p)=>n+p.capitalized_cents,0), expensed=s.software_projects.reduce((n,p)=>n+p.expensed_cents,0);
  view.innerHTML=`<div class="subgrid"><article class="card policy-card"><h3>ASC 340-40 commissions</h3><p>Incremental contract acquisition costs are capitalized and amortized over the benefit period.</p><strong>${money(commissionTotal)}</strong><small>${s.commissions.length} commission assets</small></article><article class="card policy-card"><h3>ASC 350-40 internal-use software</h3><p>Application-development costs capitalize; preliminary and post-implementation costs expense.</p><strong>${money(capitalized)}</strong><small>Capitalized development</small></article><article class="card policy-card"><h3>ASC 985-20 software to sell</h3><p>Costs capitalize only after technological feasibility and before general availability.</p><strong>${money(expensed)}</strong><small>Costs expensed under policy</small></article></div><article class="card section-card" style="margin-top:14px"><div class="table-head"><div><h3>Software cost decisions</h3><p style="font-size:10px;color:var(--muted);margin-top:4px">Every decision retains its accounting-policy basis</p></div><span class="badge">${s.software_projects.length} projects</span></div><table class="table"><thead><tr><th>Project</th><th>Model</th><th>Stage</th><th>Cost</th><th>Capitalized</th><th>Expensed</th><th>Policy conclusion</th></tr></thead><tbody>${s.software_projects.map(p=>`<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>${p.model.replaceAll("_"," ")}</td><td>${p.stage.replaceAll("_"," ")}</td><td class="amount">${money(p.cost_cents)}</td><td class="amount">${money(p.capitalized_cents)}</td><td class="amount">${money(p.expensed_cents)}</td><td>${escapeHtml(p.policy_basis)}</td></tr>`).join("")}</tbody></table></article>`;
}

function renderEntities(){
  setTitle("GLOBAL ACCOUNTING", "Entities, FX and consolidation");
  const c=state.saas.consolidation;
  view.innerHTML=`<div class="kpis">${kpi("Legal entities",c.entities.length,"◎","One consolidated reporting model")}${kpi("Currencies",new Set(c.entities.map(e=>e.currency)).size,"¤","USD presentation currency")}${kpi("Intercompany remaining",money(c.intercompany_eliminations_cents),"⇄","Eligible for elimination",true)}${kpi("Translation", "Current-rate", "↻", "Historical transaction rates retained",true)}</div><div class="grid"><article class="card section-card"><div class="table-head"><h3>Entity structure</h3><span class="badge posted">Consolidated</span></div><table class="table"><thead><tr><th>Entity</th><th>Local currency</th><th>Relationship</th><th>Status</th></tr></thead><tbody>${c.entities.map(e=>`<tr><td><strong>${escapeHtml(e.name)}</strong></td><td>${e.currency}</td><td>${e.parent_id?"Subsidiary":"Parent"}</td><td><span class="badge posted">Active</span></td></tr>`).join("")}</tbody></table></article><article class="card panel"><div class="panel-head"><div><h3>Consolidation controls</h3><p>Base-currency reporting with eliminations</p></div></div><div class="action-row"><button class="secondary" id="run-fx">Run FX revaluation</button><button class="primary" id="run-elimination">Post eliminations</button></div><div class="coverage" style="margin-top:18px"><span>Transaction rate retained</span><span>Current-rate revaluation</span><span>FX gain/loss entry</span><span>Intercompany matching</span><span>Elimination journal</span></div></article></div>`;
  document.querySelector("#run-fx").addEventListener("click",()=>runGlobal("/api/fx/revalue","FX revaluation posted"));
  document.querySelector("#run-elimination").addEventListener("click",()=>runGlobal("/api/consolidation/eliminate","Intercompany elimination posted"));
}
async function runGlobal(path,message){try{await api(path,{method:"POST",body:JSON.stringify({as_of:"2026-08-22"})});await load();navigate("entities");toast(message)}catch(error){toast(error.message,true)}}

function openArForm(kind,{invoiceId=null,paymentId=null,disputeId=null}={}){
  const ar=state.saas.receivables,today=ar.as_of,invoice=ar.invoices.find(i=>i.id===invoiceId),payment=ar.payments.find(p=>p.id===paymentId);
  const invoiceOptions=(rows=ar.invoices.filter(i=>i.balance_cents>0&&i.status!=="void"))=>`<option value="">Leave unapplied</option>${rows.map(i=>`<option value="${i.id}" ${i.id===invoiceId?"selected":""}>${escapeHtml(i.invoice_number)} · ${escapeHtml(i.customer_name)} · ${money(i.balance_cents)}</option>`).join("")}`;
  const customerOptions=state.saas.customers.map(c=>`<option value="${c.id}" ${c.id===(invoice?.customer_id||payment?.customer_id)?"selected":""}>${escapeHtml(c.name)}</option>`).join("");
  const contractOptions=state.saas.contracts.map(c=>`<option value="${c.id}">${escapeHtml(c.contract_number)} · ${escapeHtml(c.customer_name)}</option>`).join("");
  const field=(label,control)=>`<label class="field"><span>${label}</span>${control}</label>`;
  const amount=(value="")=>`<input type="number" name="amount" min="0.01" step="0.01" value="${value}" required>`;
  let title="Record receivables activity",body="";
  if(kind==="payment") {title="Record customer payment";body=`${field("Customer",`<select name="customer_id" required>${customerOptions}</select>`)}${field("Apply to invoice",`<select name="invoice_id">${invoiceOptions()}</select>`)}<div class="form-pair">${field("Amount ($)",amount(invoice?invoice.balance_cents/100:""))}${field("Received date",`<input type="date" name="date" value="${today}" required>`)}</div><div class="form-pair">${field("Payment number",`<input name="number" value="PAY-${Date.now().toString().slice(-6)}" required>`)}${field("Method",`<select name="method"><option>ach</option><option>wire</option><option>check</option><option>card</option></select>`)}</div>${field("Bank reference",`<input name="reference" placeholder="Trace or deposit reference">`)}`;}
  else if(kind==="application") {title="Apply existing payment";const rows=ar.invoices.filter(i=>i.customer_id===payment?.customer_id&&i.balance_cents>0&&i.status!=="void");body=`<div class="guardrail"><span>◇</span><div><strong>${escapeHtml(payment?.payment_number)}</strong><p>${money(payment?.unapplied_cents)} remains unapplied for ${escapeHtml(payment?.customer_name)}.</p></div></div>${field("Invoice",`<select name="invoice_id" required>${invoiceOptions(rows).replace('<option value="">Leave unapplied</option>','')}</select>`)}<div class="form-pair">${field("Amount ($)",amount(payment?.unapplied_cents/100))}${field("Application date",`<input type="date" name="date" value="${today}" required>`)}</div><input type="hidden" name="payment_id" value="${paymentId}">`;}
  else if(kind==="invoice") {title="Create customer invoice";body=`${field("Contract",`<select name="contract_id" required>${contractOptions}</select>`)}<div class="form-pair">${field("Invoice number",`<input name="number" value="INV-${Date.now().toString().slice(-6)}" required>`)}${field("Amount ($)",amount())}</div><div class="form-pair">${field("Invoice date",`<input type="date" name="date" value="${today}" required>`)}${field("Due date",`<input type="date" name="due_date" value="${today}" required>`)}</div>`;}
  else if(kind==="credit") {title=`Credit ${invoice?.invoice_number}`;body=`<input type="hidden" name="invoice_id" value="${invoiceId}"><div class="form-pair">${field("Credit amount ($)",amount(invoice?.balance_cents/100))}${field("Credit date",`<input type="date" name="date" value="${today}" required>`)}</div>${field("Credit memo number",`<input name="number" value="CM-${Date.now().toString().slice(-6)}" required>`)}${field("Reason",`<textarea name="reason" rows="3" required placeholder="Reason for reducing the invoice"></textarea>`)}`;}
  else if(kind==="writeoff") {title=`Write off ${invoice?.invoice_number}`;body=`<input type="hidden" name="invoice_id" value="${invoiceId}"><div class="form-pair">${field("Write-off amount ($)",amount(invoice?.balance_cents/100))}${field("Write-off date",`<input type="date" name="date" value="${today}" required>`)}</div>${field("Approval basis",`<textarea name="reason" rows="3" required placeholder="Collection history and approval"></textarea>`)}`;}
  else if(kind==="refund") {title=`Refund ${payment?.payment_number}`;const rows=ar.invoices.filter(i=>i.customer_id===payment?.customer_id&&i.applied_cents>i.refund_cents);body=`<input type="hidden" name="payment_id" value="${paymentId}">${field("Related invoice",`<select name="invoice_id">${invoiceOptions(rows)}</select>`)}<div class="form-pair">${field("Refund amount ($)",amount(payment?.unapplied_cents?payment.unapplied_cents/100:""))}${field("Refund date",`<input type="date" name="date" value="${today}" required>`)}</div>${field("Refund number",`<input name="number" value="RF-${Date.now().toString().slice(-6)}" required>`)}${field("Reason",`<textarea name="reason" rows="3" required></textarea>`)}`;}
  else if(kind==="dispute") {title=`Open dispute for ${invoice?.invoice_number}`;body=`<input type="hidden" name="invoice_id" value="${invoiceId}"><div class="form-pair">${field("Disputed amount ($)",amount((invoice?.balance_cents-invoice?.disputed_cents)/100))}${field("Opened date",`<input type="date" name="date" value="${today}" required>`)}</div>${field("Customer's reason",`<textarea name="reason" rows="3" required></textarea>`)}`;}
  else if(kind==="resolve") {title="Resolve invoice dispute";body=`<input type="hidden" name="dispute_id" value="${disputeId}">${field("Resolution",`<textarea name="reason" rows="3" required placeholder="Outcome and supporting evidence"></textarea>`)}<div class="form-pair">${field("Resolved date",`<input type="date" name="date" value="${today}" required>`)}${field("Outcome",`<select name="status"><option value="resolved">Resolved</option><option value="withdrawn">Withdrawn</option></select>`)}</div>`;}
  else if(kind==="collection") {title=`Log collection activity`;body=`<input type="hidden" name="customer_id" value="${invoice?.customer_id}"><input type="hidden" name="invoice_id" value="${invoiceId}"><div class="form-pair">${field("Activity",`<select name="activity_type"><option value="email">Email</option><option value="call">Call</option><option value="promise_to_pay">Promise to pay</option><option value="dunning">Dunning notice</option><option value="note">Note</option></select>`)}${field("Activity date",`<input type="date" name="date" value="${today}" required>`)}</div>${field("Notes",`<textarea name="reason" rows="3" required></textarea>`)}${field("Next action date",`<input type="date" name="next_action_date">`)}`;}
  document.querySelector("#ar-form-title").textContent=title;
  document.querySelector("#ar-form-body").innerHTML=`<form id="ar-activity-form" class="contract-form" data-kind="${kind}">${body}<button class="primary wide" type="submit">Post and save</button></form>`;
  document.querySelector("#ar-activity-form").addEventListener("submit",saveArActivity);
  document.querySelector("#ar-overlay").hidden=false;
}

async function saveArActivity(event){
  event.preventDefault();const form=event.currentTarget,f=new FormData(form),kind=form.dataset.kind,cents=Math.round(Number(f.get("amount")||0)*100),date=f.get("date");let path,payload;
  if(kind==="payment"){path="/api/receivables/payments";const invoiceId=Number(f.get("invoice_id"));payload={customer_id:Number(f.get("customer_id")),payment_number:f.get("number"),payment_date:date,amount_cents:cents,method:f.get("method"),reference:f.get("reference"),applications:invoiceId?[{invoice_id:invoiceId,amount_cents:cents}]:[]};}
  else if(kind==="application"){path="/api/receivables/applications";payload={payment_id:Number(f.get("payment_id")),invoice_id:Number(f.get("invoice_id")),amount_cents:cents,applied_date:date};}
  else if(kind==="invoice"){path="/api/invoices";payload={contract_id:Number(f.get("contract_id")),invoice_number:f.get("number"),invoice_date:date,due_date:f.get("due_date"),amount_cents:cents};}
  else if(kind==="credit"){path="/api/receivables/credits";payload={invoice_id:Number(f.get("invoice_id")),credit_number:f.get("number"),credit_date:date,amount_cents:cents,reason:f.get("reason")};}
  else if(kind==="writeoff"){path="/api/receivables/write-offs";payload={invoice_id:Number(f.get("invoice_id")),write_off_date:date,amount_cents:cents,reason:f.get("reason")};}
  else if(kind==="refund"){path="/api/receivables/refunds";payload={payment_id:Number(f.get("payment_id")),invoice_id:Number(f.get("invoice_id"))||null,refund_number:f.get("number"),refund_date:date,amount_cents:cents,reason:f.get("reason")};}
  else if(kind==="dispute"){path="/api/receivables/disputes";payload={invoice_id:Number(f.get("invoice_id")),opened_date:date,amount_cents:cents,reason:f.get("reason")};}
  else if(kind==="resolve"){path="/api/receivables/disputes/resolve";payload={dispute_id:Number(f.get("dispute_id")),resolved_date:date,resolution:f.get("reason"),status:f.get("status")};}
  else {path="/api/receivables/collections";payload={customer_id:Number(f.get("customer_id")),invoice_id:Number(f.get("invoice_id"))||null,activity_date:date,activity_type:f.get("activity_type"),notes:f.get("reason"),next_action_date:f.get("next_action_date")||null};}
  const button=form.querySelector("button[type=submit]");button.disabled=true;button.textContent="Posting…";
  try{await api(path,{method:"POST",body:JSON.stringify(payload)});document.querySelector("#ar-overlay").hidden=true;await load();navigate("receivables");toast("Receivables activity posted with journal and audit lineage.")}catch(error){toast(error.message,true);button.disabled=false;button.textContent="Post and save";}
}
async function voidArObject(kind,id){if(!confirm(`Void this ${kind}? Folio will post a reversing journal and retain the audit trail.`))return;try{const date=state.saas.receivables.as_of;await api(kind==="invoice"?`/api/invoices/${id}/void`:`/api/receivables/payments/${id}/void`,{method:"POST",body:JSON.stringify(kind==="invoice"?{void_date:date,reason:"Voided by user"}:{void_date:date})});await load();navigate("receivables");toast(`${kind[0].toUpperCase()+kind.slice(1)} voided with a reversing journal.`)}catch(error){toast(error.message,true)}}
async function completeCollection(id){try{await api("/api/receivables/collections/complete",{method:"POST",body:JSON.stringify({activity_id:id})});await load();navigate("receivables");toast("Collection action completed.")}catch(error){toast(error.message,true)}}

function bindLinks(){document.querySelectorAll("[data-view-link]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.viewLink)))}
function navigate(target){state.currentView=target;render()}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));

const overlay=document.querySelector("#entry-overlay");
document.querySelector("#new-entry").addEventListener("click",()=>{overlay.hidden=false;document.querySelector("#ai-description").focus()});
document.querySelector("[data-close]").addEventListener("click",()=>overlay.hidden=true);
overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.hidden=true});
document.querySelectorAll(".examples button").forEach(b=>b.addEventListener("click",()=>document.querySelector("#ai-description").value=b.textContent));
document.querySelector("#generate-draft").addEventListener("click",generateDraft);

const contractOverlay=document.querySelector("#contract-overlay"),contractForm=document.querySelector("#contract-form");
document.querySelector("[data-contract-close]").addEventListener("click",()=>contractOverlay.hidden=true);
contractOverlay.addEventListener("click",e=>{if(e.target===contractOverlay)contractOverlay.hidden=true});
contractForm.addEventListener("submit",saveContract);
const arOverlay=document.querySelector("#ar-overlay");
document.querySelector("[data-ar-close]").addEventListener("click",()=>arOverlay.hidden=true);
arOverlay.addEventListener("click",e=>{if(e.target===arOverlay)arOverlay.hidden=true});

function openContractForm(){
  contractForm.elements.customer_id.innerHTML=state.saas.customers.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  contractForm.elements.contract_number.value=`NEW-${Date.now().toString().slice(-6)}`;
  contractForm.elements.start_date.value="2026-09-01";contractForm.elements.end_date.value="2027-08-31";
  contractOverlay.hidden=false;
}

async function saveContract(event){
  event.preventDefault();const f=new FormData(contractForm),cents=name=>Math.round(Number(f.get(name)||0)*100),price=cents("price");
  const payload={customer_id:Number(f.get("customer_id")),entity_id:1,contract_number:f.get("contract_number"),signed_date:"2026-08-22",start_date:f.get("start_date"),end_date:f.get("end_date"),currency:"USD",transaction_price_cents:price,variable_consideration_cents:cents("variable"),constraint_percent:Number(f.get("constraint")),billing_model:f.get("method")==="usage"?"usage":"subscription",commission_cents:cents("commission"),obligations:[{product_id:state.saas.products[0]?.id,description:f.get("obligation"),ssp_cents:cents("ssp"),recognition_method:f.get("method"),total_units:f.get("method")==="usage"?100000:0}]};
  try{const contract=await api("/api/contracts",{method:"POST",body:JSON.stringify(payload)});const invoice=cents("invoice");if(invoice)await api("/api/invoices",{method:"POST",body:JSON.stringify({contract_id:contract.id,invoice_number:`INV-${Date.now().toString().slice(-6)}`,invoice_date:f.get("start_date"),amount_cents:invoice})});contractOverlay.hidden=true;contractForm.reset();await load();navigate("revenue");toast("Contract allocated, schedules created, and billing posted.")}catch(error){toast(error.message,true)}
}

async function generateDraft(){
  const button=document.querySelector("#generate-draft"), description=document.querySelector("#ai-description").value;
  button.disabled=true;button.textContent="Working through the accounting…";
  try{state.proposal=await api("/api/ai/draft",{method:"POST",body:JSON.stringify({description})});renderProposal()}
  catch(error){toast(error.message,true)}finally{button.disabled=false;button.textContent="✦ Generate draft"}
}
function renderProposal(){
  const p=state.proposal, account=id=>state.accounts.find(a=>a.id===id);
  document.querySelector("#draft-result").innerHTML=`<article class="draft-card"><div class="draft-summary"><div><h3>${escapeHtml(p.memo)}</h3><span class="badge ${p.confidence==="high"?"posted":"draft"}">${p.confidence} confidence</span></div><p>${escapeHtml(p.rationale)} Generated by ${p.provider==="openai"?"OpenAI":"local accounting rules"}.</p></div><div class="draft-lines">${p.lines.map(l=>`<div class="draft-line"><div><strong>${account(l.account_id)?.code} · ${escapeHtml(account(l.account_id)?.name||"Unknown")}</strong><small>${escapeHtml(l.description)}</small></div><b>${l.debit_cents?"Dr ":"Cr "}${money(l.debit_cents||l.credit_cents)}</b></div>`).join("")}</div><div class="draft-actions"><button class="secondary" id="discard-draft">Discard</button><button class="primary" id="save-draft">Save for approval</button></div></article>`;
  document.querySelector("#discard-draft").addEventListener("click",()=>{state.proposal=null;document.querySelector("#draft-result").innerHTML=""});
  document.querySelector("#save-draft").addEventListener("click",saveDraft);
}
async function saveDraft(){
  const p=state.proposal;
  try{await api("/api/journals",{method:"POST",body:JSON.stringify({date:p.date,memo:p.memo,source:"ai",ai_rationale:p.rationale,lines:p.lines})});overlay.hidden=true;state.proposal=null;document.querySelector("#draft-result").innerHTML="";document.querySelector("#ai-description").value="";await load();navigate("journals");toast("Draft saved. It has not been posted.")}
  catch(error){toast(error.message,true)}
}
async function postEntry(id){
  if(!confirm("Post this balanced journal entry? Posted entries are immutable."))return;
  try{await api(`/api/journals/${id}/post`,{method:"POST"});await load();navigate("journals");toast("Entry posted and sealed with an integrity hash.")}
  catch(error){toast(error.message,true)}
}
function toast(message,isError=false){const el=document.querySelector("#toast");el.textContent=message;el.style.background=isError?"#8c3030":"#17211b";el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,3500)}
function escapeHtml(value=""){return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}

load().catch(error=>{view.innerHTML=`<div class="empty">Could not load the ledger: ${escapeHtml(error.message)}</div>`});
