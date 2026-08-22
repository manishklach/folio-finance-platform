const isoMonth = date => String(date).slice(0, 7);
const asDate = value => new Date(`${value}T00:00:00Z`);
const monthKey = date => date.toISOString().slice(0, 7);
const addMonths = (value, count) => { const d = asDate(value); d.setUTCMonth(d.getUTCMonth() + count); return d.toISOString().slice(0, 10); };
const monthCount = (start, end) => Math.max(1, (asDate(end).getUTCFullYear() - asDate(start).getUTCFullYear()) * 12 + asDate(end).getUTCMonth() - asDate(start).getUTCMonth() + 1);
const moneyRatio = (amount, weight, total) => total ? Math.round(amount * weight / total) : 0;

export function migrateSaas(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,currency TEXT NOT NULL,parent_id INTEGER REFERENCES entities(id),active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS fx_rates (rate_date TEXT NOT NULL,currency TEXT NOT NULL,usd_rate REAL NOT NULL CHECK(usd_rate>0),PRIMARY KEY(rate_date,currency));
    CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,segment TEXT NOT NULL DEFAULT 'mid-market',region TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT,sku TEXT NOT NULL UNIQUE,name TEXT NOT NULL,category TEXT NOT NULL DEFAULT 'subscription',ssp_cents INTEGER NOT NULL,recurring INTEGER NOT NULL DEFAULT 1,revenue_account_code TEXT NOT NULL DEFAULT '4000');
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL REFERENCES customers(id),entity_id INTEGER NOT NULL REFERENCES entities(id),contract_number TEXT NOT NULL UNIQUE,
      signed_date TEXT NOT NULL,start_date TEXT NOT NULL,end_date TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('draft','active','cancelled','completed')),
      currency TEXT NOT NULL DEFAULT 'USD',transaction_price_cents INTEGER NOT NULL,variable_consideration_cents INTEGER NOT NULL DEFAULT 0,constraint_percent INTEGER NOT NULL DEFAULT 100,
      billing_model TEXT NOT NULL DEFAULT 'subscription',renewal_of INTEGER REFERENCES contracts(id),cancelled_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS performance_obligations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,contract_id INTEGER NOT NULL REFERENCES contracts(id),product_id INTEGER REFERENCES products(id),description TEXT NOT NULL,
      ssp_cents INTEGER NOT NULL,allocated_price_cents INTEGER NOT NULL,recognition_method TEXT NOT NULL CHECK(recognition_method IN ('straight_line','point_in_time','usage','milestone')),
      start_date TEXT NOT NULL,end_date TEXT NOT NULL,total_units REAL NOT NULL DEFAULT 0,units_delivered REAL NOT NULL DEFAULT 0,milestone_progress REAL NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS revenue_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,obligation_id INTEGER NOT NULL REFERENCES performance_obligations(id),period TEXT NOT NULL,amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','recognized','reversed')),journal_entry_id INTEGER REFERENCES journal_entries(id),recognized_at TEXT,UNIQUE(obligation_id,period));
    CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT,contract_id INTEGER NOT NULL REFERENCES contracts(id),invoice_number TEXT NOT NULL UNIQUE,invoice_date TEXT NOT NULL,due_date TEXT,amount_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'open',journal_entry_id INTEGER REFERENCES journal_entries(id));
    CREATE TABLE IF NOT EXISTS usage_events (id INTEGER PRIMARY KEY AUTOINCREMENT,obligation_id INTEGER NOT NULL REFERENCES performance_obligations(id),event_date TEXT NOT NULL,units REAL NOT NULL,amount_cents INTEGER NOT NULL,external_id TEXT UNIQUE);
    CREATE TABLE IF NOT EXISTS contract_modifications (id INTEGER PRIMARY KEY AUTOINCREMENT,contract_id INTEGER NOT NULL REFERENCES contracts(id),effective_date TEXT NOT NULL,kind TEXT NOT NULL,description TEXT NOT NULL,price_change_cents INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS commissions (id INTEGER PRIMARY KEY AUTOINCREMENT,contract_id INTEGER NOT NULL REFERENCES contracts(id),amount_cents INTEGER NOT NULL,start_date TEXT NOT NULL,amortization_months INTEGER NOT NULL,capitalizable INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS commission_schedules (id INTEGER PRIMARY KEY AUTOINCREMENT,commission_id INTEGER NOT NULL REFERENCES commissions(id),period TEXT NOT NULL,amount_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',journal_entry_id INTEGER REFERENCES journal_entries(id),UNIQUE(commission_id,period));
    CREATE TABLE IF NOT EXISTS software_projects (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,model TEXT NOT NULL CHECK(model IN ('internal_use','external_sale')),stage TEXT NOT NULL,cost_cents INTEGER NOT NULL,capitalized_cents INTEGER NOT NULL,expensed_cents INTEGER NOT NULL,placed_in_service TEXT,useful_life_months INTEGER NOT NULL DEFAULT 36,policy_basis TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS software_amortization (id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER NOT NULL REFERENCES software_projects(id),period TEXT NOT NULL,amount_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',journal_entry_id INTEGER REFERENCES journal_entries(id),UNIQUE(project_id,period));
    CREATE TABLE IF NOT EXISTS subscription_snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL REFERENCES customers(id),period TEXT NOT NULL,mrr_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'active',UNIQUE(customer_id,period));
    CREATE TABLE IF NOT EXISTS operating_metrics (period TEXT PRIMARY KEY,sales_marketing_cents INTEGER NOT NULL DEFAULT 0,cloud_cogs_cents INTEGER NOT NULL DEFAULT 0,new_customers INTEGER NOT NULL DEFAULT 0,capitalized_software_cents INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS idx_revenue_period ON revenue_schedules(period,status);
    CREATE INDEX IF NOT EXISTS idx_contract_customer ON contracts(customer_id,status);
  `);
  ensureColumn(db, "journal_entries", "entity_id", "INTEGER");
  ensureColumn(db, "journal_entries", "currency", "TEXT NOT NULL DEFAULT 'USD'");
  ensureColumn(db, "journal_entries", "exchange_rate", "REAL NOT NULL DEFAULT 1");
}

function ensureColumn(db, table, column, definition) {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some(row => row.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function createSaasRepository(db, ledger) {
  const accountId = code => {
    const row = db.prepare("SELECT id FROM accounts WHERE code=?").get(code);
    if (!row) throw new Error(`Missing account ${code}`);
    return row.id;
  };

  function listContracts() {
    return db.prepare(`SELECT c.*,cu.name customer_name,e.name entity_name,
      COALESCE(SUM(po.allocated_price_cents),0) allocated_cents,
      COALESCE((SELECT SUM(rs.amount_cents) FROM revenue_schedules rs JOIN performance_obligations p2 ON p2.id=rs.obligation_id WHERE p2.contract_id=c.id AND rs.status='recognized'),0) recognized_cents,
      COALESCE((SELECT SUM(i.amount_cents) FROM invoices i WHERE i.contract_id=c.id),0) billed_cents
      FROM contracts c JOIN customers cu ON cu.id=c.customer_id JOIN entities e ON e.id=c.entity_id LEFT JOIN performance_obligations po ON po.contract_id=c.id GROUP BY c.id ORDER BY c.signed_date DESC`).all();
  }

  function getContract(id) {
    const contract = db.prepare(`SELECT c.*,cu.name customer_name,e.name entity_name FROM contracts c JOIN customers cu ON cu.id=c.customer_id JOIN entities e ON e.id=c.entity_id WHERE c.id=?`).get(id);
    if (!contract) return null;
    return { ...contract,
      obligations: db.prepare(`SELECT po.*,p.sku,p.name product_name FROM performance_obligations po LEFT JOIN products p ON p.id=po.product_id WHERE po.contract_id=? ORDER BY po.id`).all(id),
      invoices: db.prepare("SELECT * FROM invoices WHERE contract_id=? ORDER BY invoice_date").all(id),
      modifications: db.prepare("SELECT * FROM contract_modifications WHERE contract_id=? ORDER BY effective_date").all(id)
    };
  }

  function createContract(input) {
    const required = ["customer_id","entity_id","contract_number","signed_date","start_date","end_date","transaction_price_cents","obligations"];
    for (const key of required) if (input[key] == null) throw bad(`Contract requires ${key}`);
    if (!input.obligations.length) throw bad("At least one performance obligation is required");
    const constrainedVariable = Math.round(Number(input.variable_consideration_cents || 0) * Number(input.constraint_percent ?? 100) / 100);
    const allocatable = Number(input.transaction_price_cents) + constrainedVariable;
    const totalSsp = input.obligations.reduce((s, o) => s + Number(o.ssp_cents), 0);
    if (allocatable <= 0 || totalSsp <= 0) throw bad("Transaction price and total SSP must be positive");
    let contractId;
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = db.prepare(`INSERT INTO contracts(customer_id,entity_id,contract_number,signed_date,start_date,end_date,currency,transaction_price_cents,variable_consideration_cents,constraint_percent,billing_model,renewal_of)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(input.customer_id,input.entity_id,input.contract_number,input.signed_date,input.start_date,input.end_date,input.currency||"USD",input.transaction_price_cents,input.variable_consideration_cents||0,input.constraint_percent??100,input.billing_model||"subscription",input.renewal_of||null);
      contractId = Number(result.lastInsertRowid);
      let allocated = 0;
      input.obligations.forEach((o, index) => {
        const amount = index === input.obligations.length - 1 ? allocatable - allocated : moneyRatio(allocatable, o.ssp_cents, totalSsp);
        allocated += amount;
        const po = db.prepare(`INSERT INTO performance_obligations(contract_id,product_id,description,ssp_cents,allocated_price_cents,recognition_method,start_date,end_date,total_units)
          VALUES(?,?,?,?,?,?,?,?,?)`).run(contractId,o.product_id||null,o.description,o.ssp_cents,amount,o.recognition_method,o.start_date||input.start_date,o.end_date||input.end_date,o.total_units||0);
        generateRevenueSchedule(db, Number(po.lastInsertRowid), amount, o.recognition_method, o.start_date||input.start_date, o.end_date||input.end_date);
      });
      if (input.commission_cents > 0) createCommissionInternal(db, contractId, input.commission_cents, input.start_date, input.commission_months || monthCount(input.start_date,input.end_date));
      audit(db,"contract",contractId,"asc606_contract_created","demo.user",{allocatable,totalSsp,obligations:input.obligations.length});
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    if (input.commission_cents > 0) {
      const draft=ledger.createDraft({date:input.signed_date,memo:`ASC 340-40 incremental commission — ${input.contract_number}`,source:"commission_subledger",entity_id:input.entity_id,currency:input.currency||"USD",lines:[
        {account_id:accountId("1210"),debit_cents:input.commission_cents,credit_cents:0},{account_id:accountId("2000"),debit_cents:0,credit_cents:input.commission_cents}
      ]},"commission.engine");
      ledger.postJournal(draft.id,"commission.engine");
    }
    return getContract(contractId);
  }

  function createInvoice(input) {
    const contract = getContract(input.contract_id);
    if (!contract) throw bad("Contract not found",404);
    const draft = ledger.createDraft({ date: input.invoice_date, memo: `Invoice ${input.invoice_number} — ${contract.customer_name}`, source: "billing", entity_id: contract.entity_id, currency: contract.currency, lines: [
      { account_id: accountId("1100"), debit_cents: input.amount_cents, credit_cents: 0 },
      { account_id: accountId("2100"), debit_cents: 0, credit_cents: input.amount_cents }
    ]}, "billing.engine");
    const posted = ledger.postJournal(draft.id,"billing.engine");
    const result = db.prepare("INSERT INTO invoices(contract_id,invoice_number,invoice_date,due_date,amount_cents,journal_entry_id) VALUES(?,?,?,?,?,?)")
      .run(input.contract_id,input.invoice_number,input.invoice_date,input.due_date||null,input.amount_cents,posted.id);
    audit(db,"invoice",Number(result.lastInsertRowid),"invoice_posted","billing.engine",{journal_entry_id:posted.id});
    return db.prepare("SELECT * FROM invoices WHERE id=?").get(result.lastInsertRowid);
  }

  function recordUsage(input) {
    const po = db.prepare("SELECT * FROM performance_obligations WHERE id=?").get(input.obligation_id);
    if (!po || po.recognition_method !== "usage") throw bad("Usage obligation not found");
    const amount = input.amount_cents ?? Math.round(po.allocated_price_cents * input.units / Math.max(po.total_units, input.units));
    const result = db.prepare("INSERT INTO usage_events(obligation_id,event_date,units,amount_cents,external_id) VALUES(?,?,?,?,?)").run(po.id,input.event_date,input.units,amount,input.external_id||null);
    db.prepare("UPDATE performance_obligations SET units_delivered=units_delivered+? WHERE id=?").run(input.units,po.id);
    db.prepare(`INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?) ON CONFLICT(obligation_id,period) DO UPDATE SET amount_cents=amount_cents+excluded.amount_cents`).run(po.id,isoMonth(input.event_date),amount);
    return { id:Number(result.lastInsertRowid),amount_cents:amount };
  }

  function updateMilestone(input) {
    const po = db.prepare("SELECT * FROM performance_obligations WHERE id=?").get(input.obligation_id);
    if (!po || po.recognition_method !== "milestone") throw bad("Milestone obligation not found");
    const previous = po.milestone_progress;
    const progress = Math.max(previous,Math.min(100,Number(input.progress)));
    const amount = Math.round(po.allocated_price_cents * (progress-previous)/100);
    db.prepare("UPDATE performance_obligations SET milestone_progress=? WHERE id=?").run(progress,po.id);
    if (amount) db.prepare(`INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?) ON CONFLICT(obligation_id,period) DO UPDATE SET amount_cents=amount_cents+excluded.amount_cents`).run(po.id,isoMonth(input.event_date),amount);
    return { progress,amount_cents:amount };
  }

  function recognizeThrough(asOf) {
    const through = isoMonth(asOf);
    const schedules = db.prepare(`SELECT rs.*,po.contract_id,po.description,c.entity_id,c.currency,c.customer_id,
      COALESCE((SELECT SUM(i.amount_cents) FROM invoices i WHERE i.contract_id=c.id),0) billed_cents,
      COALESCE((SELECT SUM(rs2.amount_cents) FROM revenue_schedules rs2 JOIN performance_obligations po2 ON po2.id=rs2.obligation_id WHERE po2.contract_id=c.id AND rs2.status='recognized'),0) recognized_before
      FROM revenue_schedules rs JOIN performance_obligations po ON po.id=rs.obligation_id JOIN contracts c ON c.id=po.contract_id
      WHERE rs.status='pending' AND rs.period<=? AND (c.status='active' OR (c.status='cancelled' AND rs.period<substr(c.cancelled_at,1,7))) ORDER BY rs.period,rs.id`).all(through);
    const posted=[];
    for (const schedule of schedules) {
      const useDeferred = schedule.billed_cents > schedule.recognized_before;
      const debitCode = useDeferred ? "2100" : "1150";
      const draft=ledger.createDraft({date:`${schedule.period}-28`,memo:`ASC 606 revenue — ${schedule.description}`,source:"revenue_subledger",entity_id:schedule.entity_id,currency:schedule.currency,lines:[
        {account_id:accountId(debitCode),debit_cents:schedule.amount_cents,credit_cents:0},{account_id:accountId("4000"),debit_cents:0,credit_cents:schedule.amount_cents}
      ]},"revenue.engine");
      const journal=ledger.postJournal(draft.id,"revenue.engine");
      db.prepare("UPDATE revenue_schedules SET status='recognized',journal_entry_id=?,recognized_at=CURRENT_TIMESTAMP WHERE id=?").run(journal.id,schedule.id);
      posted.push(journal.id);
    }
    recognizeCommissionThrough(through);
    recognizeSoftwareThrough(through);
    return { recognized_schedules:schedules.length,journal_entry_ids:posted };
  }

  function modifyContract(input) {
    const contract=getContract(input.contract_id); if(!contract) throw bad("Contract not found",404);
    db.prepare("INSERT INTO contract_modifications(contract_id,effective_date,kind,description,price_change_cents) VALUES(?,?,?,?,?)").run(input.contract_id,input.effective_date,input.kind,input.description,input.price_change_cents||0);
    if(input.kind==="cancellation") { db.prepare("UPDATE contracts SET status='cancelled',cancelled_at=? WHERE id=?").run(input.effective_date,input.contract_id); db.prepare(`UPDATE revenue_schedules SET status='reversed' WHERE obligation_id IN (SELECT id FROM performance_obligations WHERE contract_id=?) AND status='pending' AND period>=?`).run(input.contract_id,isoMonth(input.effective_date)); }
    else if(input.kind==="extension" && input.new_end_date) {
      db.prepare("UPDATE contracts SET end_date=? WHERE id=?").run(input.new_end_date,input.contract_id);
      for(const po of contract.obligations.filter(o=>o.recognition_method==="straight_line")){
        const recognized=db.prepare("SELECT COALESCE(SUM(amount_cents),0) value FROM revenue_schedules WHERE obligation_id=? AND status='recognized'").get(po.id).value;
        const remaining=po.allocated_price_cents-recognized;
        db.prepare("DELETE FROM revenue_schedules WHERE obligation_id=? AND status='pending'").run(po.id);
        db.prepare("UPDATE performance_obligations SET end_date=? WHERE id=?").run(input.new_end_date,po.id);
        distribute(remaining,monthCount(input.effective_date,input.new_end_date)).forEach((amount,i)=>db.prepare("INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?)").run(po.id,isoMonth(addMonths(input.effective_date,i)),amount));
      }
    }
    else if(input.price_change_cents) {
      db.prepare("UPDATE contracts SET transaction_price_cents=transaction_price_cents+? WHERE id=?").run(input.price_change_cents,input.contract_id);
      const totalSsp=contract.obligations.reduce((s,o)=>s+o.ssp_cents,0); let allocated=0;
      contract.obligations.forEach((po,index)=>{
        const delta=index===contract.obligations.length-1?input.price_change_cents-allocated:moneyRatio(input.price_change_cents,po.ssp_cents,totalSsp);allocated+=delta;
        db.prepare("UPDATE performance_obligations SET allocated_price_cents=allocated_price_cents+? WHERE id=?").run(delta,po.id);
        const pending=db.prepare("SELECT id FROM revenue_schedules WHERE obligation_id=? AND status='pending' ORDER BY period").all(po.id);
        if(input.treatment==="cumulative_catchup"){
          const recognized=db.prepare("SELECT COALESCE(SUM(amount_cents),0) value FROM revenue_schedules WHERE obligation_id=? AND status='recognized'").get(po.id).value;
          const progress=po.allocated_price_cents?recognized/po.allocated_price_cents:0,catchup=Math.round(delta*progress);
          if(catchup) db.prepare(`INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?) ON CONFLICT(obligation_id,period) DO UPDATE SET amount_cents=amount_cents+excluded.amount_cents`).run(po.id,isoMonth(input.effective_date),catchup);
          spreadScheduleDelta(db,pending,delta-catchup);
        }else spreadScheduleDelta(db,pending,delta);
      });
    }
    audit(db,"contract",input.contract_id,"contract_modified","demo.user",input);
    return getContract(input.contract_id);
  }

  function addSoftwareProject(input) {
    const internal = input.model === "internal_use";
    const capitalizable = internal ? input.stage === "application_development" : input.stage === "post_technological_feasibility";
    const capitalized = capitalizable ? input.cost_cents : 0, expensed = capitalizable ? 0 : input.cost_cents;
    const basis = capitalizable ? (internal ? "ASC 350-40: application-development stage" : "ASC 985-20: after technological feasibility") : (internal ? "ASC 350-40: preliminary/post-implementation stage expensed" : "ASC 985-20: before feasibility expensed");
    const result=db.prepare(`INSERT INTO software_projects(name,model,stage,cost_cents,capitalized_cents,expensed_cents,placed_in_service,useful_life_months,policy_basis) VALUES(?,?,?,?,?,?,?,?,?)`)
      .run(input.name,input.model,input.stage,input.cost_cents,capitalized,expensed,input.placed_in_service||null,input.useful_life_months||36,basis);
    const id=Number(result.lastInsertRowid);
    const draft=ledger.createDraft({date:input.cost_date||input.placed_in_service||new Date().toISOString().slice(0,10),memo:`Software development cost — ${input.name}`,source:"software_policy",lines:capitalizable?
      [{account_id:accountId("1250"),debit_cents:input.cost_cents,credit_cents:0},{account_id:accountId("2000"),debit_cents:0,credit_cents:input.cost_cents}]:
      [{account_id:accountId("6100"),debit_cents:input.cost_cents,credit_cents:0},{account_id:accountId("2000"),debit_cents:0,credit_cents:input.cost_cents}]},"software.engine");
    ledger.postJournal(draft.id,"software.engine");
    if(capitalized && input.placed_in_service) distribute(input.cost_cents,input.useful_life_months||36).forEach((amount,i)=>db.prepare("INSERT INTO software_amortization(project_id,period,amount_cents) VALUES(?,?,?)").run(id,isoMonth(addMonths(input.placed_in_service,i)),amount));
    return db.prepare("SELECT * FROM software_projects WHERE id=?").get(id);
  }

  function recognizeCommissionThrough(through) {
    const rows=db.prepare("SELECT cs.*,c.contract_id FROM commission_schedules cs JOIN commissions c ON c.id=cs.commission_id WHERE cs.status='pending' AND cs.period<=?").all(through);
    for(const row of rows){const draft=ledger.createDraft({date:`${row.period}-28`,memo:"ASC 340-40 commission amortization",source:"commission_subledger",lines:[{account_id:accountId("5400"),debit_cents:row.amount_cents,credit_cents:0},{account_id:accountId("1210"),debit_cents:0,credit_cents:row.amount_cents}]},"commission.engine");const j=ledger.postJournal(draft.id,"commission.engine");db.prepare("UPDATE commission_schedules SET status='recognized',journal_entry_id=? WHERE id=?").run(j.id,row.id);}
  }
  function recognizeSoftwareThrough(through) {
    const rows=db.prepare("SELECT * FROM software_amortization WHERE status='pending' AND period<=?").all(through);
    for(const row of rows){const draft=ledger.createDraft({date:`${row.period}-28`,memo:"Capitalized software amortization",source:"software_subledger",lines:[{account_id:accountId("5500"),debit_cents:row.amount_cents,credit_cents:0},{account_id:accountId("1255"),debit_cents:0,credit_cents:row.amount_cents}]},"software.engine");const j=ledger.postJournal(draft.id,"software.engine");db.prepare("UPDATE software_amortization SET status='recognized',journal_entry_id=? WHERE id=?").run(j.id,row.id);}
  }

  function revenueWaterfall() { return db.prepare(`SELECT rs.period,SUM(rs.amount_cents) scheduled_cents,SUM(CASE WHEN rs.status='recognized' THEN rs.amount_cents ELSE 0 END) recognized_cents,SUM(CASE WHEN rs.status='pending' THEN rs.amount_cents ELSE 0 END) remaining_cents FROM revenue_schedules rs GROUP BY rs.period ORDER BY rs.period`).all(); }
  function deferredRollforward() { const billed=db.prepare("SELECT COALESCE(SUM(amount_cents),0) value FROM invoices").get().value; const recognized=db.prepare("SELECT COALESCE(SUM(amount_cents),0) value FROM revenue_schedules WHERE status='recognized'").get().value; return {opening_cents:0,billings_cents:billed,revenue_cents:recognized,ending_cents:Math.max(0,billed-recognized),contract_asset_cents:Math.max(0,recognized-billed)}; }
  function rpo() { return db.prepare(`SELECT COALESCE(SUM(rs.amount_cents),0) total_cents,COALESCE(SUM(CASE WHEN rs.period<=strftime('%Y-%m','now','+12 months') THEN rs.amount_cents ELSE 0 END),0) next_12_months_cents FROM revenue_schedules rs JOIN performance_obligations po ON po.id=rs.obligation_id JOIN contracts c ON c.id=po.contract_id WHERE rs.status='pending' AND c.status='active'`).get(); }

  function metrics() {
    const periods=db.prepare("SELECT DISTINCT period FROM subscription_snapshots ORDER BY period DESC LIMIT 2").all().map(x=>x.period);
    const latest=periods[0],prior=periods[1]||latest;
    const current=new Map(db.prepare("SELECT customer_id,mrr_cents FROM subscription_snapshots WHERE period=?").all(latest).map(x=>[x.customer_id,x.mrr_cents]));
    const previous=new Map(db.prepare("SELECT customer_id,mrr_cents FROM subscription_snapshots WHERE period=?").all(prior).map(x=>[x.customer_id,x.mrr_cents]));
    let start=0,end=0,churn=0,contraction=0,expansion=0,newMrr=0;
    for(const [id,mrr] of previous){start+=mrr;const now=current.get(id)||0;if(!now)churn+=mrr;else if(now<mrr)contraction+=mrr-now;else expansion+=now-mrr;}
    for(const [id,mrr] of current){end+=mrr;if(!previous.has(id))newMrr+=mrr;}
    const revenue=ledger.dashboard().revenue_cents, expenses=ledger.dashboard().expense_cents;
    const cogs=db.prepare("SELECT COALESCE(SUM(cloud_cogs_cents),0) value FROM operating_metrics").get().value;
    const sm=db.prepare("SELECT COALESCE(SUM(sales_marketing_cents),0) value FROM operating_metrics").get().value;
    const newCustomers=db.prepare("SELECT COALESCE(SUM(new_customers),0) value FROM operating_metrics").get().value;
    const contracts=db.prepare("SELECT COALESCE(SUM(transaction_price_cents),0) bookings,COUNT(*) count FROM contracts").get();
    const billings=db.prepare("SELECT COALESCE(SUM(amount_cents),0) value FROM invoices").get().value;
    const grossMargin=revenue?Math.max(-5,(revenue-cogs)/revenue):0;
    const monthlyChurn=start?churn/start:0;
    const arpa=current.size?end/current.size:0;
    const growth=start?(end-start)/start:0;
    const operatingMargin=revenue?(revenue-expenses)/revenue:0;
    return {period:latest,mrr_cents:end,arr_cents:end*12,nrr:start?(start-churn-contraction+expansion)/start:1,grr:start?(start-churn-contraction)/start:1,churn_cents:churn,contraction_cents:contraction,expansion_cents:expansion,new_mrr_cents:newMrr,
      bookings_cents:contracts.bookings,billings_cents:billings,acv_cents:contracts.count?Math.round(contracts.bookings/contracts.count):0,gross_margin:grossMargin,cac_cents:newCustomers?Math.round(sm/newCustomers):0,
      ltv_cents:monthlyChurn?Math.round(arpa*grossMargin/monthlyChurn):0,burn_multiple:(expenses>revenue&&end>start)?(expenses-revenue)/((end-start)*12):0,magic_number:sm?((end-start)*12)/sm:0,rule_of_40:(growth+operatingMargin)*100,growth_rate:growth,operating_margin:operatingMargin};
  }

  function cashFlow() {
    const rows=db.prepare(`SELECT j.id,j.memo,l.debit_cents,l.credit_cents,a.code,a.type FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted'`).all();
    const byEntry=new Map(); for(const r of rows){if(!byEntry.has(r.id))byEntry.set(r.id,[]);byEntry.get(r.id).push(r);}
    let operating=0,investing=0,financing=0;
    for(const lines of byEntry.values()){const cash=lines.find(l=>l.code==="1000");if(!cash)continue;const change=cash.debit_cents-cash.credit_cents;const codes=new Set(lines.map(l=>l.code));if(codes.has("3000")||codes.has("2400"))financing+=change;else if(codes.has("1250"))investing+=change;else operating+=change;}
    return {operating_cents:operating,investing_cents:investing,financing_cents:financing,net_change_cents:operating+investing+financing};
  }

  function consolidation() {
    const entities=db.prepare("SELECT * FROM entities ORDER BY id").all();
    const balances=db.prepare(`SELECT COALESCE(j.entity_id,1) entity_id,a.type,SUM((l.debit_cents-l.credit_cents)*j.exchange_rate) signed_cents FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' GROUP BY entity_id,a.type`).all();
    return {entities,balances,intercompany_eliminations_cents:Math.abs(db.prepare(`SELECT COALESCE(SUM((l.debit_cents-l.credit_cents)*j.exchange_rate),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND a.code IN ('1300','2300')`).get().value)};
  }

  function revalueFx(asOf) {
    const entities=db.prepare("SELECT * FROM entities WHERE currency<>'USD' AND active=1").all();
    const posted=[];
    for(const entity of entities){
      const rate=db.prepare("SELECT usd_rate FROM fx_rates WHERE currency=? AND rate_date<=? ORDER BY rate_date DESC LIMIT 1").get(entity.currency,asOf)?.usd_rate;
      if(!rate) continue;
      const exposure=db.prepare(`SELECT COALESCE(SUM(CASE WHEN a.type='asset' THEN l.debit_cents-l.credit_cents ELSE l.credit_cents-l.debit_cents END),0) local_cents,
        COALESCE(SUM(CASE WHEN a.type='asset' THEN (l.debit_cents-l.credit_cents)*j.exchange_rate ELSE (l.credit_cents-l.debit_cents)*j.exchange_rate END),0) historical_usd_cents
        FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id
        WHERE j.status='posted' AND j.entity_id=? AND a.code IN ('1000','1100','2000')`).get(entity.id);
      const existingAdjustment=db.prepare(`SELECT COALESCE(SUM(l.debit_cents-l.credit_cents),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND j.entity_id=? AND a.code='1350'`).get(entity.id).value;
      const targetAdjustment=Math.round(exposure.local_cents*rate-exposure.historical_usd_cents),delta=targetAdjustment-existingAdjustment; if(!delta)continue;
      const lines=delta>0?[{account_id:accountId("1350"),debit_cents:delta,credit_cents:0},{account_id:accountId("6200"),debit_cents:0,credit_cents:delta}]:[{account_id:accountId("6200"),debit_cents:-delta,credit_cents:0},{account_id:accountId("1350"),debit_cents:0,credit_cents:-delta}];
      const d=ledger.createDraft({date:asOf,memo:`FX revaluation — ${entity.name}`,source:"fx_revaluation",entity_id:entity.id,currency:"USD",exchange_rate:1,lines},"fx.engine");posted.push(ledger.postJournal(d.id,"fx.engine").id);
    }
    return {journal_entry_ids:posted};
  }

  function postEliminations(asOf) {
    const receivable=db.prepare(`SELECT COALESCE(SUM(l.debit_cents-l.credit_cents),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND a.code='1300'`).get().value;
    const payable=db.prepare(`SELECT COALESCE(SUM(l.credit_cents-l.debit_cents),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND a.code='2300'`).get().value;
    const amount=Math.min(Math.max(0,receivable),Math.max(0,payable)); if(!amount)return {eliminated_cents:0,journal_entry_id:null};
    const d=ledger.createDraft({date:asOf,memo:"Consolidation elimination — intercompany balances",source:"consolidation",entity_id:1,lines:[{account_id:accountId("2300"),debit_cents:amount,credit_cents:0},{account_id:accountId("1300"),debit_cents:0,credit_cents:amount}]},"consolidation.engine");
    const j=ledger.postJournal(d.id,"consolidation.engine");return {eliminated_cents:amount,journal_entry_id:j.id};
  }

  return {listContracts,getContract,createContract,createInvoice,recordUsage,updateMilestone,recognizeThrough,modifyContract,addSoftwareProject,revenueWaterfall,deferredRollforward,rpo,metrics,cashFlow,consolidation,revalueFx,postEliminations,
    customers:()=>db.prepare("SELECT * FROM customers ORDER BY name").all(),products:()=>db.prepare("SELECT * FROM products ORDER BY sku").all(),entities:()=>db.prepare("SELECT * FROM entities ORDER BY id").all(),
    revenueSchedules:()=>db.prepare(`SELECT rs.*,po.description,c.contract_number,cu.name customer_name FROM revenue_schedules rs JOIN performance_obligations po ON po.id=rs.obligation_id JOIN contracts c ON c.id=po.contract_id JOIN customers cu ON cu.id=c.customer_id ORDER BY rs.period,rs.id`).all(),
    commissions:()=>db.prepare(`SELECT c.*,cu.name customer_name,co.contract_number FROM commissions c JOIN contracts co ON co.id=c.contract_id JOIN customers cu ON cu.id=co.customer_id`).all(),softwareProjects:()=>db.prepare("SELECT * FROM software_projects ORDER BY id DESC").all()};
}

function generateRevenueSchedule(db, obligationId, amount, method, start, end) {
  if(["usage","milestone"].includes(method)) return;
  if(method==="point_in_time") return db.prepare("INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?)").run(obligationId,isoMonth(end),amount);
  distribute(amount,monthCount(start,end)).forEach((part,i)=>db.prepare("INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?)").run(obligationId,monthKey(asDate(addMonths(start,i))),part));
}
function distribute(total,count){const base=Math.floor(total/count),remainder=total-base*count;return Array.from({length:count},(_,i)=>base+(i<remainder?1:0));}
function spreadScheduleDelta(db,rows,delta){if(!delta)return;if(!rows.length)return;distribute(delta,rows.length).forEach((amount,i)=>db.prepare("UPDATE revenue_schedules SET amount_cents=amount_cents+? WHERE id=?").run(amount,rows[i].id));}
function createCommissionInternal(db,contractId,amount,start,months){const c=db.prepare("INSERT INTO commissions(contract_id,amount_cents,start_date,amortization_months) VALUES(?,?,?,?)").run(contractId,amount,start,months);distribute(amount,months).forEach((part,i)=>db.prepare("INSERT INTO commission_schedules(commission_id,period,amount_cents) VALUES(?,?,?)").run(Number(c.lastInsertRowid),isoMonth(addMonths(start,i)),part));}
function audit(db,type,id,action,actor,payload){db.prepare("INSERT INTO audit_log(entity_type,entity_id,action,actor,payload) VALUES(?,?,?,?,?)").run(type,id,action,actor,JSON.stringify(payload));}
function bad(message,statusCode=400){return Object.assign(new Error(message),{statusCode});}

export function seedSaas(db, saas, ledger) {
  if(db.prepare("SELECT COUNT(*) count FROM entities").get().count) return;
  db.prepare("INSERT INTO entities(name,currency) VALUES('Northstar Labs, Inc.','USD')").run();
  db.prepare("INSERT INTO entities(name,currency,parent_id) VALUES('Northstar Labs Europe Ltd.','EUR',1)").run();
  for(const row of [["2026-06-30","EUR",1.17],["2026-07-31","EUR",1.16],["2026-08-22","EUR",1.18]]) db.prepare("INSERT INTO fx_rates(rate_date,currency,usd_rate) VALUES(?,?,?)").run(...row);
  const customers=[["Acme Robotics","enterprise","US"],["Helio Health","mid-market","US"],["Kite Systems","startup","EU"],["Vertex AI","enterprise","US"]];
  for(const c of customers) db.prepare("INSERT INTO customers(name,segment,region) VALUES(?,?,?)").run(...c);
  const products=[["PLATFORM","AI Platform","subscription",12000000,1,"4000"],["USAGE","Inference usage","usage",6000000,1,"4000"],["ONBOARD","Implementation","services",2000000,0,"4100"]];
  for(const p of products) db.prepare("INSERT INTO products(sku,name,category,ssp_cents,recurring,revenue_account_code) VALUES(?,?,?,?,?,?)").run(...p);
  const ids=Object.fromEntries(db.prepare("SELECT sku,id FROM products").all().map(x=>[x.sku,x.id]));
  const cids=Object.fromEntries(db.prepare("SELECT name,id FROM customers").all().map(x=>[x.name,x.id]));
  saas.createContract({customer_id:cids["Acme Robotics"],entity_id:1,contract_number:"ACME-2026-001",signed_date:"2026-05-20",start_date:"2026-06-01",end_date:"2027-05-31",currency:"USD",transaction_price_cents:15000000,variable_consideration_cents:1000000,constraint_percent:50,billing_model:"hybrid",commission_cents:1200000,commission_months:12,obligations:[
    {product_id:ids.PLATFORM,description:"Annual AI platform access",ssp_cents:12000000,recognition_method:"straight_line"},
    {product_id:ids.ONBOARD,description:"Implementation and onboarding",ssp_cents:2000000,recognition_method:"point_in_time",end_date:"2026-06-30"},
    {product_id:ids.USAGE,description:"Committed inference usage",ssp_cents:6000000,recognition_method:"usage",total_units:1000000}
  ]});
  saas.createContract({customer_id:cids["Helio Health"],entity_id:1,contract_number:"HELIO-2026-014",signed_date:"2026-07-10",start_date:"2026-08-01",end_date:"2027-07-31",currency:"USD",transaction_price_cents:7200000,billing_model:"subscription",commission_cents:500000,obligations:[{product_id:ids.PLATFORM,description:"Platform subscription",ssp_cents:7200000,recognition_method:"straight_line"}]});
  saas.createInvoice({contract_id:1,invoice_number:"INV-1001",invoice_date:"2026-06-01",due_date:"2026-07-01",amount_cents:15500000});
  saas.createInvoice({contract_id:2,invoice_number:"INV-1014",invoice_date:"2026-08-01",due_date:"2026-08-31",amount_cents:7200000});
  saas.recordUsage({obligation_id:3,event_date:"2026-08-15",units:80000,amount_cents:620000,external_id:"usage-acme-aug"});
  const snapshots=[[1,"2026-06",1000000],[2,"2026-06",400000],[3,"2026-06",250000],[1,"2026-08",1250000],[2,"2026-08",600000],[4,"2026-08",300000]];
  for(const s of snapshots) db.prepare("INSERT INTO subscription_snapshots(customer_id,period,mrr_cents) VALUES(?,?,?)").run(...s);
  db.prepare("INSERT INTO operating_metrics(period,sales_marketing_cents,cloud_cogs_cents,new_customers,capitalized_software_cents) VALUES('2026-06',1200000,1100000,2,0),('2026-07',1500000,1600000,1,2400000),('2026-08',1700000,1900000,1,0)").run();
  saas.addSoftwareProject({name:"Multi-tenant orchestration engine",model:"internal_use",stage:"application_development",cost_cents:2400000,placed_in_service:"2026-08-01",useful_life_months:36});
  saas.addSoftwareProject({name:"Discovery prototype",model:"internal_use",stage:"preliminary",cost_cents:350000});
  const a=Object.fromEntries(db.prepare("SELECT code,id FROM accounts").all().map(x=>[x.code,x.id]));
  for(const entry of [
    {date:"2026-08-15",memo:"EU customer receivable",source:"eu_billing",entity_id:2,currency:"EUR",exchange_rate:1.18,lines:[{account_id:a["1100"],debit_cents:1000000,credit_cents:0},{account_id:a["4000"],debit_cents:0,credit_cents:1000000}]},
    {date:"2026-08-18",memo:"Intercompany funding sent",source:"intercompany",entity_id:1,lines:[{account_id:a["1300"],debit_cents:500000,credit_cents:0},{account_id:a["1000"],debit_cents:0,credit_cents:500000}]},
    {date:"2026-08-18",memo:"Intercompany funding received",source:"intercompany",entity_id:2,currency:"EUR",exchange_rate:1.18,lines:[{account_id:a["1000"],debit_cents:423729,credit_cents:0},{account_id:a["2300"],debit_cents:0,credit_cents:423729}]}
  ]){const d=ledger.createDraft(entry,"system.seed");ledger.postJournal(d.id,"system.seed");}
}
