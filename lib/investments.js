import { currentActor } from "./request-context.js";

const DEBT_MODELS = new Set(["trading", "available_for_sale", "held_to_maturity"]);
const EQUITY_MODELS = new Set([
  "equity_fair_value",
  "equity_measurement_alternative",
  "equity_method",
  "proportional_amortization",
]);
const ACCOUNT_BY_MODEL = {
  cash_equivalent: "1050",
  trading: "1600",
  available_for_sale: "1610",
  held_to_maturity: "1620",
  equity_fair_value: "1630",
  equity_measurement_alternative: "1630",
  equity_method: "1640",
  proportional_amortization: "1650",
  other: "1650",
};

const required = (value, name) => {
  if (value === undefined || value === null || value === "") throw problem(`${name} is required`);
  return value;
};
const cents = (value, name, { allowZero = true } = {}) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || (!allowZero && number === 0))
    throw problem(`${name} must be ${allowZero ? "a nonnegative" : "a positive"} integer`);
  return number;
};
const numberInRange = (value, name, low, high) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < low || number > high)
    throw problem(`${name} must be between ${low} and ${high}`);
  return number;
};
const asDate = (value) => new Date(`${value}T00:00:00Z`);
const addMonths = (value, count) => {
  const date = asDate(value);
  date.setUTCMonth(date.getUTCMonth() + count);
  return date.toISOString().slice(0, 10);
};

