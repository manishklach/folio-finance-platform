import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { runWithRequestContext } from "../lib/request-context.js";

function configuredLedger(provider = "plaid") {
  const ledger = createLedger(":memory:");
  const connection = ledger.configureIntegration({
    provider,
    display_name: `${provider} sandbox`,
    environment: "sandbox",
    credential_secret_ref: `${provider.toUpperCase()}_CREDENTIAL_REF`,
    webhook_secret_ref: `${provider.toUpperCase()}_WEBHOOK_REF`,
    settings: { region: "us" },
  });
  return { ledger, connection };
}

test("integration catalog declares the initial provider boundaries", () => {
  const ledger = createLedger(":memory:");
  assert.deepEqual(
    ledger.providerCatalog().map(({ provider }) => provider),
    ["plaid", "stripe", "gusto", "hubspot"],
  );
  ledger.close();
});

test("connection configuration stores references and rejects embedded secrets", () => {
  const ledger = createLedger(":memory:");
  assert.throws(
    () =>
      ledger.configureIntegration({
        provider: "stripe",
        environment: "sandbox",
        credential_secret_ref: "STRIPE_CREDENTIAL_REF",
        settings: { access_token: "must-not-be-stored" },
      }),
    /must be stored in a referenced secret/,
  );
  assert.throws(
    () =>
      ledger.configureIntegration({
        provider: "plaid",
        environment: "production",
        credential_secret_ref: "PLAID_CREDENTIAL_REF",
      }),
    /provider account identifier/,
  );
  const connection = ledger.configureIntegration({
    provider: "stripe",
    environment: "production",
    external_account_id: "acct_123",
    credential_secret_ref: "STRIPE_CREDENTIAL_REF",
  });
  assert.equal(connection.status, "configured");
  assert.equal(connection.credential_secret_ref, "STRIPE_CREDENTIAL_REF");
  assert.deepEqual(connection.settings, {});
  ledger.close();
});

test("cursor sync stages additions, changes and removals idempotently", () => {
  const { ledger, connection } = configuredLedger();
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const first = ledger.startIntegrationSync({ connection_id: connection.id, trigger: "webhook" });
  const succeeded = ledger.ingestIntegrationPage({
    sync_run_id: first.id,
    next_cursor: "cursor-1",
    has_more: false,
    added: [
      {
        object_type: "bank_transaction",
        external_id: "txn-1",
        source_version: "v1",
        normalized: { amount_cents: 1200, description: "Hosting" },
      },
    ],
    modified: [
      {
        object_type: "bank_transaction",
        external_id: "txn-2",
        source_version: "v2",
        normalized: { amount_cents: 3500 },
      },
    ],
    removed: [
      {
        object_type: "bank_transaction",
        external_id: "txn-3",
        source_version: "v3",
        normalized: {},
      },
    ],
  });
  assert.equal(succeeded.status, "succeeded");
  assert.deepEqual([succeeded.added, succeeded.modified, succeeded.removed], [1, 1, 1]);
  assert.equal(ledger.integrationConnection(connection.id).cursor, "cursor-1");
  assert.equal(ledger.integrationRecords(connection.id).length, 3);

  const replay = ledger.startIntegrationSync({ connection_id: connection.id });
  const replayed = ledger.ingestIntegrationPage({
    sync_run_id: replay.id,
    next_cursor: "cursor-2",
    has_more: false,
    added: [
      {
        object_type: "bank_transaction",
        external_id: "txn-1",
        source_version: "v1",
        normalized: { amount_cents: 1200, description: "Hosting" },
      },
    ],
  });
  assert.equal(replayed.duplicates, 1);
  assert.equal(ledger.integrationRecords(connection.id).length, 3);
  ledger.close();
});

