import { currentActor } from "./request-context.js";

const isoMonth = (date) => String(date).slice(0, 7);
const asDate = (value) => new Date(`${value}T00:00:00Z`);
const monthKey = (date) => date.toISOString().slice(0, 7);
const addMonths = (value, count) => {
  const d = asDate(value);
  d.setUTCMonth(d.getUTCMonth() + count);
  return d.toISOString().slice(0, 10);
};
const monthCount = (start, end) =>
  Math.max(
    1,
    (asDate(end).getUTCFullYear() - asDate(start).getUTCFullYear()) * 12 +
      asDate(end).getUTCMonth() -
      asDate(start).getUTCMonth() +
      1,
  );
const moneyRatio = (amount, weight, total) => (total ? Math.round((amount * weight) / total) : 0);
const addDays = (value, count) => {
  const d = asDate(value);
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (earlier, later) => Math.floor((asDate(later) - asDate(earlier)) / 86_400_000);

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
    CREATE TABLE IF NOT EXISTS customer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL REFERENCES customers(id),entity_id INTEGER NOT NULL REFERENCES entities(id),payment_number TEXT NOT NULL UNIQUE,
      payment_date TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),method TEXT NOT NULL DEFAULT 'ach',reference TEXT,status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','void')),
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),void_journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS payment_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,payment_id INTEGER NOT NULL REFERENCES customer_payments(id),invoice_id INTEGER NOT NULL REFERENCES invoices(id),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
      applied_date TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'applied' CHECK(status IN ('applied','reversed')),journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),reversed_at TEXT);
    CREATE TABLE IF NOT EXISTS credit_memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_id INTEGER NOT NULL REFERENCES invoices(id),credit_number TEXT NOT NULL UNIQUE,credit_date TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
      reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'posted' CHECK(status IN ('posted','void')),journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS ar_write_offs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_id INTEGER NOT NULL REFERENCES invoices(id),write_off_date TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'posted' CHECK(status IN ('posted','void')),journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS customer_refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,payment_id INTEGER NOT NULL REFERENCES customer_payments(id),invoice_id INTEGER REFERENCES invoices(id),refund_number TEXT NOT NULL UNIQUE,refund_date TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK(amount_cents>0),reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'posted' CHECK(status IN ('posted','void')),journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS invoice_disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_id INTEGER NOT NULL REFERENCES invoices(id),opened_date TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','withdrawn')),resolution TEXT,resolved_date TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS collection_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL REFERENCES customers(id),invoice_id INTEGER REFERENCES invoices(id),activity_date TEXT NOT NULL,
      activity_type TEXT NOT NULL CHECK(activity_type IN ('email','call','promise_to_pay','dunning','note')),notes TEXT NOT NULL,next_action_date TEXT,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','completed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
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
    CREATE INDEX IF NOT EXISTS idx_invoice_due ON invoices(due_date,status);
    CREATE INDEX IF NOT EXISTS idx_application_invoice ON payment_applications(invoice_id,status);
    CREATE INDEX IF NOT EXISTS idx_collection_next_action ON collection_activities(next_action_date,status);
  `);
  ensureColumn(db, "journal_entries", "entity_id", "INTEGER");
  ensureColumn(db, "journal_entries", "currency", "TEXT NOT NULL DEFAULT 'USD'");
  ensureColumn(db, "journal_entries", "exchange_rate", "REAL NOT NULL DEFAULT 1");
  ensureColumn(db, "invoices", "subtotal_cents", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "invoices", "tax_cents", "INTEGER NOT NULL DEFAULT 0");
  db.exec("UPDATE invoices SET subtotal_cents=amount_cents WHERE subtotal_cents=0 AND tax_cents=0");
}

function ensureColumn(db, table, column, definition) {
  if (
    !db
      .prepare(`PRAGMA table_info(${table})`)
      .all()
      .some((row) => row.name === column)
  )
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function createSaasRepository(db, ledger) {
  function atomic(work) {
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      if (ownsTransaction) db.exec("COMMIT");
      return result;
    } catch (error) {
      if (ownsTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }
  const accountId = (code) => {
    const row = db.prepare("SELECT id FROM accounts WHERE code=?").get(code);
    if (!row) throw new Error(`Missing account ${code}`);
    return row.id;
  };

  function listContracts() {
    return db
      .prepare(
        `SELECT c.*,cu.name customer_name,e.name entity_name,
      COALESCE(SUM(po.allocated_price_cents),0) allocated_cents,
      COALESCE((SELECT SUM(rs.amount_cents) FROM revenue_schedules rs JOIN performance_obligations p2 ON p2.id=rs.obligation_id WHERE p2.contract_id=c.id AND rs.status='recognized'),0) recognized_cents,
      COALESCE((SELECT SUM(i.amount_cents) FROM invoices i WHERE i.contract_id=c.id),0) billed_cents
      FROM contracts c JOIN customers cu ON cu.id=c.customer_id JOIN entities e ON e.id=c.entity_id LEFT JOIN performance_obligations po ON po.contract_id=c.id GROUP BY c.id ORDER BY c.signed_date DESC`,
      )
      .all();
  }

  function getContract(id) {
    const contract = db
      .prepare(
        `SELECT c.*,cu.name customer_name,e.name entity_name FROM contracts c JOIN customers cu ON cu.id=c.customer_id JOIN entities e ON e.id=c.entity_id WHERE c.id=?`,
      )
      .get(id);
    if (!contract) return null;
    return {
      ...contract,
      obligations: db
        .prepare(
          `SELECT po.*,p.sku,p.name product_name FROM performance_obligations po LEFT JOIN products p ON p.id=po.product_id WHERE po.contract_id=? ORDER BY po.id`,
        )
        .all(id),
      invoices: db
        .prepare("SELECT * FROM invoices WHERE contract_id=? ORDER BY invoice_date")
        .all(id),
      modifications: db
        .prepare("SELECT * FROM contract_modifications WHERE contract_id=? ORDER BY effective_date")
        .all(id),
    };
  }

  function createContract(input) {
    const required = [
      "customer_id",
      "entity_id",
      "contract_number",
      "signed_date",
      "start_date",
      "end_date",
      "transaction_price_cents",
      "obligations",
    ];
    for (const key of required) if (input[key] == null) throw bad(`Contract requires ${key}`);
    if (!input.obligations.length) throw bad("At least one performance obligation is required");
    const constrainedVariable = Math.round(
      (Number(input.variable_consideration_cents || 0) * Number(input.constraint_percent ?? 100)) /
        100,
    );
    const allocatable = Number(input.transaction_price_cents) + constrainedVariable;
    const totalSsp = input.obligations.reduce((s, o) => s + Number(o.ssp_cents), 0);
    if (allocatable <= 0 || totalSsp <= 0)
      throw bad("Transaction price and total SSP must be positive");
    let contractId;
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = db
        .prepare(
          `INSERT INTO contracts(customer_id,entity_id,contract_number,signed_date,start_date,end_date,currency,transaction_price_cents,variable_consideration_cents,constraint_percent,billing_model,renewal_of)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          input.customer_id,
          input.entity_id,
          input.contract_number,
          input.signed_date,
          input.start_date,
          input.end_date,
          input.currency || "USD",
          input.transaction_price_cents,
          input.variable_consideration_cents || 0,
          input.constraint_percent ?? 100,
          input.billing_model || "subscription",
          input.renewal_of || null,
        );
      contractId = Number(result.lastInsertRowid);
      let allocated = 0;
      input.obligations.forEach((o, index) => {
        const amount =
          index === input.obligations.length - 1
            ? allocatable - allocated
            : moneyRatio(allocatable, o.ssp_cents, totalSsp);
        allocated += amount;
        const po = db
          .prepare(
            `INSERT INTO performance_obligations(contract_id,product_id,description,ssp_cents,allocated_price_cents,recognition_method,start_date,end_date,total_units)
          VALUES(?,?,?,?,?,?,?,?,?)`,
          )
          .run(
            contractId,
            o.product_id || null,
            o.description,
            o.ssp_cents,
            amount,
            o.recognition_method,
            o.start_date || input.start_date,
            o.end_date || input.end_date,
            o.total_units || 0,
          );
        generateRevenueSchedule(
          db,
          Number(po.lastInsertRowid),
          amount,
          o.recognition_method,
          o.start_date || input.start_date,
          o.end_date || input.end_date,
        );
      });
      if (input.commission_cents > 0)
        createCommissionInternal(
          db,
          contractId,
          input.commission_cents,
          input.start_date,
          input.commission_months || monthCount(input.start_date, input.end_date),
        );
      audit(db, "contract", contractId, "asc606_contract_created", currentActor(), {
        allocatable,
        totalSsp,
        obligations: input.obligations.length,
      });
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    if (input.commission_cents > 0) {
      const draft = ledger.createDraft(
        {
          date: input.signed_date,
          memo: `ASC 340-40 incremental commission — ${input.contract_number}`,
          source: "commission_subledger",
          entity_id: input.entity_id,
          currency: input.currency || "USD",
          lines: [
            { account_id: accountId("1210"), debit_cents: input.commission_cents, credit_cents: 0 },
            { account_id: accountId("2000"), debit_cents: 0, credit_cents: input.commission_cents },
          ],
        },
        currentActor(),
      );
      ledger.postJournal(draft.id, currentActor());
    }
    return getContract(contractId);
  }

  function createInvoice(input) {
    const contract = getContract(input.contract_id);
    if (!contract) throw bad("Contract not found", 404);
    requireAmount(input.amount_cents, "Invoice subtotal");
    const taxCents = Number(input.tax_cents || 0);
    if (!Number.isInteger(taxCents) || taxCents < 0) throw bad("Invoice tax must be whole cents");
    const totalCents = input.amount_cents + taxCents;
    if (!input.invoice_number?.trim() || !input.invoice_date)
      throw bad("Invoice number and date are required");
    if (
      db.prepare("SELECT id FROM invoices WHERE invoice_number=?").get(input.invoice_number.trim())
    )
      throw bad("Invoice number already exists", 409);
    const draft = ledger.createDraft(
      {
        date: input.invoice_date,
        memo: `Invoice ${input.invoice_number} — ${contract.customer_name}`,
        source: "billing",
        entity_id: contract.entity_id,
        currency: contract.currency,
        lines: [
          { account_id: accountId("1100"), debit_cents: totalCents, credit_cents: 0 },
          { account_id: accountId("2100"), debit_cents: 0, credit_cents: input.amount_cents },
          ...(taxCents
            ? [{ account_id: accountId("2180"), debit_cents: 0, credit_cents: taxCents }]
            : []),
        ],
      },
      currentActor(),
    );
    const posted = ledger.postJournal(draft.id, currentActor());
    const result = db
      .prepare(
        "INSERT INTO invoices(contract_id,invoice_number,invoice_date,due_date,amount_cents,subtotal_cents,tax_cents,journal_entry_id) VALUES(?,?,?,?,?,?,?,?)",
      )
      .run(
        input.contract_id,
        input.invoice_number.trim(),
        input.invoice_date,
        input.due_date || addDays(input.invoice_date, 30),
        totalCents,
        input.amount_cents,
        taxCents,
        posted.id,
      );
    audit(db, "invoice", Number(result.lastInsertRowid), "invoice_posted", currentActor(), {
      journal_entry_id: posted.id,
    });
    return invoiceRecord(Number(result.lastInsertRowid), input.invoice_date);
  }

  const invoiceBaseSql = `SELECT i.*,c.customer_id,c.contract_number,c.entity_id,c.currency,cu.name customer_name,
    COALESCE((SELECT SUM(pa.amount_cents) FROM payment_applications pa WHERE pa.invoice_id=i.id AND pa.status='applied' AND pa.applied_date<=?),0) applied_cents,
    COALESCE((SELECT SUM(cm.amount_cents) FROM credit_memos cm WHERE cm.invoice_id=i.id AND cm.status='posted' AND cm.credit_date<=?),0) credit_cents,
    COALESCE((SELECT SUM(wo.amount_cents) FROM ar_write_offs wo WHERE wo.invoice_id=i.id AND wo.status='posted' AND wo.write_off_date<=?),0) write_off_cents,
    COALESCE((SELECT SUM(r.amount_cents) FROM customer_refunds r WHERE r.invoice_id=i.id AND r.status='posted' AND r.refund_date<=?),0) refund_cents,
    COALESCE((SELECT SUM(d.amount_cents) FROM invoice_disputes d WHERE d.invoice_id=i.id AND d.status='open' AND d.opened_date<=?),0) disputed_cents
    FROM invoices i JOIN contracts c ON c.id=i.contract_id JOIN customers cu ON cu.id=c.customer_id`;

  function decorateInvoice(row, asOf) {
    if (!row) return null;
    const balance = Math.max(
      0,
      row.amount_cents -
        row.applied_cents -
        row.credit_cents -
        row.write_off_cents +
        row.refund_cents,
    );
    const daysPastDue = row.due_date ? Math.max(0, daysBetween(row.due_date, asOf)) : 0;
    let status = row.status;
    if (status !== "void")
      status =
        row.disputed_cents > 0
          ? "disputed"
          : balance === 0
            ? "paid"
            : row.applied_cents + row.credit_cents + row.write_off_cents > 0
              ? "partially_paid"
              : daysPastDue > 0
                ? "overdue"
                : "open";
    return { ...row, balance_cents: balance, days_past_due: daysPastDue, status };
  }
  function invoiceRecord(id, asOf = new Date().toISOString().slice(0, 10)) {
    return decorateInvoice(
      db
        .prepare(`${invoiceBaseSql} WHERE i.id=? AND i.invoice_date<=?`)
        .get(asOf, asOf, asOf, asOf, asOf, id, asOf),
      asOf,
    );
  }
  function listInvoices(asOf = new Date().toISOString().slice(0, 10)) {
    return db
      .prepare(`${invoiceBaseSql} WHERE i.invoice_date<=? ORDER BY i.due_date,i.id`)
      .all(asOf, asOf, asOf, asOf, asOf, asOf)
      .map((row) => decorateInvoice(row, asOf));
  }
  function paymentRecord(id) {
    return db
      .prepare(
        `SELECT p.*,cu.name customer_name,
    COALESCE((SELECT SUM(a.amount_cents) FROM payment_applications a WHERE a.payment_id=p.id AND a.status='applied'),0) applied_cents,
    COALESCE((SELECT SUM(r.amount_cents) FROM customer_refunds r WHERE r.payment_id=p.id AND r.status='posted'),0) refunded_cents
    FROM customer_payments p JOIN customers cu ON cu.id=p.customer_id WHERE p.id=?`,
      )
      .get(id);
  }
  function listPayments(asOf = new Date().toISOString().slice(0, 10)) {
    return db
      .prepare(
        `SELECT p.*,cu.name customer_name,
    COALESCE((SELECT SUM(a.amount_cents) FROM payment_applications a WHERE a.payment_id=p.id AND a.status='applied' AND a.applied_date<=?),0) applied_cents,
    COALESCE((SELECT SUM(r.amount_cents) FROM customer_refunds r WHERE r.payment_id=p.id AND r.status='posted' AND r.refund_date<=?),0) refunded_cents
    FROM customer_payments p JOIN customers cu ON cu.id=p.customer_id WHERE p.payment_date<=? ORDER BY p.payment_date DESC,p.id DESC`,
      )
      .all(asOf, asOf, asOf)
      .map((p) => ({
        ...p,
        unapplied_cents: Math.max(0, p.amount_cents - p.applied_cents - p.refunded_cents),
      }));
  }

  function recordPayment(input) {
    const customer = db.prepare("SELECT * FROM customers WHERE id=?").get(input.customer_id);
    if (!customer) throw bad("Customer not found", 404);
    requireAmount(input.amount_cents, "Payment amount");
    if (!input.payment_date) throw bad("Payment date is required");
    const number = input.payment_number?.trim() || `PAY-${Date.now()}`;
    if (db.prepare("SELECT id FROM customer_payments WHERE payment_number=?").get(number))
      throw bad("Payment number already exists", 409);
    let applicationTotal = 0;
    for (const application of input.applications || []) {
      requireAmount(application.amount_cents, "Application amount");
      const invoice = invoiceRecord(application.invoice_id, input.payment_date);
      if (!invoice || invoice.status === "void") throw bad("Open invoice not found", 404);
      if (invoice.customer_id !== input.customer_id)
        throw bad("Payment and invoice must belong to the same customer");
      if (application.amount_cents > invoice.balance_cents)
        throw bad("Application exceeds invoice balance");
      applicationTotal += application.amount_cents;
    }
    if (applicationTotal > input.amount_cents) throw bad("Applications exceed payment amount");
    const entityId = input.entity_id || 1;
    const draft = ledger.createDraft(
      {
        date: input.payment_date,
        memo: `Customer payment ${number} — ${customer.name}`,
        source: "cash_receipts",
        entity_id: entityId,
        lines: [
          { account_id: accountId("1000"), debit_cents: input.amount_cents, credit_cents: 0 },
          { account_id: accountId("2150"), debit_cents: 0, credit_cents: input.amount_cents },
        ],
      },
      currentActor(),
    );
    const journal = ledger.postJournal(draft.id, currentActor());
    const result = db
      .prepare(
        "INSERT INTO customer_payments(customer_id,entity_id,payment_number,payment_date,amount_cents,method,reference,journal_entry_id) VALUES(?,?,?,?,?,?,?,?)",
      )
      .run(
        input.customer_id,
        entityId,
        number,
        input.payment_date,
        input.amount_cents,
        input.method || "ach",
        input.reference || null,
        journal.id,
      );
    const paymentId = Number(result.lastInsertRowid);
    audit(db, "payment", paymentId, "payment_received", currentActor(), {
      amount_cents: input.amount_cents,
      journal_entry_id: journal.id,
    });
    for (const application of input.applications || [])
      applyPayment({
        payment_id: paymentId,
        invoice_id: application.invoice_id,
        amount_cents: application.amount_cents,
        applied_date: input.payment_date,
      });
    return paymentRecord(paymentId);
  }

  function applyPayment(input) {
    const payment = paymentRecord(input.payment_id);
    if (!payment || payment.status !== "received") throw bad("Active payment not found", 404);
    const invoice = invoiceRecord(input.invoice_id, input.applied_date);
    if (!invoice || invoice.status === "void") throw bad("Open invoice not found", 404);
    if (invoice.customer_id !== payment.customer_id)
      throw bad("Payment and invoice must belong to the same customer");
    requireAmount(input.amount_cents, "Application amount");
    const available = payment.amount_cents - payment.applied_cents - payment.refunded_cents;
    if (input.amount_cents > available) throw bad("Application exceeds unapplied payment balance");
    if (input.amount_cents > invoice.balance_cents)
      throw bad("Application exceeds invoice balance");
    const date = input.applied_date || payment.payment_date;
    const draft = ledger.createDraft(
      {
        date,
        memo: `Apply ${payment.payment_number} to ${invoice.invoice_number}`,
        source: "cash_application",
        entity_id: payment.entity_id,
        lines: [
          { account_id: accountId("2150"), debit_cents: input.amount_cents, credit_cents: 0 },
          { account_id: accountId("1100"), debit_cents: 0, credit_cents: input.amount_cents },
        ],
      },
      currentActor(),
    );
    const journal = ledger.postJournal(draft.id, currentActor());
    const result = db
      .prepare(
        "INSERT INTO payment_applications(payment_id,invoice_id,amount_cents,applied_date,journal_entry_id) VALUES(?,?,?,?,?)",
      )
      .run(payment.id, invoice.id, input.amount_cents, date, journal.id);
    audit(
      db,
      "payment_application",
      Number(result.lastInsertRowid),
      "payment_applied",
      currentActor(),
      {
        payment_id: payment.id,
        invoice_id: invoice.id,
        amount_cents: input.amount_cents,
        journal_entry_id: journal.id,
      },
    );
    return invoiceRecord(invoice.id, date);
  }

  function createCreditMemo(input) {
    const invoice = invoiceRecord(input.invoice_id, input.credit_date);
    if (!invoice || invoice.status === "void") throw bad("Open invoice not found", 404);
    requireAmount(input.amount_cents, "Credit amount");
    if (input.amount_cents > invoice.balance_cents) throw bad("Credit exceeds invoice balance");
    if (!input.credit_date || !input.reason?.trim())
      throw bad("Credit date and reason are required");
    const contract = getContract(invoice.contract_id);
    const recognized = db
      .prepare(
        `SELECT COALESCE(SUM(rs.amount_cents),0) value FROM revenue_schedules rs JOIN performance_obligations po ON po.id=rs.obligation_id WHERE po.contract_id=? AND rs.status='recognized'`,
      )
      .get(invoice.contract_id).value;
    const netBilled = db
      .prepare(
        `SELECT COALESCE(SUM(i.amount_cents),0)-COALESCE((SELECT SUM(cm.amount_cents) FROM credit_memos cm JOIN invoices i2 ON i2.id=cm.invoice_id WHERE i2.contract_id=? AND cm.status='posted'),0) value FROM invoices i WHERE i.contract_id=? AND i.status<>'void'`,
      )
      .get(invoice.contract_id, invoice.contract_id).value;
    const deferredPart = Math.min(input.amount_cents, Math.max(0, netBilled - recognized)),
      revenuePart = input.amount_cents - deferredPart;
    const lines = [];
    if (deferredPart)
      lines.push({ account_id: accountId("2100"), debit_cents: deferredPart, credit_cents: 0 });
    if (revenuePart)
      lines.push({ account_id: accountId("4050"), debit_cents: revenuePart, credit_cents: 0 });
    lines.push({ account_id: accountId("1100"), debit_cents: 0, credit_cents: input.amount_cents });
    const number = input.credit_number?.trim() || `CM-${Date.now()}`;
    if (db.prepare("SELECT id FROM credit_memos WHERE credit_number=?").get(number))
      throw bad("Credit memo number already exists", 409);
    const draft = ledger.createDraft(
      {
        date: input.credit_date,
        memo: `Credit ${number} — ${invoice.invoice_number}`,
        source: "credit_memo",
        entity_id: contract.entity_id,
        currency: contract.currency,
        lines,
      },
      currentActor(),
    );
    const journal = ledger.postJournal(draft.id, currentActor());
    const result = db
      .prepare(
        "INSERT INTO credit_memos(invoice_id,credit_number,credit_date,amount_cents,reason,journal_entry_id) VALUES(?,?,?,?,?,?)",
      )
      .run(
        invoice.id,
        number,
        input.credit_date,
        input.amount_cents,
        input.reason.trim(),
        journal.id,
      );
    audit(db, "credit_memo", Number(result.lastInsertRowid), "credit_memo_posted", currentActor(), {
      invoice_id: invoice.id,
      amount_cents: input.amount_cents,
      journal_entry_id: journal.id,
    });
    return invoiceRecord(invoice.id, input.credit_date);
  }

  function voidInvoice(input) {
    const invoice = invoiceRecord(input.invoice_id, input.void_date);
    if (!invoice || invoice.status === "void") throw bad("Open invoice not found", 404);
    if (invoice.applied_cents || invoice.refund_cents || invoice.write_off_cents)
      throw bad(
        "Invoices with payments, refunds, or write-offs cannot be voided; issue a credit memo instead",
      );
    if (invoice.balance_cents)
      createCreditMemo({
        invoice_id: invoice.id,
        credit_number: input.credit_number || `VOID-${invoice.invoice_number}`,
        credit_date: input.void_date,
        amount_cents: invoice.balance_cents,
        reason: input.reason || "Invoice voided",
      });
    db.prepare("UPDATE invoices SET status='void' WHERE id=?").run(invoice.id);
    audit(db, "invoice", invoice.id, "invoice_voided", currentActor(), {
      void_date: input.void_date,
      reason: input.reason || "Invoice voided",
    });
    return invoiceRecord(invoice.id, input.void_date);
  }

  function writeOffInvoice(input) {
    const invoice = invoiceRecord(input.invoice_id, input.write_off_date);
    if (!invoice || invoice.status === "void") throw bad("Open invoice not found", 404);
    requireAmount(input.amount_cents, "Write-off amount");
    if (input.amount_cents > invoice.balance_cents) throw bad("Write-off exceeds invoice balance");
    if (!input.write_off_date || !input.reason?.trim())
      throw bad("Write-off date and reason are required");
    const draft = ledger.createDraft(
      {
        date: input.write_off_date,
        memo: `AR write-off — ${invoice.invoice_number}`,
        source: "ar_write_off",
        entity_id: invoice.entity_id,
        lines: [
          { account_id: accountId("5350"), debit_cents: input.amount_cents, credit_cents: 0 },
          { account_id: accountId("1100"), debit_cents: 0, credit_cents: input.amount_cents },
        ],
      },
      currentActor(),
    );
    const journal = ledger.postJournal(draft.id, currentActor());
    const result = db
      .prepare(
        "INSERT INTO ar_write_offs(invoice_id,write_off_date,amount_cents,reason,journal_entry_id) VALUES(?,?,?,?,?)",
      )
      .run(invoice.id, input.write_off_date, input.amount_cents, input.reason.trim(), journal.id);
    audit(
      db,
      "write_off",
      Number(result.lastInsertRowid),
      "receivable_written_off",
      currentActor(),
      { invoice_id: invoice.id, amount_cents: input.amount_cents, journal_entry_id: journal.id },
    );
    return invoiceRecord(invoice.id, input.write_off_date);
  }

  function refundPayment(input) {
    const payment = paymentRecord(input.payment_id);
    if (!payment || payment.status !== "received") throw bad("Active payment not found", 404);
    requireAmount(input.amount_cents, "Refund amount");
    if (!input.refund_date || !input.reason?.trim())
      throw bad("Refund date and reason are required");
    const refundable = payment.amount_cents - payment.refunded_cents;
    if (input.amount_cents > refundable) throw bad("Refund exceeds payment amount");
    let invoice = null;
    if (input.invoice_id) {
      invoice = invoiceRecord(input.invoice_id, input.refund_date);
      if (!invoice || invoice.customer_id !== payment.customer_id)
        throw bad("Refund invoice must belong to the payment customer");
      const paidOnInvoice = db
        .prepare(
          "SELECT COALESCE(SUM(amount_cents),0) value FROM payment_applications WHERE payment_id=? AND invoice_id=? AND status='applied'",
        )
        .get(payment.id, invoice.id).value;
      const alreadyRefunded = db
        .prepare(
          "SELECT COALESCE(SUM(amount_cents),0) value FROM customer_refunds WHERE payment_id=? AND invoice_id=? AND status='posted'",
        )
        .get(payment.id, invoice.id).value;
      if (input.amount_cents > paidOnInvoice - alreadyRefunded)
        throw bad("Refund exceeds the amount this payment applied to the invoice");
    } else {
      const unapplied = payment.amount_cents - payment.applied_cents - payment.refunded_cents;
      if (input.amount_cents > unapplied)
        throw bad("Select an invoice for a refund of applied cash");
    }
    const number = input.refund_number?.trim() || `RF-${Date.now()}`;
    if (db.prepare("SELECT id FROM customer_refunds WHERE refund_number=?").get(number))
      throw bad("Refund number already exists", 409);
    const debitCode = invoice ? "1100" : "2150";
    const draft = ledger.createDraft(
      {
        date: input.refund_date,
        memo: `Customer refund ${number}`,
        source: "customer_refund",
        entity_id: payment.entity_id,
        lines: [
          { account_id: accountId(debitCode), debit_cents: input.amount_cents, credit_cents: 0 },
          { account_id: accountId("1000"), debit_cents: 0, credit_cents: input.amount_cents },
        ],
      },
      currentActor(),
    );
    const journal = ledger.postJournal(draft.id, currentActor());
    const result = db
      .prepare(
        "INSERT INTO customer_refunds(payment_id,invoice_id,refund_number,refund_date,amount_cents,reason,journal_entry_id) VALUES(?,?,?,?,?,?,?)",
      )
      .run(
        payment.id,
        invoice?.id || null,
        number,
        input.refund_date,
        input.amount_cents,
        input.reason.trim(),
        journal.id,
      );
    audit(db, "refund", Number(result.lastInsertRowid), "customer_refunded", currentActor(), {
      payment_id: payment.id,
      invoice_id: invoice?.id || null,
      amount_cents: input.amount_cents,
      journal_entry_id: journal.id,
    });
    return {
      refund_id: Number(result.lastInsertRowid),
      payment: paymentRecord(payment.id),
      invoice: invoice ? invoiceRecord(invoice.id, input.refund_date) : null,
    };
  }

  function voidPayment(input) {
    const payment = paymentRecord(input.payment_id);
    if (!payment || payment.status !== "received") throw bad("Active payment not found", 404);
    if (payment.refunded_cents) throw bad("A refunded payment cannot be voided");
    const date = input.void_date || new Date().toISOString().slice(0, 10),
      unapplied = payment.amount_cents - payment.applied_cents;
    const lines = [];
    if (payment.applied_cents)
      lines.push({
        account_id: accountId("1100"),
        debit_cents: payment.applied_cents,
        credit_cents: 0,
      });
    if (unapplied)
      lines.push({ account_id: accountId("2150"), debit_cents: unapplied, credit_cents: 0 });
    lines.push({
      account_id: accountId("1000"),
      debit_cents: 0,
      credit_cents: payment.amount_cents,
    });
    const draft = ledger.createDraft(
      {
        date,
        memo: `Void customer payment ${payment.payment_number}`,
        source: "payment_void",
        entity_id: payment.entity_id,
        lines,
      },
      currentActor(),
    );
    const journal = ledger.postJournal(draft.id, currentActor());
    db.prepare("UPDATE customer_payments SET status='void',void_journal_entry_id=? WHERE id=?").run(
      journal.id,
      payment.id,
    );
    db.prepare(
      "UPDATE payment_applications SET status='reversed',reversed_at=? WHERE payment_id=? AND status='applied'",
    ).run(date, payment.id);
    audit(db, "payment", payment.id, "payment_voided", currentActor(), {
      journal_entry_id: journal.id,
    });
    return paymentRecord(payment.id);
  }

  function openDispute(input) {
    const invoice = invoiceRecord(input.invoice_id, input.opened_date);
    if (!invoice || invoice.status === "void") throw bad("Open invoice not found", 404);
    requireAmount(input.amount_cents, "Dispute amount");
    if (input.amount_cents > invoice.balance_cents - invoice.disputed_cents)
      throw bad("Dispute exceeds undisputed invoice balance");
    if (!input.opened_date || !input.reason?.trim())
      throw bad("Dispute date and reason are required");
    const result = db
      .prepare(
        "INSERT INTO invoice_disputes(invoice_id,opened_date,amount_cents,reason) VALUES(?,?,?,?)",
      )
      .run(invoice.id, input.opened_date, input.amount_cents, input.reason.trim());
    audit(db, "dispute", Number(result.lastInsertRowid), "invoice_disputed", "collections.user", {
      invoice_id: invoice.id,
      amount_cents: input.amount_cents,
    });
    return invoiceRecord(invoice.id, input.opened_date);
  }
  function resolveDispute(input) {
    const dispute = db
      .prepare("SELECT * FROM invoice_disputes WHERE id=? AND status='open'")
      .get(input.dispute_id);
    if (!dispute) throw bad("Open dispute not found", 404);
    if (!input.resolved_date || !input.resolution?.trim())
      throw bad("Resolution date and notes are required");
    db.prepare("UPDATE invoice_disputes SET status=?,resolution=?,resolved_date=? WHERE id=?").run(
      input.status === "withdrawn" ? "withdrawn" : "resolved",
      input.resolution.trim(),
      input.resolved_date,
      dispute.id,
    );
    audit(db, "dispute", dispute.id, "dispute_resolved", "collections.user", {
      resolution: input.resolution,
    });
    return invoiceRecord(dispute.invoice_id, input.resolved_date);
  }
  function addCollectionActivity(input) {
    if (!db.prepare("SELECT id FROM customers WHERE id=?").get(input.customer_id))
      throw bad("Customer not found", 404);
    if (!input.activity_date || !input.notes?.trim())
      throw bad("Activity date and notes are required");
    if (input.invoice_id) {
      const invoice = invoiceRecord(input.invoice_id, input.activity_date);
      if (!invoice || invoice.customer_id !== input.customer_id)
        throw bad("Invoice does not belong to customer");
    }
    const type = ["email", "call", "promise_to_pay", "dunning", "note"].includes(
      input.activity_type,
    )
      ? input.activity_type
      : "note";
    const result = db
      .prepare(
        "INSERT INTO collection_activities(customer_id,invoice_id,activity_date,activity_type,notes,next_action_date,status) VALUES(?,?,?,?,?,?,?)",
      )
      .run(
        input.customer_id,
        input.invoice_id || null,
        input.activity_date,
        type,
        input.notes.trim(),
        input.next_action_date || null,
        input.status === "completed" ? "completed" : "open",
      );
    audit(
      db,
      "collection_activity",
      Number(result.lastInsertRowid),
      "collection_activity_logged",
      "collections.user",
      { customer_id: input.customer_id, invoice_id: input.invoice_id || null, type },
    );
    return db.prepare("SELECT * FROM collection_activities WHERE id=?").get(result.lastInsertRowid);
  }
  function completeCollectionActivity(input) {
    const activity = db
      .prepare("SELECT * FROM collection_activities WHERE id=?")
      .get(input.activity_id);
    if (!activity) throw bad("Collection activity not found", 404);
    db.prepare("UPDATE collection_activities SET status='completed' WHERE id=?").run(activity.id);
    audit(
      db,
      "collection_activity",
      activity.id,
      "collection_activity_completed",
      "collections.user",
      {},
    );
    return db.prepare("SELECT * FROM collection_activities WHERE id=?").get(activity.id);
  }

  function receivables(asOf = new Date().toISOString().slice(0, 10)) {
    const invoices = listInvoices(asOf),
      payments = listPayments(asOf);
    const aging = {
      current_cents: 0,
      days_1_30_cents: 0,
      days_31_60_cents: 0,
      days_61_90_cents: 0,
      days_90_plus_cents: 0,
      total_cents: 0,
      disputed_cents: 0,
    };
    for (const invoice of invoices.filter((i) => i.status !== "void" && i.balance_cents > 0)) {
      aging.total_cents += invoice.balance_cents;
      aging.disputed_cents += invoice.disputed_cents;
      if (!invoice.days_past_due) aging.current_cents += invoice.balance_cents;
      else if (invoice.days_past_due <= 30) aging.days_1_30_cents += invoice.balance_cents;
      else if (invoice.days_past_due <= 60) aging.days_31_60_cents += invoice.balance_cents;
      else if (invoice.days_past_due <= 90) aging.days_61_90_cents += invoice.balance_cents;
      else aging.days_90_plus_cents += invoice.balance_cents;
    }
    const customers = db
      .prepare("SELECT id,name FROM customers ORDER BY name")
      .all()
      .map((customer) => {
        const rows = invoices.filter((i) => i.customer_id === customer.id && i.status !== "void");
        return {
          ...customer,
          billed_cents: rows.reduce((s, i) => s + i.amount_cents, 0),
          outstanding_cents: rows.reduce((s, i) => s + i.balance_cents, 0),
          overdue_cents: rows
            .filter((i) => i.days_past_due > 0)
            .reduce((s, i) => s + i.balance_cents, 0),
        };
      });
    const contracts = listContracts().map((contract) => {
      const rows = invoices.filter((i) => i.contract_id === contract.id && i.status !== "void"),
        credits = rows.reduce((s, i) => s + i.credit_cents, 0),
        netBilled = rows.reduce((s, i) => s + i.amount_cents - i.credit_cents, 0);
      return {
        contract_id: contract.id,
        contract_number: contract.contract_number,
        customer_name: contract.customer_name,
        allocated_cents: contract.allocated_cents,
        recognized_cents: contract.recognized_cents,
        billed_cents: rows.reduce((s, i) => s + i.amount_cents, 0),
        credit_cents: credits,
        net_billed_cents: netBilled,
        unbilled_cents: Math.max(0, contract.recognized_cents - netBilled),
        deferred_cents: Math.max(0, netBilled - contract.recognized_cents),
        outstanding_cents: rows.reduce((s, i) => s + i.balance_cents, 0),
      };
    });
    const glAr = db
      .prepare(
        `SELECT COALESCE(SUM(l.debit_cents-l.credit_cents),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND a.code='1100' AND j.entry_date<=?`,
      )
      .get(asOf).value;
    const subledgerAr = invoices
      .filter((i) => i.invoice_date <= asOf && i.status !== "void")
      .reduce((s, i) => s + i.balance_cents, 0);
    const glUnapplied = db
      .prepare(
        `SELECT COALESCE(SUM(l.credit_cents-l.debit_cents),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND a.code='2150' AND j.entry_date<=?`,
      )
      .get(asOf).value;
    const unapplied = payments
      .filter((p) => p.status === "received")
      .reduce((s, p) => s + p.unapplied_cents, 0);
    const collections = db
      .prepare(
        `SELECT ca.*,cu.name customer_name,i.invoice_number FROM collection_activities ca JOIN customers cu ON cu.id=ca.customer_id LEFT JOIN invoices i ON i.id=ca.invoice_id ORDER BY COALESCE(ca.next_action_date,ca.activity_date),ca.id DESC`,
      )
      .all();
    const disputes = db
      .prepare(
        `SELECT d.*,i.invoice_number,cu.name customer_name FROM invoice_disputes d JOIN invoices i ON i.id=d.invoice_id JOIN contracts c ON c.id=i.contract_id JOIN customers cu ON cu.id=c.customer_id ORDER BY d.id DESC`,
      )
      .all();
    return {
      as_of: asOf,
      invoices,
      payments,
      aging,
      customers,
      contracts,
      collections,
      disputes,
      reconciliation: {
        gl_ar_cents: glAr,
        subledger_ar_cents: subledgerAr,
        ar_difference_cents: glAr - subledgerAr,
        gl_unapplied_cents: glUnapplied,
        subledger_unapplied_cents: unapplied,
        unapplied_difference_cents: glUnapplied - unapplied,
        balanced: glAr === subledgerAr && glUnapplied === unapplied,
      },
    };
  }

  function recordUsage(input) {
    const po = db
      .prepare("SELECT * FROM performance_obligations WHERE id=?")
      .get(input.obligation_id);
    if (!po || po.recognition_method !== "usage") throw bad("Usage obligation not found");
    const amount =
      input.amount_cents ??
      Math.round((po.allocated_price_cents * input.units) / Math.max(po.total_units, input.units));
    const result = db
      .prepare(
        "INSERT INTO usage_events(obligation_id,event_date,units,amount_cents,external_id) VALUES(?,?,?,?,?)",
      )
      .run(po.id, input.event_date, input.units, amount, input.external_id || null);
    db.prepare(
      "UPDATE performance_obligations SET units_delivered=units_delivered+? WHERE id=?",
    ).run(input.units, po.id);
    db.prepare(
      `INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?) ON CONFLICT(obligation_id,period) DO UPDATE SET amount_cents=amount_cents+excluded.amount_cents`,
    ).run(po.id, isoMonth(input.event_date), amount);
    return { id: Number(result.lastInsertRowid), amount_cents: amount };
  }

  function updateMilestone(input) {
    const po = db
      .prepare("SELECT * FROM performance_obligations WHERE id=?")
      .get(input.obligation_id);
    if (!po || po.recognition_method !== "milestone") throw bad("Milestone obligation not found");
    const previous = po.milestone_progress;
    const progress = Math.max(previous, Math.min(100, Number(input.progress)));
    const amount = Math.round((po.allocated_price_cents * (progress - previous)) / 100);
    db.prepare("UPDATE performance_obligations SET milestone_progress=? WHERE id=?").run(
      progress,
      po.id,
    );
    if (amount)
      db.prepare(
        `INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?) ON CONFLICT(obligation_id,period) DO UPDATE SET amount_cents=amount_cents+excluded.amount_cents`,
      ).run(po.id, isoMonth(input.event_date), amount);
    return { progress, amount_cents: amount };
  }

  function recognizeThrough(asOf) {
    const through = isoMonth(asOf);
    const schedules = db
      .prepare(
        `SELECT rs.*,po.contract_id,po.description,c.entity_id,c.currency,c.customer_id,
      COALESCE((SELECT SUM(i.amount_cents) FROM invoices i WHERE i.contract_id=c.id),0) billed_cents,
      COALESCE((SELECT SUM(rs2.amount_cents) FROM revenue_schedules rs2 JOIN performance_obligations po2 ON po2.id=rs2.obligation_id WHERE po2.contract_id=c.id AND rs2.status='recognized'),0) recognized_before
      FROM revenue_schedules rs JOIN performance_obligations po ON po.id=rs.obligation_id JOIN contracts c ON c.id=po.contract_id
      WHERE rs.status='pending' AND rs.period<=? AND (c.status='active' OR (c.status='cancelled' AND rs.period<substr(c.cancelled_at,1,7))) ORDER BY rs.period,rs.id`,
      )
      .all(through);
    const posted = [];
    for (const schedule of schedules) {
      const useDeferred = schedule.billed_cents > schedule.recognized_before;
      const debitCode = useDeferred ? "2100" : "1150";
      const draft = ledger.createDraft(
        {
          date: `${schedule.period}-28`,
          memo: `ASC 606 revenue — ${schedule.description}`,
          source: "revenue_subledger",
          entity_id: schedule.entity_id,
          currency: schedule.currency,
          lines: [
            {
              account_id: accountId(debitCode),
              debit_cents: schedule.amount_cents,
              credit_cents: 0,
            },
            { account_id: accountId("4000"), debit_cents: 0, credit_cents: schedule.amount_cents },
          ],
        },
        currentActor(),
      );
      const journal = ledger.postJournal(draft.id, currentActor());
      db.prepare(
        "UPDATE revenue_schedules SET status='recognized',journal_entry_id=?,recognized_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(journal.id, schedule.id);
      posted.push(journal.id);
    }
    recognizeCommissionThrough(through);
    recognizeSoftwareThrough(through);
    return { recognized_schedules: schedules.length, journal_entry_ids: posted };
  }

  function modifyContract(input) {
    const contract = getContract(input.contract_id);
    if (!contract) throw bad("Contract not found", 404);
    db.prepare(
      "INSERT INTO contract_modifications(contract_id,effective_date,kind,description,price_change_cents) VALUES(?,?,?,?,?)",
    ).run(
      input.contract_id,
      input.effective_date,
      input.kind,
      input.description,
      input.price_change_cents || 0,
    );
    if (input.kind === "cancellation") {
      db.prepare("UPDATE contracts SET status='cancelled',cancelled_at=? WHERE id=?").run(
        input.effective_date,
        input.contract_id,
      );
      db.prepare(
        `UPDATE revenue_schedules SET status='reversed' WHERE obligation_id IN (SELECT id FROM performance_obligations WHERE contract_id=?) AND status='pending' AND period>=?`,
      ).run(input.contract_id, isoMonth(input.effective_date));
    } else if (input.kind === "extension" && input.new_end_date) {
      db.prepare("UPDATE contracts SET end_date=? WHERE id=?").run(
        input.new_end_date,
        input.contract_id,
      );
      for (const po of contract.obligations.filter(
        (o) => o.recognition_method === "straight_line",
      )) {
        const recognized = db
          .prepare(
            "SELECT COALESCE(SUM(amount_cents),0) value FROM revenue_schedules WHERE obligation_id=? AND status='recognized'",
          )
          .get(po.id).value;
        const remaining = po.allocated_price_cents - recognized;
        db.prepare("DELETE FROM revenue_schedules WHERE obligation_id=? AND status='pending'").run(
          po.id,
        );
        db.prepare("UPDATE performance_obligations SET end_date=? WHERE id=?").run(
          input.new_end_date,
          po.id,
        );
        distribute(remaining, monthCount(input.effective_date, input.new_end_date)).forEach(
          (amount, i) =>
            db
              .prepare(
                "INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?)",
              )
              .run(po.id, isoMonth(addMonths(input.effective_date, i)), amount),
        );
      }
    } else if (input.price_change_cents) {
      db.prepare(
        "UPDATE contracts SET transaction_price_cents=transaction_price_cents+? WHERE id=?",
      ).run(input.price_change_cents, input.contract_id);
      const totalSsp = contract.obligations.reduce((s, o) => s + o.ssp_cents, 0);
      let allocated = 0;
      contract.obligations.forEach((po, index) => {
        const delta =
          index === contract.obligations.length - 1
            ? input.price_change_cents - allocated
            : moneyRatio(input.price_change_cents, po.ssp_cents, totalSsp);
        allocated += delta;
        db.prepare(
          "UPDATE performance_obligations SET allocated_price_cents=allocated_price_cents+? WHERE id=?",
        ).run(delta, po.id);
        const pending = db
          .prepare(
            "SELECT id FROM revenue_schedules WHERE obligation_id=? AND status='pending' ORDER BY period",
          )
          .all(po.id);
        if (input.treatment === "cumulative_catchup") {
          const recognized = db
            .prepare(
              "SELECT COALESCE(SUM(amount_cents),0) value FROM revenue_schedules WHERE obligation_id=? AND status='recognized'",
            )
            .get(po.id).value;
          const progress = po.allocated_price_cents ? recognized / po.allocated_price_cents : 0,
            catchup = Math.round(delta * progress);
          if (catchup)
            db.prepare(
              `INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?) ON CONFLICT(obligation_id,period) DO UPDATE SET amount_cents=amount_cents+excluded.amount_cents`,
            ).run(po.id, isoMonth(input.effective_date), catchup);
          spreadScheduleDelta(db, pending, delta - catchup);
        } else spreadScheduleDelta(db, pending, delta);
      });
    }
    audit(db, "contract", input.contract_id, "contract_modified", currentActor(), input);
    return getContract(input.contract_id);
  }

  function addSoftwareProject(input) {
    const internal = input.model === "internal_use";
    const capitalizable = internal
      ? input.stage === "application_development"
      : input.stage === "post_technological_feasibility";
    const capitalized = capitalizable ? input.cost_cents : 0,
      expensed = capitalizable ? 0 : input.cost_cents;
    const basis = capitalizable
      ? internal
        ? "ASC 350-40: application-development stage"
        : "ASC 985-20: after technological feasibility"
      : internal
        ? "ASC 350-40: preliminary/post-implementation stage expensed"
        : "ASC 985-20: before feasibility expensed";
    const result = db
      .prepare(
        `INSERT INTO software_projects(name,model,stage,cost_cents,capitalized_cents,expensed_cents,placed_in_service,useful_life_months,policy_basis) VALUES(?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        input.name,
        input.model,
        input.stage,
        input.cost_cents,
        capitalized,
        expensed,
        input.placed_in_service || null,
        input.useful_life_months || 36,
        basis,
      );
    const id = Number(result.lastInsertRowid);
    const draft = ledger.createDraft(
      {
        date: input.cost_date || input.placed_in_service || new Date().toISOString().slice(0, 10),
        memo: `Software development cost — ${input.name}`,
        source: "software_policy",
        lines: capitalizable
          ? [
              { account_id: accountId("1250"), debit_cents: input.cost_cents, credit_cents: 0 },
              { account_id: accountId("2000"), debit_cents: 0, credit_cents: input.cost_cents },
            ]
          : [
              { account_id: accountId("6100"), debit_cents: input.cost_cents, credit_cents: 0 },
              { account_id: accountId("2000"), debit_cents: 0, credit_cents: input.cost_cents },
            ],
      },
      currentActor(),
    );
    ledger.postJournal(draft.id, currentActor());
    if (capitalized && input.placed_in_service)
      distribute(input.cost_cents, input.useful_life_months || 36).forEach((amount, i) =>
        db
          .prepare(
            "INSERT INTO software_amortization(project_id,period,amount_cents) VALUES(?,?,?)",
          )
          .run(id, isoMonth(addMonths(input.placed_in_service, i)), amount),
      );
    return db.prepare("SELECT * FROM software_projects WHERE id=?").get(id);
  }

  function recognizeCommissionThrough(through) {
    const rows = db
      .prepare(
        "SELECT cs.*,c.contract_id FROM commission_schedules cs JOIN commissions c ON c.id=cs.commission_id WHERE cs.status='pending' AND cs.period<=?",
      )
      .all(through);
    for (const row of rows) {
      const draft = ledger.createDraft(
        {
          date: `${row.period}-28`,
          memo: "ASC 340-40 commission amortization",
          source: "commission_subledger",
          lines: [
            { account_id: accountId("5400"), debit_cents: row.amount_cents, credit_cents: 0 },
            { account_id: accountId("1210"), debit_cents: 0, credit_cents: row.amount_cents },
          ],
        },
        currentActor(),
      );
      const j = ledger.postJournal(draft.id, currentActor());
      db.prepare(
        "UPDATE commission_schedules SET status='recognized',journal_entry_id=? WHERE id=?",
      ).run(j.id, row.id);
    }
  }
  function recognizeSoftwareThrough(through) {
    const rows = db
      .prepare("SELECT * FROM software_amortization WHERE status='pending' AND period<=?")
      .all(through);
    for (const row of rows) {
      const draft = ledger.createDraft(
        {
          date: `${row.period}-28`,
          memo: "Capitalized software amortization",
          source: "software_subledger",
          lines: [
            { account_id: accountId("5500"), debit_cents: row.amount_cents, credit_cents: 0 },
            { account_id: accountId("1255"), debit_cents: 0, credit_cents: row.amount_cents },
          ],
        },
        currentActor(),
      );
      const j = ledger.postJournal(draft.id, currentActor());
      db.prepare(
        "UPDATE software_amortization SET status='recognized',journal_entry_id=? WHERE id=?",
      ).run(j.id, row.id);
    }
  }

  function revenueWaterfall() {
    return db
      .prepare(
        `SELECT rs.period,SUM(rs.amount_cents) scheduled_cents,SUM(CASE WHEN rs.status='recognized' THEN rs.amount_cents ELSE 0 END) recognized_cents,SUM(CASE WHEN rs.status='pending' THEN rs.amount_cents ELSE 0 END) remaining_cents FROM revenue_schedules rs GROUP BY rs.period ORDER BY rs.period`,
      )
      .all();
  }
  function deferredRollforward() {
    const billed =
      db
        .prepare("SELECT COALESCE(SUM(amount_cents),0) value FROM invoices WHERE status<>'void'")
        .get().value -
      db
        .prepare(
          "SELECT COALESCE(SUM(cm.amount_cents),0) value FROM credit_memos cm JOIN invoices i ON i.id=cm.invoice_id WHERE cm.status='posted' AND i.status<>'void'",
        )
        .get().value;
    const recognized = db
      .prepare(
        "SELECT COALESCE(SUM(amount_cents),0) value FROM revenue_schedules WHERE status='recognized'",
      )
      .get().value;
    return {
      opening_cents: 0,
      billings_cents: billed,
      revenue_cents: recognized,
      ending_cents: Math.max(0, billed - recognized),
      contract_asset_cents: Math.max(0, recognized - billed),
    };
  }
  function rpo() {
    return db
      .prepare(
        `SELECT COALESCE(SUM(rs.amount_cents),0) total_cents,COALESCE(SUM(CASE WHEN rs.period<=strftime('%Y-%m','now','+12 months') THEN rs.amount_cents ELSE 0 END),0) next_12_months_cents FROM revenue_schedules rs JOIN performance_obligations po ON po.id=rs.obligation_id JOIN contracts c ON c.id=po.contract_id WHERE rs.status='pending' AND c.status='active'`,
      )
      .get();
  }

  function metrics() {
    const periods = db
      .prepare("SELECT DISTINCT period FROM subscription_snapshots ORDER BY period DESC LIMIT 2")
      .all()
      .map((x) => x.period);
    const latest = periods[0],
      prior = periods[1] || latest;
    const current = new Map(
      db
        .prepare("SELECT customer_id,mrr_cents FROM subscription_snapshots WHERE period=?")
        .all(latest)
        .map((x) => [x.customer_id, x.mrr_cents]),
    );
    const previous = new Map(
      db
        .prepare("SELECT customer_id,mrr_cents FROM subscription_snapshots WHERE period=?")
        .all(prior)
        .map((x) => [x.customer_id, x.mrr_cents]),
    );
    let start = 0,
      end = 0,
      churn = 0,
      contraction = 0,
      expansion = 0,
      newMrr = 0;
    for (const [id, mrr] of previous) {
      start += mrr;
      const now = current.get(id) || 0;
      if (!now) churn += mrr;
      else if (now < mrr) contraction += mrr - now;
      else expansion += now - mrr;
    }
    for (const [id, mrr] of current) {
      end += mrr;
      if (!previous.has(id)) newMrr += mrr;
    }
    const revenue = ledger.dashboard().revenue_cents,
      expenses = ledger.dashboard().expense_cents;
    const cogs = db
      .prepare("SELECT COALESCE(SUM(cloud_cogs_cents),0) value FROM operating_metrics")
      .get().value;
    const sm = db
      .prepare("SELECT COALESCE(SUM(sales_marketing_cents),0) value FROM operating_metrics")
      .get().value;
    const newCustomers = db
      .prepare("SELECT COALESCE(SUM(new_customers),0) value FROM operating_metrics")
      .get().value;
    const contracts = db
      .prepare(
        "SELECT COALESCE(SUM(transaction_price_cents),0) bookings,COUNT(*) count FROM contracts",
      )
      .get();
    const billings =
      db
        .prepare("SELECT COALESCE(SUM(amount_cents),0) value FROM invoices WHERE status<>'void'")
        .get().value -
      db
        .prepare(
          "SELECT COALESCE(SUM(cm.amount_cents),0) value FROM credit_memos cm JOIN invoices i ON i.id=cm.invoice_id WHERE cm.status='posted' AND i.status<>'void'",
        )
        .get().value;
    const grossMargin = revenue ? Math.max(-5, (revenue - cogs) / revenue) : 0;
    const monthlyChurn = start ? churn / start : 0;
    const arpa = current.size ? end / current.size : 0;
    const growth = start ? (end - start) / start : 0;
    const operatingMargin = revenue ? (revenue - expenses) / revenue : 0;
    return {
      period: latest,
      mrr_cents: end,
      arr_cents: end * 12,
      nrr: start ? (start - churn - contraction + expansion) / start : 1,
      grr: start ? (start - churn - contraction) / start : 1,
      churn_cents: churn,
      contraction_cents: contraction,
      expansion_cents: expansion,
      new_mrr_cents: newMrr,
      bookings_cents: contracts.bookings,
      billings_cents: billings,
      acv_cents: contracts.count ? Math.round(contracts.bookings / contracts.count) : 0,
      gross_margin: grossMargin,
      cac_cents: newCustomers ? Math.round(sm / newCustomers) : 0,
      ltv_cents: monthlyChurn ? Math.round((arpa * grossMargin) / monthlyChurn) : 0,
      burn_multiple:
        expenses > revenue && end > start ? (expenses - revenue) / ((end - start) * 12) : 0,
      magic_number: sm ? ((end - start) * 12) / sm : 0,
      rule_of_40: (growth + operatingMargin) * 100,
      growth_rate: growth,
      operating_margin: operatingMargin,
    };
  }

  function cashFlow() {
    const rows = db
      .prepare(
        `SELECT j.id,j.memo,l.debit_cents,l.credit_cents,a.code,a.type FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted'`,
      )
      .all();
    const byEntry = new Map();
    for (const r of rows) {
      if (!byEntry.has(r.id)) byEntry.set(r.id, []);
      byEntry.get(r.id).push(r);
    }
    let operating = 0,
      investing = 0,
      financing = 0;
    for (const lines of byEntry.values()) {
      const cash = lines.find((l) => l.code === "1000");
      if (!cash) continue;
      const change = cash.debit_cents - cash.credit_cents;
      const codes = new Set(lines.map((l) => l.code));
      if (codes.has("3000") || codes.has("2400")) financing += change;
      else if (codes.has("1250")) investing += change;
      else operating += change;
    }
    return {
      operating_cents: operating,
      investing_cents: investing,
      financing_cents: financing,
      net_change_cents: operating + investing + financing,
    };
  }

  function consolidation() {
    const entities = db.prepare("SELECT * FROM entities ORDER BY id").all();
    const balances = db
      .prepare(
        `SELECT COALESCE(j.entity_id,1) entity_id,a.type,SUM((l.debit_cents-l.credit_cents)*j.exchange_rate) signed_cents FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' GROUP BY entity_id,a.type`,
      )
      .all();
    return {
      entities,
      balances,
      intercompany_eliminations_cents: Math.abs(
        db
          .prepare(
            `SELECT COALESCE(SUM((l.debit_cents-l.credit_cents)*j.exchange_rate),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND a.code IN ('1300','2300')`,
          )
          .get().value,
      ),
    };
  }

  function revalueFx(asOf) {
    const entities = db.prepare("SELECT * FROM entities WHERE currency<>'USD' AND active=1").all();
    const posted = [];
    for (const entity of entities) {
      const rate = db
        .prepare(
          "SELECT usd_rate FROM fx_rates WHERE currency=? AND rate_date<=? ORDER BY rate_date DESC LIMIT 1",
        )
        .get(entity.currency, asOf)?.usd_rate;
      if (!rate) continue;
      const exposure = db
        .prepare(
          `SELECT COALESCE(SUM(CASE WHEN a.type='asset' THEN l.debit_cents-l.credit_cents ELSE l.credit_cents-l.debit_cents END),0) local_cents,
        COALESCE(SUM(CASE WHEN a.type='asset' THEN (l.debit_cents-l.credit_cents)*j.exchange_rate ELSE (l.credit_cents-l.debit_cents)*j.exchange_rate END),0) historical_usd_cents
        FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id
        WHERE j.status='posted' AND j.entity_id=? AND a.code IN ('1000','1100','2000')`,
        )
        .get(entity.id);
      const existingAdjustment = db
        .prepare(
          `SELECT COALESCE(SUM(l.debit_cents-l.credit_cents),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND j.entity_id=? AND a.code='1350'`,
        )
        .get(entity.id).value;
      const targetAdjustment = Math.round(
          exposure.local_cents * rate - exposure.historical_usd_cents,
        ),
        delta = targetAdjustment - existingAdjustment;
      if (!delta) continue;
      const lines =
        delta > 0
          ? [
              { account_id: accountId("1350"), debit_cents: delta, credit_cents: 0 },
              { account_id: accountId("6200"), debit_cents: 0, credit_cents: delta },
            ]
          : [
              { account_id: accountId("6200"), debit_cents: -delta, credit_cents: 0 },
              { account_id: accountId("1350"), debit_cents: 0, credit_cents: -delta },
            ];
      const d = ledger.createDraft(
        {
          date: asOf,
          memo: `FX revaluation — ${entity.name}`,
          source: "fx_revaluation",
          entity_id: entity.id,
          currency: "USD",
          exchange_rate: 1,
          lines,
        },
        currentActor(),
      );
      posted.push(ledger.postJournal(d.id, currentActor()).id);
    }
    return { journal_entry_ids: posted };
  }

  function postEliminations(asOf) {
    const receivable = db
      .prepare(
        `SELECT COALESCE(SUM(l.debit_cents-l.credit_cents),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND a.code='1300'`,
      )
      .get().value;
    const payable = db
      .prepare(
        `SELECT COALESCE(SUM(l.credit_cents-l.debit_cents),0) value FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id WHERE j.status='posted' AND a.code='2300'`,
      )
      .get().value;
    const amount = Math.min(Math.max(0, receivable), Math.max(0, payable));
    if (!amount) return { eliminated_cents: 0, journal_entry_id: null };
    const d = ledger.createDraft(
      {
        date: asOf,
        memo: "Consolidation elimination — intercompany balances",
        source: "consolidation",
        entity_id: 1,
        lines: [
          { account_id: accountId("2300"), debit_cents: amount, credit_cents: 0 },
          { account_id: accountId("1300"), debit_cents: 0, credit_cents: amount },
        ],
      },
      currentActor(),
    );
    const j = ledger.postJournal(d.id, currentActor());
    return { eliminated_cents: amount, journal_entry_id: j.id };
  }

  return {
    listContracts,
    getContract,
    createContract,
    createInvoice,
    listInvoices,
    recordPayment: (input) => atomic(() => recordPayment(input)),
    applyPayment: (input) => atomic(() => applyPayment(input)),
    createCreditMemo: (input) => atomic(() => createCreditMemo(input)),
    voidInvoice: (input) => atomic(() => voidInvoice(input)),
    writeOffInvoice: (input) => atomic(() => writeOffInvoice(input)),
    refundPayment: (input) => atomic(() => refundPayment(input)),
    voidPayment: (input) => atomic(() => voidPayment(input)),
    openDispute,
    resolveDispute,
    addCollectionActivity,
    completeCollectionActivity,
    receivables,
    recordUsage,
    updateMilestone,
    recognizeThrough,
    modifyContract,
    addSoftwareProject,
    revenueWaterfall,
    deferredRollforward,
    rpo,
    metrics,
    cashFlow,
    consolidation,
    revalueFx,
    postEliminations,
    customers: () => db.prepare("SELECT * FROM customers ORDER BY name").all(),
    products: () => db.prepare("SELECT * FROM products ORDER BY sku").all(),
    entities: () => db.prepare("SELECT * FROM entities ORDER BY id").all(),
    revenueSchedules: () =>
      db
        .prepare(
          `SELECT rs.*,po.description,c.contract_number,cu.name customer_name FROM revenue_schedules rs JOIN performance_obligations po ON po.id=rs.obligation_id JOIN contracts c ON c.id=po.contract_id JOIN customers cu ON cu.id=c.customer_id ORDER BY rs.period,rs.id`,
        )
        .all(),
    commissions: () =>
      db
        .prepare(
          `SELECT c.*,cu.name customer_name,co.contract_number FROM commissions c JOIN contracts co ON co.id=c.contract_id JOIN customers cu ON cu.id=co.customer_id`,
        )
        .all(),
    softwareProjects: () => db.prepare("SELECT * FROM software_projects ORDER BY id DESC").all(),
  };
}

