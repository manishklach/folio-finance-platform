import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { canonicalJournalHash, normalBalance, validateJournal } from "./accounting.js";
import { createSaasRepository, migrateSaas, seedSaas } from "./saas.js";
import { currentActor } from "./request-context.js";
import { createOperationsRepository, migrateOperations } from "./operations.js";

const DEFAULT_DB_PATH = resolve("data", "ledger.db");

export function createLedger(dbPath = DEFAULT_DB_PATH, { seed = true, orgId = "legacy" } = {}) {
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  migrate(db);
  migrateSaas(db);
  migrateOperations(db);
  configureTenant(db, orgId);
  if (seed) seedDatabase(db);
  seedAdditionalAccounts(db);
  const repository = makeRepository(db);
  const saas = createSaasRepository(db, repository);
  const operations = createOperationsRepository(db, repository);
  if (seed) seedSaas(db, saas, repository);
  return Object.assign(repository, saas, operations);
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('asset','liability','equity','revenue','expense')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS periods (
      month TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      closed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      memo TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','posted','voided')),
      source TEXT NOT NULL DEFAULT 'manual',
      ai_rationale TEXT,
      content_hash TEXT,
      created_by TEXT NOT NULL DEFAULT 'demo.user',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      posted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS journal_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      description TEXT,
      debit_cents INTEGER NOT NULL DEFAULT 0 CHECK(debit_cents >= 0),
      credit_cents INTEGER NOT NULL DEFAULT 0 CHECK(credit_cents >= 0),
      CHECK((debit_cents > 0 AND credit_cents = 0) OR (credit_cents > 0 AND debit_cents = 0))
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_lines_entry ON journal_lines(entry_id);
    CREATE TABLE IF NOT EXISTS tenant_metadata (org_id TEXT PRIMARY KEY,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TRIGGER IF NOT EXISTS protect_posted_entry_update BEFORE UPDATE ON journal_entries WHEN OLD.status='posted' BEGIN SELECT RAISE(ABORT,'posted journal entries are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS protect_posted_entry_delete BEFORE DELETE ON journal_entries WHEN OLD.status='posted' BEGIN SELECT RAISE(ABORT,'posted journal entries are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS protect_posted_line_insert BEFORE INSERT ON journal_lines WHEN (SELECT status FROM journal_entries WHERE id=NEW.entry_id)='posted' BEGIN SELECT RAISE(ABORT,'posted journal lines are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS protect_posted_line_update BEFORE UPDATE ON journal_lines WHEN (SELECT status FROM journal_entries WHERE id=OLD.entry_id)='posted' BEGIN SELECT RAISE(ABORT,'posted journal lines are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS protect_posted_line_delete BEFORE DELETE ON journal_lines WHEN (SELECT status FROM journal_entries WHERE id=OLD.entry_id)='posted' BEGIN SELECT RAISE(ABORT,'posted journal lines are immutable'); END;
  `);
}

function configureTenant(db, orgId) {
  const existing = db.prepare("SELECT org_id FROM tenant_metadata LIMIT 1").get();
  if (existing && existing.org_id !== orgId)
    throw new Error("Tenant database organization mismatch");
  if (!existing) db.prepare("INSERT INTO tenant_metadata(org_id) VALUES(?)").run(orgId);
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('tenant_metadata','schema_migrations')",
    )
    .all();
  for (const { name } of tables) {
    if (
      !db
        .prepare(`PRAGMA table_info(${name})`)
        .all()
        .some((column) => column.name === "org_id")
    ) {
      db.exec(
        `ALTER TABLE ${name} ADD COLUMN org_id TEXT NOT NULL DEFAULT '${orgId.replaceAll("'", "''")}'`,
      );
    }
  }
}

function makeRepository(db) {
  const getAccounts = () =>
    db
      .prepare(
        `
    SELECT a.*, COALESCE(SUM(CASE WHEN j.status='posted' THEN l.debit_cents ELSE 0 END),0) debit_cents,
      COALESCE(SUM(CASE WHEN j.status='posted' THEN l.credit_cents ELSE 0 END),0) credit_cents
    FROM accounts a LEFT JOIN journal_lines l ON l.account_id=a.id
    LEFT JOIN journal_entries j ON j.id=l.entry_id GROUP BY a.id ORDER BY a.code
  `,
      )
      .all()
      .map((a) => ({ ...a, balance_cents: normalBalance(a.type, a.debit_cents, a.credit_cents) }));

  const getJournal = (id) => {
    const entry = db.prepare("SELECT * FROM journal_entries WHERE id=?").get(id);
    if (!entry) return null;
    const lines = db
      .prepare(
        `SELECT l.*, a.code account_code, a.name account_name, a.type account_type
      FROM journal_lines l JOIN accounts a ON a.id=l.account_id WHERE l.entry_id=? ORDER BY l.id`,
      )
      .all(id);
    return { ...entry, lines };
  };

  function createDraft(entry, actor = currentActor()) {
    const accountIds = new Set(
      db
        .prepare("SELECT id FROM accounts WHERE active=1")
        .all()
        .map((a) => a.id),
    );
    const validation = validateJournal(entry, accountIds);
    if (!validation.valid)
      throw Object.assign(new Error(validation.errors.join("; ")), { statusCode: 400 });
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      const result = db
        .prepare(
          `INSERT INTO journal_entries(entry_date,memo,source,ai_rationale,created_by,entity_id,currency,exchange_rate)
        VALUES(?,?,?,?,?,?,?,?)`,
        )
        .run(
          entry.date,
          entry.memo.trim(),
          entry.source || "manual",
          entry.ai_rationale || null,
          actor,
          entry.entity_id || 1,
          entry.currency || "USD",
          Number(entry.exchange_rate || 1),
        );
      const id = Number(result.lastInsertRowid);
      const insertLine = db.prepare(
        `INSERT INTO journal_lines(entry_id,account_id,description,debit_cents,credit_cents) VALUES(?,?,?,?,?)`,
      );
      for (const line of entry.lines)
        insertLine.run(
          id,
          Number(line.account_id),
          line.description || null,
          Number(line.debit_cents || 0),
          Number(line.credit_cents || 0),
        );
      audit(db, "journal_entry", id, "draft_created", actor, { source: entry.source || "manual" });
      if (ownsTransaction) db.exec("COMMIT");
      return getJournal(id);
    } catch (error) {
      if (ownsTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function postJournal(id, actor = currentActor()) {
    const entry = getJournal(id);
    if (!entry) throw Object.assign(new Error("Journal entry not found"), { statusCode: 404 });
    if (entry.status !== "draft")
      throw Object.assign(new Error("Only draft entries can be posted"), { statusCode: 409 });
    const period = db
      .prepare("SELECT status FROM periods WHERE month=?")
      .get(entry.entry_date.slice(0, 7));
    if (period?.status === "closed")
      throw Object.assign(new Error("This accounting period is closed"), { statusCode: 409 });
    const validation = validateJournal({
      date: entry.entry_date,
      memo: entry.memo,
      lines: entry.lines,
    });
    if (!validation.valid)
      throw Object.assign(new Error(validation.errors.join("; ")), { statusCode: 400 });
    const hash = canonicalJournalHash(entry, entry.lines);
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "UPDATE journal_entries SET status='posted',posted_at=CURRENT_TIMESTAMP,content_hash=? WHERE id=?",
      ).run(hash, id);
      audit(db, "journal_entry", Number(id), "posted", actor, { hash });
      if (ownsTransaction) db.exec("COMMIT");
      return getJournal(id);
    } catch (error) {
      if (ownsTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function listJournals() {
    return db
      .prepare(
        `SELECT j.*, SUM(l.debit_cents) total_cents, COUNT(l.id) line_count
      FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id GROUP BY j.id ORDER BY j.entry_date DESC,j.id DESC`,
      )
      .all();
  }

  function trialBalance() {
    return getAccounts().map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      balance_cents: a.balance_cents,
    }));
  }

  function dashboard() {
    const accounts = getAccounts();
    const total = (type) =>
      accounts.filter((a) => a.type === type).reduce((sum, a) => sum + a.balance_cents, 0);
    const cash = accounts.find((a) => a.code === "1000")?.balance_cents || 0;
    const revenue = total("revenue");
    const expenses = total("expense");
    const drafts = db
      .prepare("SELECT COUNT(*) count FROM journal_entries WHERE status='draft'")
      .get().count;
    const monthly = db
      .prepare(
        `SELECT substr(j.entry_date,1,7) month,
      SUM(CASE WHEN a.type='revenue' THEN l.credit_cents-l.debit_cents ELSE 0 END) revenue_cents,
      SUM(CASE WHEN a.type='expense' THEN l.debit_cents-l.credit_cents ELSE 0 END) expense_cents
      FROM journal_entries j JOIN journal_lines l ON l.entry_id=j.id JOIN accounts a ON a.id=l.account_id
      WHERE j.status='posted' GROUP BY month ORDER BY month`,
      )
      .all();
    return {
      cash_cents: cash,
      revenue_cents: revenue,
      expense_cents: expenses,
      net_income_cents: revenue - expenses,
      drafts,
      monthly,
    };
  }

  function verifyIntegrity() {
    const entries = db
      .prepare("SELECT id,content_hash FROM journal_entries WHERE status='posted'")
      .all();
    const mismatches = [];
    for (const entry of entries) {
      const journal = getJournal(entry.id);
      const actual = canonicalJournalHash(journal, journal.lines);
      if (actual !== entry.content_hash)
        mismatches.push({ id: entry.id, expected: entry.content_hash, actual });
    }
    return { checked: entries.length, mismatches, valid: mismatches.length === 0 };
  }

  return {
    db,
    getAccounts,
    getJournal,
    createDraft,
    postJournal,
    listJournals,
    trialBalance,
    dashboard,
    verifyIntegrity,
    createAccount(account) {
      const result = db
        .prepare("INSERT INTO accounts(code,name,type) VALUES(?,?,?)")
        .run(account.code, account.name, account.type);
      audit(db, "account", Number(result.lastInsertRowid), "created", currentActor(), account);
      return db.prepare("SELECT * FROM accounts WHERE id=?").get(result.lastInsertRowid);
    },
    auditLog() {
      return db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 100").all();
    },
    close() {
      db.close();
    },
  };
}

function audit(db, entityType, entityId, action, actor, payload) {
  db.prepare(
    "INSERT INTO audit_log(entity_type,entity_id,action,actor,payload) VALUES(?,?,?,?,?)",
  ).run(entityType, entityId, action, actor, JSON.stringify(payload));
}

function seedDatabase(db) {
  const count = db.prepare("SELECT COUNT(*) count FROM accounts").get().count;
  if (count) return;
  const accounts = [
    ["1000", "Operating cash", "asset"],
    ["1100", "Accounts receivable", "asset"],
    ["1200", "Prepaid expenses", "asset"],
    ["2000", "Accounts payable", "liability"],
    ["2100", "Deferred revenue", "liability"],
    ["3000", "Founder equity", "equity"],
    ["4000", "Subscription revenue", "revenue"],
    ["4100", "Services revenue", "revenue"],
    ["5000", "Cloud infrastructure", "expense"],
    ["5100", "Software", "expense"],
    ["5200", "Payroll", "expense"],
    ["5300", "Marketing", "expense"],
  ];
  const insert = db.prepare("INSERT INTO accounts(code,name,type) VALUES(?,?,?)");
  for (const account of accounts) insert.run(...account);
  const ids = Object.fromEntries(
    db
      .prepare("SELECT code,id FROM accounts")
      .all()
      .map((a) => [a.code, a.id]),
  );
  const repo = makeRepository(db);
  const samples = [
    {
      date: "2026-06-01",
      memo: "Founder capital contribution",
      source: "opening",
      lines: [
        { account_id: ids["1000"], debit_cents: 25000000, credit_cents: 0 },
        { account_id: ids["3000"], debit_cents: 0, credit_cents: 25000000 },
      ],
    },
    {
      date: "2026-06-30",
      memo: "June subscription revenue collected",
      source: "stripe",
      lines: [
        { account_id: ids["1000"], debit_cents: 4200000, credit_cents: 0 },
        { account_id: ids["4000"], debit_cents: 0, credit_cents: 4200000 },
      ],
    },
    {
      date: "2026-07-31",
      memo: "July subscription revenue collected",
      source: "stripe",
      lines: [
        { account_id: ids["1000"], debit_cents: 5900000, credit_cents: 0 },
        { account_id: ids["4000"], debit_cents: 0, credit_cents: 5900000 },
      ],
    },
    {
      date: "2026-07-31",
      memo: "July payroll",
      source: "rippling",
      lines: [
        { account_id: ids["5200"], debit_cents: 1850000, credit_cents: 0 },
        { account_id: ids["1000"], debit_cents: 0, credit_cents: 1850000 },
      ],
    },
    {
      date: "2026-08-15",
      memo: "Cloud hosting expense",
      source: "ramp",
      lines: [
        { account_id: ids["5000"], debit_cents: 680000, credit_cents: 0 },
        { account_id: ids["2000"], debit_cents: 0, credit_cents: 680000 },
      ],
    },
  ];
  for (const sample of samples) {
    const draft = repo.createDraft(sample, "system.seed");
    repo.postJournal(draft.id, "system.seed");
  }
  repo.createDraft(
    {
      date: "2026-08-20",
      memo: "Annual software prepayment — review allocation",
      source: "ai",
      ai_rationale: "Suggested as prepaid expense pending invoice review.",
      lines: [
        { account_id: ids["1200"], debit_cents: 1200000, credit_cents: 0 },
        { account_id: ids["2000"], debit_cents: 0, credit_cents: 1200000 },
      ],
    },
    "assistant",
  );
}

function seedAdditionalAccounts(db) {
  const accounts = [
    ["1150", "Contract assets — unbilled revenue", "asset"],
    ["1210", "Deferred contract acquisition costs", "asset"],
    ["1250", "Capitalized software", "asset"],
    ["1255", "Accumulated software amortization", "asset"],
    ["1300", "Intercompany receivable", "asset"],
    ["2300", "Intercompany payable", "liability"],
    ["1350", "FX revaluation adjustment", "asset"],
    ["3050", "Cumulative translation adjustment", "equity"],
    ["2400", "Debt", "liability"],
    ["5400", "Commission amortization", "expense"],
    ["5500", "Software amortization", "expense"],
    ["6000", "Cloud cost of revenue", "expense"],
    ["6100", "Research and development", "expense"],
    ["6200", "Foreign exchange gain/loss", "expense"],
    ["2150", "Unapplied customer cash", "liability"],
    ["2180", "Sales tax and VAT payable", "liability"],
    ["4050", "Sales returns and allowances", "revenue"],
    ["5350", "Bad debt expense", "expense"],
  ];
  const insert = db.prepare("INSERT OR IGNORE INTO accounts(code,name,type) VALUES(?,?,?)");
  for (const account of accounts) insert.run(...account);
}