test("failed synchronization creates an owned, resolvable exception", () => {
  const { ledger, connection } = configuredLedger("hubspot");
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const run = ledger.startIntegrationSync({ connection_id: connection.id });
  const failed = ledger.failIntegrationSync({
    sync_run_id: run.id,
    error_code: "RATE_LIMIT",
    error_message: "Provider rate limit reached",
    object_type: "deal",
    external_id: "deal-1",
    payload: { id: "deal-1" },
  });
  assert.equal(failed.run.status, "failed");
  assert.equal(failed.dead_letter.status, "open");
  assert.equal(ledger.integrationConnection(connection.id).status, "error");
  const resolved = ledger.resolveIntegrationDeadLetter({
    id: failed.dead_letter.id,
    status: "resolved",
    resolution: "Retried after provider window reset",
  });
  assert.equal(resolved.status, "resolved");
  assert.match(resolved.resolution, /Retried/);
  ledger.close();
});

function stageBankRecord(ledger, connection, normalized, operation = "added") {
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const run = ledger.startIntegrationSync({ connection_id: connection.id });
  ledger.ingestIntegrationPage({
    sync_run_id: run.id,
    next_cursor: "application-cursor",
    has_more: false,
    [operation]: [
      {
        object_type: "bank_transaction",
        external_id: `txn-${operation}`,
        source_version: "v1",
        normalized,
      },
    ],
  });
  return ledger.integrationRecords(connection.id)[0];
}

function configureBankJournalMappings(ledger, connection) {
  const definitions = [
    ["transaction_date", "date", "date", undefined],
    ["description", "memo", "identity", undefined],
    ["amount_cents", "amount_cents", "cents", undefined],
    ["debit", "debit_account_code", "identity", "5000"],
    ["credit", "credit_account_code", "identity", "1000"],
  ];
  for (const [source_field, target_field, transform, fallback] of definitions)
    ledger.createIntegrationMapping({
      connection_id: connection.id,
      object_type: "bank_transaction",
      source_field,
      target_field,
      transform,
      ...(fallback === undefined ? { required: true } : { default: fallback }),
    });
}

function stageProviderRecord(
  ledger,
  connection,
  { external_id, source_version, normalized, operation = "added" },
) {
  if (ledger.integrationConnection(connection.id).status !== "active")
    ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const run = ledger.startIntegrationSync({ connection_id: connection.id });
  ledger.ingestIntegrationPage({
    sync_run_id: run.id,
    next_cursor: `${external_id}-${source_version}`,
    has_more: false,
    added:
      operation === "added"
        ? [{ object_type: "bank_transaction", external_id, source_version, normalized }]
        : [],
    modified:
      operation === "modified"
        ? [{ object_type: "bank_transaction", external_id, source_version, normalized }]
        : [],
    removed:
      operation === "removed"
        ? [{ object_type: "bank_transaction", external_id, source_version, normalized: {} }]
        : [],
  });
  return ledger
    .integrationRecords(connection.id)
    .find(
      (record) => record.external_id === external_id && record.source_version === source_version,
    );
}

function nativeBankRecord(overrides = {}) {
  return {
    account_external_id: "plaid-checking-1",
    occurred_on: "2026-08-22",
    authorized_on: "2026-08-21",
    description: "Cloud vendor ACH",
    merchant_name: "Cloud Vendor",
    cash_amount_cents: -4321,
    currency: "USD",
    pending: false,
    ...overrides,
  };
}

function postCashLine(ledger, amountCents, date = "2026-08-22", memo = "Cash activity") {
  const accounts = Object.fromEntries(
    ledger.getAccounts().map((account) => [account.code, account]),
  );
  const cashDebit = Math.max(amountCents, 0);
  const cashCredit = Math.max(-amountCents, 0);
  const otherDebit = cashCredit;
  const otherCredit = cashDebit;
  const draft = ledger.createDraft({
    date,
    memo,
    source: "manual",
    lines: [
      { account_id: accounts["1000"].id, debit_cents: cashDebit, credit_cents: cashCredit },
      { account_id: accounts["5000"].id, debit_cents: otherDebit, credit_cents: otherCredit },
    ],
  });
  return ledger.postJournal(draft.id);
}

