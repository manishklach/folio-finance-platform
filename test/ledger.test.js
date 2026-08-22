import test from "node:test";
import assert from "node:assert/strict";
import { createLedger } from "../lib/db.js";
import { validateJournal } from "../lib/accounting.js";

test("rejects an unbalanced journal", () => {
  const result = validateJournal({
    date: "2026-08-22",
    memo: "Bad entry",
    lines: [
      { account_id: 1, debit_cents: 10000, credit_cents: 0 },
      { account_id: 2, debit_cents: 0, credit_cents: 9000 },
    ],
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /out of balance/);
});

test("posts a balanced draft and records its integrity hash", () => {
  const ledger = createLedger(":memory:", { seed: true });
  const accounts = Object.fromEntries(ledger.getAccounts().map((a) => [a.code, a.id]));
  const draft = ledger.createDraft({
    date: "2026-08-22",
    memo: "Test cash sale",
    lines: [
      { account_id: accounts["1000"], debit_cents: 50000, credit_cents: 0 },
      { account_id: accounts["4000"], debit_cents: 0, credit_cents: 50000 },
    ],
  });
  const posted = ledger.postJournal(draft.id);
  assert.equal(posted.status, "posted");
  assert.match(posted.content_hash, /^[a-f0-9]{64}$/);
  assert.throws(() => ledger.postJournal(draft.id), /Only draft entries/);
  ledger.close();
});

test("prevents posting into a closed period", () => {
  const ledger = createLedger(":memory:", { seed: true });
  const accounts = Object.fromEntries(ledger.getAccounts().map((a) => [a.code, a.id]));
  const draft = ledger.createDraft({
    date: "2026-08-22",
    memo: "Late expense",
    lines: [
      { account_id: accounts["5100"], debit_cents: 12000, credit_cents: 0 },
      { account_id: accounts["1000"], debit_cents: 0, credit_cents: 12000 },
    ],
  });
  ledger.db.prepare("INSERT INTO periods(month,status) VALUES('2026-08','closed')").run();
  assert.throws(() => ledger.postJournal(draft.id), /period is closed/);
  ledger.close();
});

test("posted trial balance remains balanced", () => {
  const ledger = createLedger(":memory:", { seed: true });
  const rows = ledger.getAccounts();
  const debitNormal = rows
    .filter((a) => ["asset", "expense"].includes(a.type))
    .reduce((sum, a) => sum + a.balance_cents, 0);
  const creditNormal = rows
    .filter((a) => ["liability", "equity", "revenue"].includes(a.type))
    .reduce((sum, a) => sum + a.balance_cents, 0);
  assert.equal(debitNormal, creditNormal);
  ledger.close();
});