export function migrateInvestments(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_instruments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      security_type TEXT NOT NULL CHECK(security_type IN ('cash_equivalent','debt','equity','partnership','tax_credit','other')),
      accounting_model TEXT NOT NULL CHECK(accounting_model IN ('cash_equivalent','trading','available_for_sale','held_to_maturity','equity_fair_value','equity_measurement_alternative','equity_method','proportional_amortization','other')),
      currency TEXT NOT NULL DEFAULT 'USD',
      acquisition_date TEXT NOT NULL,
      maturity_date TEXT,
      original_maturity_days INTEGER,
      face_value_cents INTEGER NOT NULL DEFAULT 0,
      stated_rate REAL NOT NULL DEFAULT 0,
      effective_yield REAL NOT NULL DEFAULT 0,
      payment_frequency INTEGER NOT NULL DEFAULT 1,
      ownership_percent REAL NOT NULL DEFAULT 0,
      significant_influence INTEGER NOT NULL DEFAULT 0,
      readily_determinable_fair_value INTEGER NOT NULL DEFAULT 0,
      fair_value_level INTEGER CHECK(fair_value_level BETWEEN 1 AND 3),
      valuation_technique TEXT,
      policy_basis TEXT NOT NULL,
      classification_facts_json TEXT NOT NULL DEFAULT '{}',
      asset_account_code TEXT NOT NULL,
      amortized_cost_cents INTEGER NOT NULL DEFAULT 0,
      carrying_value_cents INTEGER NOT NULL DEFAULT 0,
      fair_value_cents INTEGER,
      accumulated_oci_cents INTEGER NOT NULL DEFAULT 0,
      accumulated_unrealized_earnings_cents INTEGER NOT NULL DEFAULT 0,
      credit_loss_allowance_cents INTEGER NOT NULL DEFAULT 0,
      total_units REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disposed','matured')),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS investment_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_id INTEGER NOT NULL REFERENCES investment_instruments(id),
      lot_number TEXT NOT NULL,
      trade_date TEXT NOT NULL,
      settlement_date TEXT NOT NULL,
      units REAL NOT NULL,
      remaining_units REAL NOT NULL,
      cost_basis_cents INTEGER NOT NULL,
      remaining_cost_basis_cents INTEGER NOT NULL,
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(instrument_id,lot_number)
    );
    CREATE TABLE IF NOT EXISTS investment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_id INTEGER NOT NULL REFERENCES investment_instruments(id),
      lot_id INTEGER REFERENCES investment_lots(id),
      transaction_type TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      units REAL NOT NULL DEFAULT 0,
      cash_cents INTEGER NOT NULL DEFAULT 0,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      realized_gain_loss_cents INTEGER NOT NULL DEFAULT 0,
      external_id TEXT,
      memo TEXT NOT NULL,
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(external_id)
    );
    CREATE TABLE IF NOT EXISTS investment_yield_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_id INTEGER NOT NULL REFERENCES investment_instruments(id),
      period INTEGER NOT NULL,
      payment_date TEXT NOT NULL,
      beginning_amortized_cost_cents INTEGER NOT NULL,
      cash_interest_cents INTEGER NOT NULL,
      effective_interest_cents INTEGER NOT NULL,
      premium_discount_amortization_cents INTEGER NOT NULL,
      principal_cents INTEGER NOT NULL DEFAULT 0,
      ending_amortized_cost_cents INTEGER NOT NULL,
      accrued_cash_interest_cents INTEGER NOT NULL DEFAULT 0,
      accrued_effective_interest_cents INTEGER NOT NULL DEFAULT 0,
      accrued_amortization_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','posted')),
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      UNIQUE(instrument_id,period)
    );
    CREATE TABLE IF NOT EXISTS investment_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_id INTEGER NOT NULL REFERENCES investment_instruments(id),
      as_of TEXT NOT NULL,
      measurement_type TEXT NOT NULL,
      amortized_cost_cents INTEGER NOT NULL,
      carrying_value_before_cents INTEGER NOT NULL,
      fair_value_cents INTEGER NOT NULL,
      earnings_cents INTEGER NOT NULL DEFAULT 0,
      oci_cents INTEGER NOT NULL DEFAULT 0,
      impairment_cents INTEGER NOT NULL DEFAULT 0,
      level INTEGER CHECK(level BETWEEN 1 AND 3),
      valuation_technique TEXT NOT NULL,
      inputs_json TEXT NOT NULL,
      policy_basis TEXT NOT NULL,
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(instrument_id,as_of,measurement_type)
    );
    CREATE TABLE IF NOT EXISTS investment_credit_losses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_id INTEGER NOT NULL REFERENCES investment_instruments(id),
      as_of TEXT NOT NULL,
      amortized_cost_cents INTEGER NOT NULL,
      fair_value_cents INTEGER NOT NULL,
      expected_loss_cents INTEGER NOT NULL,
      allowance_before_cents INTEGER NOT NULL,
      allowance_after_cents INTEGER NOT NULL,
      intent_to_sell INTEGER NOT NULL DEFAULT 0,
      required_to_sell INTEGER NOT NULL DEFAULT 0,
      method TEXT NOT NULL,
      assumptions_json TEXT NOT NULL,
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      UNIQUE(instrument_id,as_of)
    );
    CREATE TABLE IF NOT EXISTS equity_method_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_id INTEGER NOT NULL REFERENCES investment_instruments(id),
      period_end TEXT NOT NULL,
      investee_income_cents INTEGER NOT NULL,
      ownership_percent REAL NOT NULL,
      investor_share_cents INTEGER NOT NULL,
      basis_difference_amortization_cents INTEGER NOT NULL DEFAULT 0,
      dividends_cents INTEGER NOT NULL DEFAULT 0,
      dividend_return_of_capital_cents INTEGER NOT NULL DEFAULT 0,
      other_adjustments_cents INTEGER NOT NULL DEFAULT 0,
      carrying_value_before_cents INTEGER NOT NULL,
      carrying_value_after_cents INTEGER NOT NULL,
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      policy_basis TEXT NOT NULL,
      UNIQUE(instrument_id,period_end)
    );
    CREATE TABLE IF NOT EXISTS proportional_amortization_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_id INTEGER NOT NULL REFERENCES investment_instruments(id),
      period_end TEXT NOT NULL,
      investment_amortization_cents INTEGER NOT NULL,
      tax_credits_cents INTEGER NOT NULL,
      other_tax_benefits_cents INTEGER NOT NULL,
      net_tax_expense_benefit_cents INTEGER NOT NULL,
      carrying_value_before_cents INTEGER NOT NULL,
      carrying_value_after_cents INTEGER NOT NULL,
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
      policy_basis TEXT NOT NULL,
      UNIQUE(instrument_id,period_end)
    );
    CREATE TABLE IF NOT EXISTS investment_model_transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_id INTEGER NOT NULL REFERENCES investment_instruments(id),
      transition_date TEXT NOT NULL,
      old_model TEXT NOT NULL,
      new_model TEXT NOT NULL,
      carrying_value_before_cents INTEGER NOT NULL,
      transition_basis_cents INTEGER NOT NULL,
      earnings_adjustment_cents INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL,
      policy_basis TEXT NOT NULL,
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      created_by TEXT NOT NULL,
      UNIQUE(instrument_id,transition_date)
    );
    CREATE INDEX IF NOT EXISTS idx_investment_transactions_date ON investment_transactions(transaction_date,instrument_id);
    CREATE INDEX IF NOT EXISTS idx_investment_yield_due ON investment_yield_schedule(payment_date,status);
    INSERT OR IGNORE INTO schema_migrations(version,name) VALUES(110,'investment subledger and ASC 305 320 321 323 325 326 820 engine');
  `);
}

export function createInvestmentsRepository(db, ledger) {
  const accountIds = new Map(ledger.getAccounts().map((account) => [account.code, account.id]));
  const accountId = (code) => {
    const id = accountIds.get(code);
    if (!id) throw problem(`Account ${code} is not configured`, 500);
    return id;
  };
  const line = (code, amount, debit, description) => ({
    account_id: accountId(code),
    debit_cents: debit ? amount : 0,
    credit_cents: debit ? 0 : amount,
    description,
  });
  const signedLine = (code, amount, debitWhenPositive, description) => {
    if (!amount) return null;
    return line(
      code,
      Math.abs(amount),
      amount > 0 ? debitWhenPositive : !debitWhenPositive,
      description,
    );
  };
  function post(date, memo, lines) {
    const valid = lines.filter(Boolean).filter((item) => item.debit_cents || item.credit_cents);
    const draft = ledger.createDraft(
      { date, memo, source: "investments", lines: valid },
      currentActor(),
    );
    return ledger.postJournal(draft.id, currentActor());
  }
  const instrument = (id) => {
    const row = db.prepare("SELECT * FROM investment_instruments WHERE id=?").get(Number(id));
    if (!row) throw problem("Investment instrument not found", 404);
    return row;
  };
  const transaction = (work) => {
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
  };

  function validateClassification(input) {
    const securityType = required(input.security_type, "security_type");
    const model = required(input.accounting_model, "accounting_model");
    if (securityType === "debt" && !DEBT_MODELS.has(model))
      throw problem("Debt securities must use trading, available_for_sale, or held_to_maturity");
    if (["equity", "partnership", "tax_credit"].includes(securityType) && !EQUITY_MODELS.has(model))
      throw problem("Ownership interests must use an applicable equity accounting model");
    if (model === "equity_measurement_alternative" && input.readily_determinable_fair_value)
      throw problem(
        "The Topic 321 measurement alternative is unavailable when fair value is readily determinable",
      );
    if (
      model === "equity_method" &&
      !input.significant_influence &&
      !input.partnership_equity_method_presumption
    )
      throw problem(
        "Equity-method classification requires significant influence or a documented current-GAAP partnership scope basis",
      );
    if (model === "held_to_maturity" && !input.positive_intent_and_ability_to_hold)
      throw problem(
        "Held-to-maturity classification requires positive intent and ability to hold to maturity",
      );
    if (securityType === "cash_equivalent") {
      if (model !== "cash_equivalent")
        throw problem("Cash equivalents must use the cash_equivalent model");
      if (Number(input.original_maturity_days) > 90)
        throw problem("A cash equivalent must have an original maturity of three months or less");
      if (!input.readily_convertible_to_known_cash || !input.insignificant_value_change_risk)
        throw problem(
          "Cash-equivalent classification requires ready convertibility and insignificant value-change risk",
        );
    }
    if (model === "proportional_amortization") {
      if (securityType !== "tax_credit")
        throw problem("Proportional amortization is limited to qualifying tax-credit investments");
      const qualifying =
        input.tax_credits_probable &&
        !input.significant_influence &&
        input.substantially_all_benefits_are_tax &&
        input.projected_yield_positive &&
        input.limited_liability_and_capital_at_risk &&
        input.proportional_amortization_elected;
      if (!qualifying)
        throw problem(
          "Proportional amortization requires all Topic 323-740 qualification conditions and an elected tax-credit program",
        );
    }
    return { securityType, model };
  }

  function createInvestment(input) {
    const { securityType, model } = validateClassification(input);
    const ownership = numberInRange(input.ownership_percent || 0, "ownership_percent", 0, 100);
    const statedRate = numberInRange(input.stated_rate || 0, "stated_rate", 0, 1);
    const effectiveYield = numberInRange(input.effective_yield || 0, "effective_yield", 0, 1);
    const frequency = Number(input.payment_frequency || 1);
    if (!Number.isInteger(frequency) || frequency < 1 || 12 % frequency !== 0)
      throw problem("payment_frequency must be a positive divisor of 12");
    const result = db
      .prepare(
        `INSERT INTO investment_instruments(
        instrument_number,name,issuer,security_type,accounting_model,currency,acquisition_date,maturity_date,
        original_maturity_days,face_value_cents,stated_rate,effective_yield,payment_frequency,ownership_percent,
        significant_influence,readily_determinable_fair_value,fair_value_level,valuation_technique,policy_basis,
        classification_facts_json,asset_account_code,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        required(input.instrument_number, "instrument_number"),
        required(input.name, "name"),
        required(input.issuer, "issuer"),
        securityType,
        model,
        input.currency || "USD",
        required(input.acquisition_date, "acquisition_date"),
        input.maturity_date || null,
        input.original_maturity_days ?? null,
        cents(input.face_value_cents || 0, "face_value_cents"),
        statedRate,
        effectiveYield,
        frequency,
        ownership,
        input.significant_influence ? 1 : 0,
        input.readily_determinable_fair_value ? 1 : 0,
        input.fair_value_level || null,
        input.valuation_technique || null,
        required(input.policy_basis, "policy_basis"),
        JSON.stringify(
          input.classification_facts || {
            positive_intent_and_ability_to_hold: Boolean(input.positive_intent_and_ability_to_hold),
            partnership_equity_method_presumption: Boolean(
              input.partnership_equity_method_presumption,
            ),
            readily_convertible_to_known_cash: Boolean(input.readily_convertible_to_known_cash),
            insignificant_value_change_risk: Boolean(input.insignificant_value_change_risk),
            tax_credits_probable: Boolean(input.tax_credits_probable),
            substantially_all_benefits_are_tax: Boolean(input.substantially_all_benefits_are_tax),
            projected_yield_positive: Boolean(input.projected_yield_positive),
            limited_liability_and_capital_at_risk: Boolean(
              input.limited_liability_and_capital_at_risk,
            ),
            proportional_amortization_elected: Boolean(input.proportional_amortization_elected),
          },
        ),
        ACCOUNT_BY_MODEL[model],
        currentActor(),
      );
    return instrument(result.lastInsertRowid);
  }

  function buildYieldSchedule(instrumentId, beginningCost) {
    const item = instrument(instrumentId);
    if (!DEBT_MODELS.has(item.accounting_model) || !item.maturity_date) return [];
    const months = Math.max(
      1,
      (asDate(item.maturity_date).getUTCFullYear() -
        asDate(item.acquisition_date).getUTCFullYear()) *
        12 +
        asDate(item.maturity_date).getUTCMonth() -
        asDate(item.acquisition_date).getUTCMonth(),
    );
    const periods = Math.max(1, Math.ceil((months * item.payment_frequency) / 12));
    const monthsPerPeriod = 12 / item.payment_frequency;
    let carrying = beginningCost;
    const insert = db.prepare(`INSERT INTO investment_yield_schedule(
      instrument_id,period,payment_date,beginning_amortized_cost_cents,cash_interest_cents,
      effective_interest_cents,premium_discount_amortization_cents,principal_cents,ending_amortized_cost_cents)
      VALUES(?,?,?,?,?,?,?,?,?)`);
    const rows = [];
    for (let period = 1; period <= periods; period += 1) {
      const cashInterest = Math.round(
        (item.face_value_cents * item.stated_rate) / item.payment_frequency,
      );
      let effectiveInterest = Math.round(
        (carrying * item.effective_yield) / item.payment_frequency,
      );
      let amortization = effectiveInterest - cashInterest;
      let ending = carrying + amortization;
      if (period === periods) {
        ending = item.face_value_cents;
        amortization = ending - carrying;
        effectiveInterest = cashInterest + amortization;
      }
      const paymentDate =
        period === periods
          ? item.maturity_date
          : addMonths(item.acquisition_date, period * monthsPerPeriod);
      const principal = period === periods ? item.face_value_cents : 0;
      insert.run(
        item.id,
        period,
        paymentDate,
        carrying,
        cashInterest,
        effectiveInterest,
        amortization,
        principal,
        ending,
      );
      rows.push({
        period,
        payment_date: paymentDate,
        cash_interest_cents: cashInterest,
        effective_interest_cents: effectiveInterest,
        premium_discount_amortization_cents: amortization,
        principal_cents: principal,
        ending_amortized_cost_cents: ending,
      });
      carrying = ending;
    }
    return rows;
  }

  function purchaseInvestment(input) {
    return transaction(() => {
      const item = instrument(required(input.instrument_id, "instrument_id"));
      if (item.status !== "active") throw problem("Only active investments can be purchased");
      const units = Number(required(input.units, "units"));
      if (!Number.isFinite(units) || units <= 0) throw problem("units must be positive");
      const price = cents(input.purchase_price_cents, "purchase_price_cents", { allowZero: false });
      const fees = cents(input.transaction_cost_cents || 0, "transaction_cost_cents");
      const capitalizeFees = !["trading", "equity_fair_value"].includes(item.accounting_model);
      const basis = price + (capitalizeFees ? fees : 0);
      const cash = price + fees;
      const journal = post(
        input.settlement_date || input.trade_date,
        `Purchase ${item.instrument_number}: ${item.name}`,
        [
          line(item.asset_account_code, basis, true, "Investment acquisition"),
          fees && !capitalizeFees
            ? line("5900", fees, true, "Expensed investment transaction costs")
            : null,
          line("1000", cash, false, "Cash paid"),
        ],
      );
      const lotResult = db
        .prepare(
          `INSERT INTO investment_lots(
        instrument_id,lot_number,trade_date,settlement_date,units,remaining_units,cost_basis_cents,
        remaining_cost_basis_cents,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.lot_number || `${item.instrument_number}-${Date.now()}`,
          required(input.trade_date, "trade_date"),
          input.settlement_date || input.trade_date,
          units,
          units,
          basis,
          basis,
          journal.id,
        );
      db.prepare(
        `UPDATE investment_instruments SET amortized_cost_cents=amortized_cost_cents+?,
        carrying_value_cents=carrying_value_cents+?,total_units=total_units+? WHERE id=?`,
      ).run(basis, basis, units, item.id);
      const transactionResult = db
        .prepare(
          `INSERT INTO investment_transactions(
        instrument_id,lot_id,transaction_type,transaction_date,units,cash_cents,amount_cents,external_id,memo,
        journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          lotResult.lastInsertRowid,
          "purchase",
          input.trade_date,
          units,
          cash,
          basis,
          input.external_id || null,
          input.memo || "Investment purchase",
          journal.id,
          currentActor(),
        );
      if (DEBT_MODELS.has(item.accounting_model)) {
        const existing = db
          .prepare("SELECT COUNT(*) count FROM investment_yield_schedule WHERE instrument_id=?")
          .get(item.id).count;
        if (!existing) buildYieldSchedule(item.id, basis);
      }
      return {
        transaction: db
          .prepare("SELECT * FROM investment_transactions WHERE id=?")
          .get(transactionResult.lastInsertRowid),
        instrument: instrument(item.id),
        yield_schedule: investmentYieldSchedule(item.id),
      };
    });
  }

  function recognizeInvestmentYieldThrough(asOf) {
    return transaction(() => {
      const due = db
        .prepare(
          `SELECT s.*,i.instrument_number,i.name,i.asset_account_code,i.accounting_model,
        i.accumulated_oci_cents,i.accumulated_unrealized_earnings_cents,i.credit_loss_allowance_cents
        FROM investment_yield_schedule s JOIN investment_instruments i ON i.id=s.instrument_id
        WHERE s.status='pending' AND s.payment_date<=? ORDER BY s.payment_date,s.id`,
        )
        .all(asOf);
      const posted = [];
      for (const row of due) {
        const remainingEffectiveInterest =
          row.effective_interest_cents - row.accrued_effective_interest_cents;
        const remainingAmortization =
          row.premium_discount_amortization_cents - row.accrued_amortization_cents;
        const journal = post(row.payment_date, `Effective-yield income: ${row.instrument_number}`, [
          row.cash_interest_cents
            ? line("1000", row.cash_interest_cents, true, "Cash interest received")
            : null,
          row.accrued_cash_interest_cents
            ? line(
                "1680",
                row.accrued_cash_interest_cents,
                false,
                "Clear accrued investment interest receivable",
              )
            : null,
          signedLine(
            row.asset_account_code,
            remainingAmortization,
            true,
            "Discount accretion / premium amortization",
          ),
          remainingEffectiveInterest
            ? line("4200", remainingEffectiveInterest, false, "Remaining effective interest income")
            : null,
          row.principal_cents
            ? signedLine(
                row.asset_account_code,
                -row.accumulated_oci_cents,
                true,
                "AFS adjustment to par at maturity",
              )
            : null,
          row.principal_cents && row.accounting_model === "trading"
            ? signedLine(
                row.asset_account_code,
                -row.accumulated_unrealized_earnings_cents,
                true,
                "Trading security adjustment to par at maturity",
              )
            : null,
          row.principal_cents && row.accounting_model === "trading"
            ? signedLine(
                "4230",
                -row.accumulated_unrealized_earnings_cents,
                false,
                "Final trading fair-value change at maturity",
              )
            : null,
          row.principal_cents
            ? signedLine(
                "3150",
                -row.accumulated_oci_cents,
                false,
                "Remove matured AFS amount from AOCI",
              )
            : null,
          row.principal_cents && row.credit_loss_allowance_cents
            ? line(
                "1660",
                row.credit_loss_allowance_cents,
                true,
                "Release credit-loss allowance at collection",
              )
            : null,
          row.principal_cents && row.credit_loss_allowance_cents
            ? line(
                "5360",
                row.credit_loss_allowance_cents,
                false,
                "Credit-loss recovery at collection",
              )
            : null,
          row.principal_cents
            ? line("1000", row.principal_cents, true, "Principal received")
            : null,
          row.principal_cents
            ? line(row.asset_account_code, row.principal_cents, false, "Debt security maturity")
            : null,
        ]);
        const newCost = row.principal_cents ? 0 : row.ending_amortized_cost_cents;
        db.prepare(
          "UPDATE investment_yield_schedule SET status='posted',journal_entry_id=? WHERE id=?",
        ).run(journal.id, row.id);
        db.prepare(
          `UPDATE investment_instruments SET amortized_cost_cents=?,
          carrying_value_cents=CASE WHEN ?>0 THEN 0 ELSE carrying_value_cents+? END,
          accumulated_oci_cents=CASE WHEN ?>0 THEN 0 ELSE accumulated_oci_cents END,
          accumulated_unrealized_earnings_cents=CASE WHEN ?>0 THEN 0 ELSE accumulated_unrealized_earnings_cents END,
          credit_loss_allowance_cents=CASE WHEN ?>0 THEN 0 ELSE credit_loss_allowance_cents END,
          fair_value_cents=CASE WHEN ?>0 THEN 0 ELSE fair_value_cents END,
          total_units=CASE WHEN ?>0 THEN 0 ELSE total_units END,
          status=CASE WHEN ?>0 THEN 'matured' ELSE status END WHERE id=?`,
        ).run(
          newCost,
          row.principal_cents,
          remainingAmortization,
          row.principal_cents,
          row.principal_cents,
          row.principal_cents,
          row.principal_cents,
          row.principal_cents,
          row.principal_cents,
          row.instrument_id,
        );
        if (row.principal_cents)
          db.prepare(
            "UPDATE investment_lots SET remaining_units=0,remaining_cost_basis_cents=0,status='closed' WHERE instrument_id=? AND status='open'",
          ).run(row.instrument_id);
        if (row.principal_cents && row.accumulated_oci_cents)
          db.prepare(
            `INSERT INTO oci_items(item_key,period_end,description,category,pretax_cents,tax_cents,net_cents,reclassification_cents,journal_entry_id)
            VALUES(?,?,?,?,?,?,?,?,?)`,
          ).run(
            `investment-${row.instrument_id}-maturity-${row.id}`,
            row.payment_date,
            `AFS adjustment at maturity — ${row.instrument_number}`,
            "available_for_sale_debt",
            -row.accumulated_oci_cents,
            0,
            -row.accumulated_oci_cents,
            0,
            journal.id,
          );
        db.prepare(
          `INSERT INTO investment_transactions(instrument_id,transaction_type,transaction_date,cash_cents,amount_cents,memo,journal_entry_id,created_by)
          VALUES(?,?,?,?,?,?,?,?)`,
        ).run(
          row.instrument_id,
          row.principal_cents ? "maturity" : "interest",
          row.payment_date,
          row.cash_interest_cents + row.principal_cents,
          remainingEffectiveInterest,
          "Effective-yield recognition",
          journal.id,
          currentActor(),
        );
        posted.push({ ...row, journal_entry_id: journal.id });
      }
      return posted;
    });
  }

  function accrueInvestmentInterest(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      if (!DEBT_MODELS.has(item.accounting_model))
        throw problem("Effective-yield accruals apply only to debt securities");
      const schedule = db
        .prepare(
          `SELECT * FROM investment_yield_schedule WHERE instrument_id=? AND status='pending' AND payment_date>=?
          ORDER BY payment_date,period LIMIT 1`,
        )
        .get(item.id, input.as_of);
      if (!schedule) throw problem("No pending yield period covers this accrual date");
      const cashInterest = cents(input.cash_interest_cents, "cash_interest_cents");
      const effectiveInterest = cents(input.effective_interest_cents, "effective_interest_cents", {
        allowZero: false,
      });
      const amortization = effectiveInterest - cashInterest;
      if (
        schedule.accrued_cash_interest_cents + cashInterest > schedule.cash_interest_cents ||
        schedule.accrued_effective_interest_cents + effectiveInterest >
          schedule.effective_interest_cents
      )
        throw problem("Accrual exceeds the remaining scheduled interest for this payment period");
      const journal = post(input.as_of, `Accrued investment interest: ${item.instrument_number}`, [
        cashInterest
          ? line("1680", cashInterest, true, "Accrued contractual interest receivable")
          : null,
        signedLine(
          item.asset_account_code,
          amortization,
          true,
          "Accrued discount accretion / premium amortization",
        ),
        line("4200", effectiveInterest, false, "Accrued effective interest income"),
      ]);
      db.prepare(
        `UPDATE investment_yield_schedule SET
        accrued_cash_interest_cents=accrued_cash_interest_cents+?,
        accrued_effective_interest_cents=accrued_effective_interest_cents+?,
        accrued_amortization_cents=accrued_amortization_cents+? WHERE id=?`,
      ).run(cashInterest, effectiveInterest, amortization, schedule.id);
      db.prepare(
        `UPDATE investment_instruments SET amortized_cost_cents=amortized_cost_cents+?,
        carrying_value_cents=carrying_value_cents+? WHERE id=?`,
      ).run(amortization, amortization, item.id);
      const result = db
        .prepare(
          `INSERT INTO investment_transactions(instrument_id,transaction_type,transaction_date,
        cash_cents,amount_cents,memo,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          "interest_accrual",
          input.as_of,
          0,
          effectiveInterest,
          input.memo || "Reporting-date effective-yield accrual",
          journal.id,
          currentActor(),
        );
      return db
        .prepare("SELECT * FROM investment_transactions WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function recordInvestmentIncome(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      const amount = cents(input.amount_cents, "amount_cents", { allowZero: false });
      const type = required(input.income_type, "income_type");
      if (!new Set(["interest", "dividend", "distribution", "return_of_capital"]).has(type))
        throw problem("Unsupported investment income type");
      const reducesInvestment =
        type === "return_of_capital" ||
        (type === "distribution" && item.accounting_model === "equity_method");
      const incomeCode = type === "interest" ? "4200" : "4210";
      const journal = post(input.date, `${type} from ${item.instrument_number}`, [
        line("1000", amount, true, "Cash received"),
        line(
          reducesInvestment ? item.asset_account_code : incomeCode,
          amount,
          false,
          reducesInvestment ? "Reduction of investment basis" : "Investment income",
        ),
      ]);
      if (reducesInvestment)
        db.prepare(
          "UPDATE investment_instruments SET amortized_cost_cents=amortized_cost_cents-?,carrying_value_cents=carrying_value_cents-? WHERE id=?",
        ).run(amount, amount, item.id);
      const result = db
        .prepare(
          `INSERT INTO investment_transactions(instrument_id,transaction_type,transaction_date,cash_cents,amount_cents,memo,journal_entry_id,created_by)
        VALUES(?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          type,
          input.date,
          amount,
          amount,
          input.memo || `${type} received`,
          journal.id,
          currentActor(),
        );
      return db
        .prepare("SELECT * FROM investment_transactions WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function measureInvestment(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      const fairValue = cents(input.fair_value_cents, "fair_value_cents");
      const level = Number(input.level || item.fair_value_level);
      if (![1, 2, 3].includes(level)) throw problem("level must be 1, 2, or 3");
      let earnings = 0;
      let oci = 0;
      let impairment = 0;
      let newCarrying = item.carrying_value_cents;
      let journal = null;
      const delta = fairValue - item.carrying_value_cents;
      if (["trading", "equity_fair_value"].includes(item.accounting_model)) {
        earnings = delta;
        newCarrying = fairValue;
      } else if (item.accounting_model === "available_for_sale") {
        newCarrying = fairValue + item.credit_loss_allowance_cents;
        oci = newCarrying - item.carrying_value_cents;
      } else if (item.accounting_model === "equity_measurement_alternative") {
        if (!input.observable_price_change && !input.impairment_indicator)
          throw problem(
            "Measurement-alternative remeasurement requires an observable price change or impairment indicator",
          );
        if (input.impairment_indicator && fairValue >= item.carrying_value_cents)
          throw problem("An impairment measurement must reduce the carrying value");
        earnings = delta;
        impairment = input.impairment_indicator && delta < 0 ? -delta : 0;
        newCarrying = fairValue;
      }
      if (earnings || oci) {
        const counter = oci ? "3150" : "4230";
        journal = post(input.as_of, `Investment remeasurement: ${item.instrument_number}`, [
          signedLine(item.asset_account_code, earnings || oci, true, "Fair value adjustment"),
          signedLine(
            counter,
            earnings || oci,
            false,
            oci ? "AFS unrealized gain/loss in OCI" : "Unrealized investment gain/loss",
          ),
        ]);
      }
      const result = db
        .prepare(
          `INSERT INTO investment_measurements(instrument_id,as_of,measurement_type,
        amortized_cost_cents,carrying_value_before_cents,fair_value_cents,earnings_cents,oci_cents,impairment_cents,
        level,valuation_technique,inputs_json,policy_basis,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.as_of,
          input.measurement_type || "recurring",
          item.amortized_cost_cents,
          item.carrying_value_cents,
          fairValue,
          earnings,
          oci,
          impairment,
          level,
          required(input.valuation_technique, "valuation_technique"),
          JSON.stringify(input.inputs || {}),
          required(input.policy_basis, "policy_basis"),
          journal?.id || null,
        );
      if (oci)
        db.prepare(
          `INSERT INTO oci_items(item_key,period_end,description,category,pretax_cents,tax_cents,net_cents,reclassification_cents,journal_entry_id)
          VALUES(?,?,?,?,?,?,?,?,?)`,
        ).run(
          `investment-${item.id}-measurement-${result.lastInsertRowid}`,
          input.as_of,
          `AFS fair-value change — ${item.instrument_number}`,
          "available_for_sale_debt",
          oci,
          0,
          oci,
          0,
          journal?.id || null,
        );
      db.prepare(
        `UPDATE investment_instruments SET carrying_value_cents=?,fair_value_cents=?,
        accumulated_oci_cents=accumulated_oci_cents+?,
        accumulated_unrealized_earnings_cents=accumulated_unrealized_earnings_cents+?,
        fair_value_level=?,valuation_technique=? WHERE id=?`,
      ).run(newCarrying, fairValue, oci, earnings, level, input.valuation_technique, item.id);
      return db
        .prepare("SELECT * FROM investment_measurements WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function sellInvestment(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      const units = Number(required(input.units, "units"));
      if (!Number.isFinite(units) || units <= 0 || units > item.total_units)
        throw problem("Sale units exceed the open position");
      const proceeds = cents(input.proceeds_cents, "proceeds_cents");
      let remaining = units;
      let costBasis = 0;
      const lots = input.lot_ids?.length
        ? input.lot_ids.map((id) =>
            db
              .prepare("SELECT * FROM investment_lots WHERE id=? AND instrument_id=?")
              .get(id, item.id),
          )
        : db
            .prepare(
              "SELECT * FROM investment_lots WHERE instrument_id=? AND status='open' ORDER BY trade_date,id",
            )
            .all(item.id);
      if (lots.some((lot) => !lot)) throw problem("A selected lot was not found");
      for (const lot of lots) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, lot.remaining_units);
        const allocated =
          take === lot.remaining_units
            ? lot.remaining_cost_basis_cents
            : Math.round((lot.remaining_cost_basis_cents * take) / lot.remaining_units);
        costBasis += allocated;
        remaining -= take;
        const unitsLeft = lot.remaining_units - take;
        db.prepare(
          "UPDATE investment_lots SET remaining_units=?,remaining_cost_basis_cents=?,status=? WHERE id=?",
        ).run(
          unitsLeft,
          lot.remaining_cost_basis_cents - allocated,
          unitsLeft <= 1e-9 ? "closed" : "open",
          lot.id,
        );
      }
      if (remaining > 1e-9) throw problem("Selected lots do not cover the requested sale units");
      const proportion = units / item.total_units;
      const carryingRemoved =
        units === item.total_units
          ? item.carrying_value_cents
          : Math.round(item.carrying_value_cents * proportion);
      const amortizedRemoved =
        units === item.total_units
          ? item.amortized_cost_cents
          : Math.round(item.amortized_cost_cents * proportion);
      const ociRemoved =
        item.accounting_model === "available_for_sale"
          ? units === item.total_units
            ? item.accumulated_oci_cents
            : Math.round(item.accumulated_oci_cents * proportion)
          : 0;
      const allowanceRemoved =
        units === item.total_units
          ? item.credit_loss_allowance_cents
          : Math.round(item.credit_loss_allowance_cents * proportion);
      const unrealizedRemoved = [
        "trading",
        "equity_fair_value",
        "equity_measurement_alternative",
      ].includes(item.accounting_model)
        ? units === item.total_units
          ? item.accumulated_unrealized_earnings_cents
          : Math.round(item.accumulated_unrealized_earnings_cents * proportion)
        : 0;
      const realizedBasis = ["available_for_sale", "held_to_maturity"].includes(
        item.accounting_model,
      )
        ? amortizedRemoved - allowanceRemoved
        : carryingRemoved;
      const disposalGainLoss = proceeds - realizedBasis;
      const realized = disposalGainLoss + unrealizedRemoved;
      const journal = post(input.trade_date, `Sale ${item.instrument_number}: ${item.name}`, [
        line("1000", proceeds, true, "Investment sale proceeds"),
        allowanceRemoved
          ? line("1660", allowanceRemoved, true, "Remove investment credit-loss allowance")
          : null,
        line(item.asset_account_code, carryingRemoved, false, "Investment carrying value disposed"),
        signedLine("3150", ociRemoved, true, "Reclassification from AOCI"),
        signedLine("4220", disposalGainLoss, false, "Disposal gain/loss since last measurement"),
        signedLine("4230", unrealizedRemoved, true, "Reclassify cumulative unrealized result"),
        signedLine("4220", unrealizedRemoved, false, "Reclassify to realized investment result"),
      ]);
      if (ociRemoved)
        db.prepare(
          `INSERT INTO oci_items(item_key,period_end,description,category,pretax_cents,tax_cents,net_cents,reclassification_cents,journal_entry_id)
          VALUES(?,?,?,?,?,?,?,?,?)`,
        ).run(
          `investment-${item.id}-sale-${journal.id}`,
          input.trade_date,
          `AFS reclassification on sale — ${item.instrument_number}`,
          "available_for_sale_debt",
          0,
          0,
          -ociRemoved,
          ociRemoved,
          journal.id,
        );
      db.prepare(
        `UPDATE investment_instruments SET total_units=total_units-?,amortized_cost_cents=amortized_cost_cents-?,
        carrying_value_cents=carrying_value_cents-?,accumulated_oci_cents=accumulated_oci_cents-?,
        accumulated_unrealized_earnings_cents=accumulated_unrealized_earnings_cents-?,credit_loss_allowance_cents=credit_loss_allowance_cents-?,
        status=CASE WHEN total_units-?<=0.000000001 THEN 'disposed' ELSE status END WHERE id=?`,
      ).run(
        units,
        amortizedRemoved,
        carryingRemoved,
        ociRemoved,
        unrealizedRemoved,
        allowanceRemoved,
        units,
        item.id,
      );
      const result = db
        .prepare(
          `INSERT INTO investment_transactions(instrument_id,transaction_type,transaction_date,units,cash_cents,
        amount_cents,realized_gain_loss_cents,external_id,memo,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          "sale",
          input.trade_date,
          units,
          proceeds,
          costBasis,
          realized,
          input.external_id || null,
          input.memo || "Investment sale",
          journal.id,
          currentActor(),
        );
      return db
        .prepare("SELECT * FROM investment_transactions WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function recordEquityMethodPeriod(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      if (item.accounting_model !== "equity_method")
        throw problem("Instrument does not use the equity method");
      const investeeIncome = Number(required(input.investee_income_cents, "investee_income_cents"));
      if (!Number.isInteger(investeeIncome))
        throw problem("investee_income_cents must be an integer");
      const ownership =
        input.ownership_percent === undefined
          ? item.ownership_percent
          : numberInRange(input.ownership_percent, "ownership_percent", 0, 100);
      const share = Math.round((investeeIncome * ownership) / 100);
      const basisAmortization = cents(
        input.basis_difference_amortization_cents || 0,
        "basis_difference_amortization_cents",
      );
      const dividends = cents(input.dividends_cents || 0, "dividends_cents");
      const returnOfCapital = cents(
        input.dividend_return_of_capital_cents || 0,
        "dividend_return_of_capital_cents",
      );
      if (returnOfCapital > dividends)
        throw problem("dividend_return_of_capital_cents cannot exceed total dividends");
      const other = Number(input.other_adjustments_cents || 0);
      if (!Number.isInteger(other)) throw problem("other_adjustments_cents must be an integer");
      const incomeAdjustment = share - basisAmortization;
      const change = incomeAdjustment + other - dividends;
      const journal =
        change || dividends
          ? post(input.period_end, `Equity-method activity: ${item.instrument_number}`, [
              signedLine(
                item.asset_account_code,
                incomeAdjustment + other,
                true,
                "Share of investee earnings/loss and basis adjustments",
              ),
              signedLine("4240", incomeAdjustment + other, false, "Equity-method income/loss"),
              dividends ? line("1000", dividends, true, "Dividends received") : null,
              dividends
                ? line(
                    item.asset_account_code,
                    dividends,
                    false,
                    "Equity-method dividend basis reduction",
                  )
                : null,
            ])
          : null;
      const after = item.carrying_value_cents + change;
      if (after < 0 && !input.additional_loss_obligation)
        throw problem(
          "Equity-method losses cannot reduce the investment below zero without an additional-loss obligation",
        );
      const result = db
        .prepare(
          `INSERT INTO equity_method_periods(instrument_id,period_end,investee_income_cents,ownership_percent,
        investor_share_cents,basis_difference_amortization_cents,dividends_cents,dividend_return_of_capital_cents,
        other_adjustments_cents,carrying_value_before_cents,carrying_value_after_cents,journal_entry_id,policy_basis) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.period_end,
          investeeIncome,
          ownership,
          share,
          basisAmortization,
          dividends,
          returnOfCapital,
          other,
          item.carrying_value_cents,
          after,
          journal?.id || null,
          required(input.policy_basis, "policy_basis"),
        );
      db.prepare(
        "UPDATE investment_instruments SET carrying_value_cents=?,amortized_cost_cents=? WHERE id=?",
      ).run(after, after, item.id);
      return db
        .prepare("SELECT * FROM equity_method_periods WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function assessEquityMethodImpairment(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      if (item.accounting_model !== "equity_method")
        throw problem("Instrument does not use the equity method");
      if (!input.other_than_temporary)
        throw problem("Equity-method impairment requires an other-than-temporary loss conclusion");
      const fairValue = cents(input.fair_value_cents, "fair_value_cents");
      const loss = Math.max(0, item.carrying_value_cents - fairValue);
      if (!loss) throw problem("Fair value must be below carrying value for impairment");
      const journal = post(input.as_of, `Equity-method impairment: ${item.instrument_number}`, [
        line("5900", loss, true, "Other-than-temporary impairment loss"),
        line(item.asset_account_code, loss, false, "Write down equity-method investment"),
      ]);
      const result = db
        .prepare(
          `INSERT INTO investment_measurements(instrument_id,as_of,measurement_type,
        amortized_cost_cents,carrying_value_before_cents,fair_value_cents,earnings_cents,oci_cents,impairment_cents,
        level,valuation_technique,inputs_json,policy_basis,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.as_of,
          "equity_method_impairment",
          item.amortized_cost_cents,
          item.carrying_value_cents,
          fairValue,
          -loss,
          0,
          loss,
          input.level || null,
          required(input.valuation_technique, "valuation_technique"),
          JSON.stringify(input.inputs || {}),
          required(input.policy_basis, "policy_basis"),
          journal.id,
        );
      db.prepare(
        "UPDATE investment_instruments SET amortized_cost_cents=?,carrying_value_cents=?,fair_value_cents=? WHERE id=?",
      ).run(fairValue, fairValue, fairValue, item.id);
      return db
        .prepare("SELECT * FROM investment_measurements WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function recordProportionalAmortizationPeriod(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      if (item.accounting_model !== "proportional_amortization")
        throw problem("Instrument does not use the proportional amortization method");
      const amortization = cents(
        input.investment_amortization_cents,
        "investment_amortization_cents",
        { allowZero: false },
      );
      const credits = cents(input.tax_credits_cents || 0, "tax_credits_cents");
      const benefits = cents(input.other_tax_benefits_cents || 0, "other_tax_benefits_cents");
      if (amortization > item.carrying_value_cents)
        throw problem("Amortization exceeds the investment carrying value");
      const taxBenefit = credits + benefits;
      const journal = post(
        input.period_end,
        `Proportional amortization: ${item.instrument_number}`,
        [
          line(
            "5700",
            amortization,
            true,
            "Proportional investment amortization in income tax expense",
          ),
          line(item.asset_account_code, amortization, false, "Tax-credit investment amortization"),
          taxBenefit
            ? line("2510", taxBenefit, true, "Tax credits and other tax benefits realized")
            : null,
          taxBenefit
            ? line("5700", taxBenefit, false, "Tax benefits recognized in income tax expense")
            : null,
        ],
      );
      const after = item.carrying_value_cents - amortization;
      const result = db
        .prepare(
          `INSERT INTO proportional_amortization_periods(instrument_id,period_end,
        investment_amortization_cents,tax_credits_cents,other_tax_benefits_cents,net_tax_expense_benefit_cents,
        carrying_value_before_cents,carrying_value_after_cents,journal_entry_id,policy_basis) VALUES(?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.period_end,
          amortization,
          credits,
          benefits,
          amortization - taxBenefit,
          item.carrying_value_cents,
          after,
          journal.id,
          required(input.policy_basis, "policy_basis"),
        );
      db.prepare(
        "UPDATE investment_instruments SET amortized_cost_cents=?,carrying_value_cents=? WHERE id=?",
      ).run(after, after, item.id);
      return db
        .prepare("SELECT * FROM proportional_amortization_periods WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function transitionInvestmentModel(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      const newModel = required(input.new_accounting_model, "new_accounting_model");
      const allowed = item.security_type === "debt" ? DEBT_MODELS : EQUITY_MODELS;
      if (!allowed.has(newModel))
        throw problem("The new accounting model is not applicable to this instrument type");
      if (newModel === item.accounting_model)
        throw problem("The investment already uses this accounting model");
      if (
        newModel === "equity_method" &&
        !input.significant_influence &&
        !input.partnership_equity_method_presumption
      )
        throw problem(
          "Transition to the equity method requires significant influence or a documented current-GAAP partnership scope basis",
        );
      if (newModel === "held_to_maturity" && !input.positive_intent_and_ability_to_hold)
        throw problem("Transition to HTM requires positive intent and ability to hold");
      const requiresFairValue =
        ["equity_fair_value", "trading", "available_for_sale"].includes(newModel) &&
        item.accounting_model === "equity_method";
      const transitionBasis = requiresFairValue
        ? cents(required(input.fair_value_cents, "fair_value_cents"), "fair_value_cents")
        : item.carrying_value_cents;
      const adjustment = transitionBasis - item.carrying_value_cents;
      const newAccount = ACCOUNT_BY_MODEL[newModel];
      let journal = null;
      if (newAccount !== item.asset_account_code || adjustment) {
        journal = post(
          input.transition_date,
          `Investment accounting-model transition: ${item.instrument_number}`,
          [
            transitionBasis
              ? line(newAccount, transitionBasis, true, "Investment at transition basis")
              : null,
            item.carrying_value_cents
              ? line(
                  item.asset_account_code,
                  item.carrying_value_cents,
                  false,
                  "Remove former investment classification",
                )
              : null,
            signedLine("4230", adjustment, false, "Transition-date fair-value adjustment"),
          ],
        );
      }
      const result = db
        .prepare(
          `INSERT INTO investment_model_transitions(instrument_id,transition_date,old_model,new_model,
        carrying_value_before_cents,transition_basis_cents,earnings_adjustment_cents,reason,policy_basis,journal_entry_id,created_by)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.transition_date,
          item.accounting_model,
          newModel,
          item.carrying_value_cents,
          transitionBasis,
          adjustment,
          required(input.reason, "reason"),
          required(input.policy_basis, "policy_basis"),
          journal?.id || null,
          currentActor(),
        );
      const newUnrealized = [
        "trading",
        "equity_fair_value",
        "equity_measurement_alternative",
      ].includes(newModel)
        ? (["trading", "equity_fair_value", "equity_measurement_alternative"].includes(
            item.accounting_model,
          )
            ? item.accumulated_unrealized_earnings_cents
            : 0) + adjustment
        : 0;
      db.prepare(
        `UPDATE investment_instruments SET accounting_model=?,asset_account_code=?,amortized_cost_cents=?,
        carrying_value_cents=?,fair_value_cents=?,significant_influence=?,accumulated_unrealized_earnings_cents=? WHERE id=?`,
      ).run(
        newModel,
        newAccount,
        transitionBasis,
        transitionBasis,
        input.fair_value_cents ?? item.fair_value_cents,
        newModel === "equity_method" && input.significant_influence ? 1 : 0,
        newUnrealized,
        item.id,
      );
      return db
        .prepare("SELECT * FROM investment_model_transitions WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function assessInvestmentCreditLoss(input) {
    return transaction(() => {
      const item = instrument(input.instrument_id);
      if (!new Set(["held_to_maturity", "available_for_sale"]).has(item.accounting_model))
        throw problem(
          "Investment credit-loss accounting applies here only to HTM or AFS debt securities",
        );
      const fairValue = cents(input.fair_value_cents, "fair_value_cents");
      const expected = cents(input.expected_loss_cents, "expected_loss_cents");
      const writeDown =
        item.accounting_model === "available_for_sale" &&
        (input.intent_to_sell || input.required_to_sell);
      const desired = writeDown
        ? 0
        : item.accounting_model === "available_for_sale"
          ? Math.min(expected, Math.max(0, item.amortized_cost_cents - fairValue))
          : Math.min(expected, item.amortized_cost_cents);
      const adjustment = desired - item.credit_loss_allowance_cents;
      let journal = null;
      let newCost = item.amortized_cost_cents;
      let newCarrying = item.carrying_value_cents;
      let newOci = item.accumulated_oci_cents;
      let reportOciChange = 0;
      if (writeDown) {
        const assetAdjustment = fairValue - item.carrying_value_cents;
        const ociAdjustment = -item.accumulated_oci_cents;
        reportOciChange = ociAdjustment;
        const allowanceAdjustment = -item.credit_loss_allowance_cents;
        const loss = -assetAdjustment + ociAdjustment + allowanceAdjustment;
        if (assetAdjustment || ociAdjustment || allowanceAdjustment || loss)
          journal = post(input.as_of, `AFS credit-loss write-down: ${item.instrument_number}`, [
            signedLine(
              item.asset_account_code,
              assetAdjustment,
              true,
              "Write investment to fair value",
            ),
            signedLine("3150", ociAdjustment, false, "Remove related AFS amount from AOCI"),
            signedLine(
              "1660",
              allowanceAdjustment,
              false,
              "Remove prior AFS credit-loss allowance",
            ),
            signedLine("5360", loss, true, "AFS impairment recognized in earnings"),
          ]);
        newCost = Math.min(item.amortized_cost_cents, fairValue);
        newCarrying = fairValue;
        newOci = 0;
      } else if (item.accounting_model === "available_for_sale") {
        newCarrying = fairValue + desired;
        const assetAdjustment = newCarrying - item.carrying_value_cents;
        newOci = newCarrying - item.amortized_cost_cents;
        const ociAdjustment = newOci - item.accumulated_oci_cents;
        reportOciChange = ociAdjustment;
        if (assetAdjustment || ociAdjustment || adjustment)
          journal = post(input.as_of, `AFS credit-loss allowance: ${item.instrument_number}`, [
            signedLine(
              item.asset_account_code,
              assetAdjustment,
              true,
              "AFS noncredit fair-value adjustment",
            ),
            signedLine("3150", ociAdjustment, false, "AFS noncredit amount in OCI"),
            signedLine("5360", adjustment, true, "AFS credit-loss expense/reversal"),
            signedLine("1660", adjustment, false, "AFS allowance for credit losses"),
          ]);
      } else if (adjustment) {
        journal = post(input.as_of, `HTM credit-loss allowance: ${item.instrument_number}`, [
          signedLine("5360", adjustment, true, "HTM lifetime credit-loss expense/reversal"),
          signedLine("1660", adjustment, false, "HTM allowance for credit losses"),
        ]);
      }
      const result = db
        .prepare(
          `INSERT INTO investment_credit_losses(instrument_id,as_of,amortized_cost_cents,fair_value_cents,
        expected_loss_cents,allowance_before_cents,allowance_after_cents,intent_to_sell,required_to_sell,method,
        assumptions_json,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.as_of,
          item.amortized_cost_cents,
          fairValue,
          expected,
          item.credit_loss_allowance_cents,
          desired,
          input.intent_to_sell ? 1 : 0,
          input.required_to_sell ? 1 : 0,
          required(input.method, "method"),
          JSON.stringify(input.assumptions || {}),
          journal?.id || null,
        );
      db.prepare(
        "UPDATE investment_instruments SET amortized_cost_cents=?,carrying_value_cents=?,credit_loss_allowance_cents=?,fair_value_cents=?,accumulated_oci_cents=? WHERE id=?",
      ).run(newCost, newCarrying, desired, fairValue, newOci, item.id);
      if (reportOciChange)
        db.prepare(
          `INSERT INTO oci_items(item_key,period_end,description,category,pretax_cents,tax_cents,net_cents,reclassification_cents,journal_entry_id)
          VALUES(?,?,?,?,?,?,?,?,?)`,
        ).run(
          `investment-${item.id}-credit-${result.lastInsertRowid}`,
          input.as_of,
          `AFS noncredit OCI adjustment — ${item.instrument_number}`,
          "available_for_sale_debt",
          reportOciChange,
          0,
          reportOciChange,
          0,
          journal?.id || null,
        );
      return db
        .prepare("SELECT * FROM investment_credit_losses WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function investment(id) {
    const item = instrument(id);
    return {
      ...item,
      lots: db
        .prepare("SELECT * FROM investment_lots WHERE instrument_id=? ORDER BY trade_date,id")
        .all(item.id),
      transactions: db
        .prepare(
          "SELECT * FROM investment_transactions WHERE instrument_id=? ORDER BY transaction_date,id",
        )
        .all(item.id),
      yield_schedule: investmentYieldSchedule(item.id),
      measurements: db
        .prepare("SELECT * FROM investment_measurements WHERE instrument_id=? ORDER BY as_of,id")
        .all(item.id),
      credit_losses: db
        .prepare("SELECT * FROM investment_credit_losses WHERE instrument_id=? ORDER BY as_of,id")
        .all(item.id),
      equity_method_periods: db
        .prepare("SELECT * FROM equity_method_periods WHERE instrument_id=? ORDER BY period_end,id")
        .all(item.id),
      proportional_amortization_periods: db
        .prepare(
          "SELECT * FROM proportional_amortization_periods WHERE instrument_id=? ORDER BY period_end,id",
        )
        .all(item.id),
      model_transitions: db
        .prepare(
          "SELECT * FROM investment_model_transitions WHERE instrument_id=? ORDER BY transition_date,id",
        )
        .all(item.id),
    };
  }
  function investmentYieldSchedule(id) {
    return db
      .prepare("SELECT * FROM investment_yield_schedule WHERE instrument_id=? ORDER BY period")
      .all(Number(id));
  }
  function listInvestments() {
    return db
      .prepare("SELECT * FROM investment_instruments ORDER BY acquisition_date DESC,id DESC")
      .all();
  }

  function investmentReconciliation(asOf = "9999-12-31") {
    const subledger = db
      .prepare(
        `SELECT asset_account_code,SUM(carrying_value_cents) subledger_cents
      FROM investment_instruments WHERE acquisition_date<=? GROUP BY asset_account_code ORDER BY asset_account_code`,
      )
      .all(asOf);
    const trial = new Map(ledger.trialBalance(asOf).map((row) => [row.code, row.balance_cents]));
    return subledger.map((row) => ({
      ...row,
      gl_cents: trial.get(row.asset_account_code) || 0,
      difference_cents: row.subledger_cents - (trial.get(row.asset_account_code) || 0),
      reconciled: row.subledger_cents === (trial.get(row.asset_account_code) || 0),
    }));
  }

  function investmentDisclosures(asOf = "9999-12-31") {
    const byModel = db
      .prepare(
        `SELECT accounting_model,COUNT(*) instrument_count,SUM(amortized_cost_cents) amortized_cost_cents,
      SUM(carrying_value_cents) carrying_value_cents,SUM(COALESCE(fair_value_cents,carrying_value_cents)) fair_value_cents,
      SUM(accumulated_oci_cents) accumulated_oci_cents,SUM(credit_loss_allowance_cents) allowance_cents
      FROM investment_instruments WHERE acquisition_date<=? GROUP BY accounting_model ORDER BY accounting_model`,
      )
      .all(asOf);
    const maturities = db
      .prepare(
        `SELECT CASE
      WHEN julianday(maturity_date)-julianday(?)<=365 THEN 'within_one_year'
      WHEN julianday(maturity_date)-julianday(?)<=1825 THEN 'one_to_five_years'
      WHEN julianday(maturity_date)-julianday(?)<=3650 THEN 'five_to_ten_years' ELSE 'after_ten_years' END bucket,
      SUM(amortized_cost_cents) amortized_cost_cents,SUM(COALESCE(fair_value_cents,carrying_value_cents)) fair_value_cents
      FROM investment_instruments WHERE maturity_date IS NOT NULL AND maturity_date>? GROUP BY bucket`,
      )
      .all(asOf, asOf, asOf, asOf);
    const activity = db
      .prepare(
        `SELECT transaction_type,SUM(amount_cents) amount_cents,SUM(realized_gain_loss_cents) realized_gain_loss_cents
      FROM investment_transactions WHERE transaction_date<=? GROUP BY transaction_type ORDER BY transaction_type`,
      )
      .all(asOf);
    return {
      as_of: asOf,
      by_accounting_model: byModel,
      contractual_maturities: maturities,
      activity,
      level_3_measurements: db
        .prepare(
          "SELECT * FROM investment_measurements WHERE as_of<=? AND level=3 ORDER BY as_of,instrument_id",
        )
        .all(asOf),
      credit_losses: db
        .prepare(
          "SELECT * FROM investment_credit_losses WHERE as_of<=? ORDER BY as_of,instrument_id",
        )
        .all(asOf),
      equity_method: db
        .prepare(
          `SELECT i.instrument_number,i.name,i.issuer,i.ownership_percent,i.carrying_value_cents,
        SUM(COALESCE(e.investor_share_cents-e.basis_difference_amortization_cents+e.other_adjustments_cents,0)) cumulative_income_cents,
        SUM(COALESCE(e.dividends_cents,0)) cumulative_dividends_cents FROM investment_instruments i
        LEFT JOIN equity_method_periods e ON e.instrument_id=i.id AND e.period_end<=?
        WHERE i.accounting_model='equity_method' GROUP BY i.id`,
        )
        .all(asOf),
      proportional_amortization: db
        .prepare(
          `SELECT i.instrument_number,i.name,SUM(p.investment_amortization_cents) amortization_cents,
        SUM(p.tax_credits_cents+p.other_tax_benefits_cents) tax_benefits_cents,SUM(p.net_tax_expense_benefit_cents) net_tax_expense_benefit_cents
        FROM investment_instruments i JOIN proportional_amortization_periods p ON p.instrument_id=i.id
        WHERE p.period_end<=? GROUP BY i.id`,
        )
        .all(asOf),
    };
  }
  function investmentsOverview(asOf = "9999-12-31") {
    const items = listInvestments();
    return {
      as_of: asOf,
      totals: {
        instruments: items.length,
        active: items.filter((item) => item.status === "active").length,
        amortized_cost_cents: items.reduce((sum, item) => sum + item.amortized_cost_cents, 0),
        carrying_value_cents: items.reduce((sum, item) => sum + item.carrying_value_cents, 0),
        fair_value_cents: items.reduce(
          (sum, item) => sum + (item.fair_value_cents ?? item.carrying_value_cents),
          0,
        ),
        accumulated_oci_cents: items.reduce((sum, item) => sum + item.accumulated_oci_cents, 0),
        credit_loss_allowance_cents: items.reduce(
          (sum, item) => sum + item.credit_loss_allowance_cents,
          0,
        ),
      },
      instruments: items,
      reconciliation: investmentReconciliation(asOf),
      disclosures: investmentDisclosures(asOf),
    };
  }

  return {
    createInvestment,
    purchaseInvestment,
    investment,
    listInvestments,
    investmentYieldSchedule,
    recognizeInvestmentYieldThrough,
    accrueInvestmentInterest,
    recordInvestmentIncome,
    measureInvestment,
    sellInvestment,
    recordEquityMethodPeriod,
    assessEquityMethodImpairment,
    recordProportionalAmortizationPeriod,
    transitionInvestmentModel,
    assessInvestmentCreditLoss,
    investmentReconciliation,
    investmentDisclosures,
    investmentsOverview,
  };
}

function problem(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