function generateRevenueSchedule(db, obligationId, amount, method, start, end) {
  if (["usage", "milestone"].includes(method)) return;
  if (method === "point_in_time")
    return db
      .prepare("INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?)")
      .run(obligationId, isoMonth(end), amount);
  distribute(amount, monthCount(start, end)).forEach((part, i) =>
    db
      .prepare("INSERT INTO revenue_schedules(obligation_id,period,amount_cents) VALUES(?,?,?)")
      .run(obligationId, monthKey(asDate(addMonths(start, i))), part),
  );
}
function distribute(total, count) {
  const base = Math.floor(total / count),
    remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}
function spreadScheduleDelta(db, rows, delta) {
  if (!delta) return;
  if (!rows.length) return;
  distribute(delta, rows.length).forEach((amount, i) =>
    db
      .prepare("UPDATE revenue_schedules SET amount_cents=amount_cents+? WHERE id=?")
      .run(amount, rows[i].id),
  );
}
function createCommissionInternal(db, contractId, amount, start, months) {
  const c = db
    .prepare(
      "INSERT INTO commissions(contract_id,amount_cents,start_date,amortization_months) VALUES(?,?,?,?)",
    )
    .run(contractId, amount, start, months);
  distribute(amount, months).forEach((part, i) =>
    db
      .prepare("INSERT INTO commission_schedules(commission_id,period,amount_cents) VALUES(?,?,?)")
      .run(Number(c.lastInsertRowid), isoMonth(addMonths(start, i)), part),
  );
}
function audit(db, type, id, action, actor, payload) {
  const requestActor = currentActor();
  db.prepare(
    "INSERT INTO audit_log(entity_type,entity_id,action,actor,payload) VALUES(?,?,?,?,?)",
  ).run(
    type,
    id,
    action,
    requestActor === "system" ? actor : requestActor,
    JSON.stringify(payload),
  );
}
function requireAmount(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw bad(`${label} must be a positive whole number of cents`);
}
function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

