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
    CREATE TABLE IF NOT EXISTS bank_feed_accounts (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      external_account_id TEXT NOT NULL,
      cash_account_id INTEGER NOT NULL REFERENCES accounts(id),
      display_name TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused')),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(connection_id,external_account_id)
    );
    CREATE TABLE IF NOT EXISTS bank_feed_transactions (
      id TEXT PRIMARY KEY,
      feed_account_id TEXT NOT NULL REFERENCES bank_feed_accounts(id),
      integration_record_id TEXT NOT NULL UNIQUE REFERENCES integration_records(id),
      external_id TEXT NOT NULL,
      source_version TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('added','modified','removed')),
      transaction_date TEXT NOT NULL,
      authorized_date TEXT,
      description TEXT NOT NULL,
      merchant_name TEXT,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      pending INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pending','unmatched','matched','removed','superseded','exception')),
      matched_line_id INTEGER REFERENCES journal_lines(id),
      supersedes_id TEXT REFERENCES bank_feed_transactions(id),
      approved_by TEXT NOT NULL,
      approval_note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bank_feed_match_decisions (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES bank_feed_transactions(id),
      journal_line_id INTEGER NOT NULL REFERENCES journal_lines(id),
      decided_by TEXT NOT NULL,
      rationale TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS attachments (id TEXT PRIMARY KEY,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,filename TEXT NOT NULL,mime_type TEXT NOT NULL,size_bytes INTEGER NOT NULL,sha256 TEXT NOT NULL,storage_key TEXT NOT NULL UNIQUE,created_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS tax_rates (id TEXT PRIMARY KEY,name TEXT NOT NULL,jurisdiction TEXT NOT NULL,rate_basis_points INTEGER NOT NULL CHECK(rate_basis_points BETWEEN 0 AND 10000),active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS close_checklist (period TEXT NOT NULL,item_key TEXT NOT NULL,completed INTEGER NOT NULL DEFAULT 0,evidence TEXT,completed_by TEXT,completed_at TEXT,PRIMARY KEY(period,item_key));
    CREATE TABLE IF NOT EXISTS reconciliation_exceptions (id TEXT PRIMARY KEY,kind TEXT NOT NULL,reference TEXT NOT NULL,amount_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),owner TEXT,resolution TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX IF NOT EXISTS idx_bank_unmatched ON bank_transactions(statement_id,matched_line_id);
    CREATE INDEX IF NOT EXISTS idx_bank_feed_external ON bank_feed_transactions(feed_account_id,external_id,created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bank_feed_status ON bank_feed_transactions(status,transaction_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_feed_matched_line ON bank_feed_transactions(matched_line_id) WHERE matched_line_id IS NOT NULL AND status='matched';
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
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
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
      if (ownsTransaction) db.exec("COMMIT");
    } catch (error) {
      if (ownsTransaction) db.exec("ROLLBACK");
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
          `SELECT l.id FROM journal_lines l JOIN journal_entries j ON j.id=l.entry_id WHERE j.status='posted' AND l.account_id=? AND j.entry_date=? AND l.debit_cents-l.credit_cents=? AND NOT EXISTS(SELECT 1 FROM bank_transactions b WHERE b.matched_line_id=l.id) AND NOT EXISTS(SELECT 1 FROM bank_feed_transactions f WHERE f.matched_line_id=l.id AND f.status='matched')`,
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

  function configureBankFeedAccount(input) {
    const connection = db
      .prepare("SELECT id,provider,status FROM integration_connections WHERE id=?")
      .get(input.connection_id);
    if (!connection || connection.provider !== "plaid")
      throw bad("An existing Plaid connection is required");
    if (connection.status === "disconnected")
      throw bad("Disconnected connections cannot be bound", 409);
    const account = db
      .prepare("SELECT id,code,name FROM accounts WHERE id=? AND type='asset' AND active=1")
      .get(Number(input.cash_account_id));
    if (!account) throw bad("Active cash account not found");
    const externalAccountId = requiredText(input.external_account_id, "Provider account ID", 240);
    const displayName = requiredText(
      input.display_name || `${account.code} · ${account.name}`,
      "Feed display name",
      120,
    );
    const currency = String(input.currency || "USD")
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw bad("Currency must be a three-letter code");
    const existing = db
      .prepare(
        "SELECT id,cash_account_id,currency FROM bank_feed_accounts WHERE connection_id=? AND external_account_id=?",
      )
      .get(connection.id, externalAccountId);
    if (
      existing &&
      (existing.cash_account_id !== account.id || existing.currency !== currency) &&
      db
        .prepare("SELECT 1 FROM bank_feed_transactions WHERE feed_account_id=? LIMIT 1")
        .get(existing.id)
    )
      throw bad(
        "A feed with transaction history cannot be rebound to a different account or currency",
        409,
      );
    const id = existing?.id || randomUUID();
    db.prepare(
      `INSERT INTO bank_feed_accounts(id,connection_id,external_account_id,cash_account_id,display_name,currency,created_by)
       VALUES(?,?,?,?,?,?,?)
       ON CONFLICT(connection_id,external_account_id) DO UPDATE SET cash_account_id=excluded.cash_account_id,display_name=excluded.display_name,currency=excluded.currency,status='active',updated_at=CURRENT_TIMESTAMP`,
    ).run(id, connection.id, externalAccountId, account.id, displayName, currency, currentActor());
    return bankFeedAccount(id);
  }

  function bankFeedAccount(id) {
    const row = db
      .prepare(
        `SELECT f.*,a.code cash_account_code,a.name cash_account_name,c.display_name connection_name
         FROM bank_feed_accounts f JOIN accounts a ON a.id=f.cash_account_id JOIN integration_connections c ON c.id=f.connection_id WHERE f.id=?`,
      )
      .get(id);
    if (!row) throw bad("Bank feed account not found", 404);
    return row;
  }

  function bankFeedOverview() {
    const accounts = db
      .prepare(
        `SELECT f.*,a.code cash_account_code,a.name cash_account_name,c.display_name connection_name,
          COUNT(t.id) transaction_count,
          SUM(CASE WHEN t.status IN ('unmatched','exception') THEN 1 ELSE 0 END) exception_count
         FROM bank_feed_accounts f JOIN accounts a ON a.id=f.cash_account_id JOIN integration_connections c ON c.id=f.connection_id
         LEFT JOIN bank_feed_transactions t ON t.feed_account_id=f.id AND t.status<>'superseded'
         GROUP BY f.id ORDER BY f.display_name`,
      )
      .all();
    const transactions = db
      .prepare(
        `SELECT t.*,f.display_name feed_name,a.code cash_account_code,j.entry_id matched_journal_id,
          d.decided_by match_decided_by,d.rationale match_rationale,d.created_at match_decided_at
         FROM bank_feed_transactions t JOIN bank_feed_accounts f ON f.id=t.feed_account_id JOIN accounts a ON a.id=f.cash_account_id
         LEFT JOIN journal_lines j ON j.id=t.matched_line_id
         LEFT JOIN bank_feed_match_decisions d ON d.id=(SELECT decision.id FROM bank_feed_match_decisions decision WHERE decision.transaction_id=t.id ORDER BY decision.created_at DESC,decision.id DESC LIMIT 1)
         WHERE t.status<>'superseded' ORDER BY t.transaction_date DESC,t.created_at DESC LIMIT 250`,
      )
      .all();
    return {
      accounts,
      transactions,
      metrics: {
        active_accounts: accounts.filter((item) => item.status === "active").length,
        pending: transactions.filter((item) => item.status === "pending").length,
        matched: transactions.filter((item) => item.status === "matched").length,
        needs_review: transactions.filter((item) =>
          ["unmatched", "exception"].includes(item.status),
        ).length,
      },
    };
  }

  function bankFeedCandidates(transactionId) {
    const transaction = db
      .prepare(
        `SELECT t.*,f.cash_account_id,f.display_name feed_name,a.code cash_account_code
         FROM bank_feed_transactions t JOIN bank_feed_accounts f ON f.id=t.feed_account_id JOIN accounts a ON a.id=f.cash_account_id
         WHERE t.id=? AND t.status<>'superseded'`,
      )
      .get(transactionId);
    if (!transaction) throw bad("Current bank-feed transaction not found", 404);
    if (!["unmatched", "exception"].includes(transaction.status))
      throw bad("Only unmatched or ambiguous bank activity can be matched", 409);
    return {
      transaction,
      candidates: availableCashLines(
        transaction.cash_account_id,
        transaction.transaction_date,
        transaction.amount_cents,
      ),
    };
  }

  function matchBankFeedTransaction(input) {
    if (input.approved !== true) throw bad("Explicit bank match approval is required");
    const rationale = requiredText(input.rationale, "Match rationale", 500);
    if (rationale.length < 5) throw bad("Match rationale must contain at least 5 characters");
    const lineId = Number(input.journal_line_id);
    const ownsTransaction = !db.isTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      const review = bankFeedCandidates(input.transaction_id);
      const candidate = review.candidates.find((item) => item.id === lineId);
      if (!candidate)
        throw bad("Selected journal line is no longer an available exact cash match", 409);
      db.prepare(
        "UPDATE bank_feed_transactions SET status='matched',matched_line_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(candidate.id, review.transaction.id);
      db.prepare(
        "INSERT INTO bank_feed_match_decisions(id,transaction_id,journal_line_id,decided_by,rationale) VALUES(?,?,?,?,?)",
      ).run(randomUUID(), review.transaction.id, candidate.id, currentActor(), rationale);
      resolveBankExceptions(review.transaction.id, "Operator approved an exact posted-cash match");
      if (ownsTransaction) db.exec("COMMIT");
      return {
        transaction: db
          .prepare("SELECT * FROM bank_feed_transactions WHERE id=?")
          .get(review.transaction.id),
        decision: db
          .prepare(
            "SELECT * FROM bank_feed_match_decisions WHERE transaction_id=? ORDER BY created_at DESC LIMIT 1",
          )
          .get(review.transaction.id),
      };
    } catch (error) {
      if (ownsTransaction && db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function previewProviderBankRecord(record, connection) {
    const issues = [];
    if (connection.provider !== "plaid" || record.object_type !== "bank_transaction")
      issues.push("Native bank-feed application requires a Plaid bank transaction");
    let feedAccount = null;
    let previous = null;
    if (record.operation === "removed") {
      previous = db
        .prepare(
          `SELECT t.*,f.connection_id FROM bank_feed_transactions t JOIN bank_feed_accounts f ON f.id=t.feed_account_id
           WHERE f.connection_id=? AND t.external_id=? AND t.status<>'superseded' ORDER BY t.created_at DESC LIMIT 1`,
        )
        .get(connection.id, record.external_id);
      if (!previous) issues.push("Removed transaction has no applied bank-feed version");
      if (previous?.operation === "removed") issues.push("Transaction is already removed");
      if (previous) feedAccount = bankFeedAccount(previous.feed_account_id);
    } else {
      const externalAccountId = String(record.normalized.account_external_id || "").trim();
      if (!externalAccountId) issues.push("Provider account ID is missing");
      else {
        const binding = db
          .prepare(
            "SELECT id FROM bank_feed_accounts WHERE connection_id=? AND external_account_id=? AND status='active'",
          )
          .get(connection.id, externalAccountId);
        if (!binding) issues.push("Provider account is not bound to an active Folio cash account");
        else feedAccount = bankFeedAccount(binding.id);
      }
      if (!isCalendarDate(record.normalized.occurred_on))
        issues.push("Transaction date must use YYYY-MM-DD");
      if (!Number.isSafeInteger(record.normalized.cash_amount_cents))
        issues.push("Cash amount must be a whole number of cents");
      if (!String(record.normalized.description || "").trim())
        issues.push("Transaction description is required");
      const currency = String(record.normalized.currency || "").toUpperCase();
      if (feedAccount && currency !== feedAccount.currency)
        issues.push(
          `Transaction currency ${currency || "unknown"} does not match ${feedAccount.currency}`,
        );
    }
    return {
      record: {
        id: record.id,
        external_id: record.external_id,
        operation: record.operation,
        source_version: record.source_version,
        status: record.status,
      },
      feed_account: feedAccount,
      previous: previous
        ? { id: previous.id, status: previous.status, matched_line_id: previous.matched_line_id }
        : null,
      normalized: record.normalized,
      ready: issues.length === 0 && record.status !== "applied",
      issues: record.status === "applied" ? [...issues, "Record is already applied"] : issues,
    };
  }

  function applyProviderBankRecord(record, connection, input) {
    const existing = db
      .prepare("SELECT * FROM bank_feed_transactions WHERE integration_record_id=?")
      .get(record.id);
    if (existing) return { duplicate: true, transaction: existing };
    const preview = previewProviderBankRecord(record, connection);
    if (!preview.ready) return { duplicate: false, status: "error", preview };
    const previous = latestFeedVersion(connection.id, record.external_id);
    const source = record.operation === "removed" ? previous : record.normalized;
    if (previous) {
      db.prepare(
        "UPDATE bank_feed_transactions SET status='superseded',matched_line_id=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(previous.id);
      resolveBankExceptions(previous.id, "Superseded by a newer provider version");
    }
    const id = randomUUID();
    const pending = record.operation === "removed" ? previous.pending : Boolean(source.pending);
    let status = record.operation === "removed" ? "removed" : pending ? "pending" : "unmatched";
    let matchedLineId = null;
    const values = {
      feedAccountId: preview.feed_account.id,
      date: record.operation === "removed" ? previous.transaction_date : source.occurred_on,
      authorizedDate:
        record.operation === "removed" ? previous.authorized_date : source.authorized_on || null,
      description: record.operation === "removed" ? previous.description : source.description,
      merchantName:
        record.operation === "removed" ? previous.merchant_name : source.merchant_name || null,
      amount: record.operation === "removed" ? previous.amount_cents : source.cash_amount_cents,
      currency:
        record.operation === "removed" ? previous.currency : String(source.currency).toUpperCase(),
    };
    if (record.operation !== "removed" && !pending) {
      const account = preview.feed_account;
      const candidates = availableCashLines(account.cash_account_id, values.date, values.amount);
      if (candidates.length === 1) {
        status = "matched";
        matchedLineId = candidates[0].id;
      } else if (candidates.length > 1) status = "exception";
    }
    db.prepare(
      `INSERT INTO bank_feed_transactions(id,feed_account_id,integration_record_id,external_id,source_version,operation,transaction_date,authorized_date,description,merchant_name,amount_cents,currency,pending,status,matched_line_id,supersedes_id,approved_by,approval_note)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      values.feedAccountId,
      record.id,
      record.external_id,
      record.source_version,
      record.operation,
      values.date,
      values.authorizedDate,
      values.description,
      values.merchantName,
      values.amount,
      values.currency,
      pending ? 1 : 0,
      status,
      matchedLineId,
      previous?.id || null,
      currentActor(),
      input.approval_note,
    );
    if (record.operation === "removed" && previous?.matched_line_id)
      upsertBankException("bank_feed_removed_matched", id, values.amount);
    else if (
      previous?.matched_line_id &&
      (previous.feed_account_id !== values.feedAccountId ||
        previous.transaction_date !== values.date ||
        previous.amount_cents !== values.amount)
    )
      upsertBankException("bank_feed_changed_matched", id, values.amount);
    else if (status === "unmatched") upsertBankException("bank_feed_unmatched", id, values.amount);
    else if (status === "exception") upsertBankException("bank_feed_ambiguous", id, values.amount);
    return {
      duplicate: false,
      status: "applied",
      transaction: db.prepare("SELECT * FROM bank_feed_transactions WHERE id=?").get(id),
      match: matchedLineId ? { journal_line_id: matchedLineId } : null,
    };
  }

  function latestFeedVersion(connectionId, externalId, feedAccountId = null) {
    return feedAccountId
      ? db
          .prepare(
            `SELECT t.* FROM bank_feed_transactions t JOIN bank_feed_accounts f ON f.id=t.feed_account_id
             WHERE f.connection_id=? AND t.feed_account_id=? AND t.external_id=? AND t.status<>'superseded' ORDER BY t.created_at DESC LIMIT 1`,
          )
          .get(connectionId, feedAccountId, externalId)
      : db
          .prepare(
            `SELECT t.* FROM bank_feed_transactions t JOIN bank_feed_accounts f ON f.id=t.feed_account_id
             WHERE f.connection_id=? AND t.external_id=? AND t.status<>'superseded' ORDER BY t.created_at DESC LIMIT 1`,
          )
          .get(connectionId, externalId);
  }

  function availableCashLines(accountId, transactionDate, amountCents) {
    return db
      .prepare(
        `SELECT l.id,l.entry_id,j.entry_date,j.memo FROM journal_lines l JOIN journal_entries j ON j.id=l.entry_id
         WHERE j.status='posted' AND l.account_id=? AND j.entry_date=? AND l.debit_cents-l.credit_cents=?
         AND NOT EXISTS(SELECT 1 FROM bank_transactions b WHERE b.matched_line_id=l.id)
         AND NOT EXISTS(SELECT 1 FROM bank_feed_transactions f WHERE f.matched_line_id=l.id AND f.status='matched')`,
      )
      .all(accountId, transactionDate, amountCents);
  }

  function upsertBankException(kind, reference, amount) {
    const existing = db
      .prepare(
        "SELECT id FROM reconciliation_exceptions WHERE kind=? AND reference=? AND status<>'resolved'",
      )
      .get(kind, reference);
    if (!existing)
      db.prepare(
        "INSERT INTO reconciliation_exceptions(id,kind,reference,amount_cents) VALUES(?,?,?,?)",
      ).run(randomUUID(), kind, reference, amount);
  }

  function resolveBankExceptions(reference, resolution) {
    db.prepare(
      `UPDATE reconciliation_exceptions SET status='resolved',owner=?,resolution=?,updated_at=CURRENT_TIMESTAMP
       WHERE reference=? AND kind LIKE 'bank_feed_%' AND status<>'resolved'`,
    ).run(currentActor(), resolution, reference);
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
    if (input.item_key === "bank_reconciled") {
      const unresolvedStatements = db
        .prepare("SELECT end_date FROM bank_statements WHERE status<>'reconciled'")
        .all()
        .some((item) => fiscalPeriod(item.end_date) === input.period);
      const unresolvedActivity = db
        .prepare(
          "SELECT transaction_date FROM bank_feed_transactions WHERE status IN ('pending','unmatched','exception')",
        )
        .all()
        .some((item) => fiscalPeriod(item.transaction_date) === input.period);
      const unresolvedRemoval = db
        .prepare(
          `SELECT t.transaction_date FROM reconciliation_exceptions e JOIN bank_feed_transactions t ON t.id=e.reference
           WHERE e.kind LIKE 'bank_feed_%' AND e.status<>'resolved'`,
        )
        .all()
        .some((item) => fiscalPeriod(item.transaction_date) === input.period);
      const unresolvedStripePayout = db
        .prepare(
          `SELECT effective_at FROM integration_records
           WHERE object_type='stripe_payout' AND status IN ('staged','error') AND effective_at IS NOT NULL`,
        )
        .all()
        .some((item) => fiscalPeriod(item.effective_at.slice(0, 10)) === input.period);
      const invalidatedStripePayout = db
        .prepare(
          "SELECT occurred_on FROM stripe_reconciliation_records WHERE object_type='stripe_payout' AND status='exception' AND occurred_on IS NOT NULL",
        )
        .all()
        .some((item) => fiscalPeriod(item.occurred_on) === input.period);
      if (
        unresolvedStatements ||
        unresolvedActivity ||
        unresolvedRemoval ||
        unresolvedStripePayout ||
        invalidatedStripePayout
      )
        throw bad(
          "Bank or payment-settlement reconciliation exceptions for this period must be resolved before sign-off",
          409,
        );
    }
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
    configureBankFeedAccount,
    bankFeedOverview,
    bankFeedCandidates,
    matchBankFeedTransaction,
    previewProviderBankRecord,
    applyProviderBankRecord,
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
function requiredText(value, label, max) {
  const text = String(value || "").trim();
  if (!text || text.length > max)
    throw bad(`${label} is required and must be at most ${max} characters`);
  return text;
}
function isCalendarDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) &&
    !Number.isNaN(new Date(`${value}T00:00:00Z`).valueOf())
  );
}
function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}
function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