test("mapped provider records require preview and approval before creating an idempotent draft", () => {
  const { ledger, connection } = configuredLedger();
  configureBankJournalMappings(ledger, connection);
  const record = stageBankRecord(ledger, connection, {
    transaction_date: "2026-08-21T14:00:00.000Z",
    description: "Provider hosting debit",
    amount_cents: 1275,
  });

  const preview = ledger.previewIntegrationRecordApplication({ record_id: record.id });
  assert.equal(preview.ready, true);
  assert.deepEqual(preview.mapped, {
    amount_cents: 1275,
    credit_account_code: "1000",
    date: "2026-08-21",
    debit_account_code: "5000",
    memo: "Provider hosting debit",
  });
  assert.throws(
    () => ledger.applyIntegrationRecord({ record_id: record.id, approval_note: "Reviewed" }),
    /Explicit accounting application approval/,
  );

  const applied = runWithRequestContext({ actor: "operator-a" }, () =>
    ledger.applyIntegrationRecord({
      record_id: record.id,
      approved: true,
      approval_note: "Reviewed provider lineage and mapped accounts",
      mapping_fingerprint: preview.mapping_fingerprint,
    }),
  );
  assert.equal(applied.status, "applied");
  assert.equal(applied.journal.status, "draft");
  assert.equal(applied.journal.source, "provider_integration");
  assert.equal(ledger.integrationRecord(record.id).applied_entity_id, String(applied.journal.id));
  assert.throws(
    () =>
      runWithRequestContext({ actor: "operator-a" }, () => ledger.postJournal(applied.journal.id)),
    /different approver/,
  );
  const posted = runWithRequestContext({ actor: "approver-b" }, () =>
    ledger.postJournal(applied.journal.id),
  );
  assert.equal(posted.status, "posted");

  const replay = ledger.applyIntegrationRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Repeated request must not create another draft",
  });
  assert.equal(replay.duplicate, true);
  assert.equal(replay.journal.id, applied.journal.id);
  ledger.close();
});

test("mapping validation failures enter one retryable exception and stale previews fail closed", () => {
  const { ledger, connection } = configuredLedger();
  const record = stageBankRecord(ledger, connection, {
    transaction_date: "2026-08-21",
    description: "Unmapped debit",
    amount_cents: 600,
  });
  const failed = ledger.applyIntegrationRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Attempted after source review",
  });
  assert.equal(failed.status, "error");
  assert.equal(failed.exception.error_code, "MAPPING_VALIDATION_FAILED");
  const repeated = ledger.applyIntegrationRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Repeated mapping validation attempt",
  });
  assert.equal(repeated.exception.id, failed.exception.id);

  configureBankJournalMappings(ledger, connection);
  const preview = ledger.previewIntegrationRecordApplication({ record_id: record.id });
  ledger.createIntegrationMapping({
    connection_id: connection.id,
    object_type: "bank_transaction",
    source_field: "description",
    target_field: "memo",
    transform: "uppercase",
    required: true,
    version: 2,
  });
  assert.throws(
    () =>
      ledger.applyIntegrationRecord({
        record_id: record.id,
        approved: true,
        approval_note: "Approval against an old mapping preview",
        mapping_fingerprint: preview.mapping_fingerprint,
      }),
    /Mappings changed after preview/,
  );
  ledger.close();
});

test("removed provider records are routed to reversal-policy review", () => {
  const { ledger, connection } = configuredLedger();
  configureBankJournalMappings(ledger, connection);
  const record = stageBankRecord(
    ledger,
    connection,
    {
      transaction_date: "2026-08-21",
      description: "Removed provider transaction",
      amount_cents: 600,
    },
    "removed",
  );
  const result = ledger.applyIntegrationRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Reviewed removed source transaction",
  });
  assert.equal(result.status, "error");
  assert.match(result.preview.issues.join(" "), /reversal policy/);
  assert.equal(
    ledger.listJournals().some((item) => item.source === "provider_integration"),
    false,
  );
  ledger.close();
});

test("controlled previews classify invalid staged records into the exception workbench", () => {
  const { ledger, connection } = configuredLedger();
  const record = stageBankRecord(ledger, connection, {
    transaction_date: "2026-08-21",
    description: "Needs mapping",
    amount_cents: 700,
  });
  const preview = ledger.previewIntegrationRecordApplication({
    record_id: record.id,
    classify: true,
  });
  assert.equal(preview.ready, false);
  assert.equal(preview.exception.error_code, "MAPPING_VALIDATION_FAILED");
  assert.equal(ledger.integrationRecord(record.id).status, "error");
  assert.equal(ledger.integrationDeadLetters().length, 1);
  ledger.close();
});

