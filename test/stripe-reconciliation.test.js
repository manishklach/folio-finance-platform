import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";

function stripeLedger() {
  const ledger = createLedger(":memory:");
  const connection = ledger.configureIntegration({
    provider: "stripe",
    display_name: "Stripe production mirror",
    environment: "sandbox",
    credential_secret_ref: "STRIPE_RECONCILIATION_TEST",
  });
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  return { ledger, connection };
}

function stage(ledger, connection, records, operation = "added") {
  const run = ledger.startIntegrationSync({ connection_id: connection.id, trigger: "webhook" });
  ledger.ingestIntegrationPage({
    sync_run_id: run.id,
    has_more: false,
    [operation]: records,
  });
  const expected = records[records.length - 1];
  return ledger
    .integrationRecords(connection.id)
    .find(
      (record) =>
        record.external_id === expected.external_id &&
        record.source_version === expected.source_version,
    );
}

function approve(ledger, record, targetEntityId = undefined) {
  return ledger.applyStripeRecordApplication({
    record_id: record.id,
    approved: true,
    approval_note: "Controller verified provider-to-subledger identity and amount",
    ...(targetEntityId === undefined ? {} : { target_entity_id: targetEntityId }),
  });
}

test("Stripe customer, invoice and charge reconcile to existing AR without duplicate journals", () => {
  const { ledger, connection } = stripeLedger();
  const journalCount = ledger.listJournals().length;
  const customer = stage(ledger, connection, [
    {
      object_type: "stripe_customer",
      external_id: "cus_acme",
      source_version: "customer-v1",
      normalized: { customer_name: "Acme Robotics", livemode: true },
    },
  ]);
  assert.equal(
    ledger.previewStripeRecordApplication({ record_id: customer.id }).candidates.length,
    4,
  );
  approve(ledger, customer, 1);

  const invoice = stage(ledger, connection, [
    {
      object_type: "stripe_invoice",
      external_id: "in_acme_1001",
      source_version: "invoice-v1",
      effective_at: "2026-06-01T00:00:00.000Z",
      normalized: {
        customer_external_id: "cus_acme",
        amount_cents: 15_500_000,
        amount_due_cents: 15_500_000,
        currency: "usd",
        status: "open",
      },
    },
  ]);
  const invoicePreview = ledger.previewStripeRecordApplication({ record_id: invoice.id });
  assert.deepEqual(
    invoicePreview.candidates.map((item) => item.id),
    [1],
  );
  approve(ledger, invoice, 1);

  const payment = ledger.recordPayment({
    customer_id: 1,
    entity_id: 1,
    payment_number: "STRIPE-CH-1",
    payment_date: "2026-08-20",
    amount_cents: 1_000_000,
    method: "card",
    reference: "ch_acme_1",
  });
  const afterPayment = ledger.listJournals().length;
  const charge = stage(ledger, connection, [
    {
      object_type: "stripe_charge",
      external_id: "ch_acme_1",
      source_version: "charge-v1",
      effective_at: "2026-08-20T00:00:00.000Z",
      normalized: {
        customer_external_id: "cus_acme",
        invoice_external_id: "in_acme_1001",
        amount_cents: 1_000_000,
        currency: "usd",
        paid: true,
        status: "succeeded",
      },
    },
  ]);
  assert.deepEqual(
    ledger
      .previewStripeRecordApplication({ record_id: charge.id })
      .candidates.map((item) => item.id),
    [payment.id],
  );
  approve(ledger, charge, payment.id);
  assert.equal(ledger.listJournals().length, afterPayment);
  assert.ok(
    ledger.listJournals().length > journalCount,
    "only Folio's payment operation posts cash",
  );
  assert.equal(ledger.stripeReconciliationOverview(connection.id).metrics.matched, 3);
  ledger.close();
});

