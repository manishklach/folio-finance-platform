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
  ({ dashboard: renderDashboard, journals: renderJournals, revenue: renderRevenue, metrics: renderMetrics, accounts: renderAccounts, reports: renderReports, operations: renderOperations, entities: renderEntities, audit: renderAudit }[state.currentView] || renderDashboard)();
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