test("Plaid records enter a bound bank subledger and uniquely match posted cash", () => {
  const { ledger, connection } = configuredLedger();
  const cash = ledger.getAccounts().find((account) => account.code === "1000");
  const binding = ledger.configureBankFeedAccount({
    connection_id: connection.id,
    external_account_id: "plaid-checking-1",
    cash_account_id: cash.id,
    display_name: "Operating checking",
    currency: "USD",
  });
  const journal = postCashLine(ledger, -4321);
  const record = stageProviderRecord(ledger, connection, {
    external_id: "plaid-txn-1",
    source_version: "v1",
    normalized: nativeBankRecord(),
  });
  const preview = ledger.previewBankFeedRecordApplication({ record_id: record.id });
  assert.equal(preview.ready, true);
  assert.equal(preview.feed_account.id, binding.id);

  const result = runWithRequestContext({ actor: "bank-operator" }, () =>
    ledger.applyBankFeedRecord({
      record_id: record.id,
      approved: true,
      approval_note: "Reviewed Plaid source and cash-account binding",
    }),
  );
  assert.equal(result.status, "applied");
  assert.equal(result.transaction.status, "matched");
  assert.equal(
    result.match.journal_line_id,
    journal.lines.find((line) => line.account_id === cash.id).id,
  );
  assert.equal(ledger.integrationRecord(record.id).applied_entity_type, "bank_feed_transaction");
  assert.equal(ledger.bankFeedOverview().metrics.matched, 1);
  assert.equal(ledger.exceptions().filter((item) => item.kind.startsWith("bank_feed_")).length, 0);

  const replay = ledger.applyBankFeedRecord({
    record_id: record.id,
    approved: true,
    approval_note: "Idempotent review replay",
  });
  assert.equal(replay.duplicate, true);
  assert.equal(ledger.bankFeedOverview().transactions.length, 1);
  ledger.close();
});