test("Stripe payout requires balanced components and a matched bank-feed deposit", () => {
  const { ledger, connection } = stripeLedger();
  const component = stage(ledger, connection, [
    {
      object_type: "stripe_balance_transaction",
      external_id: "txn_net_1",
      source_version: "balance-v1",
      effective_at: "2026-08-21T00:00:00.000Z",
      normalized: {
        payout_external_id: "po_1",
        amount_cents: 100_000,
        fee_cents: 3_000,
        net_cents: 97_000,
        currency: "usd",
        transaction_type: "charge",
      },
    },
  ]);
  approve(ledger, component);

  const cashAccount = ledger.getAccounts().find((account) => account.code === "1000");
  const clearing = ledger.getAccounts().find((account) => account.code === "2150");
  const deposit = ledger.createDraft({
    date: "2026-08-22",
    memo: "Stripe payout deposit po_1",
    source: "cash_receipts",
    lines: [
      { account_id: cashAccount.id, debit_cents: 97_000, credit_cents: 0 },
      { account_id: clearing.id, debit_cents: 0, credit_cents: 97_000 },
    ],
  });
  ledger.postJournal(deposit.id);
  const plaid = ledger.configureIntegration({
    provider: "plaid",
    display_name: "Operating bank",
    environment: "sandbox",
    credential_secret_ref: "PLAID_PAYOUT_TEST",
  });
  ledger.setIntegrationStatus({ connection_id: plaid.id, status: "active" });
  ledger.configureBankFeedAccount({
    connection_id: plaid.id,
    external_account_id: "bank-operating",
    cash_account_id: cashAccount.id,
    display_name: "Operating account",
    currency: "USD",
  });
  const bankRecord = stage(ledger, plaid, [
    {
      object_type: "bank_transaction",
      external_id: "bank-po-1",
      source_version: "bank-v1",
      effective_at: "2026-08-22T00:00:00.000Z",
      normalized: {
        account_external_id: "bank-operating",
        occurred_on: "2026-08-22",
        description: "STRIPE PAYOUT PO_1",
        cash_amount_cents: 97_000,
        currency: "USD",
        pending: false,
      },
    },
  ]);
  const appliedBank = ledger.applyBankFeedRecord({
    record_id: bankRecord.id,
    approved: true,
    approval_note: "Verified exact payout deposit against posted cash",
  });
  assert.equal(appliedBank.transaction.status, "matched");

  const payout = stage(ledger, connection, [
    {
      object_type: "stripe_payout",
      external_id: "po_1",
      source_version: "payout-v1",
      effective_at: "2026-08-22T00:00:00.000Z",
      normalized: { amount_cents: 97_000, currency: "usd", status: "paid" },
    },
  ]);
  const preview = ledger.previewStripeRecordApplication({ record_id: payout.id });
  assert.equal(preview.ready, true);
  assert.deepEqual(
    preview.candidates.map((item) => item.id),
    [appliedBank.transaction.id],
  );
  assert.throws(
    () =>
      ledger.completeCloseItem({
        period: "2026-08",
        item_key: "bank_reconciled",
        evidence: "Settlement review",
      }),
    /payment-settlement reconciliation exceptions/,
  );
  approve(ledger, payout, appliedBank.transaction.id);
  assert.equal(
    ledger
      .completeCloseItem({
        period: "2026-08",
        item_key: "bank_reconciled",
        evidence: "Stripe payout matched to Plaid deposit and posted cash",
      })
      .find((item) => item.item_key === "bank_reconciled").completed,
    1,
  );
  assert.equal(ledger.stripeReconciliationOverview(connection.id).metrics.components, 1);

  const revisedComponent = stage(
    ledger,
    connection,
    [
      {
        object_type: "stripe_balance_transaction",
        external_id: "txn_net_1",
        source_version: "balance-v2",
        effective_at: "2026-08-22T00:00:00.000Z",
        normalized: {
          payout_external_id: "po_1",
          amount_cents: 100_000,
          fee_cents: 3_000,
          net_cents: 97_000,
          currency: "usd",
          transaction_type: "charge",
        },
      },
    ],
    "modified",
  );
  approve(ledger, revisedComponent);
  assert.equal(ledger.stripeReconciliationOverview(connection.id).metrics.exceptions, 1);
  assert.throws(
    () =>
      ledger.completeCloseItem({
        period: "2026-08",
        item_key: "bank_reconciled",
        evidence: "Recheck after component revision",
      }),
    /payment-settlement reconciliation exceptions/,
  );
  const revisedPayout = stage(
    ledger,
    connection,
    [
      {
        object_type: "stripe_payout",
        external_id: "po_1",
        source_version: "payout-v2",
        effective_at: "2026-08-22T00:00:00.000Z",
        normalized: { amount_cents: 97_000, currency: "usd", status: "paid" },
      },
    ],
    "modified",
  );
  approve(ledger, revisedPayout, appliedBank.transaction.id);
  assert.equal(ledger.stripeReconciliationOverview(connection.id).metrics.exceptions, 0);
  ledger.close();
});

test("Stripe changes supersede prior matches and removed objects retain the lineage", () => {
  const { ledger, connection } = stripeLedger();
  const first = stage(ledger, connection, [
    {
      object_type: "stripe_customer",
      external_id: "cus_changed",
      source_version: "v1",
      normalized: { customer_name: "Acme Robotics" },
    },
  ]);
  approve(ledger, first, 1);
  const changed = stage(
    ledger,
    connection,
    [
      {
        object_type: "stripe_customer",
        external_id: "cus_changed",
        source_version: "v2",
        normalized: { customer_name: "Acme Robotics LLC" },
      },
    ],
    "modified",
  );
  approve(ledger, changed, 1);
  const removed = stage(
    ledger,
    connection,
    [
      {
        object_type: "stripe_customer",
        external_id: "cus_changed",
        source_version: "v3",
        normalized: {},
      },
    ],
    "removed",
  );
  approve(ledger, removed);
  const rows = ledger.stripeReconciliationOverview(connection.id).records;
  assert.deepEqual(rows.map((row) => row.status).sort(), ["removed", "superseded", "superseded"]);
  assert.equal(rows.find((row) => row.status === "removed").supersedes_id != null, true);
  ledger.close();
});

test("Stripe removals fail closed when no applied source version exists", () => {
  const { ledger, connection } = stripeLedger();
  const removed = stage(
    ledger,
    connection,
    [
      {
        object_type: "stripe_charge",
        external_id: "ch_never_seen",
        source_version: "missing-v1",
        normalized: {},
      },
    ],
    "removed",
  );
  const preview = ledger.previewStripeRecordApplication({ record_id: removed.id });
  assert.equal(preview.ready, false);
  assert.match(preview.issues.join(" "), /no applied reconciliation version/);
  assert.equal(approve(ledger, removed).status, "error");
  assert.equal(ledger.integrationDeadLetters().at(0).error_code, "STRIPE_RECONCILIATION_FAILED");
  ledger.close();
});
