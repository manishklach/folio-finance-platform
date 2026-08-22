import { createLedger } from "../lib/db.js";

const ledger = createLedger(":memory:");
const accounts = Object.fromEntries(
  ledger.getAccounts().map((account) => [account.code, account.id]),
);
const iterations = Number(process.env.LOAD_ITERATIONS || 250);
const started = performance.now();
for (let index = 0; index < iterations; index += 1) {
  const draft = ledger.createDraft(
    {
      date: "2026-08-22",
      memo: `Load write ${index}`,
      source: "load_test",
      lines: [
        { account_id: accounts["1200"], debit_cents: 100, credit_cents: 0 },
        { account_id: accounts["2000"], debit_cents: 0, credit_cents: 100 },
      ],
    },
    "load.test",
  );
  ledger.postJournal(draft.id, "load.test");
}
const duration = performance.now() - started;
process.stdout.write(
  `${JSON.stringify({ writes: iterations, duration_ms: Math.round(duration), writes_per_second: Math.round((iterations / duration) * 1000) })}\n`,
);
ledger.close();
