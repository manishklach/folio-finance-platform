import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentActor } from "./request-context.js";

const componentAccounts = {
  net_pay: "2160",
  taxes: "2170",
  reimbursements: "2165",
  child_support: "2196",
};

export function migratePayroll(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS payroll_runs (
      id TEXT PRIMARY KEY,
      integration_record_id TEXT NOT NULL UNIQUE REFERENCES integration_records(id),
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      external_id TEXT NOT NULL,
      source_version TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('added','modified','removed')),
      check_date TEXT NOT NULL,
      period_start TEXT,
      period_end TEXT,
      payroll_type TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      gross_pay_cents INTEGER NOT NULL,
      net_pay_cents INTEGER NOT NULL,
      employer_taxes_cents INTEGER NOT NULL,
      employee_taxes_cents INTEGER NOT NULL,
      employee_deductions_cents INTEGER NOT NULL,
      employee_benefits_cents INTEGER NOT NULL,
      other_deductions_cents INTEGER NOT NULL,
      employer_benefits_cents INTEGER NOT NULL,
      reimbursements_cents INTEGER NOT NULL,
      company_debit_cents INTEGER NOT NULL,
      accounting_journal_id INTEGER REFERENCES journal_entries(id),
      status TEXT NOT NULL CHECK(status IN ('draft','reversal_draft','removed','superseded','exception')),
      supersedes_id TEXT REFERENCES payroll_runs(id),
      approved_by TEXT NOT NULL,
      approval_note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payroll_settlements (
      id TEXT PRIMARY KEY,
      payroll_run_id TEXT NOT NULL REFERENCES payroll_runs(id),
      component_type TEXT NOT NULL CHECK(component_type IN ('net_pay','taxes','reimbursements','child_support')),
      expected_cents INTEGER NOT NULL CHECK(expected_cents > 0),
      liability_account_id INTEGER NOT NULL REFERENCES accounts(id),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','draft','reconciled','superseded','exception')),
      journal_entry_id INTEGER REFERENCES journal_entries(id),
      bank_feed_transaction_id TEXT UNIQUE REFERENCES bank_feed_transactions(id),
      settlement_date TEXT,
      prepared_by TEXT,
      preparation_note TEXT,
      reconciled_by TEXT,
      reconciliation_note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(payroll_run_id,component_type)
    );
    CREATE INDEX IF NOT EXISTS idx_payroll_runs_external ON payroll_runs(connection_id,external_id,created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payroll_runs_date ON payroll_runs(check_date,status);
    CREATE INDEX IF NOT EXISTS idx_payroll_settlements_status ON payroll_settlements(status,settlement_date);
  `);
}

export function createPayrollRepository(db, ledger) {
  function overview(connectionId = null) {
    const where = connectionId ? "WHERE r.connection_id=?" : "";
    const args = connectionId ? [connectionId] : [];
    const runs = db
      .prepare(
        `SELECT r.*,j.status accounting_status,c.display_name connection_name
         FROM payroll_runs r JOIN integration_connections c ON c.id=r.connection_id
         LEFT JOIN journal_entries j ON j.id=r.accounting_journal_id
         ${where} ORDER BY r.check_date DESC,r.created_at DESC LIMIT 250`,
      )
      .all(...args)
      .map((run) => ({ ...run, settlements: settlementsFor(run.id) }));
    const settlements = runs.flatMap((run) => run.settlements);
    return {
      runs,
      metrics: {
        runs: runs.filter((run) => !["superseded", "removed"].includes(run.status)).length,
        draft_accruals: runs.filter(
          (run) =>
            ["draft", "reversal_draft"].includes(run.status) && run.accounting_status === "draft",
        ).length,
        open_settlements: settlements.filter((item) => item.effective_status !== "reconciled")
          .length,
        reconciled_settlements: settlements.filter((item) => item.effective_status === "reconciled")
          .length,
      },
    };
  }

  function preview(record, connection) {
    const issues = [];
    if (connection.provider !== "gusto" || record.object_type !== "payroll_run")
      issues.push("Native payroll application requires a Gusto payroll run");
    const previous = currentRun(connection.id, record.external_id);
    if (record.status === "applied") issues.push("Record is already applied");
    if (record.operation === "removed") {
      if (!previous) issues.push("Removed payroll has no applied source version");
      if (previous?.accounting_journal_id) {
        const journal = db
          .prepare("SELECT status FROM journal_entries WHERE id=?")
          .get(previous.accounting_journal_id);
        if (journal?.status === "posted" && startedSettlements(previous.id))
          issues.push(
            "A settled payroll cannot be reversed until its cash recoveries are recorded",
          );
      }
      return payrollPreview(
        record,
        previous ? sourceFromRun(previous) : record.normalized,
        issues,
        previous,
      );
    }
    if (record.operation !== "removed" && previous?.accounting_journal_id) {
      const journal = db
        .prepare("SELECT status FROM journal_entries WHERE id=?")
        .get(previous.accounting_journal_id);
      if (journal?.status === "posted")
        issues.push("A posted payroll change requires an approved reversal before replacement");
      if (startedSettlements(previous.id))
        issues.push("A payroll with settlement activity cannot be replaced in place");
    }
    return payrollPreview(record, record.normalized, issues, previous);
  }

  function payrollPreview(record, normalized, initialIssues, previous) {
    const issues = [...initialIssues];
    const checkDate = dateOnly(normalized.check_date || record.effective_at);
    if (!calendarDate(checkDate)) issues.push("Payroll check date must use YYYY-MM-DD");
    if (record.operation !== "removed" && normalized.processed !== true)
      issues.push("Only a processed Gusto payroll can enter the accounting subledger");
    const fields = [
      "gross_pay_cents",
      "net_pay_cents",
      "employer_taxes_cents",
      "employee_taxes_cents",
      "employee_benefits_cents",
      "employer_benefits_cents",
      "reimbursements_cents",
      "company_debit_cents",
      "net_pay_debit_cents",
      "tax_debit_cents",
      "reimbursement_debit_cents",
      "child_support_debit_cents",
    ];
    if (record.operation !== "removed")
      for (const [index, field] of fields.entries())
        if (normalized[field] === undefined || normalized[field] === null)
          if (index < 7 || normalized.payroll_type !== "external")
            issues.push(`Gusto payroll totals are missing ${field}`);
    const amounts = Object.fromEntries(
      fields.map((field) => [field, nonnegative(normalized[field], field, issues)]),
    );
    const employeeDeductions =
      amounts.gross_pay_cents - amounts.net_pay_cents - amounts.employee_taxes_cents;
    if (employeeDeductions < 0) issues.push("Gross pay must cover net pay and employee taxes");
    if (amounts.employee_benefits_cents > Math.max(0, employeeDeductions))
      issues.push("Employee benefit deductions exceed total employee deductions");
    const otherDeductions = Math.max(0, employeeDeductions - amounts.employee_benefits_cents);
    const taxLiability = amounts.employee_taxes_cents + amounts.employer_taxes_cents;
    if (amounts.net_pay_debit_cents > amounts.net_pay_cents)
      issues.push("Net-pay bank debit exceeds net payroll payable");
    if (amounts.tax_debit_cents > taxLiability)
      issues.push("Tax bank debit exceeds employee and employer tax liability");
    if (amounts.reimbursement_debit_cents > amounts.reimbursements_cents)
      issues.push("Reimbursement bank debit exceeds reimbursements payable");
    if (amounts.child_support_debit_cents > otherDeductions)
      issues.push("Child-support debit exceeds non-benefit employee deductions");
    const cashComponents =
      amounts.net_pay_debit_cents +
      amounts.tax_debit_cents +
      amounts.reimbursement_debit_cents +
      amounts.child_support_debit_cents;
    if (cashComponents !== amounts.company_debit_cents)
      issues.push("Gusto company debit must equal its disclosed bank-debit components");
    const currency = String(normalized.currency || "USD").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) issues.push("Payroll currency must be a three-letter code");
    else if (currency !== "USD")
      issues.push("This Gusto payroll subledger currently supports USD only");
    if (amounts.gross_pay_cents <= 0 && record.operation !== "removed")
      issues.push("Gross payroll must be greater than zero");
    const model = {
      ...amounts,
      employee_deductions_cents: Math.max(0, employeeDeductions),
      other_deductions_cents: otherDeductions,
      check_date: checkDate,
      period_start: dateOnly(normalized.period_start),
      period_end: dateOnly(normalized.period_end),
      payroll_type: normalized.payroll_type || null,
      currency,
    };
    return {
      record: pickRecord(record),
      normalized: model,
      previous: previous ? { id: previous.id, status: previous.status } : null,
      journal_lines: record.operation === "removed" ? [] : journalBlueprint(model),
      settlement_components: settlementBlueprint(model),
      issues: [...new Set(issues)],
      ready: issues.length === 0 && record.status !== "applied",
    };
  }

  function apply(record, connection, input) {
    if (input.approved !== true) throw bad("Explicit payroll application approval is required");
    const note = z.string().trim().min(5).max(500).parse(input.approval_note);
    const existing = db
      .prepare("SELECT * FROM payroll_runs WHERE integration_record_id=?")
      .get(record.id);
    if (existing) return { duplicate: true, status: "applied", payroll_run: hydrateRun(existing) };
    const review = preview(record, connection);
    if (!review.ready) return { duplicate: false, status: "error", preview: review };
    const previous = currentRun(connection.id, record.external_id);
    const owns = !db.isTransaction;
    if (owns) db.exec("BEGIN IMMEDIATE");
    try {
      if (previous) supersede(previous);
      const id = randomUUID();
      let journal = null;
      let status = "removed";
      if (record.operation === "removed") {
        const priorJournal = db
          .prepare("SELECT * FROM journal_entries WHERE id=?")
          .get(previous.accounting_journal_id);
        if (priorJournal?.status === "draft") {
          db.prepare("UPDATE journal_entries SET status='voided' WHERE id=?").run(priorJournal.id);
        } else if (priorJournal?.status === "posted") {
          journal = reversingDraft(previous, review.normalized.check_date);
          status = "reversal_draft";
        }
      } else {
        journal = createAccrualDraft(record.external_id, review.normalized);
        status = "draft";
      }
      insertRun(
        id,
        record,
        connection,
        review.normalized,
        journal?.id || null,
        status,
        previous,
        note,
      );
      if (record.operation !== "removed") insertSettlements(id, review.normalized);
      if (owns) db.exec("COMMIT");
      return { duplicate: false, status: "applied", payroll_run: run(id), journal };
    } catch (error) {
      if (owns && db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function createSettlementDraft(input) {
    if (input.approved !== true) throw bad("Explicit payroll settlement approval is required");
    const note = z.string().trim().min(5).max(500).parse(input.approval_note);
    const settlementRecord = findSettlement(input.settlement_id);
    if (settlementRecord.status !== "open")
      throw bad("Only an open payroll settlement can create a draft", 409);
    const runRow = db
      .prepare("SELECT * FROM payroll_runs WHERE id=?")
      .get(settlementRecord.payroll_run_id);
    const accrual = db
      .prepare("SELECT status FROM journal_entries WHERE id=?")
      .get(runRow.accounting_journal_id);
    if (accrual?.status !== "posted")
      throw bad("Post the payroll accrual before preparing settlement", 409);
    const cash = db
      .prepare("SELECT id,code,name FROM accounts WHERE id=? AND type='asset' AND active=1")
      .get(Number(input.cash_account_id));
    if (!cash) throw bad("Active cash account not found");
    const date = dateOnly(input.settlement_date);
    if (!calendarDate(date)) throw bad("Settlement date must use YYYY-MM-DD");
    if (Math.abs(daysBetween(runRow.check_date, date)) > 14)
      throw bad("Settlement date must be within 14 days of the payroll check date");
    const journal = ledger.createDraft({
      date,
      memo: `Gusto ${labelComponent(settlementRecord.component_type)} settlement · ${runRow.external_id}`,
      source: "payroll_settlement",
      lines: [
        {
          account_id: settlementRecord.liability_account_id,
          debit_cents: settlementRecord.expected_cents,
          credit_cents: 0,
        },
        { account_id: cash.id, debit_cents: 0, credit_cents: settlementRecord.expected_cents },
      ],
    });
    db.prepare(
      `UPDATE payroll_settlements SET status='draft',journal_entry_id=?,settlement_date=?,prepared_by=?,preparation_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    ).run(journal.id, date, currentActor(), note, settlementRecord.id);
    return { settlement: settlementView(settlementRecord.id), journal };
  }

  function reconcileSettlement(input) {
    if (input.approved !== true)
      throw bad("Explicit settlement reconciliation approval is required");
    const note = z.string().trim().min(5).max(500).parse(input.approval_note);
    const item = findSettlement(input.settlement_id);
    if (item.status !== "draft") throw bad("Settlement must have a prepared draft", 409);
    const journal = db
      .prepare("SELECT status FROM journal_entries WHERE id=?")
      .get(item.journal_entry_id);
    if (journal?.status !== "posted")
      throw bad("Post the settlement journal before bank reconciliation", 409);
    const cashLine = db
      .prepare(
        `SELECT l.id FROM journal_lines l JOIN accounts a ON a.id=l.account_id
         WHERE l.entry_id=? AND a.type='asset' AND l.credit_cents=?`,
      )
      .get(item.journal_entry_id, item.expected_cents);
    const candidates = cashLine
      ? db
          .prepare(
            `SELECT * FROM bank_feed_transactions WHERE matched_line_id=? AND status='matched'`,
          )
          .all(cashLine.id)
      : [];
    if (candidates.length !== 1)
      throw bad(
        "Settlement requires one exact native bank-feed match to its posted cash line",
        409,
      );
    db.prepare(
      `UPDATE payroll_settlements SET status='reconciled',bank_feed_transaction_id=?,reconciled_by=?,reconciliation_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    ).run(candidates[0].id, currentActor(), note, item.id);
    return settlementView(item.id);
  }

  function run(id) {
    const row = db.prepare("SELECT * FROM payroll_runs WHERE id=?").get(id);
    if (!row) throw bad("Payroll run not found", 404);
    return hydrateRun(row);
  }
  function hydrateRun(row) {
    const journal = row.accounting_journal_id
      ? db.prepare("SELECT status FROM journal_entries WHERE id=?").get(row.accounting_journal_id)
      : null;
    return {
      ...row,
      accounting_status: journal?.status || null,
      settlements: settlementsFor(row.id),
    };
  }
  function settlementsFor(runId) {
    return db
      .prepare(
        `SELECT s.*,a.code liability_account_code,j.status journal_status
         FROM payroll_settlements s JOIN accounts a ON a.id=s.liability_account_id
         LEFT JOIN journal_entries j ON j.id=s.journal_entry_id WHERE s.payroll_run_id=? ORDER BY s.component_type`,
      )
      .all(runId)
      .map((item) => ({
        ...item,
        effective_status:
          item.status === "draft" && item.journal_status === "posted" ? "posted" : item.status,
      }));
  }
  function findSettlement(id) {
    const row = db.prepare("SELECT * FROM payroll_settlements WHERE id=?").get(id);
    if (!row) throw bad("Payroll settlement not found", 404);
    return row;
  }
  function settlementView(id) {
    return db
      .prepare(
        `SELECT s.*,a.code liability_account_code,j.status journal_status FROM payroll_settlements s
         JOIN accounts a ON a.id=s.liability_account_id LEFT JOIN journal_entries j ON j.id=s.journal_entry_id WHERE s.id=?`,
      )
      .get(id);
  }
  function currentRun(connectionId, externalId) {
    return db
      .prepare(
        `SELECT * FROM payroll_runs WHERE connection_id=? AND external_id=? AND status NOT IN ('superseded','removed') ORDER BY created_at DESC,id DESC LIMIT 1`,
      )
      .get(connectionId, externalId);
  }
  function startedSettlements(runId) {
    return Boolean(
      db
        .prepare(
          "SELECT 1 FROM payroll_settlements WHERE payroll_run_id=? AND status<>'open' LIMIT 1",
        )
        .get(runId),
    );
  }
  function supersede(previous) {
    db.prepare(
      "UPDATE payroll_runs SET status='superseded',updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(previous.id);
    db.prepare(
      "UPDATE payroll_settlements SET status='superseded',updated_at=CURRENT_TIMESTAMP WHERE payroll_run_id=? AND status='open'",
    ).run(previous.id);
    const journal = previous.accounting_journal_id
      ? db
          .prepare("SELECT status FROM journal_entries WHERE id=?")
          .get(previous.accounting_journal_id)
      : null;
    if (journal?.status === "draft")
      db.prepare("UPDATE journal_entries SET status='voided' WHERE id=?").run(
        previous.accounting_journal_id,
      );
  }

  function createAccrualDraft(externalId, model) {
    const accounts = accountMap();
    return ledger.createDraft({
      date: model.check_date,
      memo: `Gusto payroll accrual · ${externalId}`,
      source: "payroll_integration",
      lines: materializeLines(journalBlueprint(model), accounts),
    });
  }
  function reversingDraft(previous, date) {
    const lines = db
      .prepare(
        "SELECT account_id,debit_cents,credit_cents,description FROM journal_lines WHERE entry_id=? ORDER BY id",
      )
      .all(previous.accounting_journal_id)
      .map((line) => ({ ...line, debit_cents: line.credit_cents, credit_cents: line.debit_cents }));
    return ledger.createDraft({
      date,
      memo: `Gusto payroll reversal · ${previous.external_id}`,
      source: "payroll_integration",
      lines,
    });
  }
  function accountMap() {
    return new Map(ledger.getAccounts().map((account) => [account.code, account.id]));
  }
  function insertRun(id, record, connection, m, journalId, status, previous, note) {
    db.prepare(
      `INSERT INTO payroll_runs(id,integration_record_id,connection_id,external_id,source_version,operation,check_date,period_start,period_end,payroll_type,currency,gross_pay_cents,net_pay_cents,employer_taxes_cents,employee_taxes_cents,employee_deductions_cents,employee_benefits_cents,other_deductions_cents,employer_benefits_cents,reimbursements_cents,company_debit_cents,accounting_journal_id,status,supersedes_id,approved_by,approval_note)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      record.id,
      connection.id,
      record.external_id,
      record.source_version,
      record.operation,
      m.check_date,
      m.period_start,
      m.period_end,
      m.payroll_type,
      m.currency,
      m.gross_pay_cents,
      m.net_pay_cents,
      m.employer_taxes_cents,
      m.employee_taxes_cents,
      m.employee_deductions_cents,
      m.employee_benefits_cents,
      m.other_deductions_cents,
      m.employer_benefits_cents,
      m.reimbursements_cents,
      m.company_debit_cents,
      journalId,
      status,
      previous?.id || null,
      currentActor(),
      note,
    );
  }
  function insertSettlements(runId, model) {
    const accounts = accountMap();
    const insert = db.prepare(
      "INSERT INTO payroll_settlements(id,payroll_run_id,component_type,expected_cents,liability_account_id) VALUES(?,?,?,?,?)",
    );
    for (const item of settlementBlueprint(model))
      if (item.amount_cents > 0)
        insert.run(
          randomUUID(),
          runId,
          item.component_type,
          item.amount_cents,
          accounts.get(item.account_code),
        );
  }

  return {
    payrollOverview: overview,
    previewPayrollRecord: preview,
    applyPayrollRecord: apply,
    createPayrollSettlementDraft: createSettlementDraft,
    reconcilePayrollSettlement: reconcileSettlement,
  };
}