export function seedSaas(db, saas, ledger) {
  if (db.prepare("SELECT COUNT(*) count FROM entities").get().count) return;
  db.prepare("INSERT INTO entities(name,currency) VALUES('Northstar Labs, Inc.','USD')").run();
  db.prepare(
    "INSERT INTO entities(name,currency,parent_id) VALUES('Northstar Labs Europe Ltd.','EUR',1)",
  ).run();
  for (const row of [
    ["2026-06-30", "EUR", 1.17],
    ["2026-07-31", "EUR", 1.16],
    ["2026-08-22", "EUR", 1.18],
  ])
    db.prepare("INSERT INTO fx_rates(rate_date,currency,usd_rate) VALUES(?,?,?)").run(...row);
  const customers = [
    ["Acme Robotics", "enterprise", "US"],
    ["Helio Health", "mid-market", "US"],
    ["Kite Systems", "startup", "EU"],
    ["Vertex AI", "enterprise", "US"],
  ];
  for (const c of customers)
    db.prepare("INSERT INTO customers(name,segment,region) VALUES(?,?,?)").run(...c);
  const products = [
    ["PLATFORM", "AI Platform", "subscription", 12000000, 1, "4000"],
    ["USAGE", "Inference usage", "usage", 6000000, 1, "4000"],
    ["ONBOARD", "Implementation", "services", 2000000, 0, "4100"],
  ];
  for (const p of products)
    db.prepare(
      "INSERT INTO products(sku,name,category,ssp_cents,recurring,revenue_account_code) VALUES(?,?,?,?,?,?)",
    ).run(...p);
  const ids = Object.fromEntries(
    db
      .prepare("SELECT sku,id FROM products")
      .all()
      .map((x) => [x.sku, x.id]),
  );
  const cids = Object.fromEntries(
    db
      .prepare("SELECT name,id FROM customers")
      .all()
      .map((x) => [x.name, x.id]),
  );
  saas.createContract({
    customer_id: cids["Acme Robotics"],
    entity_id: 1,
    contract_number: "ACME-2026-001",
    signed_date: "2026-05-20",
    start_date: "2026-06-01",
    end_date: "2027-05-31",
    currency: "USD",
    transaction_price_cents: 15000000,
    variable_consideration_cents: 1000000,
    constraint_percent: 50,
    billing_model: "hybrid",
    commission_cents: 1200000,
    commission_months: 12,
    obligations: [
      {
        product_id: ids.PLATFORM,
        description: "Annual AI platform access",
        ssp_cents: 12000000,
        recognition_method: "straight_line",
      },
      {
        product_id: ids.ONBOARD,
        description: "Implementation and onboarding",
        ssp_cents: 2000000,
        recognition_method: "point_in_time",
        end_date: "2026-06-30",
      },
      {
        product_id: ids.USAGE,
        description: "Committed inference usage",
        ssp_cents: 6000000,
        recognition_method: "usage",
        total_units: 1000000,
      },
    ],
  });
  saas.createContract({
    customer_id: cids["Helio Health"],
    entity_id: 1,
    contract_number: "HELIO-2026-014",
    signed_date: "2026-07-10",
    start_date: "2026-08-01",
    end_date: "2027-07-31",
    currency: "USD",
    transaction_price_cents: 7200000,
    billing_model: "subscription",
    commission_cents: 500000,
    obligations: [
      {
        product_id: ids.PLATFORM,
        description: "Platform subscription",
        ssp_cents: 7200000,
        recognition_method: "straight_line",
      },
    ],
  });
  saas.createInvoice({
    contract_id: 1,
    invoice_number: "INV-1001",
    invoice_date: "2026-06-01",
    due_date: "2026-07-01",
    amount_cents: 15500000,
  });
  saas.createInvoice({
    contract_id: 2,
    invoice_number: "INV-1014",
    invoice_date: "2026-08-01",
    due_date: "2026-08-31",
    amount_cents: 7200000,
  });
  saas.recordUsage({
    obligation_id: 3,
    event_date: "2026-08-15",
    units: 80000,
    amount_cents: 620000,
    external_id: "usage-acme-aug",
  });
  const snapshots = [
    [1, "2026-06", 1000000],
    [2, "2026-06", 400000],
    [3, "2026-06", 250000],
    [1, "2026-08", 1250000],
    [2, "2026-08", 600000],
    [4, "2026-08", 300000],
  ];
  for (const s of snapshots)
    db.prepare(
      "INSERT INTO subscription_snapshots(customer_id,period,mrr_cents) VALUES(?,?,?)",
    ).run(...s);
  db.prepare(
    "INSERT INTO operating_metrics(period,sales_marketing_cents,cloud_cogs_cents,new_customers,capitalized_software_cents) VALUES('2026-06',1200000,1100000,2,0),('2026-07',1500000,1600000,1,2400000),('2026-08',1700000,1900000,1,0)",
  ).run();
  saas.addSoftwareProject({
    name: "Multi-tenant orchestration engine",
    model: "internal_use",
    stage: "application_development",
    cost_cents: 2400000,
    placed_in_service: "2026-08-01",
    useful_life_months: 36,
  });
  saas.addSoftwareProject({
    name: "Discovery prototype",
    model: "internal_use",
    stage: "preliminary",
    cost_cents: 350000,
  });
  const a = Object.fromEntries(
    db
      .prepare("SELECT code,id FROM accounts")
      .all()
      .map((x) => [x.code, x.id]),
  );
  for (const entry of [
    {
      date: "2026-08-15",
      memo: "EU customer receivable",
      source: "eu_billing",
      entity_id: 2,
      currency: "EUR",
      exchange_rate: 1.18,
      lines: [
        { account_id: a["1100"], debit_cents: 1000000, credit_cents: 0 },
        { account_id: a["4000"], debit_cents: 0, credit_cents: 1000000 },
      ],
    },
    {
      date: "2026-08-18",
      memo: "Intercompany funding sent",
      source: "intercompany",
      entity_id: 1,
      lines: [
        { account_id: a["1300"], debit_cents: 500000, credit_cents: 0 },
        { account_id: a["1000"], debit_cents: 0, credit_cents: 500000 },
      ],
    },
    {
      date: "2026-08-18",
      memo: "Intercompany funding received",
      source: "intercompany",
      entity_id: 2,
      currency: "EUR",
      exchange_rate: 1.18,
      lines: [
        { account_id: a["1000"], debit_cents: 423729, credit_cents: 0 },
        { account_id: a["2300"], debit_cents: 0, credit_cents: 423729 },
      ],
    },
  ]) {
    const d = ledger.createDraft(entry, "system.seed");
    ledger.postJournal(d.id, "system.seed");
  }
}
