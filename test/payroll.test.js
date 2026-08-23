import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { runWithRequestContext } from "../lib/request-context.js";

function setup() {
  const ledger = createLedger(":memory:");
  const connection = ledger.configureIntegration({
    provider: "gusto",
    display_name: "Gusto payroll",
    environment: "sandbox",
    credential_secret_ref: "GUSTO_PAYROLL_TEST",
    external_account_id: "company-123",
  });
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  return { ledger, connection };
}

function stage(ledger, connection, normalized, operation = "added", version = "v1") {
  const sync = ledger.startIntegrationSync({ connection_id: connection.id, trigger: "webhook" });
  ledger.ingestIntegrationPage({
    sync_run_id: sync.id,
    has_more: false,
    [operation]: [
      {
        object_type: "payroll_run",
        external_id: "payroll-001",
        source_version: version,
        effective_at: "2026-08-20T18:00:00.000Z",
        normalized,
      },
    ],
  });
  return ledger
    .integrationRecords(connection.id)
    .find((item) => item.source_version === version && item.operation === operation);
}

function payroll(overrides = {}) {
  return {
    check_date: "2026-08-20",
    period_start: "2026-08-01",
    period_end: "2026-08-15",
    payroll_type: "regular",
    currency: "USD",
    processed: true,
    gross_pay_cents: 1_000_000,
    net_pay_cents: 700_000,
    employer_taxes_cents: 80_000,
    employee_taxes_cents: 200_000,
    employee_benefits_cents: 60_000,
    employer_benefits_cents: 20_000,
    reimbursements_cents: 10_000,
    company_debit_cents: 700_000,
    net_pay_debit_cents: 700_000,
    tax_debit_cents: 0,
    reimbursement_debit_cents: 0,
    child_support_debit_cents: 0,
    ...overrides,
  };
}

test("Gusto payroll creates a balanced controlled accrual and reconciles disclosed cash", () => {
  const { ledger, connection } = setup();
  const record = stage(ledger, connection, payroll());
  const preview = ledger.previewPayrollRecordApplication({ record_id: record.id });
  assert.equal(preview.ready, true);
  assert.equal(preview.normalized.employee_deductions_cents, 100_000);
  assert.equal(
    preview.journal_lines.reduce(
      (sum, line) => sum + (line.side === "debit" ? line.amount_cents : -line.amount_cents),
      0,
    ),
    0,
  );

  const applied = runWithRequestContext({ actor: "payroll-reviewer" }, () =>
    ledger.applyPayrollRecordApplication({
      record_id: record.id,
      approved: true,
      approval_note: "Reviewed payroll totals, dates, debit components and liability crossfoot",
    }),
  );
  assert.equal(applied.journal.status, "draft");
  assert.throws(
    () =>
      runWithRequestContext({ actor: "payroll-reviewer" }, () =>
        ledger.postJournal(applied.journal.id),
      ),
    /different approver/,
  );
  runWithRequestContext({ actor: "controller-poster" }, () =>
    ledger.postJournal(applied.journal.id),
  );
  assert.equal(
    ledger
      .completeCloseItem({
        period: "2026-08",
        item_key: "accruals_posted",
        evidence: "Payroll accrual independently posted",
      })
      .find((item) => item.item_key === "accruals_posted").completed,
    1,
  );

  const settlement = ledger.payrollOverview(connection.id).runs[0].settlements[0];
  const cash = ledger.getAccounts().find((account) => account.code === "1000");
  const prepared = runWithRequestContext({ actor: "treasury-preparer" }, () =>
    ledger.createPayrollSettlementDraft({
      settlement_id: settlement.id,
      cash_account_id: cash.id,
      settlement_date: "2026-08-20",
      approved: true,
      approval_note: "Prepared exact disclosed Gusto net-pay bank debit",
    }),
  );
  assert.throws(
    () =>
      runWithRequestContext({ actor: "treasury-preparer" }, () =>
        ledger.postJournal(prepared.journal.id),
      ),
    /different approver/,
  );
  runWithRequestContext({ actor: "controller-poster" }, () =>
    ledger.postJournal(prepared.journal.id),
  );

  const plaid = ledger.configureIntegration({
    provider: "plaid",
    display_name: "Operating bank",
    environment: "sandbox",
    credential_secret_ref: "PLAID_PAYROLL_TEST",
  });
  ledger.setIntegrationStatus({ connection_id: plaid.id, status: "active" });
  ledger.configureBankFeedAccount({
    connection_id: plaid.id,
    external_account_id: "operating",
    cash_account_id: cash.id,
    display_name: "Operating account",
    currency: "USD",
  });
  const bankRecord = stageBank(ledger, plaid, -700_000);
  const bank = ledger.applyBankFeedRecord({
    record_id: bankRecord.id,
    approved: true,
    approval_note: "Verified exact payroll withdrawal against posted settlement cash",
  });
  assert.equal(bank.transaction.status, "matched");
  assert.throws(
    () =>
      ledger.completeCloseItem({
        period: "2026-08",
        item_key: "bank_reconciled",
        evidence: "Payroll cash pending subledger sign-off",
      }),
    /payroll-settlement/,
  );
  const reconciled = ledger.reconcilePayrollSettlement({
    settlement_id: settlement.id,
    approved: true,
    approval_note: "Matched Gusto debit to Plaid and the independently posted cash line",
  });
  assert.equal(reconciled.status, "reconciled");
  assert.equal(
    ledger
      .completeCloseItem({
        period: "2026-08",
        item_key: "bank_reconciled",
        evidence: "Gusto settlement tied to Plaid and posted cash",
      })
      .find((item) => item.item_key === "bank_reconciled").completed,
    1,
  );
  ledger.close();
});

