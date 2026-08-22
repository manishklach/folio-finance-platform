import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { currentActor, requestContext } from "./request-context.js";

const closeItems = [
  "bank_reconciled",
  "ar_reviewed",
  "ap_reviewed",
  "revenue_reviewed",
  "accruals_posted",
  "integrity_verified",
];

export function migrateOperations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fiscal_config (id INTEGER PRIMARY KEY CHECK(id=1),calendar_type TEXT NOT NULL DEFAULT 'calendar' CHECK(calendar_type IN ('calendar','fiscal_month','445')),fiscal_year_start_month INTEGER NOT NULL DEFAULT 1 CHECK(fiscal_year_start_month BETWEEN 1 AND 12),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    INSERT OR IGNORE INTO fiscal_config(id) VALUES(1);
    CREATE TABLE IF NOT EXISTS bank_statements (id TEXT PRIMARY KEY,cash_account_id INTEGER NOT NULL REFERENCES accounts(id),start_date TEXT NOT NULL,end_date TEXT NOT NULL,opening_cents INTEGER NOT NULL,closing_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reconciled')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS bank_transactions (id TEXT PRIMARY KEY,statement_id TEXT NOT NULL REFERENCES bank_statements(id),transaction_date TEXT NOT NULL,description TEXT NOT NULL,amount_cents INTEGER NOT NULL,external_id TEXT NOT NULL UNIQUE,matched_line_id INTEGER REFERENCES journal_lines(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS attachments (id TEXT PRIMARY KEY,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,filename TEXT NOT NULL,mime_type TEXT NOT NULL,size_bytes INTEGER NOT NULL,sha256 TEXT NOT NULL,storage_key TEXT NOT NULL UNIQUE,created_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS tax_rates (id TEXT PRIMARY KEY,name TEXT NOT NULL,jurisdiction TEXT NOT NULL,rate_basis_points INTEGER NOT NULL CHECK(rate_basis_points BETWEEN 0 AND 10000),active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS close_checklist (period TEXT NOT NULL,item_key TEXT NOT NULL,completed INTEGER NOT NULL DEFAULT 0,evidence TEXT,completed_by TEXT,completed_at TEXT,PRIMARY KEY(period,item_key));
    CREATE TABLE IF NOT EXISTS reconciliation_exceptions (id TEXT PRIMARY KEY,kind TEXT NOT NULL,reference TEXT NOT NULL,amount_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),owner TEXT,resolution TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX IF NOT EXISTS idx_bank_unmatched ON bank_transactions(statement_id,matched_line_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON reconciliation_exceptions(status,kind);
  `);
}

export function createOperationsRepository(db, ledger, options = {}) {
  const storageRoot = resolve(
    options.storageRoot || process.env.ATTACHMENT_DIR || "data/attachments",
  );
  mkdirSync(storageRoot, { recursive: true });

  function fiscalConfig() {
    return db.prepare("SELECT * FROM fiscal_config WHERE id=1").get();
  }
  function configureFiscal(input) {
    const type = ["calendar", "fiscal_month", "445"].includes(input.calendar_type)
      ? input.calendar_type
      : "calendar";
    const month = Number(input.fiscal_year_start_month || 1);
    if (month < 1 || month > 12) throw bad("Fiscal start month must be 1 through 12");
    db.prepare(
      "UPDATE fiscal_config SET calendar_type=?,fiscal_year_start_month=?,updated_at=CURRENT_TIMESTAMP WHERE id=1",
    ).run(type, month);
    return fiscalConfig();
  }
  function fiscalPeriod(date) {
    const cfg = fiscalConfig();
    const d = new Date(`${date}T00:00:00Z`);
    if (cfg.calendar_type === "calendar") return date.slice(0, 7);
    if (cfg.calendar_type === "fiscal_month") {
      const fy =
        d.getUTCMonth() + 1 >= cfg.fiscal_year_start_month
          ? d.getUTCFullYear() + 1
          : d.getUTCFullYear();
      const period = ((d.getUTCMonth() + 1 - cfg.fiscal_year_start_month + 12) % 12) + 1;
      return `FY${fy}-P${String(period).padStart(2, "0")}`;
    }
    const start = new Date(
      Date.UTC(
        d.getUTCFullYear() - (d.getUTCMonth() + 1 < cfg.fiscal_year_start_month ? 1 : 0),
        cfg.fiscal_year_start_month - 1,
        1,
      ),
    );
    const week = Math.floor((d - start) / 604800000);
    return `FY${start.getUTCFullYear() + 1}-P${String(Math.min(13, Math.floor(week / 4) + 1)).padStart(2, "0")}`;
  }

  function importBankStatement(input) {
    const account = db
      .prepare("SELECT id FROM accounts WHERE id=? AND type='asset'")
      .get(input.cash_account_id);
    if (!account) throw bad("Cash account not found");
    const rows = parseCsv(input.csv);
    if (!rows.length) throw bad("Statement has no transactions");
    const id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "INSERT INTO bank_statements(id,cash_account_id,start_date,end_date,opening_cents,closing_cents) VALUES(?,?,?,?,?,?)",
      ).run(
        id,
        input.cash_account_id,
        input.start_date,
        input.end_date,
        input.opening_cents,
        input.closing_cents,
      );
      const insert = db.prepare(
        "INSERT INTO bank_transactions(id,statement_id,transaction_date,description,amount_cents,external_id) VALUES(?,?,?,?,?,?)",
      );
      for (const row of rows)
        insert.run(
          randomUUID(),
          id,
          row.date,
          row.description,
          Math.round(Number(row.amount) * 100),
          row.external_id || digest(`${id}:${row.date}:${row.description}:${row.amount}`),
        );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return reconcileBank(id);
  }
  function reconcileBank(statementId) {
    const statement = db.prepare("SELECT * FROM bank_statements WHERE id=?").get(statementId);
    if (!statement) throw bad("Statement not found", 404);
    const unmatched = db
      .prepare(
        "SELECT * FROM bank_transactions WHERE statement_id=? AND matched_line_id IS NULL ORDER BY transaction_date,id",
      )
      .all(statementId);
    for (const row of unmatched) {
      const candidates = db
        .prepare(
          `SELECT l.id FROM journal_lines l JOIN journal_entries j ON j.id=l.entry_id WHERE j.status='posted' AND l.account_id=? AND j.entry_date=? AND l.debit_cents-l.credit_cents=? AND NOT EXISTS(SELECT 1 FROM bank_transactions b WHERE b.matched_line_id=l.id)`,
        )
        .all(statement.cash_account_id, row.transaction_date, row.amount_cents);
      if (candidates.length === 1)
        db.prepare("UPDATE bank_transactions SET matched_line_id=? WHERE id=?").run(
          candidates[0].id,
          row.id,
        );
    }
    const summary = db
      .prepare(
        "SELECT COUNT(*) total,SUM(CASE WHEN matched_line_id IS NULL THEN 1 ELSE 0 END) unmatched FROM bank_transactions WHERE statement_id=?",
      )
      .get(statementId);
    if (summary.unmatched === 0)
      db.prepare("UPDATE bank_statements SET status='reconciled' WHERE id=?").run(statementId);
    return {
      ...db.prepare("SELECT * FROM bank_statements WHERE id=?").get(statementId),
      ...summary,
      transactions: db
        .prepare(
          "SELECT * FROM bank_transactions WHERE statement_id=? ORDER BY transaction_date,id",
        )
        .all(statementId),
    };
  }
  function bankStatements() {
    return db
      .prepare(
        "SELECT s.*,COUNT(t.id) transaction_count,SUM(CASE WHEN t.matched_line_id IS NULL THEN 1 ELSE 0 END) unmatched_count FROM bank_statements s LEFT JOIN bank_transactions t ON t.statement_id=s.id GROUP BY s.id ORDER BY s.end_date DESC",
      )
      .all();
  }

  function addAttachment(input) {
    if (!["invoice", "contract", "journal"].includes(input.entity_type))
      throw bad("Unsupported attachment entity");
    const content = Buffer.from(input.content_base64 || "", "base64");
    if (!content.length || content.length > 5_000_000)
      throw bad("Attachment must be between 1 byte and 5 MB");
    const mime = validatedMime(input.mime_type, content);
    const id = randomUUID(),
      extension = {
        "application/pdf": "pdf",
        "image/png": "png",
        "image/jpeg": "jpg",
        "text/csv": "csv",
      }[mime];
    const org = requestContext().orgId || "legacy";
    const directory = join(storageRoot, org);
    mkdirSync(directory, { recursive: true });
    const key = `${id}.${extension}`;
    writeFileSync(join(directory, key), content, { flag: "wx" });
    db.prepare(
      "INSERT INTO attachments(id,entity_type,entity_id,filename,mime_type,size_bytes,sha256,storage_key,created_by) VALUES(?,?,?,?,?,?,?,?,?)",
    ).run(
      id,
      input.entity_type,
      String(input.entity_id),
      safeFilename(input.filename),
      mime,
      content.length,
      digest(content),
      join(org, key),
      currentActor(),
    );
    return db
      .prepare(
        "SELECT id,entity_type,entity_id,filename,mime_type,size_bytes,sha256,created_by,created_at FROM attachments WHERE id=?",
      )
      .get(id);
  }
  function attachment(id) {
    const row = db.prepare("SELECT * FROM attachments WHERE id=?").get(id);
    if (!row) throw bad("Attachment not found", 404);
    return { metadata: row, content: readFileSync(join(storageRoot, row.storage_key)) };
  }
  function attachments(entityType, entityId) {
    return db
      .prepare(
        "SELECT id,entity_type,entity_id,filename,mime_type,size_bytes,sha256,created_by,created_at FROM attachments WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC",
      )
      .all(entityType, String(entityId));
  }

  function createTaxRate(input) {
    const id = randomUUID();
    db.prepare("INSERT INTO tax_rates(id,name,jurisdiction,rate_basis_points) VALUES(?,?,?,?)").run(
      id,
      input.name,
      input.jurisdiction,
      input.rate_basis_points,
    );
    return db.prepare("SELECT * FROM tax_rates WHERE id=?").get(id);
  }
  function taxRates() {
    return db.prepare("SELECT * FROM tax_rates WHERE active=1 ORDER BY jurisdiction,name").all();
  }
  function calculateTax(rateId, subtotalCents) {
    const rate = db.prepare("SELECT * FROM tax_rates WHERE id=? AND active=1").get(rateId);
    if (!rate) throw bad("Tax rate not found", 404);
    return {
      rate,
      subtotal_cents: subtotalCents,
      tax_cents: Math.round((subtotalCents * rate.rate_basis_points) / 10000),
      total_cents: subtotalCents + Math.round((subtotalCents * rate.rate_basis_points) / 10000),
    };
  }

  function closeChecklist(period) {
    for (const key of closeItems)
      db.prepare("INSERT OR IGNORE INTO close_checklist(period,item_key) VALUES(?,?)").run(
        period,
        key,
      );
    return db.prepare("SELECT * FROM close_checklist WHERE period=? ORDER BY item_key").all(period);
  }
  function completeCloseItem(input) {
    if (!closeItems.includes(input.item_key)) throw bad("Unknown close item");
    db.prepare(
      "INSERT INTO close_checklist(period,item_key,completed,evidence,completed_by,completed_at) VALUES(?,?,1,?,?,CURRENT_TIMESTAMP) ON CONFLICT(period,item_key) DO UPDATE SET completed=1,evidence=excluded.evidence,completed_by=excluded.completed_by,completed_at=CURRENT_TIMESTAMP",
    ).run(input.period, input.item_key, input.evidence || null, currentActor());
    return closeChecklist(input.period);
  }
  function closePeriod(period) {
    const items = closeChecklist(period);
    if (items.some((item) => !item.completed))
      throw bad("All close checklist items must be completed", 409);
    const integrity = ledger.verifyIntegrity();
    if (!integrity.valid) throw bad("Journal integrity verification failed", 409);
    db.prepare(
      "INSERT INTO periods(month,status,closed_at) VALUES(?,'closed',CURRENT_TIMESTAMP) ON CONFLICT(month) DO UPDATE SET status='closed',closed_at=CURRENT_TIMESTAMP",
    ).run(period);
    return { period, status: "closed", items };
  }

  function syncReconciliationExceptions(asOf) {
    const ar = ledger.receivables(asOf);
    const candidates = [
      { kind: "ar_to_gl", reference: asOf, amount: ar.reconciliation.ar_difference_cents },
      {
        kind: "unapplied_cash",
        reference: asOf,
        amount: ar.reconciliation.unapplied_difference_cents,
      },
    ];
    for (const item of candidates.filter((x) => x.amount)) {
      const existing = db
        .prepare(
          "SELECT id FROM reconciliation_exceptions WHERE kind=? AND reference=? AND status<>'resolved'",
        )
        .get(item.kind, item.reference);
      if (!existing)
        db.prepare(
          "INSERT INTO reconciliation_exceptions(id,kind,reference,amount_cents) VALUES(?,?,?,?)",
        ).run(randomUUID(), item.kind, item.reference, item.amount);
    }
    return exceptions();
  }
  function exceptions() {
    return db
      .prepare(
        "SELECT * FROM reconciliation_exceptions ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'acknowledged' THEN 1 ELSE 2 END,created_at DESC",
      )
      .all();
  }
  function updateException(input) {
    if (!["acknowledged", "resolved"].includes(input.status)) throw bad("Invalid exception status");
    const result = db
      .prepare(
        "UPDATE reconciliation_exceptions SET status=?,owner=?,resolution=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .run(input.status, currentActor(), input.resolution || null, input.id);
    if (!result.changes) throw bad("Exception not found", 404);
    return db.prepare("SELECT * FROM reconciliation_exceptions WHERE id=?").get(input.id);
  }

  return {
    fiscalConfig,
    configureFiscal,
    fiscalPeriod,
    importBankStatement,
    reconcileBank,
    bankStatements,
    addAttachment,
    attachment,
    attachments,
    createTaxRate,
    taxRates,
    calculateTax,
    closeChecklist,
    completeCloseItem,
    closePeriod,
    syncReconciliationExceptions,
    exceptions,
    updateException,
  };
}

function parseCsv(value) {
  const lines = String(value || "")
    .trim()
    .split(/\r?\n/);
  const headers = lines
    .shift()
    ?.split(",")
    .map((x) => x.trim().toLowerCase());
  for (const required of ["date", "description", "amount"])
    if (!headers?.includes(required)) throw bad(`CSV requires ${required} column`);
  return lines
    .filter(Boolean)
    .map((line) => Object.fromEntries(splitCsv(line).map((part, index) => [headers[index], part])));
}
function splitCsv(line) {
  const result = [];
  let current = "",
    quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index++;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      result.push(current.trim());
      current = "";
    } else current += char;
  }
  result.push(current.trim());
  return result;
}
function validatedMime(claimed, content) {
  const signatures = [
    { mime: "application/pdf", ok: content.subarray(0, 5).toString() === "%PDF-" },
    { mime: "image/png", ok: content.subarray(1, 4).toString() === "PNG" },
    { mime: "image/jpeg", ok: content[0] === 0xff && content[1] === 0xd8 },
    { mime: "text/csv", ok: !content.includes(0) },
  ];
  const match = signatures.find((item) => item.mime === claimed && item.ok);
  if (!match) throw bad("Attachment content does not match an allowed PDF, PNG, JPEG, or CSV type");
  return match.mime;
}
function safeFilename(value) {
  return String(value || "attachment")
    .replace(/[^A-Za-z0-9._ -]/g, "_")
    .slice(0, 120);
}
function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}
function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
