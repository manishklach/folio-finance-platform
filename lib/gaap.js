import { currentActor } from "./request-context.js";

const asDate = (value) => new Date(`${value}T00:00:00Z`);
const addMonths = (value, count) => {
  const date = asDate(value);
  date.setUTCMonth(date.getUTCMonth() + count);
  return date.toISOString().slice(0, 10);
};
const distribute = (amount, periods) => {
  const base = Math.floor(amount / periods);
  return Array.from({ length: periods }, (_, index) =>
    index === periods - 1 ? amount - base * (periods - 1) : base,
  );
};
const required = (value, name) => {
  if (value === undefined || value === null || value === "") throw problem(`${name} is required`);
  return value;
};
const positiveInt = (value, name) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw problem(`${name} must be a positive integer`);
  return number;
};
const rate = (value, name) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1)
    throw problem(`${name} must be between 0 and 1`);
  return number;
};

export function migrateGaap(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS gaap_policy_elections (id INTEGER PRIMARY KEY AUTOINCREMENT,topic TEXT NOT NULL,policy_key TEXT NOT NULL,value_json TEXT NOT NULL,effective_date TEXT NOT NULL,approved_by TEXT NOT NULL,approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(topic,policy_key,effective_date));
    CREATE TABLE IF NOT EXISTS leases (id INTEGER PRIMARY KEY AUTOINCREMENT,lease_number TEXT NOT NULL UNIQUE,description TEXT NOT NULL,commencement_date TEXT NOT NULL,term_months INTEGER NOT NULL,classification TEXT NOT NULL CHECK(classification IN ('operating','finance','short_term')),annual_discount_rate REAL NOT NULL,initial_liability_cents INTEGER NOT NULL,initial_rou_asset_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'active',policy_basis TEXT NOT NULL,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS lease_schedule (id INTEGER PRIMARY KEY AUTOINCREMENT,lease_id INTEGER NOT NULL REFERENCES leases(id),period INTEGER NOT NULL,payment_date TEXT NOT NULL,payment_cents INTEGER NOT NULL,interest_cents INTEGER NOT NULL,principal_cents INTEGER NOT NULL,liability_cents INTEGER NOT NULL,rou_amortization_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',journal_entry_id INTEGER REFERENCES journal_entries(id),UNIQUE(lease_id,period));
    CREATE TABLE IF NOT EXISTS stock_awards (id INTEGER PRIMARY KEY AUTOINCREMENT,award_number TEXT NOT NULL UNIQUE,recipient TEXT NOT NULL,award_type TEXT NOT NULL,grant_date TEXT NOT NULL,shares INTEGER NOT NULL,fair_value_per_share_cents INTEGER NOT NULL,service_months INTEGER NOT NULL,forfeiture_rate REAL NOT NULL DEFAULT 0,total_compensation_cents INTEGER NOT NULL,classification TEXT NOT NULL CHECK(classification IN ('equity','liability')),policy_basis TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS stock_comp_schedule (id INTEGER PRIMARY KEY AUTOINCREMENT,award_id INTEGER NOT NULL REFERENCES stock_awards(id),period INTEGER NOT NULL,recognition_date TEXT NOT NULL,amount_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',journal_entry_id INTEGER REFERENCES journal_entries(id),UNIQUE(award_id,period));
    CREATE TABLE IF NOT EXISTS stock_award_remeasurements (id INTEGER PRIMARY KEY AUTOINCREMENT,award_id INTEGER NOT NULL REFERENCES stock_awards(id),measurement_date TEXT NOT NULL,fair_value_per_share_cents INTEGER NOT NULL,service_months_elapsed INTEGER NOT NULL,cumulative_compensation_cents INTEGER NOT NULL,adjustment_cents INTEGER NOT NULL,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(award_id,measurement_date));
    CREATE TABLE IF NOT EXISTS tax_provisions (id INTEGER PRIMARY KEY AUTOINCREMENT,period_end TEXT NOT NULL UNIQUE,pretax_income_cents INTEGER NOT NULL,statutory_rate REAL NOT NULL,current_tax_cents INTEGER NOT NULL,deferred_tax_asset_cents INTEGER NOT NULL,deferred_tax_liability_cents INTEGER NOT NULL,valuation_allowance_cents INTEGER NOT NULL,total_tax_expense_cents INTEGER NOT NULL,effective_tax_rate REAL NOT NULL,assumptions_json TEXT NOT NULL,policy_basis TEXT NOT NULL,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS cecl_estimates (id INTEGER PRIMARY KEY AUTOINCREMENT,as_of TEXT NOT NULL,pool_key TEXT NOT NULL,exposure_cents INTEGER NOT NULL,historical_loss_rate REAL NOT NULL,forecast_adjustment REAL NOT NULL,qualitative_adjustment REAL NOT NULL,expected_loss_cents INTEGER NOT NULL,method TEXT NOT NULL,assumptions_json TEXT NOT NULL,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(as_of,pool_key));
    CREATE TABLE IF NOT EXISTS contingencies (id INTEGER PRIMARY KEY AUTOINCREMENT,matter_key TEXT NOT NULL UNIQUE,as_of TEXT NOT NULL,description TEXT NOT NULL,likelihood TEXT NOT NULL CHECK(likelihood IN ('remote','reasonably_possible','probable')),estimable INTEGER NOT NULL,low_estimate_cents INTEGER,high_estimate_cents INTEGER,accrued_cents INTEGER NOT NULL DEFAULT 0,disclosure_required INTEGER NOT NULL,policy_basis TEXT NOT NULL,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS fair_value_measurements (id INTEGER PRIMARY KEY AUTOINCREMENT,measurement_key TEXT NOT NULL,as_of TEXT NOT NULL,description TEXT NOT NULL,fair_value_cents INTEGER NOT NULL,carrying_value_cents INTEGER NOT NULL,level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 3),valuation_technique TEXT NOT NULL,inputs_json TEXT NOT NULL,recurring INTEGER NOT NULL DEFAULT 1,policy_basis TEXT NOT NULL,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(measurement_key,as_of));
    CREATE TABLE IF NOT EXISTS debt_instruments (id INTEGER PRIMARY KEY AUTOINCREMENT,debt_number TEXT NOT NULL UNIQUE,description TEXT NOT NULL,issue_date TEXT NOT NULL,maturity_date TEXT NOT NULL,face_cents INTEGER NOT NULL,proceeds_cents INTEGER NOT NULL,stated_rate REAL NOT NULL,effective_rate REAL NOT NULL,payment_frequency INTEGER NOT NULL,classification TEXT NOT NULL CHECK(classification IN ('current','noncurrent')),policy_basis TEXT NOT NULL,issuance_journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS debt_schedule (id INTEGER PRIMARY KEY AUTOINCREMENT,debt_id INTEGER NOT NULL REFERENCES debt_instruments(id),period INTEGER NOT NULL,payment_date TEXT NOT NULL,cash_interest_cents INTEGER NOT NULL,effective_interest_cents INTEGER NOT NULL,principal_cents INTEGER NOT NULL,carrying_value_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',journal_entry_id INTEGER REFERENCES journal_entries(id),UNIQUE(debt_id,period));
    CREATE TABLE IF NOT EXISTS classification_assessments (id INTEGER PRIMARY KEY AUTOINCREMENT,instrument_key TEXT NOT NULL,as_of TEXT NOT NULL,instrument_type TEXT NOT NULL,obligation_to_repurchase INTEGER NOT NULL,unconditional_redemption INTEGER NOT NULL,variable_share_obligation INTEGER NOT NULL,conclusion TEXT NOT NULL CHECK(conclusion IN ('liability','temporary_equity','equity')),policy_basis TEXT NOT NULL,approved_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(instrument_key,as_of));
    CREATE TABLE IF NOT EXISTS business_combinations (id INTEGER PRIMARY KEY AUTOINCREMENT,acquisition_key TEXT NOT NULL UNIQUE,acquisition_date TEXT NOT NULL,acquiree TEXT NOT NULL,consideration_cents INTEGER NOT NULL,nci_fair_value_cents INTEGER NOT NULL,previous_interest_fair_value_cents INTEGER NOT NULL,identifiable_assets_cents INTEGER NOT NULL,liabilities_assumed_cents INTEGER NOT NULL,goodwill_cents INTEGER NOT NULL,bargain_gain_cents INTEGER NOT NULL,measurement_basis_json TEXT NOT NULL,policy_basis TEXT NOT NULL,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS consolidation_assessments (id INTEGER PRIMARY KEY AUTOINCREMENT,entity_key TEXT NOT NULL,as_of TEXT NOT NULL,entity_name TEXT NOT NULL,vie INTEGER NOT NULL,power INTEGER NOT NULL,significant_economics INTEGER NOT NULL,primary_beneficiary INTEGER NOT NULL,voting_interest_percent REAL NOT NULL,consolidate INTEGER NOT NULL,nci_percent REAL NOT NULL,policy_basis TEXT NOT NULL,approved_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(entity_key,as_of));
    CREATE TABLE IF NOT EXISTS eps_calculations (id INTEGER PRIMARY KEY AUTOINCREMENT,period_end TEXT NOT NULL UNIQUE,net_income_cents INTEGER NOT NULL,preferred_dividends_cents INTEGER NOT NULL,weighted_average_shares INTEGER NOT NULL,dilutive_incremental_shares INTEGER NOT NULL,basic_eps REAL NOT NULL,diluted_eps REAL NOT NULL,assumptions_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS oci_items (id INTEGER PRIMARY KEY AUTOINCREMENT,item_key TEXT NOT NULL,period_end TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,pretax_cents INTEGER NOT NULL,tax_cents INTEGER NOT NULL,net_cents INTEGER NOT NULL,reclassification_cents INTEGER NOT NULL DEFAULT 0,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(item_key,period_end));
    CREATE TABLE IF NOT EXISTS gaap_assessments (id INTEGER PRIMARY KEY AUTOINCREMENT,topic TEXT NOT NULL,assessment_key TEXT NOT NULL,as_of TEXT NOT NULL,facts_json TEXT NOT NULL,conclusion TEXT NOT NULL,policy_basis TEXT NOT NULL,disclosure_json TEXT NOT NULL,approved_by TEXT NOT NULL,journal_entry_id INTEGER REFERENCES journal_entries(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(topic,assessment_key,as_of));
    CREATE INDEX IF NOT EXISTS idx_lease_schedule_date ON lease_schedule(payment_date,status);
    CREATE INDEX IF NOT EXISTS idx_stock_schedule_date ON stock_comp_schedule(recognition_date,status);
    CREATE INDEX IF NOT EXISTS idx_gaap_assessment_topic ON gaap_assessments(topic,as_of);
    INSERT OR IGNORE INTO schema_migrations(version,name) VALUES(100,'comprehensive SaaS GAAP engine');
  `);
  ensureColumn(
    db,
    "debt_instruments",
    "issuance_journal_entry_id",
    "INTEGER REFERENCES journal_entries(id)",
  );
  ensureColumn(db, "debt_schedule", "status", "TEXT NOT NULL DEFAULT 'pending'");
  ensureColumn(db, "debt_schedule", "journal_entry_id", "INTEGER REFERENCES journal_entries(id)");
  ensureColumn(
    db,
    "gaap_assessments",
    "journal_entry_id",
    "INTEGER REFERENCES journal_entries(id)",
  );
}

function ensureColumn(db, table, column, definition) {
  if (
    !db
      .prepare(`PRAGMA table_info(${table})`)
      .all()
      .some((item) => item.name === column)
  )
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function createGaapRepository(db, ledger) {
  function atomic(work) {
    const owns = !db.isTransaction;
    if (owns) db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      if (owns) db.exec("COMMIT");
      return result;
    } catch (error) {
      if (owns) db.exec("ROLLBACK");
      throw error;
    }
  }
  const accountId = (code) => {
    const row = db.prepare("SELECT id FROM accounts WHERE code=?").get(code);
    if (!row) throw new Error(`Missing account ${code}`);
    return row.id;
  };
  const post = (date, memo, source, lines) => {
    const draft = ledger.createDraft({ date, memo, source, lines }, currentActor());
    return ledger.postJournal(draft.id, currentActor());
  };

  function setPolicy(input) {
    required(input.topic, "topic");
    required(input.policy_key, "policy_key");
    required(input.effective_date, "effective_date");
    const actor = currentActor();
    db.prepare(
      `INSERT INTO gaap_policy_elections(topic,policy_key,value_json,effective_date,approved_by)
      VALUES(?,?,?,?,?) ON CONFLICT(topic,policy_key,effective_date) DO UPDATE SET value_json=excluded.value_json,approved_by=excluded.approved_by,approved_at=CURRENT_TIMESTAMP`,
    ).run(input.topic, input.policy_key, JSON.stringify(input.value), input.effective_date, actor);
    return db
      .prepare(
        "SELECT * FROM gaap_policy_elections WHERE topic=? AND policy_key=? AND effective_date=?",
      )
      .get(input.topic, input.policy_key, input.effective_date);
  }

  function createLease(input) {
    return atomic(() => {
      const term = positiveInt(input.term_months, "term_months");
      const annualRate = rate(input.annual_discount_rate, "annual_discount_rate");
      const payments = input.payments_cents?.length
        ? input.payments_cents.map(Number)
        : Array(term).fill(positiveInt(input.monthly_payment_cents, "monthly_payment_cents"));
      if (payments.length !== term || payments.some((x) => !Number.isInteger(x) || x < 0))
        throw problem("payments_cents must contain one nonnegative integer for every lease month");
      const indicators = input.classification_indicators || {};
      const shortTerm = term <= 12 && Boolean(input.short_term_election);
      const finance = [
        "ownership_transfer",
        "purchase_option_reasonably_certain",
        "major_part",
        "substantially_all",
        "specialized_asset",
      ].some((key) => indicators[key]);
      const classification = shortTerm ? "short_term" : finance ? "finance" : "operating";
      const monthlyRate = annualRate / 12;
      let liability = payments.reduce(
        (sum, payment, index) => sum + payment / (1 + monthlyRate) ** (index + 1),
        0,
      );
      liability = Math.round(liability);
      const rou =
        liability +
        Number(input.initial_direct_costs_cents || 0) +
        Number(input.prepayments_cents || 0) -
        Number(input.incentives_cents || 0);
      const result = db
        .prepare(
          `INSERT INTO leases(lease_number,description,commencement_date,term_months,classification,annual_discount_rate,initial_liability_cents,initial_rou_asset_cents,policy_basis)
        VALUES(?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.lease_number, "lease_number"),
          required(input.description, "description"),
          required(input.commencement_date, "commencement_date"),
          term,
          classification,
          annualRate,
          liability,
          rou,
          required(input.policy_basis, "policy_basis"),
        );
      const id = Number(result.lastInsertRowid);
      let balance = liability;
      const totalOperatingExpense =
        payments.reduce((sum, x) => sum + x, 0) +
        Number(input.initial_direct_costs_cents || 0) -
        Number(input.incentives_cents || 0);
      const operatingExpense = distribute(totalOperatingExpense, term);
      const financeRou = distribute(rou, term);
      for (let index = 0; index < term; index += 1) {
        const interest =
          index === term - 1 ? payments[index] - balance : Math.round(balance * monthlyRate);
        const principal =
          index === term - 1 ? balance : Math.min(balance, payments[index] - interest);
        balance -= principal;
        const rouAmortization =
          classification === "operating" ? operatingExpense[index] - interest : financeRou[index];
        db.prepare(
          `INSERT INTO lease_schedule(lease_id,period,payment_date,payment_cents,interest_cents,principal_cents,liability_cents,rou_amortization_cents) VALUES(?,?,?,?,?,?,?,?)`,
        ).run(
          id,
          index + 1,
          addMonths(input.commencement_date, index + 1),
          payments[index],
          interest,
          principal,
          balance,
          Math.max(0, rouAmortization),
        );
      }
      if (classification !== "short_term" && input.post_commencement !== false) {
        const cashDifference = rou - liability;
        const lines = [
          {
            account_id: accountId(classification === "finance" ? "1410" : "1400"),
            debit_cents: rou,
            credit_cents: 0,
          },
          {
            account_id: accountId(classification === "finance" ? "2260" : "2250"),
            debit_cents: 0,
            credit_cents: liability,
          },
        ];
        if (cashDifference > 0)
          lines.push({
            account_id: accountId("1000"),
            debit_cents: 0,
            credit_cents: cashDifference,
          });
        if (cashDifference < 0)
          lines.push({
            account_id: accountId("1000"),
            debit_cents: -cashDifference,
            credit_cents: 0,
          });
        const journal = post(
          input.commencement_date,
          `Lease commencement — ${input.lease_number}`,
          "asc842",
          lines,
        );
        db.prepare("UPDATE leases SET journal_entry_id=? WHERE id=?").run(journal.id, id);
      }
      return lease(id);
    });
  }
  const lease = (id) => {
    const row = db.prepare("SELECT * FROM leases WHERE id=?").get(id);
    return row
      ? {
          ...row,
          schedule: db
            .prepare("SELECT * FROM lease_schedule WHERE lease_id=? ORDER BY period")
            .all(id),
        }
      : null;
  };
  function recognizeLeaseThrough(asOf) {
    return atomic(() => {
      const rows = db
        .prepare(
          `SELECT s.*,l.lease_number,l.classification FROM lease_schedule s JOIN leases l ON l.id=s.lease_id WHERE s.status='pending' AND s.payment_date<=? ORDER BY s.payment_date,s.id`,
        )
        .all(asOf);
      const ids = [];
      for (const row of rows) {
        let lines;
        if (row.classification === "short_term") {
          lines = [
            { account_id: accountId("5600"), debit_cents: row.payment_cents, credit_cents: 0 },
            { account_id: accountId("1000"), debit_cents: 0, credit_cents: row.payment_cents },
          ];
        } else if (row.classification === "operating") {
          const expense = row.interest_cents + row.rou_amortization_cents;
          lines = [
            { account_id: accountId("5600"), debit_cents: expense, credit_cents: 0 },
            { account_id: accountId("2250"), debit_cents: row.principal_cents, credit_cents: 0 },
            {
              account_id: accountId("1400"),
              debit_cents: 0,
              credit_cents: row.rou_amortization_cents,
            },
            { account_id: accountId("1000"), debit_cents: 0, credit_cents: row.payment_cents },
          ];
        } else {
          lines = [
            { account_id: accountId("5620"), debit_cents: row.interest_cents, credit_cents: 0 },
            {
              account_id: accountId("5610"),
              debit_cents: row.rou_amortization_cents,
              credit_cents: 0,
            },
            { account_id: accountId("2260"), debit_cents: row.principal_cents, credit_cents: 0 },
            {
              account_id: accountId("1410"),
              debit_cents: 0,
              credit_cents: row.rou_amortization_cents,
            },
            { account_id: accountId("1000"), debit_cents: 0, credit_cents: row.payment_cents },
          ];
        }
        const journal = post(
          row.payment_date,
          `Lease accounting — ${row.lease_number} period ${row.period}`,
          "asc842",
          lines,
        );
        db.prepare(
          "UPDATE lease_schedule SET status='recognized',journal_entry_id=? WHERE id=?",
        ).run(journal.id, row.id);
        ids.push(journal.id);
      }
      return { recognized_periods: rows.length, journal_entry_ids: ids };
    });
  }

  function createStockAward(input) {
    return atomic(() => {
      const shares = positiveInt(input.shares, "shares");
      const fairValue = positiveInt(input.fair_value_per_share_cents, "fair_value_per_share_cents");
      const months = positiveInt(input.service_months, "service_months");
      const forfeiture = rate(input.forfeiture_rate || 0, "forfeiture_rate");
      const total = Math.round(shares * fairValue * (1 - forfeiture));
      const result = db
        .prepare(
          `INSERT INTO stock_awards(award_number,recipient,award_type,grant_date,shares,fair_value_per_share_cents,service_months,forfeiture_rate,total_compensation_cents,classification,policy_basis) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.award_number, "award_number"),
          required(input.recipient, "recipient"),
          input.award_type || "option",
          required(input.grant_date, "grant_date"),
          shares,
          fairValue,
          months,
          forfeiture,
          total,
          input.classification || "equity",
          required(input.policy_basis, "policy_basis"),
        );
      const id = Number(result.lastInsertRowid);
      distribute(total, months).forEach((amount, index) =>
        db
          .prepare(
            "INSERT INTO stock_comp_schedule(award_id,period,recognition_date,amount_cents) VALUES(?,?,?,?)",
          )
          .run(id, index + 1, addMonths(input.grant_date, index + 1), amount),
      );
      return stockAward(id);
    });
  }
  const stockAward = (id) => {
    const row = db.prepare("SELECT * FROM stock_awards WHERE id=?").get(id);
    return row
      ? {
          ...row,
          schedule: db
            .prepare("SELECT * FROM stock_comp_schedule WHERE award_id=? ORDER BY period")
            .all(id),
        }
      : null;
  };
  function recognizeStockCompThrough(asOf) {
    return atomic(() => {
      const rows = db
        .prepare(
          `SELECT s.*,a.award_number,a.classification FROM stock_comp_schedule s JOIN stock_awards a ON a.id=s.award_id WHERE s.status='pending' AND s.recognition_date<=? ORDER BY s.recognition_date,s.id`,
        )
        .all(asOf);
      const ids = [];
      for (const row of rows) {
        const journal = post(
          row.recognition_date,
          `Share-based compensation — ${row.award_number}`,
          "asc718",
          [
            { account_id: accountId("5250"), debit_cents: row.amount_cents, credit_cents: 0 },
            {
              account_id: accountId(row.classification === "equity" ? "3100" : "2530"),
              debit_cents: 0,
              credit_cents: row.amount_cents,
            },
          ],
        );
        db.prepare(
          "UPDATE stock_comp_schedule SET status='recognized',journal_entry_id=? WHERE id=?",
        ).run(journal.id, row.id);
        ids.push(journal.id);
      }
      return { recognized_periods: rows.length, journal_entry_ids: ids };
    });
  }

  function remeasureStockAward(input) {
    return atomic(() => {
      const award = db.prepare("SELECT * FROM stock_awards WHERE id=?").get(input.award_id);
      if (!award) throw problem("Stock award not found", 404);
      if (award.classification !== "liability")
        throw problem("Only liability-classified awards are remeasured");
      const fairValue = positiveInt(input.fair_value_per_share_cents, "fair_value_per_share_cents");
      const elapsed = Number(input.service_months_elapsed);
      if (!Number.isInteger(elapsed) || elapsed < 0 || elapsed > award.service_months)
        throw problem("service_months_elapsed is outside the award service period");
      const total = Math.round(award.shares * fairValue * (1 - award.forfeiture_rate));
      const cumulative = Math.round((total * elapsed) / award.service_months);
      const recognizedSchedule = db
        .prepare(
          "SELECT COALESCE(SUM(amount_cents),0) value FROM stock_comp_schedule WHERE award_id=? AND status='recognized'",
        )
        .get(award.id).value;
      const priorAdjustments = db
        .prepare(
          "SELECT COALESCE(SUM(adjustment_cents),0) value FROM stock_award_remeasurements WHERE award_id=?",
        )
        .get(award.id).value;
      const delta = cumulative - recognizedSchedule - priorAdjustments;
      let journal = null;
      if (delta)
        journal = post(
          input.measurement_date,
          `Liability award remeasurement — ${award.award_number}`,
          "asc718",
          delta > 0
            ? [
                { account_id: accountId("5250"), debit_cents: delta, credit_cents: 0 },
                { account_id: accountId("2530"), debit_cents: 0, credit_cents: delta },
              ]
            : [
                { account_id: accountId("2530"), debit_cents: -delta, credit_cents: 0 },
                { account_id: accountId("5250"), debit_cents: 0, credit_cents: -delta },
              ],
        );
      db.prepare(
        `INSERT INTO stock_award_remeasurements(award_id,measurement_date,fair_value_per_share_cents,service_months_elapsed,cumulative_compensation_cents,adjustment_cents,journal_entry_id) VALUES(?,?,?,?,?,?,?)`,
      ).run(
        award.id,
        input.measurement_date,
        fairValue,
        elapsed,
        cumulative,
        delta,
        journal?.id || null,
      );
      db.prepare(
        "UPDATE stock_comp_schedule SET status='recognized',journal_entry_id=COALESCE(journal_entry_id,?) WHERE award_id=? AND period<=?",
      ).run(journal?.id || null, award.id, elapsed);
      const remainingRows = db
        .prepare("SELECT id FROM stock_comp_schedule WHERE award_id=? AND period>? ORDER BY period")
        .all(award.id, elapsed);
      if (remainingRows.length)
        distribute(Math.max(0, total - cumulative), remainingRows.length).forEach((amount, index) =>
          db
            .prepare("UPDATE stock_comp_schedule SET amount_cents=? WHERE id=?")
            .run(amount, remainingRows[index].id),
        );
      db.prepare(
        "UPDATE stock_awards SET fair_value_per_share_cents=?,total_compensation_cents=? WHERE id=?",
      ).run(fairValue, total, award.id);
      return db
        .prepare(
          "SELECT * FROM stock_award_remeasurements WHERE award_id=? ORDER BY id DESC LIMIT 1",
        )
        .get(award.id);
    });
  }

  function calculateTaxProvision(input) {
    return atomic(() => {
      const statutoryRate = rate(input.statutory_rate, "statutory_rate");
      const current = Math.round(
        Number(input.taxable_income_cents || 0) * statutoryRate +
          Number(input.discrete_current_tax_cents || 0),
      );
      let dta = 0,
        dtl = 0;
      for (const difference of input.temporary_differences || []) {
        const tax = Math.round(
          Math.abs(Number(difference.amount_cents)) *
            rate(difference.tax_rate ?? statutoryRate, "temporary difference tax_rate"),
        );
        if (difference.kind === "deductible") dta += tax;
        else if (difference.kind === "taxable") dtl += tax;
        else throw problem("temporary difference kind must be deductible or taxable");
      }
      const valuationAllowance = Math.min(
        dta,
        Math.max(0, Number(input.valuation_allowance_cents || 0)),
      );
      const deferredExpense = dtl - (dta - valuationAllowance);
      const totalExpense = current + deferredExpense;
      const pretax = Number(input.pretax_income_cents || 0);
      const journal =
        totalExpense || current || dta || dtl
          ? post(input.period_end, `Income tax provision — ${input.period_end}`, "asc740", [
              ...(totalExpense >= 0
                ? [{ account_id: accountId("5700"), debit_cents: totalExpense, credit_cents: 0 }]
                : [{ account_id: accountId("5700"), debit_cents: 0, credit_cents: -totalExpense }]),
              ...(dta
                ? [{ account_id: accountId("1170"), debit_cents: dta, credit_cents: 0 }]
                : []),
              ...(valuationAllowance
                ? [
                    {
                      account_id: accountId("1180"),
                      debit_cents: 0,
                      credit_cents: valuationAllowance,
                    },
                  ]
                : []),
              ...(dtl
                ? [{ account_id: accountId("2420"), debit_cents: 0, credit_cents: dtl }]
                : []),
              ...(current >= 0
                ? [{ account_id: accountId("2510"), debit_cents: 0, credit_cents: current }]
                : [{ account_id: accountId("2510"), debit_cents: -current, credit_cents: 0 }]),
            ])
          : null;
      const result = db
        .prepare(
          `INSERT INTO tax_provisions(period_end,pretax_income_cents,statutory_rate,current_tax_cents,deferred_tax_asset_cents,deferred_tax_liability_cents,valuation_allowance_cents,total_tax_expense_cents,effective_tax_rate,assumptions_json,policy_basis,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.period_end, "period_end"),
          pretax,
          statutoryRate,
          current,
          dta,
          dtl,
          valuationAllowance,
          totalExpense,
          pretax ? totalExpense / pretax : 0,
          JSON.stringify(input.assumptions || {}),
          required(input.policy_basis, "policy_basis"),
          journal?.id || null,
        );
      return db.prepare("SELECT * FROM tax_provisions WHERE id=?").get(result.lastInsertRowid);
    });
  }

  function estimateCreditLosses(input) {
    return atomic(() => {
      const estimates = [];
      for (const pool of input.pools || []) {
        const historical = rate(pool.historical_loss_rate, "historical_loss_rate");
        const forecast = Number(pool.forecast_adjustment ?? 1);
        const qualitative = Number(pool.qualitative_adjustment ?? 1);
        if (forecast < 0 || qualitative < 0) throw problem("CECL adjustments cannot be negative");
        const expected = Math.min(
          Number(pool.exposure_cents),
          Math.round(Number(pool.exposure_cents) * historical * forecast * qualitative),
        );
        const result = db
          .prepare(
            `INSERT INTO cecl_estimates(as_of,pool_key,exposure_cents,historical_loss_rate,forecast_adjustment,qualitative_adjustment,expected_loss_cents,method,assumptions_json) VALUES(?,?,?,?,?,?,?,?,?)`,
          )
          .run(
            input.as_of,
            required(pool.pool_key, "pool_key"),
            positiveInt(pool.exposure_cents, "exposure_cents"),
            historical,
            forecast,
            qualitative,
            expected,
            pool.method || "loss_rate",
            JSON.stringify(pool.assumptions || {}),
          );
        estimates.push({ id: Number(result.lastInsertRowid), expected_loss_cents: expected });
      }
      const requiredAllowance = estimates.reduce((sum, item) => sum + item.expected_loss_cents, 0);
      const existing =
        ledger.trialBalance(input.as_of).find((item) => item.code === "1160")?.balance_cents || 0;
      const currentAllowance = -existing;
      const delta = requiredAllowance - currentAllowance;
      let journal = null;
      if (delta)
        journal = post(
          input.as_of,
          `CECL allowance — ${input.as_of}`,
          "asc326",
          delta > 0
            ? [
                { account_id: accountId("5360"), debit_cents: delta, credit_cents: 0 },
                { account_id: accountId("1160"), debit_cents: 0, credit_cents: delta },
              ]
            : [
                { account_id: accountId("1160"), debit_cents: -delta, credit_cents: 0 },
                { account_id: accountId("5360"), debit_cents: 0, credit_cents: -delta },
              ],
        );
      if (journal)
        db.prepare("UPDATE cecl_estimates SET journal_entry_id=? WHERE as_of=?").run(
          journal.id,
          input.as_of,
        );
      return {
        as_of: input.as_of,
        required_allowance_cents: requiredAllowance,
        adjustment_cents: delta,
        journal_entry_id: journal?.id || null,
        pools: estimates,
      };
    });
  }

  function assessContingency(input) {
    return atomic(() => {
      const likelihood = required(input.likelihood, "likelihood");
      const estimable = Boolean(input.estimable);
      const low = input.low_estimate_cents == null ? null : Number(input.low_estimate_cents);
      const high = input.high_estimate_cents == null ? low : Number(input.high_estimate_cents);
      const accrue = likelihood === "probable" && estimable;
      if (accrue && (low == null || low < 0 || high < low))
        throw problem("A probable estimable loss requires a valid estimate range");
      const accrued = accrue ? Number(input.best_estimate_cents ?? low) : 0;
      const disclosure = likelihood === "probable" || likelihood === "reasonably_possible";
      const journal = accrued
        ? post(input.as_of, `Loss contingency — ${input.matter_key}`, "asc450", [
            { account_id: accountId("5800"), debit_cents: accrued, credit_cents: 0 },
            { account_id: accountId("2500"), debit_cents: 0, credit_cents: accrued },
          ])
        : null;
      const result = db
        .prepare(
          `INSERT INTO contingencies(matter_key,as_of,description,likelihood,estimable,low_estimate_cents,high_estimate_cents,accrued_cents,disclosure_required,policy_basis,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.matter_key, "matter_key"),
          input.as_of,
          required(input.description, "description"),
          likelihood,
          Number(estimable),
          low,
          high,
          accrued,
          Number(disclosure),
          required(input.policy_basis, "policy_basis"),
          journal?.id || null,
        );
      return db.prepare("SELECT * FROM contingencies WHERE id=?").get(result.lastInsertRowid);
    });
  }

  function recordFairValue(input) {
    return atomic(() => {
      const level = Number(input.level);
      if (![1, 2, 3].includes(level)) throw problem("level must be 1, 2, or 3");
      const fair = Number(input.fair_value_cents),
        carrying = Number(input.carrying_value_cents);
      const delta = fair - carrying;
      let journal = null;
      if (delta && input.asset_account_code)
        journal = post(
          input.as_of,
          `Fair value measurement — ${input.measurement_key}`,
          "asc820",
          delta > 0
            ? [
                {
                  account_id: accountId(input.asset_account_code),
                  debit_cents: delta,
                  credit_cents: 0,
                },
                { account_id: accountId("6300"), debit_cents: 0, credit_cents: delta },
              ]
            : [
                { account_id: accountId("6300"), debit_cents: -delta, credit_cents: 0 },
                {
                  account_id: accountId(input.asset_account_code),
                  debit_cents: 0,
                  credit_cents: -delta,
                },
              ],
        );
      const result = db
        .prepare(
          `INSERT INTO fair_value_measurements(measurement_key,as_of,description,fair_value_cents,carrying_value_cents,level,valuation_technique,inputs_json,recurring,policy_basis,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.measurement_key, "measurement_key"),
          input.as_of,
          required(input.description, "description"),
          fair,
          carrying,
          level,
          required(input.valuation_technique, "valuation_technique"),
          JSON.stringify(input.inputs || {}),
          Number(input.recurring !== false),
          required(input.policy_basis, "policy_basis"),
          journal?.id || null,
        );
      return db
        .prepare("SELECT * FROM fair_value_measurements WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function createDebt(input) {
    return atomic(() => {
      const face = positiveInt(input.face_cents, "face_cents"),
        proceeds = positiveInt(input.proceeds_cents, "proceeds_cents");
      const stated = rate(input.stated_rate, "stated_rate"),
        effective = rate(input.effective_rate, "effective_rate");
      const frequency = positiveInt(input.payment_frequency, "payment_frequency");
      const years = Math.max(
        1,
        Math.ceil((asDate(input.maturity_date) - asDate(input.issue_date)) / (365.25 * 86_400_000)),
      );
      const periods = years * frequency,
        months = Math.round(12 / frequency);
      const result = db
        .prepare(
          `INSERT INTO debt_instruments(debt_number,description,issue_date,maturity_date,face_cents,proceeds_cents,stated_rate,effective_rate,payment_frequency,classification,policy_basis) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.debt_number, "debt_number"),
          required(input.description, "description"),
          input.issue_date,
          input.maturity_date,
          face,
          proceeds,
          stated,
          effective,
          frequency,
          input.classification || "noncurrent",
          required(input.policy_basis, "policy_basis"),
        );
      const id = Number(result.lastInsertRowid),
        cashInterest = Math.round((face * stated) / frequency);
      let carrying = proceeds;
      for (let index = 0; index < periods; index += 1) {
        const effectiveInterest = Math.round((carrying * effective) / frequency);
        const principal = index === periods - 1 ? face : 0;
        carrying = index === periods - 1 ? 0 : carrying + effectiveInterest - cashInterest;
        db.prepare(
          "INSERT INTO debt_schedule(debt_id,period,payment_date,cash_interest_cents,effective_interest_cents,principal_cents,carrying_value_cents) VALUES(?,?,?,?,?,?,?)",
        ).run(
          id,
          index + 1,
          addMonths(input.issue_date, months * (index + 1)),
          cashInterest,
          effectiveInterest,
          principal,
          carrying,
        );
      }
      const issuance = post(input.issue_date, `Debt issuance — ${input.debt_number}`, "asc470", [
        { account_id: accountId("1000"), debit_cents: proceeds, credit_cents: 0 },
        { account_id: accountId("2400"), debit_cents: 0, credit_cents: proceeds },
      ]);
      db.prepare("UPDATE debt_instruments SET issuance_journal_entry_id=? WHERE id=?").run(
        issuance.id,
        id,
      );
      return {
        ...db.prepare("SELECT * FROM debt_instruments WHERE id=?").get(id),
        schedule: db.prepare("SELECT * FROM debt_schedule WHERE debt_id=? ORDER BY period").all(id),
      };
    });
  }

  function recognizeDebtThrough(asOf) {
    return atomic(() => {
      const rows = db
        .prepare(
          `SELECT s.*,d.debt_number FROM debt_schedule s JOIN debt_instruments d ON d.id=s.debt_id WHERE s.status='pending' AND s.payment_date<=? ORDER BY s.payment_date,s.id`,
        )
        .all(asOf);
      const ids = [];
      for (const row of rows) {
        const accretion = row.effective_interest_cents - row.cash_interest_cents;
        const lines = [
          {
            account_id: accountId("5620"),
            debit_cents: row.effective_interest_cents,
            credit_cents: 0,
          },
          {
            account_id: accountId("1000"),
            debit_cents: 0,
            credit_cents: row.cash_interest_cents + row.principal_cents,
          },
        ];
        if (accretion > 0)
          lines.push({ account_id: accountId("2400"), debit_cents: 0, credit_cents: accretion });
        if (accretion < 0)
          lines.push({ account_id: accountId("2400"), debit_cents: -accretion, credit_cents: 0 });
        if (row.principal_cents)
          lines.push({
            account_id: accountId("2400"),
            debit_cents: row.principal_cents,
            credit_cents: 0,
          });
        const journal = post(
          row.payment_date,
          `Debt accounting — ${row.debt_number} period ${row.period}`,
          "asc470",
          lines,
        );
        db.prepare(
          "UPDATE debt_schedule SET status='recognized',journal_entry_id=? WHERE id=?",
        ).run(journal.id, row.id);
        ids.push(journal.id);
      }
      return { recognized_periods: rows.length, journal_entry_ids: ids };
    });
  }

  function assessClassification(input) {
    const liability = Boolean(
      input.obligation_to_repurchase ||
      input.unconditional_redemption ||
      input.variable_share_obligation,
    );
    const conclusion = liability
      ? "liability"
      : input.redeemable_outside_issuer_control
        ? "temporary_equity"
        : "equity";
    const result = db
      .prepare(
        `INSERT INTO classification_assessments(instrument_key,as_of,instrument_type,obligation_to_repurchase,unconditional_redemption,variable_share_obligation,conclusion,policy_basis,approved_by) VALUES(?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        required(input.instrument_key, "instrument_key"),
        input.as_of,
        required(input.instrument_type, "instrument_type"),
        Number(Boolean(input.obligation_to_repurchase)),
        Number(Boolean(input.unconditional_redemption)),
        Number(Boolean(input.variable_share_obligation)),
        conclusion,
        required(input.policy_basis, "policy_basis"),
        currentActor(),
      );
    return db
      .prepare("SELECT * FROM classification_assessments WHERE id=?")
      .get(result.lastInsertRowid);
  }

  function recordBusinessCombination(input) {
    return atomic(() => {
      const consideration = Number(input.consideration_cents),
        nci = Number(input.nci_fair_value_cents || 0),
        prior = Number(input.previous_interest_fair_value_cents || 0),
        assets = Number(input.identifiable_assets_cents),
        liabilities = Number(input.liabilities_assumed_cents);
      const residual = consideration + nci + prior - (assets - liabilities);
      const goodwill = Math.max(0, residual),
        bargain = Math.max(0, -residual);
      const journal =
        input.post_entry === true
          ? post(input.acquisition_date, `Business combination — ${input.acquiree}`, "asc805", [
              { account_id: accountId("1510"), debit_cents: assets, credit_cents: 0 },
              ...(goodwill
                ? [{ account_id: accountId("1500"), debit_cents: goodwill, credit_cents: 0 }]
                : []),
              { account_id: accountId("2500"), debit_cents: 0, credit_cents: liabilities },
              { account_id: accountId("1000"), debit_cents: 0, credit_cents: consideration },
              ...(nci
                ? [{ account_id: accountId("3200"), debit_cents: 0, credit_cents: nci }]
                : []),
              ...(prior
                ? [{ account_id: accountId("3100"), debit_cents: 0, credit_cents: prior }]
                : []),
              ...(bargain
                ? [{ account_id: accountId("6300"), debit_cents: 0, credit_cents: bargain }]
                : []),
            ])
          : null;
      const result = db
        .prepare(
          `INSERT INTO business_combinations(acquisition_key,acquisition_date,acquiree,consideration_cents,nci_fair_value_cents,previous_interest_fair_value_cents,identifiable_assets_cents,liabilities_assumed_cents,goodwill_cents,bargain_gain_cents,measurement_basis_json,policy_basis,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.acquisition_key, "acquisition_key"),
          input.acquisition_date,
          required(input.acquiree, "acquiree"),
          consideration,
          nci,
          prior,
          assets,
          liabilities,
          goodwill,
          bargain,
          JSON.stringify(input.measurement_basis || {}),
          required(input.policy_basis, "policy_basis"),
          journal?.id || null,
        );
      return db
        .prepare("SELECT * FROM business_combinations WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function assessConsolidation(input) {
    const vie = Boolean(
      input.insufficient_equity ||
      input.lacks_power_characteristics ||
      input.nonsubstantive_voting_rights,
    );
    const primary = vie && Boolean(input.power) && Boolean(input.significant_economics);
    const voting = Number(input.voting_interest_percent || 0);
    const consolidate = primary || (!vie && voting > 0.5);
    const nci = consolidate
      ? Math.round(Math.max(0, 1 - Number(input.economic_interest_percent ?? voting)) * 1e9) / 1e9
      : 0;
    const result = db
      .prepare(
        `INSERT INTO consolidation_assessments(entity_key,as_of,entity_name,vie,power,significant_economics,primary_beneficiary,voting_interest_percent,consolidate,nci_percent,policy_basis,approved_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        required(input.entity_key, "entity_key"),
        input.as_of,
        required(input.entity_name, "entity_name"),
        Number(vie),
        Number(Boolean(input.power)),
        Number(Boolean(input.significant_economics)),
        Number(primary),
        voting,
        Number(consolidate),
        nci,
        required(input.policy_basis, "policy_basis"),
        currentActor(),
      );
    return db
      .prepare("SELECT * FROM consolidation_assessments WHERE id=?")
      .get(result.lastInsertRowid);
  }

  function calculateEps(input) {
    const weighted = positiveInt(input.weighted_average_shares, "weighted_average_shares");
    const numerator = Number(input.net_income_cents) - Number(input.preferred_dividends_cents || 0);
    let incremental = 0;
    for (const instrument of input.potential_common_shares || []) {
      if (instrument.kind === "options") {
        const averagePrice = Number(instrument.average_market_price_cents);
        if (averagePrice > Number(instrument.exercise_price_cents))
          incremental += Math.floor(
            (Number(instrument.shares) * (averagePrice - Number(instrument.exercise_price_cents))) /
              averagePrice,
          );
      } else if (instrument.kind === "restricted_stock") incremental += Number(instrument.shares);
    }
    const basic = numerator / 100 / weighted;
    const candidate = numerator / 100 / (weighted + incremental);
    const diluted = numerator >= 0 ? Math.min(basic, candidate) : basic;
    if (numerator < 0) incremental = 0;
    const result = db
      .prepare(
        `INSERT INTO eps_calculations(period_end,net_income_cents,preferred_dividends_cents,weighted_average_shares,dilutive_incremental_shares,basic_eps,diluted_eps,assumptions_json) VALUES(?,?,?,?,?,?,?,?)`,
      )
      .run(
        input.period_end,
        Number(input.net_income_cents),
        Number(input.preferred_dividends_cents || 0),
        weighted,
        incremental,
        basic,
        diluted,
        JSON.stringify(input.potential_common_shares || []),
      );
    return db.prepare("SELECT * FROM eps_calculations WHERE id=?").get(result.lastInsertRowid);
  }

  function recordOci(input) {
    return atomic(() => {
      const pretax = Number(input.pretax_cents),
        tax = Number(input.tax_cents || 0),
        reclassification = Number(input.reclassification_cents || 0),
        net = pretax - tax - reclassification;
      const journal = net
        ? post(
            input.period_end,
            `Other comprehensive income — ${input.description}`,
            "asc220",
            net > 0
              ? [
                  {
                    account_id: accountId(input.balance_sheet_account_code || "1350"),
                    debit_cents: net,
                    credit_cents: 0,
                  },
                  { account_id: accountId("3150"), debit_cents: 0, credit_cents: net },
                ]
              : [
                  { account_id: accountId("3150"), debit_cents: -net, credit_cents: 0 },
                  {
                    account_id: accountId(input.balance_sheet_account_code || "1350"),
                    debit_cents: 0,
                    credit_cents: -net,
                  },
                ],
          )
        : null;
      const result = db
        .prepare(
          `INSERT INTO oci_items(item_key,period_end,description,category,pretax_cents,tax_cents,net_cents,reclassification_cents,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.item_key, "item_key"),
          input.period_end,
          required(input.description, "description"),
          required(input.category, "category"),
          pretax,
          tax,
          net,
          reclassification,
          journal?.id || null,
        );
      return db.prepare("SELECT * FROM oci_items WHERE id=?").get(result.lastInsertRowid);
    });
  }

  function recordAssessment(input, journalEntryId = null) {
    const supported = [
      "ASC 606",
      "ASC 205",
      "ASC 210",
      "ASC 230",
      "ASC 275",
      "ASC 350",
      "ASC 360",
      "ASC 450",
      "ASC 460",
      "ASC 470",
      "ASC 480",
      "ASC 718",
      "ASC 740",
      "ASC 805",
      "ASC 810",
      "ASC 820",
      "ASC 842",
      "ASC 855",
    ];
    if (!supported.includes(input.topic)) throw problem("Unsupported assessment topic");
    const result = db
      .prepare(
        `INSERT INTO gaap_assessments(topic,assessment_key,as_of,facts_json,conclusion,policy_basis,disclosure_json,approved_by,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        input.topic,
        required(input.assessment_key, "assessment_key"),
        input.as_of,
        JSON.stringify(input.facts || {}),
        required(input.conclusion, "conclusion"),
        required(input.policy_basis, "policy_basis"),
        JSON.stringify(input.disclosure || {}),
        currentActor(),
        journalEntryId,
      );
    return db.prepare("SELECT * FROM gaap_assessments WHERE id=?").get(result.lastInsertRowid);
  }

  function assessImpairment(input) {
    return atomic(() => {
      let impaired, loss, conclusion;
      if (input.model === "long_lived_asset") {
        impaired = Number(input.undiscounted_cash_flows_cents) < Number(input.carrying_value_cents);
        loss = impaired
          ? Math.max(0, Number(input.carrying_value_cents) - Number(input.fair_value_cents))
          : 0;
        conclusion = impaired
          ? "Recoverability test failed; write down to fair value."
          : "Recoverability test passed; no impairment.";
      } else if (input.model === "goodwill") {
        loss = Math.min(
          Number(input.goodwill_carrying_cents),
          Math.max(
            0,
            Number(input.reporting_unit_carrying_cents) -
              Number(input.reporting_unit_fair_value_cents),
          ),
        );
        impaired = loss > 0;
        conclusion = impaired
          ? "Reporting-unit carrying amount exceeds fair value; goodwill impairment recognized."
          : "Reporting-unit fair value supports carrying amount; no impairment.";
      } else throw problem("model must be long_lived_asset or goodwill");
      const journal = loss
        ? post(
            input.as_of,
            `Impairment — ${input.assessment_key}`,
            input.model === "goodwill" ? "asc350" : "asc360",
            [
              { account_id: accountId("5610"), debit_cents: loss, credit_cents: 0 },
              {
                account_id: accountId(
                  input.asset_account_code || (input.model === "goodwill" ? "1500" : "1250"),
                ),
                debit_cents: 0,
                credit_cents: loss,
              },
            ],
          )
        : null;
      return recordAssessment(
        {
          topic: input.model === "goodwill" ? "ASC 350" : "ASC 360",
          assessment_key: input.assessment_key,
          as_of: input.as_of,
          facts: { ...input, impaired, impairment_loss_cents: loss },
          conclusion,
          policy_basis: required(input.policy_basis, "policy_basis"),
          disclosure: { impairment_loss_cents: loss },
        },
        journal?.id || null,
      );
    });
  }

  function assessGoingConcern(input) {
    const substantialDoubt = Boolean(input.conditions_raise_substantial_doubt);
    const alleviated =
      substantialDoubt &&
      Boolean(input.plans_probable_to_be_implemented) &&
      Boolean(input.plans_probable_to_mitigate);
    const conclusion = !substantialDoubt
      ? "No substantial doubt identified."
      : alleviated
        ? "Substantial doubt is alleviated by management plans."
        : "Substantial doubt is not alleviated.";
    return recordAssessment({
      topic: "ASC 205",
      assessment_key: input.assessment_key,
      as_of: input.as_of,
      facts: input,
      conclusion,
      policy_basis: required(input.policy_basis, "policy_basis"),
      disclosure: { required: substantialDoubt, substantial_doubt_alleviated: alleviated },
    });
  }

  function recordGuarantee(input) {
    return atomic(() => {
      const fairValue = positiveInt(input.fair_value_cents, "fair_value_cents");
      const journal = post(
        input.inception_date,
        `Guarantee liability — ${input.assessment_key}`,
        "asc460",
        [
          { account_id: accountId("5800"), debit_cents: fairValue, credit_cents: 0 },
          { account_id: accountId("2520"), debit_cents: 0, credit_cents: fairValue },
        ],
      );
      return recordAssessment(
        {
          topic: "ASC 460",
          assessment_key: input.assessment_key,
          as_of: input.inception_date,
          facts: input,
          conclusion: "Guarantee liability initially recognized at fair value.",
          policy_basis: required(input.policy_basis, "policy_basis"),
          disclosure: {
            maximum_exposure_cents: Number(input.maximum_exposure_cents || 0),
            term: input.term || null,
          },
        },
        journal.id,
      );
    });
  }

  function assessSubsequentEvent(input) {
    const recognized = Boolean(input.condition_existed_at_balance_sheet_date);
    const disclose = !recognized && Boolean(input.material);
    return recordAssessment({
      topic: "ASC 855",
      assessment_key: input.assessment_key,
      as_of: input.balance_sheet_date,
      facts: input,
      conclusion: recognized
        ? "Recognized subsequent event; adjust the financial statements."
        : disclose
          ? "Nonrecognized material subsequent event; disclose nature and estimated effect."
          : "Nonrecognized subsequent event; no material disclosure required.",
      policy_basis: required(input.policy_basis, "policy_basis"),
      disclosure: {
        required: disclose,
        event_date: input.event_date,
        estimated_effect_cents: input.estimated_effect_cents ?? null,
      },
    });
  }

  function gaapOverview(asOf) {
    const select = (table, dateColumn = null) =>
      db
        .prepare(
          `SELECT * FROM ${table}${dateColumn ? ` WHERE ${dateColumn}<=?` : ""} ORDER BY id DESC`,
        )
        .all(...(dateColumn ? [asOf] : []));
    return {
      as_of: asOf,
      policies: select("gaap_policy_elections", "effective_date"),
      leases: select("leases", "commencement_date"),
      stock_awards: select("stock_awards", "grant_date"),
      tax_provisions: select("tax_provisions", "period_end"),
      cecl: select("cecl_estimates", "as_of"),
      contingencies: select("contingencies", "as_of"),
      fair_value: select("fair_value_measurements", "as_of"),
      debt: select("debt_instruments", "issue_date"),
      classifications: select("classification_assessments", "as_of"),
      combinations: select("business_combinations", "acquisition_date"),
      consolidation_assessments: select("consolidation_assessments", "as_of"),
      eps: select("eps_calculations", "period_end"),
      oci: select("oci_items", "period_end"),
      assessments: select("gaap_assessments", "as_of"),
      disclosures: gaapDisclosures(asOf),
    };
  }

  function gaapDisclosures(asOf) {
    const leaseSchedules = db
      .prepare(
        `SELECT s.*,l.classification,l.annual_discount_rate,l.term_months,l.initial_liability_cents
         FROM lease_schedule s JOIN leases l ON l.id=s.lease_id WHERE s.payment_date>? AND l.commencement_date<=?`,
      )
      .all(asOf, asOf);
    const maturity = (rows, amount = (row) => row.payment_cents) =>
      Object.fromEntries(
        [...new Set(rows.map((row) => row.payment_date.slice(0, 4)))]
          .sort()
          .map((year) => [
            year,
            rows
              .filter((row) => row.payment_date.startsWith(year))
              .reduce((sum, row) => sum + amount(row), 0),
          ]),
      );
    const leases = db
      .prepare("SELECT * FROM leases WHERE commencement_date<=? ORDER BY commencement_date")
      .all(asOf);
    const stock = db
      .prepare(
        `SELECT a.*,COALESCE(SUM(CASE WHEN s.status='pending' THEN s.amount_cents ELSE 0 END),0) unrecognized_cents
         FROM stock_awards a LEFT JOIN stock_comp_schedule s ON s.award_id=a.id WHERE a.grant_date<=? GROUP BY a.id`,
      )
      .all(asOf);
    const latestCeclDate = db
      .prepare("SELECT MAX(as_of) value FROM cecl_estimates WHERE as_of<=?")
      .get(asOf).value;
    const latestTax = db
      .prepare("SELECT * FROM tax_provisions WHERE period_end<=? ORDER BY period_end DESC LIMIT 1")
      .get(asOf);
    const fairValue = db
      .prepare(
        `SELECT level,COUNT(*) measurements,SUM(fair_value_cents) fair_value_cents FROM fair_value_measurements
         WHERE as_of=(SELECT MAX(as_of) FROM fair_value_measurements WHERE as_of<=?) GROUP BY level ORDER BY level`,
      )
      .all(asOf);
    const debtRows = db
      .prepare(
        `SELECT s.* FROM debt_schedule s JOIN debt_instruments d ON d.id=s.debt_id WHERE s.payment_date>? AND d.issue_date<=?`,
      )
      .all(asOf, asOf);
    const oci = db
      .prepare(
        "SELECT category,SUM(pretax_cents) pretax_cents,SUM(tax_cents) tax_cents,SUM(net_cents) net_cents,SUM(reclassification_cents) reclassification_cents FROM oci_items WHERE period_end<=? GROUP BY category",
      )
      .all(asOf);
    return {
      as_of: asOf,
      asc606: {
        deferred_revenue_rollforward: ledger.deferredRollforward(asOf),
        remaining_performance_obligations: ledger.rpo(asOf),
        significant_judgments: db
          .prepare("SELECT * FROM gaap_assessments WHERE topic='ASC 606' AND as_of<=?")
          .all(asOf),
      },
      asc718: {
        awards: stock,
        unrecognized_compensation_cents: stock.reduce(
          (sum, row) => sum + row.unrecognized_cents,
          0,
        ),
      },
      asc740: latestTax || null,
      asc842: {
        leases,
        undiscounted_maturities: maturity(leaseSchedules),
        total_undiscounted_cents: leaseSchedules.reduce((sum, row) => sum + row.payment_cents, 0),
        weighted_average_discount_rate: leases.length
          ? leases.reduce(
              (sum, item) => sum + item.annual_discount_rate * item.initial_liability_cents,
              0,
            ) / leases.reduce((sum, item) => sum + item.initial_liability_cents, 0)
          : 0,
      },
      asc326: {
        measurement_date: latestCeclDate || null,
        pools: latestCeclDate
          ? db
              .prepare("SELECT * FROM cecl_estimates WHERE as_of=? ORDER BY pool_key")
              .all(latestCeclDate)
          : [],
      },
      asc450: db
        .prepare(
          "SELECT * FROM contingencies WHERE as_of<=? AND disclosure_required=1 ORDER BY as_of",
        )
        .all(asOf),
      asc470: {
        maturities: maturity(debtRows, (row) => row.principal_cents),
        future_interest_cents: debtRows.reduce((sum, row) => sum + row.cash_interest_cents, 0),
      },
      asc805: db.prepare("SELECT * FROM business_combinations WHERE acquisition_date<=?").all(asOf),
      asc810: db.prepare("SELECT * FROM consolidation_assessments WHERE as_of<=?").all(asOf),
      asc820: { hierarchy: fairValue },
      asc220: oci,
      policies: db.prepare("SELECT * FROM gaap_policy_elections WHERE effective_date<=?").all(asOf),
      other_judgments: db
        .prepare("SELECT * FROM gaap_assessments WHERE topic<>'ASC 606' AND as_of<=?")
        .all(asOf),
    };
  }

  return {
    setGaapPolicy: setPolicy,
    createLease,
    lease,
    leases: () => db.prepare("SELECT * FROM leases ORDER BY commencement_date DESC").all(),
    recognizeLeaseThrough,
    createStockAward,
    stockAward,
    stockAwards: () => db.prepare("SELECT * FROM stock_awards ORDER BY grant_date DESC").all(),
    recognizeStockCompThrough,
    remeasureStockAward,
    calculateTaxProvision,
    estimateCreditLosses,
    assessContingency,
    recordFairValue,
    createDebt,
    recognizeDebtThrough,
    assessClassification,
    recordBusinessCombination,
    assessConsolidation,
    calculateEps,
    recordOci,
    recordGaapAssessment: recordAssessment,
    assessImpairment,
    assessGoingConcern,
    recordGuarantee,
    assessSubsequentEvent,
    gaapOverview,
    gaapDisclosures,
    ociItems: (asOf, from = "0000-01-01") =>
      db
        .prepare("SELECT * FROM oci_items WHERE period_end BETWEEN ? AND ? ORDER BY period_end,id")
        .all(from, asOf),
  };
}

function problem(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
