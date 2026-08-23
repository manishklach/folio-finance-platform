import { currentActor } from "./request-context.js";

const METHODS = new Set([
  "straight_line",
  "declining_balance",
  "double_declining",
  "units_of_production",
  "none",
]);
const CONVENTIONS = new Set(["full_month", "next_month", "half_month"]);
const CLASS_DEFAULTS = [
  ["LAND", "Land", "1700", "none", 0, "full_month", 0],
  ["BUILDING", "Buildings and improvements", "1710", "straight_line", 360, "full_month", 0],
  ["LEASEHOLD", "Leasehold improvements", "1720", "straight_line", 120, "full_month", 0],
  ["COMPUTER", "Computer and technology equipment", "1730", "straight_line", 36, "full_month", 0],
  ["FURNITURE", "Furniture and fixtures", "1740", "straight_line", 60, "full_month", 0],
  ["MACHINERY", "Machinery and equipment", "1750", "straight_line", 84, "full_month", 0],
  ["VEHICLE", "Vehicles", "1760", "straight_line", 60, "full_month", 10],
  ["OTHER", "Other property and equipment", "1780", "straight_line", 60, "full_month", 0],
];

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
const asDate = (value) => new Date(`${value}T00:00:00Z`);
const addMonths = (value, count) => {
  const date = asDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + count);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
};
const monthEnd = (value) => {
  const date = asDate(value);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
};