test("payroll validation fails closed on missing totals, crossfoot errors and posted changes", () => {
  const { ledger, connection } = setup();
  const invalid = stage(
    ledger,
    connection,
    payroll({ company_debit_cents: 699_999, employee_taxes_cents: null }),
  );
  const invalidPreview = ledger.previewPayrollRecordApplication({ record_id: invalid.id });
  assert.equal(invalidPreview.ready, false);
  assert.match(invalidPreview.issues.join(" "), /missing employee_taxes_cents/);
  assert.match(invalidPreview.issues.join(" "), /company debit/);
  ledger.close();

  const second = setup();
  const original = stage(second.ledger, second.connection, payroll());
  const applied = runWithRequestContext({ actor: "reviewer" }, () =>
    second.ledger.applyPayrollRecordApplication({
      record_id: original.id,
      approved: true,
      approval_note: "Approved original payroll source totals",
    }),
  );
  runWithRequestContext({ actor: "poster" }, () => second.ledger.postJournal(applied.journal.id));
  const changed = stage(
    second.ledger,
    second.connection,
    payroll({ gross_pay_cents: 1_001_000, net_pay_cents: 701_000 }),
    "modified",
    "v2",
  );
  const changePreview = second.ledger.previewPayrollRecordApplication({ record_id: changed.id });
  assert.equal(changePreview.ready, false);
  assert.match(changePreview.issues.join(" "), /approved reversal/);
  second.ledger.close();
});

test("external payrolls accrue with zero provider cash when debit totals are omitted", () => {
  const { ledger, connection } = setup();
  const normalized = payroll({ payroll_type: "external" });
  for (const field of [
    "company_debit_cents",
    "net_pay_debit_cents",
    "tax_debit_cents",
    "reimbursement_debit_cents",
    "child_support_debit_cents",
  ])
    delete normalized[field];
  const record = stage(ledger, connection, normalized);
  const preview = ledger.previewPayrollRecordApplication({ record_id: record.id });
  assert.equal(preview.ready, true);
  assert.deepEqual(preview.settlement_components, []);
  ledger.close();
});

test("an unsettled posted payroll removal creates an independently posted reversal draft", () => {
  const { ledger, connection } = setup();
  const original = stage(
    ledger,
    connection,
    payroll({ company_debit_cents: 0, net_pay_debit_cents: 0 }),
  );
  const applied = runWithRequestContext({ actor: "reviewer" }, () =>
    ledger.applyPayrollRecordApplication({
      record_id: original.id,
      approved: true,
      approval_note: "Approved payroll accrual with manual settlement",
    }),
  );
  runWithRequestContext({ actor: "poster" }, () => ledger.postJournal(applied.journal.id));
  const removed = stage(ledger, connection, {}, "removed", "v2");
  const result = runWithRequestContext({ actor: "reversal-reviewer" }, () =>
    ledger.applyPayrollRecordApplication({
      record_id: removed.id,
      approved: true,
      approval_note: "Approved source removal and exact reversal of original accrual",
    }),
  );
  assert.equal(result.payroll_run.status, "reversal_draft");
  assert.equal(result.journal.status, "draft");
  assert.equal(
    result.journal.lines.reduce((sum, line) => sum + line.debit_cents - line.credit_cents, 0),
    0,
  );
  assert.throws(
    () =>
      runWithRequestContext({ actor: "reversal-reviewer" }, () =>
        ledger.postJournal(result.journal.id),
      ),
    /different approver/,
  );
  ledger.close();
});

function stageBank(ledger, plaid, amount) {
  const sync = ledger.startIntegrationSync({ connection_id: plaid.id, trigger: "webhook" });
  ledger.ingestIntegrationPage({
    sync_run_id: sync.id,
    has_more: false,
    added: [
      {
        object_type: "bank_transaction",
        external_id: "bank-gusto-001",
        source_version: "bank-v1",
        effective_at: "2026-08-20T00:00:00.000Z",
        normalized: {
          account_external_id: "operating",
          occurred_on: "2026-08-20",
          description: "GUSTO NET PAY PAYROLL-001",
          cash_amount_cents: amount,
          currency: "USD",
          pending: false,
        },
      },
    ],
  });
  return ledger.integrationRecords(plaid.id).find((item) => item.external_id === "bank-gusto-001");
}