test("unmatched, ambiguous and changed matched Plaid activity enters reconciliation control", () => {
  const { ledger, connection } = configuredLedger();
  const cash = ledger.getAccounts().find((account) => account.code === "1000");
  ledger.configureBankFeedAccount({
    connection_id: connection.id,
    external_account_id: "plaid-checking-1",
    cash_account_id: cash.id,
    display_name: "Operating checking",
  });

  const unmatched = stageProviderRecord(ledger, connection, {
    external_id: "unmatched-1",
    source_version: "v1",
    normalized: nativeBankRecord({ cash_amount_cents: -1111 }),
  });
  assert.equal(
    ledger.applyBankFeedRecord({
      record_id: unmatched.id,
      approved: true,
      approval_note: "Reviewed unmatched source activity",
    }).transaction.status,
    "unmatched",
  );

  postCashLine(ledger, -2222, "2026-08-22", "Candidate one");
  postCashLine(ledger, -2222, "2026-08-22", "Candidate two");
  const ambiguous = stageProviderRecord(ledger, connection, {
    external_id: "ambiguous-1",
    source_version: "v1",
    normalized: nativeBankRecord({ cash_amount_cents: -2222 }),
  });
  const ambiguousResult = ledger.applyBankFeedRecord({
    record_id: ambiguous.id,
    approved: true,
    approval_note: "Reviewed ambiguous source activity",
  });
  assert.equal(ambiguousResult.transaction.status, "exception");
  const candidateReview = ledger.bankFeedCandidates(ambiguousResult.transaction.id);
  assert.equal(candidateReview.candidates.length, 2);
  assert.throws(
    () =>
      ledger.matchBankFeedTransaction({
        transaction_id: ambiguousResult.transaction.id,
        journal_line_id: candidateReview.candidates[0].id,
        rationale: "Reviewed exact candidates",
      }),
    /Explicit bank match approval/,
  );
  const manualMatch = runWithRequestContext({ actor: "bank-reviewer" }, () =>
    ledger.matchBankFeedTransaction({
      transaction_id: ambiguousResult.transaction.id,
      journal_line_id: candidateReview.candidates[0].id,
      approved: true,
      rationale: "Selected the journal supported by bank remittance evidence",
    }),
  );
  assert.equal(manualMatch.transaction.status, "matched");
  assert.equal(manualMatch.decision.decided_by, "bank-reviewer");

  postCashLine(ledger, -3333, "2026-08-22", "Original match");
  const original = stageProviderRecord(ledger, connection, {
    external_id: "changed-1",
    source_version: "v1",
    normalized: nativeBankRecord({ cash_amount_cents: -3333 }),
  });
  assert.equal(
    ledger.applyBankFeedRecord({
      record_id: original.id,
      approved: true,
      approval_note: "Reviewed original matched activity",
    }).transaction.status,
    "matched",
  );
  const changed = stageProviderRecord(ledger, connection, {
    external_id: "changed-1",
    source_version: "v2",
    operation: "modified",
    normalized: nativeBankRecord({ cash_amount_cents: -3555 }),
  });
  const changedResult = ledger.applyBankFeedRecord({
    record_id: changed.id,
    approved: true,
    approval_note: "Reviewed provider amount modification",
  });
  assert.equal(changedResult.transaction.status, "unmatched");
  const kinds = ledger.exceptions().map((item) => item.kind);
  assert.ok(kinds.includes("bank_feed_unmatched"));
  assert.ok(kinds.includes("bank_feed_ambiguous"));
  assert.ok(kinds.includes("bank_feed_changed_matched"));
  assert.throws(
    () =>
      ledger.completeCloseItem({
        period: "2026-08",
        item_key: "bank_reconciled",
        evidence: "Attempted sign-off with unresolved feed activity",
      }),
    /must be resolved before sign-off/,
  );
  const otherAsset = ledger.getAccounts().find((account) => account.code === "1200");
  assert.throws(
    () =>
      ledger.configureBankFeedAccount({
        connection_id: connection.id,
        external_account_id: "plaid-checking-1",
        cash_account_id: otherAsset.id,
        display_name: "Unsafe rebind",
      }),
    /cannot be rebound/,
  );
  ledger.close();
});

test("pending and removed Plaid versions preserve lineage without silently reversing journals", () => {
  const { ledger, connection } = configuredLedger();
  const cash = ledger.getAccounts().find((account) => account.code === "1000");
  ledger.configureBankFeedAccount({
    connection_id: connection.id,
    external_account_id: "plaid-checking-1",
    cash_account_id: cash.id,
    display_name: "Operating checking",
  });
  const pending = stageProviderRecord(ledger, connection, {
    external_id: "pending-1",
    source_version: "v1",
    normalized: nativeBankRecord({ pending: true, cash_amount_cents: -1200 }),
  });
  assert.equal(
    ledger.applyBankFeedRecord({
      record_id: pending.id,
      approved: true,
      approval_note: "Reviewed pending provider transaction",
    }).transaction.status,
    "pending",
  );

  postCashLine(ledger, -6600);
  const original = stageProviderRecord(ledger, connection, {
    external_id: "removed-1",
    source_version: "v1",
    normalized: nativeBankRecord({ cash_amount_cents: -6600 }),
  });
  ledger.applyBankFeedRecord({
    record_id: original.id,
    approved: true,
    approval_note: "Reviewed transaction before removal",
  });
  const removed = stageProviderRecord(ledger, connection, {
    external_id: "removed-1",
    source_version: "v2",
    operation: "removed",
    normalized: {},
  });
  const removal = ledger.applyBankFeedRecord({
    record_id: removed.id,
    approved: true,
    approval_note: "Reviewed provider removal and retained journal",
  });
  assert.equal(removal.transaction.status, "removed");
  assert.ok(ledger.exceptions().some((item) => item.kind === "bank_feed_removed_matched"));
  assert.equal(ledger.listJournals().filter((item) => item.status === "posted").length >= 1, true);
  ledger.close();
});