function journalBlueprint(m) {
  return [
    line("5200", "debit", m.gross_pay_cents, "Gross wages"),
    line("5210", "debit", m.employer_taxes_cents, "Employer payroll taxes"),
    line("5220", "debit", m.employer_benefits_cents, "Employer benefit contributions"),
    line("5230", "debit", m.reimbursements_cents, "Employee reimbursements"),
    line("2160", "credit", m.net_pay_cents, "Net payroll payable"),
    line(
      "2170",
      "credit",
      m.employee_taxes_cents + m.employer_taxes_cents,
      "Payroll taxes payable",
    ),
    line(
      "2195",
      "credit",
      m.employee_benefits_cents + m.employer_benefits_cents,
      "Benefit deductions and contributions payable",
    ),
    line("2196", "credit", m.other_deductions_cents, "Other payroll deductions payable"),
    line("2165", "credit", m.reimbursements_cents, "Employee reimbursements payable"),
  ].filter((item) => item.amount_cents > 0);
}
function settlementBlueprint(m) {
  return [
    {
      component_type: "net_pay",
      amount_cents: m.net_pay_debit_cents,
      account_code: componentAccounts.net_pay,
    },
    {
      component_type: "taxes",
      amount_cents: m.tax_debit_cents,
      account_code: componentAccounts.taxes,
    },
    {
      component_type: "reimbursements",
      amount_cents: m.reimbursement_debit_cents,
      account_code: componentAccounts.reimbursements,
    },
    {
      component_type: "child_support",
      amount_cents: m.child_support_debit_cents,
      account_code: componentAccounts.child_support,
    },
  ].filter((item) => item.amount_cents > 0);
}
function materializeLines(lines, accounts) {
  return lines.map((item) => ({
    account_id: accounts.get(item.account_code),
    description: item.description,
    debit_cents: item.side === "debit" ? item.amount_cents : 0,
    credit_cents: item.side === "credit" ? item.amount_cents : 0,
  }));
}
function line(accountCode, side, amountCents, description) {
  return { account_code: accountCode, side, amount_cents: amountCents, description };
}
function nonnegative(value, field, issues) {
  const amount = value == null ? 0 : Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    issues.push(`${field} must be nonnegative whole cents`);
    return 0;
  }
  return amount;
}
function pickRecord(record) {
  return {
    id: record.id,
    object_type: record.object_type,
    external_id: record.external_id,
    operation: record.operation,
    source_version: record.source_version,
    status: record.status,
  };
}
function sourceFromRun(run) {
  return {
    check_date: run.check_date,
    period_start: run.period_start,
    period_end: run.period_end,
    payroll_type: run.payroll_type,
    currency: run.currency,
    gross_pay_cents: run.gross_pay_cents,
    net_pay_cents: run.net_pay_cents,
    employer_taxes_cents: run.employer_taxes_cents,
    employee_taxes_cents: run.employee_taxes_cents,
    employee_benefits_cents: run.employee_benefits_cents,
    employer_benefits_cents: run.employer_benefits_cents,
    reimbursements_cents: run.reimbursements_cents,
    company_debit_cents: 0,
    net_pay_debit_cents: 0,
    tax_debit_cents: 0,
    reimbursement_debit_cents: 0,
    child_support_debit_cents: 0,
  };
}
function dateOnly(value) {
  return value ? String(value).slice(0, 10) : null;
}
function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
function daysBetween(a, b) {
  return (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000;
}
function labelComponent(value) {
  return String(value).replaceAll("_", " ");
}
function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