export function migrateFixedAssets(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fixed_asset_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_key TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      capitalization_threshold_cents INTEGER NOT NULL,
      group_purchase_threshold_cents INTEGER NOT NULL DEFAULT 0,
      default_convention TEXT NOT NULL CHECK(default_convention IN ('full_month','next_month','half_month')),
      policy_basis TEXT NOT NULL,
      approved_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(policy_key,effective_date)
    );
    CREATE TABLE IF NOT EXISTS fixed_asset_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      asset_account_code TEXT NOT NULL,
      accumulated_depreciation_account_code TEXT NOT NULL DEFAULT '1790',
      depreciation_expense_account_code TEXT NOT NULL DEFAULT '5650',
      default_method TEXT NOT NULL,
      default_useful_life_months INTEGER NOT NULL,
      default_convention TEXT NOT NULL,
      default_residual_percent REAL NOT NULL DEFAULT 0,
      capitalization_threshold_cents INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      policy_basis TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS fixed_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_number TEXT NOT NULL UNIQUE,
      parent_asset_id INTEGER REFERENCES fixed_assets(id),
      class_id INTEGER NOT NULL REFERENCES fixed_asset_classes(id),
      description TEXT NOT NULL,
      manufacturer TEXT,
      model TEXT,
      serial_number TEXT,
      tag_number TEXT,
      vendor TEXT,
      invoice_reference TEXT,
      acquisition_date TEXT NOT NULL,
      placed_in_service_date TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      original_cost_cents INTEGER NOT NULL DEFAULT 0,
      capitalized_improvements_cents INTEGER NOT NULL DEFAULT 0,
      capitalized_aro_cents INTEGER NOT NULL DEFAULT 0,
      residual_value_cents INTEGER NOT NULL DEFAULT 0,
      accumulated_depreciation_cents INTEGER NOT NULL DEFAULT 0,
      accumulated_impairment_cents INTEGER NOT NULL DEFAULT 0,
      net_book_value_cents INTEGER NOT NULL DEFAULT 0,
      depreciation_method TEXT NOT NULL,
      depreciation_convention TEXT NOT NULL,
      useful_life_months INTEGER NOT NULL DEFAULT 0,
      declining_balance_factor REAL NOT NULL DEFAULT 1.5,
      production_capacity REAL,
      production_used REAL NOT NULL DEFAULT 0,
      location TEXT,
      custodian TEXT,
      department TEXT,
      entity_id INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK(status IN ('cip','in_service','idle','held_for_sale','disposed','expensed')),
      held_for_sale_date TEXT,
      disposal_date TEXT,
      policy_basis TEXT NOT NULL,
      acquisition_journal_entry_id INTEGER REFERENCES journal_entries(id),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS fixed_asset_depreciation_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES fixed_assets(id),
      schedule_version INTEGER NOT NULL DEFAULT 1,
      period INTEGER NOT NULL,
      depreciation_date TEXT NOT NULL,
      beginning_net_book_value_cents INTEGER NOT NULL,
      depreciation_cents INTEGER NOT NULL,
      ending_net_book_value_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','posted','cancelled')),
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      UNIQUE(asset_id,schedule_version,period)
    );
    CREATE TABLE IF NOT EXISTS fixed_asset_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER REFERENCES fixed_assets(id),
      cip_project_id INTEGER,
      transaction_type TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      proceeds_cents INTEGER NOT NULL DEFAULT 0,
      gain_loss_cents INTEGER NOT NULL DEFAULT 0,
      units REAL NOT NULL DEFAULT 0,
      from_value TEXT,
      to_value TEXT,
      memo TEXT NOT NULL,
      evidence_json TEXT NOT NULL DEFAULT '{}',
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS fixed_asset_estimate_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES fixed_assets(id),
      effective_date TEXT NOT NULL,
      old_method TEXT NOT NULL,
      new_method TEXT NOT NULL,
      old_useful_life_months INTEGER NOT NULL,
      new_remaining_life_months INTEGER NOT NULL,
      old_residual_value_cents INTEGER NOT NULL,
      new_residual_value_cents INTEGER NOT NULL,
      carrying_value_cents INTEGER NOT NULL,
      reason TEXT NOT NULL,
      policy_basis TEXT NOT NULL,
      approved_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(asset_id,effective_date)
    );
    CREATE TABLE IF NOT EXISTS fixed_asset_impairments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES fixed_assets(id),
      as_of TEXT NOT NULL,
      model TEXT NOT NULL CHECK(model IN ('held_and_used','held_for_sale')),
      carrying_value_before_cents INTEGER NOT NULL,
      undiscounted_cash_flows_cents INTEGER,
      fair_value_cents INTEGER NOT NULL,
      cost_to_sell_cents INTEGER NOT NULL DEFAULT 0,
      impairment_cents INTEGER NOT NULL,
      recoverable INTEGER NOT NULL,
      level INTEGER CHECK(level BETWEEN 1 AND 3),
      valuation_technique TEXT NOT NULL,
      inputs_json TEXT NOT NULL,
      policy_basis TEXT NOT NULL,
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      UNIQUE(asset_id,as_of,model)
    );
    CREATE TABLE IF NOT EXISTS cip_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      asset_class_id INTEGER NOT NULL REFERENCES fixed_asset_classes(id),
      construction_start_date TEXT NOT NULL,
      capitalization_start_date TEXT NOT NULL,
      capitalization_suspended_date TEXT,
      qualifying_asset INTEGER NOT NULL DEFAULT 0,
      accumulated_cost_cents INTEGER NOT NULL DEFAULT 0,
      capitalized_interest_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','placed_in_service','abandoned')),
      placed_asset_id INTEGER REFERENCES fixed_assets(id),
      policy_basis TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cip_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES cip_projects(id),
      cost_date TEXT NOT NULL,
      cost_type TEXT NOT NULL CHECK(cost_type IN ('materials','labor','contractor','overhead','interest','other')),
      amount_cents INTEGER NOT NULL,
      vendor TEXT,
      invoice_reference TEXT,
      description TEXT NOT NULL,
      qualifying INTEGER NOT NULL DEFAULT 1,
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS asset_retirement_obligations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES fixed_assets(id),
      obligation_number TEXT NOT NULL UNIQUE,
      recognition_date TEXT NOT NULL,
      expected_settlement_date TEXT NOT NULL,
      initial_fair_value_cents INTEGER NOT NULL,
      liability_cents INTEGER NOT NULL,
      credit_adjusted_risk_free_rate REAL NOT NULL,
      legal_basis TEXT NOT NULL,
      valuation_inputs_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','settled')),
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS aro_accretion_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aro_id INTEGER NOT NULL REFERENCES asset_retirement_obligations(id),
      period INTEGER NOT NULL,
      accretion_date TEXT NOT NULL,
      beginning_liability_cents INTEGER NOT NULL,
      accretion_cents INTEGER NOT NULL,
      ending_liability_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','posted')),
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      UNIQUE(aro_id,period)
    );
    CREATE TABLE IF NOT EXISTS fixed_asset_inventory_counts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      count_number TEXT NOT NULL UNIQUE,
      count_date TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','completed')),
      instructions TEXT NOT NULL,
      completed_by TEXT,
      completed_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS fixed_asset_inventory_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      count_id INTEGER NOT NULL REFERENCES fixed_asset_inventory_counts(id),
      asset_id INTEGER NOT NULL REFERENCES fixed_assets(id),
      result TEXT NOT NULL CHECK(result IN ('found','missing','damaged','untagged')),
      observed_location TEXT,
      observed_custodian TEXT,
      condition_notes TEXT,
      evidence_json TEXT NOT NULL DEFAULT '{}',
      observed_by TEXT NOT NULL,
      observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(count_id,asset_id)
    );
    CREATE INDEX IF NOT EXISTS idx_fa_schedule_due ON fixed_asset_depreciation_schedule(depreciation_date,status);
    CREATE INDEX IF NOT EXISTS idx_fa_status ON fixed_assets(status,class_id);
    CREATE INDEX IF NOT EXISTS idx_fa_transactions_date ON fixed_asset_transactions(transaction_date,asset_id);
    CREATE INDEX IF NOT EXISTS idx_cip_cost_date ON cip_costs(project_id,cost_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_fa_tag_unique ON fixed_assets(tag_number) WHERE tag_number IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_fa_serial_unique ON fixed_assets(serial_number) WHERE serial_number IS NOT NULL;
    INSERT OR IGNORE INTO schema_migrations(version,name) VALUES(120,'fixed assets ASC 360 410 835-20 subledger');
  `);
}

export function createFixedAssetsRepository(db, ledger) {
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
      { date, memo, source: "fixed_assets", lines: valid },
      currentActor(),
    );
    return ledger.postJournal(draft.id, currentActor());
  }
  const atomic = (work) => {
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
  seedClasses();

  function seedClasses() {
    const insert =
      db.prepare(`INSERT OR IGNORE INTO fixed_asset_classes(class_code,name,asset_account_code,
      default_method,default_useful_life_months,default_convention,default_residual_percent,policy_basis)
      VALUES(?,?,?,?,?,?,?,?)`);
    for (const row of CLASS_DEFAULTS)
      insert.run(...row, "Controller-approved default PP&E class; entity policy may override.");
  }
  function assetClass(idOrCode) {
    const row =
      typeof idOrCode === "number"
        ? db.prepare("SELECT * FROM fixed_asset_classes WHERE id=?").get(idOrCode)
        : db.prepare("SELECT * FROM fixed_asset_classes WHERE class_code=?").get(String(idOrCode));
    if (!row) throw problem("Fixed asset class not found", 404);
    return row;
  }
  function asset(id) {
    const row = db
      .prepare(
        `SELECT a.*,c.class_code,c.name class_name,c.asset_account_code,
      c.accumulated_depreciation_account_code,c.depreciation_expense_account_code
      FROM fixed_assets a JOIN fixed_asset_classes c ON c.id=a.class_id WHERE a.id=?`,
      )
      .get(Number(id));
    if (!row) throw problem("Fixed asset not found", 404);
    return row;
  }
  function paymentLine(input, amount) {
    return line(
      input.credit_account_code || (input.on_account ? "2000" : "1000"),
      amount,
      false,
      "Acquisition consideration",
    );
  }

  function setFixedAssetPolicy(input) {
    const threshold = cents(input.capitalization_threshold_cents, "capitalization_threshold_cents");
    const group = cents(
      input.group_purchase_threshold_cents || 0,
      "group_purchase_threshold_cents",
    );
    const convention = input.default_convention || "full_month";
    if (!CONVENTIONS.has(convention)) throw problem("Unsupported depreciation convention");
    const result = db
      .prepare(
        `INSERT INTO fixed_asset_policies(policy_key,effective_date,capitalization_threshold_cents,
      group_purchase_threshold_cents,default_convention,policy_basis,approved_by) VALUES(?,?,?,?,?,?,?)`,
      )
      .run(
        input.policy_key || "corporate_ppe",
        required(input.effective_date, "effective_date"),
        threshold,
        group,
        convention,
        required(input.policy_basis, "policy_basis"),
        currentActor(),
      );
    return db.prepare("SELECT * FROM fixed_asset_policies WHERE id=?").get(result.lastInsertRowid);
  }

  function createFixedAssetClass(input) {
    if (!METHODS.has(input.default_method)) throw problem("Unsupported depreciation method");
    if (!CONVENTIONS.has(input.default_convention))
      throw problem("Unsupported depreciation convention");
    accountId(input.asset_account_code);
    accountId(input.accumulated_depreciation_account_code || "1790");
    accountId(input.depreciation_expense_account_code || "5650");
    const residualPercent = Number(input.default_residual_percent || 0);
    if (!Number.isFinite(residualPercent) || residualPercent < 0 || residualPercent > 100)
      throw problem("default_residual_percent must be between 0 and 100");
    const result = db
      .prepare(
        `INSERT INTO fixed_asset_classes(class_code,name,asset_account_code,
      accumulated_depreciation_account_code,depreciation_expense_account_code,default_method,
      default_useful_life_months,default_convention,default_residual_percent,capitalization_threshold_cents,
      policy_basis) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        required(input.class_code, "class_code"),
        required(input.name, "name"),
        input.asset_account_code,
        input.accumulated_depreciation_account_code || "1790",
        input.depreciation_expense_account_code || "5650",
        input.default_method,
        Number(input.default_useful_life_months || 0),
        input.default_convention,
        residualPercent,
        input.capitalization_threshold_cents ?? null,
        required(input.policy_basis, "policy_basis"),
      );
    return assetClass(Number(result.lastInsertRowid));
  }

  function effectivePolicy(date) {
    return (
      db
        .prepare(
          "SELECT * FROM fixed_asset_policies WHERE effective_date<=? ORDER BY effective_date DESC,id DESC LIMIT 1",
        )
        .get(date) || {
        capitalization_threshold_cents: 250_000,
        group_purchase_threshold_cents: 0,
        default_convention: "full_month",
        policy_basis: "Default engineering policy; configure and approve before production use.",
      }
    );
  }

  function acquireFixedAsset(input) {
    return atomic(() => {
      const cls = assetClass(input.class_id ?? input.class_code);
      const cost = cents(input.cost_cents, "cost_cents", { allowZero: false });
      const policy = effectivePolicy(input.acquisition_date);
      const threshold = cls.capitalization_threshold_cents ?? policy.capitalization_threshold_cents;
      const groupQualifies = input.group_purchase && cost >= policy.group_purchase_threshold_cents;
      const capitalize =
        cls.default_method === "none" ||
        cost >= threshold ||
        groupQualifies ||
        input.capitalization_exception;
      const method = input.depreciation_method || cls.default_method;
      const convention =
        input.depreciation_convention || cls.default_convention || policy.default_convention;
      if (!METHODS.has(method)) throw problem("Unsupported depreciation method");
      if (!CONVENTIONS.has(convention)) throw problem("Unsupported depreciation convention");
      const life = Number(input.useful_life_months ?? cls.default_useful_life_months);
      if (!Number.isInteger(life) || life < 0 || (method !== "none" && life === 0))
        throw problem("A depreciable asset requires a positive useful life in months");
      const residual =
        input.residual_value_cents === undefined
          ? Math.round((cost * Number(cls.default_residual_percent || 0)) / 100)
          : cents(input.residual_value_cents, "residual_value_cents");
      if (residual > cost) throw problem("Residual value cannot exceed asset cost");
      const quantity = Number(input.quantity || 1);
      if (!Number.isFinite(quantity) || quantity <= 0) throw problem("quantity must be positive");
      const journal = capitalize
        ? post(
            input.acquisition_date,
            `Acquire fixed asset ${input.asset_number}: ${input.description}`,
            [
              line(cls.asset_account_code, cost, true, "Capitalized PP&E acquisition"),
              paymentLine(input, cost),
            ],
          )
        : post(input.acquisition_date, `Expense below-threshold property: ${input.description}`, [
            line(
              input.expense_account_code || "5100",
              cost,
              true,
              "Below-threshold property expense",
            ),
            paymentLine(input, cost),
          ]);
      const status = capitalize
        ? input.placed_in_service_date
          ? "in_service"
          : "idle"
        : "expensed";
      if (capitalize && !input.qualifying_ppe)
        throw problem(
          "Capitalization requires documented control, probable future benefit, and measurable PP&E cost",
        );
      if (input.capitalization_exception && !input.capitalization_exception_reason)
        throw problem("A capitalization exception requires an approved reason");
      if (input.placed_in_service_date && input.placed_in_service_date < input.acquisition_date)
        throw problem("placed_in_service_date cannot precede acquisition_date");
      const result = db
        .prepare(
          `INSERT INTO fixed_assets(asset_number,parent_asset_id,class_id,description,manufacturer,
        model,serial_number,tag_number,vendor,invoice_reference,acquisition_date,placed_in_service_date,quantity,
        original_cost_cents,residual_value_cents,net_book_value_cents,depreciation_method,depreciation_convention,
        useful_life_months,declining_balance_factor,production_capacity,location,custodian,department,entity_id,status,
        policy_basis,acquisition_journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.asset_number, "asset_number"),
          input.parent_asset_id || null,
          cls.id,
          required(input.description, "description"),
          input.manufacturer || null,
          input.model || null,
          input.serial_number || null,
          input.tag_number || null,
          input.vendor || null,
          input.invoice_reference || null,
          required(input.acquisition_date, "acquisition_date"),
          input.placed_in_service_date || null,
          quantity,
          capitalize ? cost : 0,
          capitalize ? residual : 0,
          capitalize ? cost : 0,
          method,
          convention,
          life,
          Number(input.declining_balance_factor || 1.5),
          input.production_capacity || null,
          input.location || null,
          input.custodian || null,
          input.department || null,
          Number(input.entity_id || 1),
          status,
          required(input.policy_basis, "policy_basis"),
          journal.id,
          currentActor(),
        );
      const id = Number(result.lastInsertRowid);
      recordTransaction(
        id,
        null,
        capitalize ? "acquisition" : "expensed_purchase",
        input.acquisition_date,
        cost,
        input.memo || "Property acquisition",
        journal.id,
        input.evidence || {},
      );
      if (status === "in_service") rebuildSchedule(id, input.placed_in_service_date);
      return fixedAsset(id);
    });
  }

  function scheduleWeights(life, convention) {
    if (convention === "half_month") return [1, ...Array(Math.max(0, life - 1)).fill(2), 1];
    return Array(life).fill(1);
  }
  function scheduleStart(date, convention) {
    return convention === "next_month" ? monthEnd(addMonths(date, 1)) : monthEnd(date);
  }
  function allocateStraightLine(amount, weights) {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let remaining = amount;
    return weights.map((weight, index) => {
      const allocation =
        index === weights.length - 1 ? remaining : Math.round((amount * weight) / total);
      remaining -= allocation;
      return allocation;
    });
  }
  function rebuildSchedule(assetId, startDate, remainingLife = null) {
    const item = asset(assetId);
    if (item.depreciation_method === "none" || item.depreciation_method === "units_of_production")
      return [];
    const version = db
      .prepare(
        "SELECT COALESCE(MAX(schedule_version),0)+1 version FROM fixed_asset_depreciation_schedule WHERE asset_id=?",
      )
      .get(item.id).version;
    db.prepare(
      "UPDATE fixed_asset_depreciation_schedule SET status='cancelled' WHERE asset_id=? AND status='pending'",
    ).run(item.id);
    const life = remainingLife ?? item.useful_life_months;
    const depreciable = Math.max(0, item.net_book_value_cents - item.residual_value_cents);
    if (!depreciable) return [];
    const weights = scheduleWeights(life, item.depreciation_convention);
    let amounts;
    if (item.depreciation_method === "straight_line")
      amounts = allocateStraightLine(depreciable, weights);
    else {
      let carrying = item.net_book_value_cents;
      const rate =
        (item.depreciation_method === "double_declining" ? 2 : item.declining_balance_factor) /
        Math.max(1, life);
      amounts = weights.map((weight, index) => {
        if (index === weights.length - 1) return Math.max(0, carrying - item.residual_value_cents);
        const amount = Math.min(
          Math.round(
            carrying * rate * (item.depreciation_convention === "half_month" ? weight / 2 : weight),
          ),
          Math.max(0, carrying - item.residual_value_cents),
        );
        carrying -= amount;
        return amount;
      });
    }
    const insert =
      db.prepare(`INSERT INTO fixed_asset_depreciation_schedule(asset_id,schedule_version,period,
      depreciation_date,beginning_net_book_value_cents,depreciation_cents,ending_net_book_value_cents) VALUES(?,?,?,?,?,?,?)`);
    let carrying = item.net_book_value_cents;
    const firstDate = scheduleStart(startDate, item.depreciation_convention);
    const rows = [];
    amounts.forEach((amount, index) => {
      const date = monthEnd(addMonths(firstDate, index));
      insert.run(item.id, version, index + 1, date, carrying, amount, carrying - amount);
      rows.push({ period: index + 1, depreciation_date: date, depreciation_cents: amount });
      carrying -= amount;
    });
    return rows;
  }

  function placeAssetInService(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      if (!new Set(["idle", "cip"]).has(item.status))
        throw problem("Only idle or CIP assets can be placed in service");
      db.prepare(
        "UPDATE fixed_assets SET placed_in_service_date=?,status='in_service' WHERE id=?",
      ).run(input.placed_in_service_date, item.id);
      recordTransaction(
        item.id,
        null,
        "placed_in_service",
        input.placed_in_service_date,
        0,
        input.memo || "Asset available for intended use",
        null,
        input.evidence || {},
      );
      rebuildSchedule(item.id, input.placed_in_service_date);
      return fixedAsset(item.id);
    });
  }

  function recognizeDepreciationThrough(asOf) {
    return atomic(() => {
      const rows = db
        .prepare(
          `SELECT s.*,a.asset_number,c.accumulated_depreciation_account_code,
        c.depreciation_expense_account_code FROM fixed_asset_depreciation_schedule s
        JOIN fixed_assets a ON a.id=s.asset_id JOIN fixed_asset_classes c ON c.id=a.class_id
        WHERE s.status='pending' AND s.depreciation_date<=? AND a.status IN ('in_service','idle') ORDER BY s.depreciation_date,s.id`,
        )
        .all(asOf);
      const posted = [];
      for (const row of rows) {
        if (!row.depreciation_cents) {
          db.prepare("UPDATE fixed_asset_depreciation_schedule SET status='posted' WHERE id=?").run(
            row.id,
          );
          continue;
        }
        const journal = post(row.depreciation_date, `Depreciation: ${row.asset_number}`, [
          line(
            row.depreciation_expense_account_code,
            row.depreciation_cents,
            true,
            "Periodic depreciation",
          ),
          line(
            row.accumulated_depreciation_account_code,
            row.depreciation_cents,
            false,
            "Accumulated depreciation",
          ),
        ]);
        db.prepare(
          "UPDATE fixed_asset_depreciation_schedule SET status='posted',journal_entry_id=? WHERE id=?",
        ).run(journal.id, row.id);
        db.prepare(
          `UPDATE fixed_assets SET accumulated_depreciation_cents=accumulated_depreciation_cents+?,
          net_book_value_cents=net_book_value_cents-? WHERE id=?`,
        ).run(row.depreciation_cents, row.depreciation_cents, row.asset_id);
        recordTransaction(
          row.asset_id,
          null,
          "depreciation",
          row.depreciation_date,
          row.depreciation_cents,
          "Scheduled depreciation",
          journal.id,
          { schedule_id: row.id },
        );
        posted.push({ ...row, journal_entry_id: journal.id });
      }
      return posted;
    });
  }

  function recordAssetUsage(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      if (item.depreciation_method !== "units_of_production")
        throw problem("Asset does not use the units-of-production method");
      if (item.status !== "in_service")
        throw problem("Only in-service assets can record production usage");
      const units = Number(input.units);
      if (!Number.isFinite(units) || units <= 0) throw problem("units must be positive");
      if (!item.production_capacity || item.production_used + units > item.production_capacity)
        throw problem("Usage exceeds the asset's remaining production capacity");
      const depreciableBase = Math.max(
        0,
        item.original_cost_cents +
          item.capitalized_improvements_cents +
          item.capitalized_aro_cents -
          item.accumulated_impairment_cents -
          item.residual_value_cents,
      );
      const cumulativeTarget = Math.round(
        (depreciableBase * (item.production_used + units)) / item.production_capacity,
      );
      const depreciation = Math.min(
        cumulativeTarget - item.accumulated_depreciation_cents,
        Math.max(0, item.net_book_value_cents - item.residual_value_cents),
      );
      if (depreciation <= 0) throw problem("No remaining depreciable amount");
      const journal = post(input.period_end, `Production depreciation: ${item.asset_number}`, [
        line(
          item.depreciation_expense_account_code,
          depreciation,
          true,
          "Units-of-production depreciation",
        ),
        line(
          item.accumulated_depreciation_account_code,
          depreciation,
          false,
          "Accumulated depreciation",
        ),
      ]);
      db.prepare(
        `UPDATE fixed_assets SET production_used=production_used+?,
        accumulated_depreciation_cents=accumulated_depreciation_cents+?,net_book_value_cents=net_book_value_cents-? WHERE id=?`,
      ).run(units, depreciation, depreciation, item.id);
      return recordTransaction(
        item.id,
        null,
        "production_depreciation",
        input.period_end,
        depreciation,
        input.memo || "Units-of-production depreciation",
        journal.id,
        input.evidence || {},
        { units },
      );
    });
  }

  function changeFixedAssetEstimate(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      if (!new Set(["in_service", "idle"]).has(item.status))
        throw problem("Estimate changes require an in-service or idle asset");
      const method = input.new_method || item.depreciation_method;
      if (!METHODS.has(method)) throw problem("Unsupported depreciation method");
      const remainingLife = Number(
        required(input.new_remaining_life_months, "new_remaining_life_months"),
      );
      if (!Number.isInteger(remainingLife) || remainingLife <= 0)
        throw problem("new_remaining_life_months must be positive");
      const residual =
        input.new_residual_value_cents === undefined
          ? item.residual_value_cents
          : cents(input.new_residual_value_cents, "new_residual_value_cents");
      if (residual > item.net_book_value_cents)
        throw problem("Residual value cannot exceed current carrying value");
      const result = db
        .prepare(
          `INSERT INTO fixed_asset_estimate_changes(asset_id,effective_date,old_method,new_method,
        old_useful_life_months,new_remaining_life_months,old_residual_value_cents,new_residual_value_cents,
        carrying_value_cents,reason,policy_basis,approved_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.effective_date,
          item.depreciation_method,
          method,
          item.useful_life_months,
          remainingLife,
          item.residual_value_cents,
          residual,
          item.net_book_value_cents,
          required(input.reason, "reason"),
          required(input.policy_basis, "policy_basis"),
          currentActor(),
        );
      db.prepare(
        "UPDATE fixed_assets SET depreciation_method=?,useful_life_months=?,residual_value_cents=? WHERE id=?",
      ).run(method, remainingLife, residual, item.id);
      recordTransaction(
        item.id,
        null,
        "estimate_change",
        input.effective_date,
        0,
        input.reason,
        null,
        { policy_basis: input.policy_basis, estimate_change_id: Number(result.lastInsertRowid) },
      );
      rebuildSchedule(item.id, input.effective_date, remainingLife);
      return db
        .prepare("SELECT * FROM fixed_asset_estimate_changes WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function addFixedAssetImprovement(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      if (!new Set(["in_service", "idle"]).has(item.status))
        throw problem("Asset cannot accept an improvement in its current status");
      const amount = cents(input.amount_cents, "amount_cents", { allowZero: false });
      if (!input.extends_life && !input.increases_capacity && !input.improves_quality)
        throw problem(
          "A capital improvement must extend life, increase capacity, or improve output quality",
        );
      const journal = post(input.date, `Capital improvement: ${item.asset_number}`, [
        line(item.asset_account_code, amount, true, "Capitalized subsequent expenditure"),
        paymentLine(input, amount),
      ]);
      db.prepare(
        `UPDATE fixed_assets SET capitalized_improvements_cents=capitalized_improvements_cents+?,
        net_book_value_cents=net_book_value_cents+? WHERE id=?`,
      ).run(amount, amount, item.id);
      const transactionRow = recordTransaction(
        item.id,
        null,
        "improvement",
        input.date,
        amount,
        input.memo || "Capitalized improvement",
        journal.id,
        input.evidence || {},
      );
      if (input.new_remaining_life_months) {
        const refreshed = asset(item.id);
        const remaining = Number(input.new_remaining_life_months);
        db.prepare("UPDATE fixed_assets SET useful_life_months=? WHERE id=?").run(
          remaining,
          item.id,
        );
        rebuildSchedule(item.id, input.date, remaining);
        db.prepare(
          `INSERT INTO fixed_asset_estimate_changes(asset_id,effective_date,old_method,new_method,
          old_useful_life_months,new_remaining_life_months,old_residual_value_cents,new_residual_value_cents,
          carrying_value_cents,reason,policy_basis,approved_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(
          item.id,
          input.date,
          item.depreciation_method,
          item.depreciation_method,
          item.useful_life_months,
          remaining,
          item.residual_value_cents,
          item.residual_value_cents,
          refreshed.net_book_value_cents,
          input.estimate_change_reason || "Useful life revised for capital improvement",
          required(input.policy_basis, "policy_basis"),
          currentActor(),
        );
      } else rebuildSchedule(item.id, input.date, Math.max(1, item.useful_life_months));
      return { transaction: transactionRow, asset: fixedAsset(item.id) };
    });
  }

  function transferFixedAsset(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      const newClass =
        input.new_class_id || input.new_class_code
          ? assetClass(input.new_class_id ?? input.new_class_code)
          : null;
      let journal = null;
      if (newClass && newClass.id !== item.class_id) {
        const grossCarrying =
          item.original_cost_cents +
          item.capitalized_improvements_cents +
          item.capitalized_aro_cents -
          item.accumulated_impairment_cents;
        journal = post(input.transfer_date, `Reclassify fixed asset: ${item.asset_number}`, [
          line(newClass.asset_account_code, grossCarrying, true, "Transfer to new asset class"),
          line(item.asset_account_code, grossCarrying, false, "Transfer from former asset class"),
        ]);
      }
      const from = JSON.stringify({
        class_id: item.class_id,
        location: item.location,
        custodian: item.custodian,
        department: item.department,
      });
      const to = JSON.stringify({
        class_id: newClass?.id || item.class_id,
        location: input.location ?? item.location,
        custodian: input.custodian ?? item.custodian,
        department: input.department ?? item.department,
      });
      db.prepare(
        `UPDATE fixed_assets SET class_id=?,location=?,custodian=?,department=? WHERE id=?`,
      ).run(
        newClass?.id || item.class_id,
        input.location ?? item.location,
        input.custodian ?? item.custodian,
        input.department ?? item.department,
        item.id,
      );
      return recordTransaction(
        item.id,
        null,
        "transfer",
        input.transfer_date,
        0,
        input.memo || "Asset transfer",
        journal?.id || null,
        input.evidence || {},
        { from_value: from, to_value: to },
      );
    });
  }

  function createCipProject(input) {
    const cls = assetClass(input.asset_class_id ?? input.asset_class_code);
    if (
      input.capitalization_start_date &&
      input.capitalization_start_date < input.construction_start_date
    )
      throw problem("capitalization_start_date cannot precede construction_start_date");
    const result = db
      .prepare(
        `INSERT INTO cip_projects(project_number,name,description,asset_class_id,
      construction_start_date,capitalization_start_date,qualifying_asset,policy_basis,created_by)
      VALUES(?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        required(input.project_number, "project_number"),
        required(input.name, "name"),
        required(input.description, "description"),
        cls.id,
        input.construction_start_date,
        input.capitalization_start_date || input.construction_start_date,
        input.qualifying_asset ? 1 : 0,
        required(input.policy_basis, "policy_basis"),
        currentActor(),
      );
    return cipProject(result.lastInsertRowid);
  }
  function cipProject(id) {
    const row = db
      .prepare(
        `SELECT p.*,c.class_code,c.name class_name,c.asset_account_code FROM cip_projects p
      JOIN fixed_asset_classes c ON c.id=p.asset_class_id WHERE p.id=?`,
      )
      .get(Number(id));
    if (!row) throw problem("CIP project not found", 404);
    return {
      ...row,
      costs: db
        .prepare("SELECT * FROM cip_costs WHERE project_id=? ORDER BY cost_date,id")
        .all(row.id),
    };
  }
  function addCipCost(input) {
    return atomic(() => {
      const project = cipProject(input.project_id);
      if (project.status !== "active") throw problem("CIP costs require an active project");
      const amount = cents(input.amount_cents, "amount_cents", { allowZero: false });
      const qualifying = input.qualifying !== false;
      const journal = post(input.cost_date, `CIP ${project.project_number}: ${input.description}`, [
        line(
          qualifying ? "1770" : input.expense_account_code || "5100",
          amount,
          true,
          qualifying ? "Qualifying construction cost" : "Nonqualifying project cost",
        ),
        paymentLine(input, amount),
      ]);
      const result = db
        .prepare(
          `INSERT INTO cip_costs(project_id,cost_date,cost_type,amount_cents,vendor,
        invoice_reference,description,qualifying,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          project.id,
          input.cost_date,
          input.cost_type || "other",
          amount,
          input.vendor || null,
          input.invoice_reference || null,
          input.description,
          qualifying ? 1 : 0,
          journal.id,
          currentActor(),
        );
      if (qualifying)
        db.prepare(
          "UPDATE cip_projects SET accumulated_cost_cents=accumulated_cost_cents+? WHERE id=?",
        ).run(amount, project.id);
      recordTransaction(
        null,
        project.id,
        qualifying ? "cip_cost" : "cip_expense",
        input.cost_date,
        amount,
        input.description,
        journal.id,
        input.evidence || {},
      );
      return db.prepare("SELECT * FROM cip_costs WHERE id=?").get(result.lastInsertRowid);
    });
  }

  function capitalizeCipInterest(input) {
    return atomic(() => {
      const project = cipProject(input.project_id);
      if (project.status !== "active" || !project.qualifying_asset)
        throw problem("Interest capitalization requires an active qualifying asset");
      const amount = cents(input.amount_cents, "amount_cents", { allowZero: false });
      const incurred = cents(input.interest_cost_incurred_cents, "interest_cost_incurred_cents");
      const avoidable = cents(input.avoidable_interest_cents, "avoidable_interest_cents");
      if (amount > Math.min(incurred, avoidable))
        throw problem("Capitalized interest cannot exceed interest incurred or avoidable interest");
      const journal = post(input.period_end, `Capitalized interest — ${project.project_number}`, [
        line("1770", amount, true, "Capitalized interest on qualifying asset"),
        line("5620", amount, false, "Interest cost capitalized"),
      ]);
      const result = db
        .prepare(
          `INSERT INTO cip_costs(project_id,cost_date,cost_type,amount_cents,description,
        qualifying,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?)`,
        )
        .run(
          project.id,
          input.period_end,
          "interest",
          amount,
          input.memo || "Avoidable interest capitalized",
          1,
          journal.id,
          currentActor(),
        );
      db.prepare(
        `UPDATE cip_projects SET accumulated_cost_cents=accumulated_cost_cents+?,
        capitalized_interest_cents=capitalized_interest_cents+? WHERE id=?`,
      ).run(amount, amount, project.id);
      recordTransaction(
        null,
        project.id,
        "capitalized_interest",
        input.period_end,
        amount,
        input.memo || "CIP interest capitalization",
        journal.id,
        {
          ...input.evidence,
          interest_cost_incurred_cents: incurred,
          avoidable_interest_cents: avoidable,
          capitalized_interest_cents: amount,
        },
      );
      return db.prepare("SELECT * FROM cip_costs WHERE id=?").get(result.lastInsertRowid);
    });
  }

  function setCipStatus(input) {
    const project = cipProject(input.project_id);
    if (!new Set(["active", "suspended"]).has(input.status))
      throw problem("CIP status must be active or suspended");
    db.prepare(`UPDATE cip_projects SET status=?,capitalization_suspended_date=? WHERE id=?`).run(
      input.status,
      input.status === "suspended" ? input.date : null,
      project.id,
    );
    recordTransaction(
      null,
      project.id,
      `cip_${input.status}`,
      input.date,
      0,
      input.reason || `CIP ${input.status}`,
      null,
      input.evidence || {},
    );
    return cipProject(project.id);
  }

  function placeCipInService(input) {
    return atomic(() => {
      const project = cipProject(input.project_id);
      if (!new Set(["active", "suspended"]).has(project.status))
        throw problem("CIP project cannot be placed in service");
      if (project.accumulated_cost_cents <= 0) throw problem("CIP project has no capitalized cost");
      const cls = assetClass(project.asset_class_id);
      const method = input.depreciation_method || cls.default_method;
      const life = Number(input.useful_life_months ?? cls.default_useful_life_months);
      const residual = cents(input.residual_value_cents || 0, "residual_value_cents");
      const journal = post(
        input.placed_in_service_date,
        `Place CIP in service: ${project.project_number}`,
        [
          line(
            cls.asset_account_code,
            project.accumulated_cost_cents,
            true,
            "Completed fixed asset",
          ),
          line("1770", project.accumulated_cost_cents, false, "Remove construction in progress"),
        ],
      );
      const result = db
        .prepare(
          `INSERT INTO fixed_assets(asset_number,class_id,description,acquisition_date,
        placed_in_service_date,original_cost_cents,residual_value_cents,net_book_value_cents,depreciation_method,
        depreciation_convention,useful_life_months,location,custodian,department,entity_id,status,policy_basis,
        acquisition_journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          required(input.asset_number, "asset_number"),
          cls.id,
          input.description || project.name,
          project.construction_start_date,
          input.placed_in_service_date,
          project.accumulated_cost_cents,
          residual,
          project.accumulated_cost_cents,
          method,
          input.depreciation_convention || cls.default_convention,
          life,
          input.location || null,
          input.custodian || null,
          input.department || null,
          Number(input.entity_id || 1),
          "in_service",
          required(input.policy_basis, "policy_basis"),
          journal.id,
          currentActor(),
        );
      const assetId = Number(result.lastInsertRowid);
      db.prepare(
        "UPDATE cip_projects SET status='placed_in_service',placed_asset_id=? WHERE id=?",
      ).run(assetId, project.id);
      recordTransaction(
        assetId,
        project.id,
        "cip_placed_in_service",
        input.placed_in_service_date,
        project.accumulated_cost_cents,
        "CIP transferred to completed PP&E",
        journal.id,
        input.evidence || {},
      );
      rebuildSchedule(assetId, input.placed_in_service_date);
      return { project: cipProject(project.id), asset: fixedAsset(assetId) };
    });
  }

  function abandonCipProject(input) {
    return atomic(() => {
      const project = cipProject(input.project_id);
      if (!new Set(["active", "suspended"]).has(project.status))
        throw problem("CIP project cannot be abandoned");
      const amount = project.accumulated_cost_cents;
      const journal = amount
        ? post(input.date, `Abandon CIP: ${project.project_number}`, [
            line("5670", amount, true, "Abandoned construction project loss"),
            line("1770", amount, false, "Write off construction in progress"),
          ])
        : null;
      db.prepare(
        "UPDATE cip_projects SET status='abandoned',accumulated_cost_cents=0 WHERE id=?",
      ).run(project.id);
      recordTransaction(
        null,
        project.id,
        "cip_abandoned",
        input.date,
        amount,
        required(input.reason, "reason"),
        journal?.id || null,
        input.evidence || {},
      );
      return cipProject(project.id);
    });
  }

  function assessFixedAssetImpairment(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      if (!new Set(["in_service", "idle", "held_for_sale"]).has(item.status))
        throw problem("Asset is not eligible for a long-lived asset impairment assessment");
      const model = input.model || "held_and_used";
      if (!new Set(["held_and_used", "held_for_sale"]).has(model))
        throw problem("Unsupported impairment model");
      const fairValue = cents(input.fair_value_cents, "fair_value_cents");
      if (
        model === "held_for_sale" &&
        !(
          input.management_committed &&
          input.available_for_immediate_sale &&
          input.sale_probable_within_one_year &&
          input.actively_marketed &&
          input.unlikely_plan_changes
        )
      )
        throw problem(
          "Held-for-sale classification requires all ASC 360 sale criteria to be documented",
        );
      const costToSell = cents(input.cost_to_sell_cents || 0, "cost_to_sell_cents");
      let recoverable;
      let target = item.net_book_value_cents;
      if (model === "held_and_used") {
        const undiscounted = cents(
          input.undiscounted_cash_flows_cents,
          "undiscounted_cash_flows_cents",
        );
        recoverable = undiscounted >= item.net_book_value_cents;
        if (!recoverable) target = fairValue;
      } else {
        recoverable = false;
        target = Math.max(0, fairValue - costToSell);
      }
      const impairment = Math.max(0, item.net_book_value_cents - target);
      const journal = impairment
        ? post(input.as_of, `Fixed asset impairment: ${item.asset_number}`, [
            line("5670", impairment, true, "Long-lived asset impairment loss"),
            line(item.asset_account_code, impairment, false, "Reduce PP&E carrying amount"),
          ])
        : null;
      const result = db
        .prepare(
          `INSERT INTO fixed_asset_impairments(asset_id,as_of,model,carrying_value_before_cents,
        undiscounted_cash_flows_cents,fair_value_cents,cost_to_sell_cents,impairment_cents,recoverable,level,
        valuation_technique,inputs_json,policy_basis,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          input.as_of,
          model,
          item.net_book_value_cents,
          model === "held_and_used" ? input.undiscounted_cash_flows_cents : null,
          fairValue,
          costToSell,
          impairment,
          recoverable ? 1 : 0,
          input.level || null,
          required(input.valuation_technique, "valuation_technique"),
          JSON.stringify(input.inputs || {}),
          required(input.policy_basis, "policy_basis"),
          journal?.id || null,
        );
      if (impairment)
        db.prepare(
          `UPDATE fixed_assets SET accumulated_impairment_cents=accumulated_impairment_cents+?,
          net_book_value_cents=net_book_value_cents-? WHERE id=?`,
        ).run(impairment, impairment, item.id);
      if (model === "held_for_sale") {
        db.prepare(
          "UPDATE fixed_assets SET status='held_for_sale',held_for_sale_date=? WHERE id=?",
        ).run(input.as_of, item.id);
        db.prepare(
          "UPDATE fixed_asset_depreciation_schedule SET status='cancelled' WHERE asset_id=? AND status='pending'",
        ).run(item.id);
      } else if (impairment) {
        const pending = db
          .prepare(
            "SELECT COUNT(*) count FROM fixed_asset_depreciation_schedule WHERE asset_id=? AND status='pending'",
          )
          .get(item.id).count;
        if (pending) rebuildSchedule(item.id, input.as_of, pending);
      }
      recordTransaction(
        item.id,
        null,
        model === "held_for_sale" ? "held_for_sale" : "impairment",
        input.as_of,
        impairment,
        input.memo || `${model} impairment assessment`,
        journal?.id || null,
        { impairment_id: Number(result.lastInsertRowid), ...input.evidence },
      );
      return db
        .prepare("SELECT * FROM fixed_asset_impairments WHERE id=?")
        .get(result.lastInsertRowid);
    });
  }

  function remeasureHeldForSale(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      if (item.status !== "held_for_sale")
        throw problem("Asset is not classified as held for sale");
      const fairLessCost = Math.max(
        0,
        cents(input.fair_value_cents, "fair_value_cents") -
          cents(input.cost_to_sell_cents || 0, "cost_to_sell_cents"),
      );
      const requestedIncrease = Math.max(0, fairLessCost - item.net_book_value_cents);
      const recovery = Math.min(requestedIncrease, item.accumulated_impairment_cents);
      const additionalLoss = Math.max(0, item.net_book_value_cents - fairLessCost);
      const delta = recovery - additionalLoss;
      const journal = delta
        ? post(input.as_of, `Held-for-sale remeasurement: ${item.asset_number}`, [
            signedLine(item.asset_account_code, delta, true, "Held-for-sale carrying adjustment"),
            signedLine("5670", delta, false, "Impairment recovery/additional loss"),
          ])
        : null;
      db.prepare(
        `UPDATE fixed_assets SET accumulated_impairment_cents=accumulated_impairment_cents-?+?,
        net_book_value_cents=net_book_value_cents+?-? WHERE id=?`,
      ).run(recovery, additionalLoss, recovery, additionalLoss, item.id);
      return recordTransaction(
        item.id,
        null,
        "held_for_sale_remeasurement",
        input.as_of,
        Math.abs(delta),
        input.memo || "Held-for-sale remeasurement",
        journal?.id || null,
        input.evidence || {},
        { gain_loss_cents: delta },
      );
    });
  }

  function returnAssetToHeldAndUsed(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      if (item.status !== "held_for_sale")
        throw problem("Asset is not classified as held for sale");
      const adjustedWithoutSale = cents(
        input.adjusted_carrying_without_held_for_sale_cents,
        "adjusted_carrying_without_held_for_sale_cents",
      );
      const recoverable = cents(input.recoverable_amount_cents, "recoverable_amount_cents");
      const target = Math.min(adjustedWithoutSale, recoverable);
      const delta = target - item.net_book_value_cents;
      const recovery = Math.max(0, Math.min(delta, item.accumulated_impairment_cents));
      const loss = Math.max(0, -delta);
      const journal = delta
        ? post(input.as_of, `Return held-for-sale asset to use: ${item.asset_number}`, [
            signedLine(item.asset_account_code, delta, true, "Return-to-use carrying adjustment"),
            signedLine("5670", delta, false, "Return-to-use impairment adjustment"),
          ])
        : null;
      db.prepare(
        `UPDATE fixed_assets SET status='in_service',held_for_sale_date=NULL,
        accumulated_impairment_cents=accumulated_impairment_cents-?+?,net_book_value_cents=? WHERE id=?`,
      ).run(recovery, loss, item.net_book_value_cents + delta, item.id);
      rebuildSchedule(
        item.id,
        input.as_of,
        Number(input.remaining_life_months || item.useful_life_months),
      );
      return recordTransaction(
        item.id,
        null,
        "returned_to_held_and_used",
        input.as_of,
        Math.abs(delta),
        input.reason || "Held-for-sale criteria no longer met",
        journal?.id || null,
        input.evidence || {},
        { gain_loss_cents: delta },
      );
    });
  }

  function disposeFixedAsset(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      if (item.status === "disposed" || item.status === "expensed")
        throw problem("Asset cannot be disposed in its current status");
      const portion = Number(input.portion_percent || 100);
      if (!Number.isFinite(portion) || portion <= 0 || portion > 100)
        throw problem("portion_percent must be between 0 and 100");
      const ratio = portion / 100;
      const activeAro = db
        .prepare(
          "SELECT COUNT(*) count FROM asset_retirement_obligations WHERE asset_id=? AND status='active'",
        )
        .get(item.id).count;
      if (portion === 100 && activeAro && !input.aro_treatment_documented)
        throw problem(
          "Settle or document transfer of the active asset retirement obligation before disposal",
        );
      const allocatedCost = Math.round(
        (item.original_cost_cents +
          item.capitalized_improvements_cents +
          item.capitalized_aro_cents) *
          ratio,
      );
      const allocatedImpairment = Math.round(item.accumulated_impairment_cents * ratio);
      const allocatedAccumDep = Math.round(item.accumulated_depreciation_cents * ratio);
      const grossLedgerAmount = allocatedCost - allocatedImpairment;
      const carrying = grossLedgerAmount - allocatedAccumDep;
      const proceeds = cents(input.proceeds_cents || 0, "proceeds_cents");
      const gainLoss = proceeds - carrying;
      const journal = post(input.disposal_date, `Dispose fixed asset: ${item.asset_number}`, [
        proceeds ? line("1000", proceeds, true, "Disposal proceeds") : null,
        allocatedAccumDep
          ? line(
              item.accumulated_depreciation_account_code,
              allocatedAccumDep,
              true,
              "Remove accumulated depreciation",
            )
          : null,
        line(
          item.asset_account_code,
          grossLedgerAmount,
          false,
          "Remove fixed asset gross carrying amount",
        ),
        signedLine("5660", gainLoss, false, "Fixed asset disposal gain/loss"),
      ]);
      db.prepare(
        `UPDATE fixed_assets SET original_cost_cents=original_cost_cents-?,
        capitalized_improvements_cents=capitalized_improvements_cents-?,capitalized_aro_cents=capitalized_aro_cents-?,
        accumulated_impairment_cents=accumulated_impairment_cents-?,accumulated_depreciation_cents=accumulated_depreciation_cents-?,
        net_book_value_cents=net_book_value_cents-?,quantity=quantity*?,status=CASE WHEN ?=100 THEN 'disposed' ELSE status END,
        disposal_date=CASE WHEN ?=100 THEN ? ELSE disposal_date END WHERE id=?`,
      ).run(
        Math.round(item.original_cost_cents * ratio),
        Math.round(item.capitalized_improvements_cents * ratio),
        Math.round(item.capitalized_aro_cents * ratio),
        allocatedImpairment,
        allocatedAccumDep,
        carrying,
        1 - ratio,
        portion,
        portion,
        input.disposal_date,
        item.id,
      );
      if (portion === 100)
        db.prepare(
          "UPDATE fixed_asset_depreciation_schedule SET status='cancelled' WHERE asset_id=? AND status='pending'",
        ).run(item.id);
      else {
        const pending = db
          .prepare(
            "SELECT COUNT(*) count FROM fixed_asset_depreciation_schedule WHERE asset_id=? AND status='pending'",
          )
          .get(item.id).count;
        if (pending) rebuildSchedule(item.id, input.disposal_date, pending);
      }
      return recordTransaction(
        item.id,
        null,
        "disposal",
        input.disposal_date,
        carrying,
        input.memo || "Fixed asset disposal",
        journal.id,
        input.evidence || {},
        { proceeds_cents: proceeds, gain_loss_cents: gainLoss, units: portion },
      );
    });
  }

  function recognizeAssetRetirementObligation(input) {
    return atomic(() => {
      const item = asset(input.asset_id);
      const fairValue = cents(input.initial_fair_value_cents, "initial_fair_value_cents", {
        allowZero: false,
      });
      const rate = Number(input.credit_adjusted_risk_free_rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 1)
        throw problem("credit_adjusted_risk_free_rate must be between 0 and 1");
      if (input.expected_settlement_date <= input.recognition_date)
        throw problem("expected_settlement_date must follow recognition_date");
      const journal = post(input.recognition_date, `Recognize ARO: ${input.obligation_number}`, [
        line(item.asset_account_code, fairValue, true, "Capitalized asset retirement cost"),
        line("2560", fairValue, false, "Asset retirement obligation at fair value"),
      ]);
      const result = db
        .prepare(
          `INSERT INTO asset_retirement_obligations(asset_id,obligation_number,recognition_date,
        expected_settlement_date,initial_fair_value_cents,liability_cents,credit_adjusted_risk_free_rate,legal_basis,
        valuation_inputs_json,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          item.id,
          required(input.obligation_number, "obligation_number"),
          input.recognition_date,
          input.expected_settlement_date,
          fairValue,
          fairValue,
          rate,
          required(input.legal_basis, "legal_basis"),
          JSON.stringify(input.valuation_inputs || {}),
          journal.id,
        );
      const aroId = Number(result.lastInsertRowid);
      db.prepare(
        `UPDATE fixed_assets SET capitalized_aro_cents=capitalized_aro_cents+?,
        net_book_value_cents=net_book_value_cents+? WHERE id=?`,
      ).run(fairValue, fairValue, item.id);
      buildAroSchedule(aroId);
      const pending = db
        .prepare(
          "SELECT COUNT(*) count FROM fixed_asset_depreciation_schedule WHERE asset_id=? AND status='pending'",
        )
        .get(item.id).count;
      if (pending) rebuildSchedule(item.id, input.recognition_date, pending);
      recordTransaction(
        item.id,
        null,
        "aro_recognition",
        input.recognition_date,
        fairValue,
        input.memo || "Asset retirement obligation recognized",
        journal.id,
        input.evidence || {},
      );
      return aro(aroId);
    });
  }
  function aro(id) {
    const row = db.prepare("SELECT * FROM asset_retirement_obligations WHERE id=?").get(Number(id));
    if (!row) throw problem("Asset retirement obligation not found", 404);
    return {
      ...row,
      schedule: db
        .prepare("SELECT * FROM aro_accretion_schedule WHERE aro_id=? ORDER BY period")
        .all(row.id),
    };
  }
  function buildAroSchedule(aroId) {
    const item = aro(aroId);
    if (!item.credit_adjusted_risk_free_rate) return;
    const lastPosted = db
      .prepare(
        `SELECT period,accretion_date FROM aro_accretion_schedule
      WHERE aro_id=? AND status='posted' ORDER BY period DESC LIMIT 1`,
      )
      .get(item.id);
    const startDate = lastPosted?.accretion_date || item.recognition_date;
    const start = asDate(startDate);
    const end = asDate(item.expected_settlement_date);
    const months = Math.max(
      1,
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        end.getUTCMonth() -
        start.getUTCMonth(),
    );
    let liability = item.liability_cents;
    const insert = db.prepare(`INSERT INTO aro_accretion_schedule(aro_id,period,accretion_date,
      beginning_liability_cents,accretion_cents,ending_liability_cents) VALUES(?,?,?,?,?,?)`);
    const firstPeriod = Number(lastPosted?.period || 0) + 1;
    for (let offset = 1; offset <= months; offset += 1) {
      const period = firstPeriod + offset - 1;
      const accretion = Math.round((liability * item.credit_adjusted_risk_free_rate) / 12);
      const ending = liability + accretion;
      insert.run(
        item.id,
        period,
        monthEnd(addMonths(startDate, offset)),
        liability,
        accretion,
        ending,
      );
      liability = ending;
    }
  }

  function recognizeAroAccretionThrough(asOf) {
    return atomic(() => {
      const rows = db
        .prepare(
          `SELECT s.*,a.asset_id,a.obligation_number FROM aro_accretion_schedule s
        JOIN asset_retirement_obligations a ON a.id=s.aro_id WHERE s.status='pending' AND s.accretion_date<=?
        ORDER BY s.accretion_date,s.id`,
        )
        .all(asOf);
      const posted = [];
      for (const row of rows) {
        const journal = post(row.accretion_date, `ARO accretion: ${row.obligation_number}`, [
          line("5680", row.accretion_cents, true, "ARO accretion expense"),
          line("2560", row.accretion_cents, false, "Increase asset retirement obligation"),
        ]);
        db.prepare(
          "UPDATE aro_accretion_schedule SET status='posted',journal_entry_id=? WHERE id=?",
        ).run(journal.id, row.id);
        db.prepare(
          "UPDATE asset_retirement_obligations SET liability_cents=liability_cents+? WHERE id=?",
        ).run(row.accretion_cents, row.aro_id);
        recordTransaction(
          row.asset_id,
          null,
          "aro_accretion",
          row.accretion_date,
          row.accretion_cents,
          "ARO accretion",
          journal.id,
          { aro_id: row.aro_id },
        );
        posted.push({ ...row, journal_entry_id: journal.id });
      }
      return posted;
    });
  }

  function remeasureAssetRetirementObligation(input) {
    return atomic(() => {
      const obligation = aro(input.aro_id);
      if (obligation.status !== "active") throw problem("Only active AROs can be remeasured");
      const newLiability = cents(input.new_liability_cents, "new_liability_cents");
      const delta = newLiability - obligation.liability_cents;
      if (!delta) throw problem("ARO remeasurement has no change");
      const item = asset(obligation.asset_id);
      if (delta < 0 && (-delta > item.net_book_value_cents || -delta > item.capitalized_aro_cents))
        throw problem(
          "Downward ARO remeasurement exceeds the related asset retirement cost or carrying amount",
        );
      const journal = post(input.as_of, `Remeasure ARO: ${obligation.obligation_number}`, [
        signedLine(item.asset_account_code, delta, true, "Adjust asset retirement cost"),
        signedLine("2560", delta, false, "Remeasure asset retirement obligation"),
      ]);
      db.prepare("UPDATE asset_retirement_obligations SET liability_cents=? WHERE id=?").run(
        newLiability,
        obligation.id,
      );
      db.prepare(
        `UPDATE fixed_assets SET capitalized_aro_cents=capitalized_aro_cents+?,
        net_book_value_cents=net_book_value_cents+? WHERE id=?`,
      ).run(delta, delta, item.id);
      const pendingDepreciation = db
        .prepare(
          "SELECT COUNT(*) count FROM fixed_asset_depreciation_schedule WHERE asset_id=? AND status='pending'",
        )
        .get(item.id).count;
      if (pendingDepreciation) rebuildSchedule(item.id, input.as_of, pendingDepreciation);
      db.prepare("DELETE FROM aro_accretion_schedule WHERE aro_id=? AND status='pending'").run(
        obligation.id,
      );
      const refreshed = aro(obligation.id);
      if (input.new_expected_settlement_date)
        db.prepare(
          "UPDATE asset_retirement_obligations SET expected_settlement_date=? WHERE id=?",
        ).run(input.new_expected_settlement_date, obligation.id);
      buildAroSchedule(refreshed.id);
      recordTransaction(
        item.id,
        null,
        "aro_remeasurement",
        input.as_of,
        Math.abs(delta),
        required(input.reason, "reason"),
        journal.id,
        input.evidence || {},
        { gain_loss_cents: delta },
      );
      return aro(obligation.id);
    });
  }

  function settleAssetRetirementObligation(input) {
    return atomic(() => {
      const obligation = aro(input.aro_id);
      if (obligation.status !== "active") throw problem("ARO is not active");
      const cash = cents(input.settlement_cents, "settlement_cents");
      const gainLoss = obligation.liability_cents - cash;
      const journal = post(input.settlement_date, `Settle ARO: ${obligation.obligation_number}`, [
        line("2560", obligation.liability_cents, true, "Remove asset retirement obligation"),
        cash ? line("1000", cash, false, "ARO settlement cash") : null,
        signedLine("5660", gainLoss, false, "ARO settlement gain/loss"),
      ]);
      db.prepare(
        "UPDATE asset_retirement_obligations SET status='settled',liability_cents=0 WHERE id=?",
      ).run(obligation.id);
      db.prepare("DELETE FROM aro_accretion_schedule WHERE aro_id=? AND status='pending'").run(
        obligation.id,
      );
      recordTransaction(
        obligation.asset_id,
        null,
        "aro_settlement",
        input.settlement_date,
        cash,
        input.memo || "ARO settled",
        journal.id,
        input.evidence || {},
        { gain_loss_cents: gainLoss },
      );
      return aro(obligation.id);
    });
  }

  function startFixedAssetInventoryCount(input) {
    const result = db
      .prepare(
        `INSERT INTO fixed_asset_inventory_counts(count_number,count_date,location,
      instructions,created_by) VALUES(?,?,?,?,?)`,
      )
      .run(
        required(input.count_number, "count_number"),
        required(input.count_date, "count_date"),
        input.location || null,
        required(input.instructions, "instructions"),
        currentActor(),
      );
    return fixedAssetInventoryCount(result.lastInsertRowid);
  }
  function fixedAssetInventoryCount(id) {
    const row = db.prepare("SELECT * FROM fixed_asset_inventory_counts WHERE id=?").get(Number(id));
    if (!row) throw problem("Fixed asset inventory count not found", 404);
    return {
      ...row,
      observations: db
        .prepare(
          `SELECT o.*,a.asset_number,a.description FROM fixed_asset_inventory_observations o
      JOIN fixed_assets a ON a.id=o.asset_id WHERE o.count_id=? ORDER BY a.asset_number`,
        )
        .all(row.id),
    };
  }
  function observeFixedAsset(input) {
    const count = fixedAssetInventoryCount(input.count_id);
    if (count.status !== "open") throw problem("Inventory count is completed");
    asset(input.asset_id);
    if (!new Set(["found", "missing", "damaged", "untagged"]).has(input.result))
      throw problem("Unsupported inventory observation result");
    const result = db
      .prepare(
        `INSERT INTO fixed_asset_inventory_observations(count_id,asset_id,result,
      observed_location,observed_custodian,condition_notes,evidence_json,observed_by) VALUES(?,?,?,?,?,?,?,?)`,
      )
      .run(
        count.id,
        input.asset_id,
        input.result,
        input.observed_location || null,
        input.observed_custodian || null,
        input.condition_notes || null,
        JSON.stringify(input.evidence || {}),
        currentActor(),
      );
    return db
      .prepare("SELECT * FROM fixed_asset_inventory_observations WHERE id=?")
      .get(result.lastInsertRowid);
  }
  function completeFixedAssetInventoryCount(input) {
    const count = fixedAssetInventoryCount(input.count_id);
    if (count.status !== "open") throw problem("Inventory count is already completed");
    const unobserved = db
      .prepare(
        `SELECT a.id FROM fixed_assets a WHERE a.status IN ('in_service','idle','held_for_sale')
        AND (? IS NULL OR a.location=?) AND NOT EXISTS(
          SELECT 1 FROM fixed_asset_inventory_observations o WHERE o.count_id=? AND o.asset_id=a.id)`,
      )
      .all(count.location, count.location, count.id);
    const insertMissing =
      db.prepare(`INSERT INTO fixed_asset_inventory_observations(count_id,asset_id,result,
      condition_notes,evidence_json,observed_by) VALUES(?,?,'missing',?,'{}',?)`);
    for (const row of unobserved)
      insertMissing.run(
        count.id,
        row.id,
        "No observation was submitted before count completion",
        currentActor(),
      );
    db.prepare(
      `UPDATE fixed_asset_inventory_counts SET status='completed',completed_by=?,
      completed_at=CURRENT_TIMESTAMP WHERE id=?`,
    ).run(currentActor(), count.id);
    return fixedAssetInventoryCount(count.id);
  }

  function fixedAssetReconciliation(asOf = "9999-12-31") {
    const assetRows = db
      .prepare(
        `SELECT c.asset_account_code,SUM(a.original_cost_cents+a.capitalized_improvements_cents+
      a.capitalized_aro_cents-a.accumulated_impairment_cents) subledger_cents FROM fixed_assets a
      JOIN fixed_asset_classes c ON c.id=a.class_id WHERE a.acquisition_date<=? AND a.status<>'expensed'
      GROUP BY c.asset_account_code ORDER BY c.asset_account_code`,
      )
      .all(asOf);
    const trial = new Map(ledger.trialBalance(asOf).map((row) => [row.code, row.balance_cents]));
    const assets = assetRows.map((row) => ({
      ...row,
      gl_cents: trial.get(row.asset_account_code) || 0,
      difference_cents: row.subledger_cents - (trial.get(row.asset_account_code) || 0),
      reconciled: row.subledger_cents === (trial.get(row.asset_account_code) || 0),
    }));
    const accumulated = db
      .prepare(
        `SELECT COALESCE(SUM(accumulated_depreciation_cents),0) amount FROM fixed_assets
      WHERE acquisition_date<=? AND status<>'expensed'`,
      )
      .get(asOf).amount;
    const accumulatedGl = -(trial.get("1790") || 0);
    const cip = db
      .prepare(
        `SELECT COALESCE(SUM(accumulated_cost_cents),0) amount FROM cip_projects
      WHERE construction_start_date<=? AND status IN ('active','suspended')`,
      )
      .get(asOf).amount;
    const aroLiability = db
      .prepare(
        `SELECT COALESCE(SUM(liability_cents),0) amount FROM asset_retirement_obligations
      WHERE recognition_date<=? AND status='active'`,
      )
      .get(asOf).amount;
    const aroGl = -(trial.get("2560") || 0);
    return {
      assets,
      accumulated_depreciation: {
        subledger_cents: accumulated,
        gl_cents: accumulatedGl,
        difference_cents: accumulated - accumulatedGl,
        reconciled: accumulated === accumulatedGl,
      },
      construction_in_progress: {
        subledger_cents: cip,
        gl_cents: trial.get("1770") || 0,
        difference_cents: cip - (trial.get("1770") || 0),
        reconciled: cip === (trial.get("1770") || 0),
      },
      asset_retirement_obligations: {
        subledger_cents: aroLiability,
        gl_cents: aroGl,
        difference_cents: aroLiability - aroGl,
        reconciled: aroLiability === aroGl,
      },
      reconciled:
        assets.every((row) => row.reconciled) &&
        accumulated === accumulatedGl &&
        cip === (trial.get("1770") || 0) &&
        aroLiability === aroGl,
    };
  }

  function fixedAssetRollforward(from = "0000-01-01", asOf = "9999-12-31") {
    return db
      .prepare(
        `SELECT c.class_code,c.name,
      SUM(CASE WHEN t.transaction_type IN ('acquisition','cip_placed_in_service','improvement','aro_recognition') THEN t.amount_cents ELSE 0 END) additions_cents,
      SUM(CASE WHEN t.transaction_type IN ('depreciation','production_depreciation') THEN t.amount_cents ELSE 0 END) depreciation_cents,
      SUM(CASE WHEN t.transaction_type IN ('impairment','held_for_sale') THEN t.amount_cents ELSE 0 END) impairment_cents,
      SUM(CASE WHEN t.transaction_type='disposal' THEN t.amount_cents ELSE 0 END) disposals_net_book_value_cents,
      SUM(CASE WHEN t.transaction_type='disposal' THEN t.proceeds_cents ELSE 0 END) disposal_proceeds_cents,
      SUM(CASE WHEN t.transaction_type='disposal' THEN t.gain_loss_cents ELSE 0 END) disposal_gain_loss_cents
      FROM fixed_asset_classes c LEFT JOIN fixed_assets a ON a.class_id=c.id
      LEFT JOIN fixed_asset_transactions t ON t.asset_id=a.id AND t.transaction_date BETWEEN ? AND ?
      GROUP BY c.id ORDER BY c.class_code`,
      )
      .all(from, asOf);
  }

  function fixedAssetDisclosures(asOf = "9999-12-31", from = "0000-01-01") {
    const byClass = db
      .prepare(
        `SELECT c.class_code,c.name,c.asset_account_code,c.default_method,
      MIN(CASE WHEN a.useful_life_months>0 THEN a.useful_life_months END) minimum_useful_life_months,
      MAX(a.useful_life_months) maximum_useful_life_months,COUNT(a.id) asset_count,
      COALESCE(SUM(a.original_cost_cents+a.capitalized_improvements_cents+a.capitalized_aro_cents),0) gross_carrying_cents,
      COALESCE(SUM(a.accumulated_depreciation_cents),0) accumulated_depreciation_cents,
      COALESCE(SUM(a.accumulated_impairment_cents),0) accumulated_impairment_cents,
      COALESCE(SUM(a.net_book_value_cents),0) net_book_value_cents FROM fixed_asset_classes c
      LEFT JOIN fixed_assets a ON a.class_id=c.id AND a.acquisition_date<=? AND a.status<>'expensed'
      GROUP BY c.id ORDER BY c.class_code`,
      )
      .all(asOf);
    const future = db
      .prepare(
        `SELECT CASE
      WHEN julianday(depreciation_date)-julianday(?)<=365 THEN 'within_one_year'
      WHEN julianday(depreciation_date)-julianday(?)<=730 THEN 'year_two'
      WHEN julianday(depreciation_date)-julianday(?)<=1095 THEN 'year_three'
      WHEN julianday(depreciation_date)-julianday(?)<=1460 THEN 'year_four'
      WHEN julianday(depreciation_date)-julianday(?)<=1825 THEN 'year_five' ELSE 'thereafter' END bucket,
      SUM(depreciation_cents) depreciation_cents FROM fixed_asset_depreciation_schedule
      WHERE status='pending' AND depreciation_date>? GROUP BY bucket`,
      )
      .all(asOf, asOf, asOf, asOf, asOf, asOf);
    return {
      as_of: asOf,
      by_class: byClass,
      rollforward: fixedAssetRollforward(from, asOf),
      future_depreciation: future,
      construction_in_progress: db
        .prepare(
          "SELECT * FROM cip_projects WHERE construction_start_date<=? ORDER BY project_number",
        )
        .all(asOf),
      impairments: db
        .prepare(
          "SELECT * FROM fixed_asset_impairments WHERE as_of BETWEEN ? AND ? ORDER BY as_of,asset_id",
        )
        .all(from, asOf),
      held_for_sale: db
        .prepare(
          "SELECT * FROM fixed_assets WHERE status='held_for_sale' AND held_for_sale_date<=? ORDER BY held_for_sale_date",
        )
        .all(asOf),
      asset_retirement_obligations: db
        .prepare(
          "SELECT * FROM asset_retirement_obligations WHERE recognition_date<=? ORDER BY recognition_date",
        )
        .all(asOf),
      inventory_exceptions: db
        .prepare(
          `SELECT o.*,a.asset_number,a.description,c.count_number,c.count_date
        FROM fixed_asset_inventory_observations o JOIN fixed_assets a ON a.id=o.asset_id
        JOIN fixed_asset_inventory_counts c ON c.id=o.count_id WHERE c.count_date<=? AND o.result<>'found'
        ORDER BY c.count_date,a.asset_number`,
        )
        .all(asOf),
      policies: db
        .prepare(
          "SELECT * FROM fixed_asset_policies WHERE effective_date<=? ORDER BY effective_date",
        )
        .all(asOf),
    };
  }
  function fixedAssetsOverview(asOf = "9999-12-31") {
    const items = listFixedAssets().filter((item) => item.acquisition_date <= asOf);
    return {
      as_of: asOf,
      totals: {
        assets: items.length,
        in_service: items.filter((item) => item.status === "in_service").length,
        held_for_sale: items.filter((item) => item.status === "held_for_sale").length,
        gross_carrying_cents: items.reduce(
          (sum, item) =>
            sum +
            item.original_cost_cents +
            item.capitalized_improvements_cents +
            item.capitalized_aro_cents,
          0,
        ),
        accumulated_depreciation_cents: items.reduce(
          (sum, item) => sum + item.accumulated_depreciation_cents,
          0,
        ),
        accumulated_impairment_cents: items.reduce(
          (sum, item) => sum + item.accumulated_impairment_cents,
          0,
        ),
        net_book_value_cents: items.reduce((sum, item) => sum + item.net_book_value_cents, 0),
      },
      assets: items,
      cip_projects: db
        .prepare("SELECT * FROM cip_projects ORDER BY construction_start_date DESC,id DESC")
        .all(),
      reconciliation: fixedAssetReconciliation(asOf),
      disclosures: fixedAssetDisclosures(asOf),
    };
  }

  function recordTransaction(
    assetId,
    projectId,
    type,
    date,
    amount,
    memo,
    journalId,
    evidence = {},
    extra = {},
  ) {
    const result = db
      .prepare(
        `INSERT INTO fixed_asset_transactions(asset_id,cip_project_id,transaction_type,
      transaction_date,amount_cents,proceeds_cents,gain_loss_cents,units,from_value,to_value,memo,evidence_json,
      journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        assetId || null,
        projectId || null,
        type,
        date,
        amount || 0,
        extra.proceeds_cents || 0,
        extra.gain_loss_cents || 0,
        extra.units || 0,
        extra.from_value || null,
        extra.to_value || null,
        memo,
        JSON.stringify(evidence),
        journalId || null,
        currentActor(),
      );
    return db
      .prepare("SELECT * FROM fixed_asset_transactions WHERE id=?")
      .get(result.lastInsertRowid);
  }

  function fixedAsset(id) {
    const item = asset(id);
    return {
      ...item,
      components: db
        .prepare("SELECT * FROM fixed_assets WHERE parent_asset_id=? ORDER BY asset_number")
        .all(item.id),
      schedule: db
        .prepare(
          "SELECT * FROM fixed_asset_depreciation_schedule WHERE asset_id=? ORDER BY schedule_version,period",
        )
        .all(item.id),
      transactions: db
        .prepare(
          "SELECT * FROM fixed_asset_transactions WHERE asset_id=? ORDER BY transaction_date,id",
        )
        .all(item.id),
      estimate_changes: db
        .prepare(
          "SELECT * FROM fixed_asset_estimate_changes WHERE asset_id=? ORDER BY effective_date,id",
        )
        .all(item.id),
      impairments: db
        .prepare("SELECT * FROM fixed_asset_impairments WHERE asset_id=? ORDER BY as_of,id")
        .all(item.id),
      retirement_obligations: db
        .prepare(
          "SELECT * FROM asset_retirement_obligations WHERE asset_id=? ORDER BY recognition_date,id",
        )
        .all(item.id),
    };
  }
  function listFixedAssets() {
    return db
      .prepare(
        `SELECT a.*,c.class_code,c.name class_name,c.asset_account_code FROM fixed_assets a
      JOIN fixed_asset_classes c ON c.id=a.class_id ORDER BY a.acquisition_date DESC,a.id DESC`,
      )
      .all();
  }

  return {
    setFixedAssetPolicy,
    createFixedAssetClass,
    fixedAssetClasses: () =>
      db.prepare("SELECT * FROM fixed_asset_classes ORDER BY class_code").all(),
    acquireFixedAsset,
    fixedAsset,
    listFixedAssets,
    placeAssetInService,
    recognizeDepreciationThrough,
    recordAssetUsage,
    changeFixedAssetEstimate,
    addFixedAssetImprovement,
    transferFixedAsset,
    createCipProject,
    cipProject,
    cipProjects: () =>
      db.prepare("SELECT * FROM cip_projects ORDER BY construction_start_date DESC,id DESC").all(),
    addCipCost,
    capitalizeCipInterest,
    setCipStatus,
    placeCipInService,
    abandonCipProject,
    assessFixedAssetImpairment,
    remeasureHeldForSale,
    returnAssetToHeldAndUsed,
    disposeFixedAsset,
    recognizeAssetRetirementObligation,
    assetRetirementObligation: aro,
    recognizeAroAccretionThrough,
    remeasureAssetRetirementObligation,
    settleAssetRetirementObligation,
    startFixedAssetInventoryCount,
    fixedAssetInventoryCount,
    observeFixedAsset,
    completeFixedAssetInventoryCount,
    fixedAssetReconciliation,
    fixedAssetRollforward,
    fixedAssetDisclosures,
    fixedAssetsOverview,
  };
}

function problem(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
