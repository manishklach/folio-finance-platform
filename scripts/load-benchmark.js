import assert from "node:assert/strict";
import { createLedger } from "../lib/db.js";

const journalWrites = boundedEnv("LOAD_JOURNALS", 250, 1, 10_000);
const importRows = boundedEnv("LOAD_IMPORT_ROWS", 10_000, 100, 10_000);
const maxStepMs = boundedEnv("LOAD_MAX_STEP_MS", 60_000, 1_000, 600_000);
const ledger = createLedger(":memory:");

try {
  const accounts = Object.fromEntries(
    ledger.getAccounts().map((account) => [account.code, account.id]),
  );
  const journal = measured("journal_write", () => {
    for (let index = 0; index < journalWrites; index += 1) {
      const draft = ledger.createDraft(
        {
          date: "2026-08-22",
          memo: `Capacity write ${index}`,
          source: "capacity_gate",
          lines: [
            { account_id: accounts["1200"], debit_cents: 100, credit_cents: 0 },
            { account_id: accounts["2000"], debit_cents: 0, credit_cents: 100 },
          ],
        },
        "capacity.gate",
      );
      ledger.postJournal(draft.id, "capacity.gate");
    }
  });

  ledger.configureImportDuplicatePolicy({
    template_key: "customers",
    field_key: "name",
    threshold_percent: 99,
  });
  const csv = ["name,segment,region,external_id"];
  for (let index = 0; index < importRows; index += 1) {
    const suffix = String(index).padStart(5, "0");
    csv.push(`Launch Customer ${suffix},Enterprise,US,launch-${suffix}`);
  }
  let batch;
  const stage = measured("import_stage", () => {
    batch = ledger.stageImport({
      template_key: "customers",
      filename: "launch-capacity.csv",
      csv: csv.join("\n"),
    });
  });
  assert.equal(batch.row_count, importRows);
  assert.equal(batch.valid_count, importRows);
  assert.equal(batch.duplicate_count, 0);
  assert.equal(batch.row_page.page_size, 100);
  assert.equal(batch.row_page.total_pages, Math.ceil(importRows / 100));

  let applied;
  const apply = measured("import_apply", () => {
    ledger.approveImport({ id: batch.id });
    applied = ledger.applyImport(batch.id);
  });
  assert.equal(applied.applied_count, importRows);

  let policy;
  const reindex = measured("fuzzy_reindex", () => {
    policy = ledger.configureImportDuplicatePolicy({
      template_key: "customers",
      field_key: "name",
      threshold_percent: 75,
    });
  });
  assert.equal(policy.indexed_rows, importRows);

  let candidate;
  const candidateLookup = measured("fuzzy_candidate_lookup", () => {
    candidate = ledger.stageImport({
      template_key: "customers",
      filename: "launch-candidate.csv",
      csv: "name,segment,region,external_id\nLaunch Custmer 05000,Enterprise,US,launch-candidate",
    });
  });
  assert.equal(candidate.duplicate_count, 1);
  assert.equal(candidate.rows[0].duplicate_evidence.kind, "fuzzy");
  assert.equal(candidate.rows[0].duplicate_evidence.source, "applied_import");
  assert.ok(candidate.rows[0].duplicate_evidence.score_percent >= 75);

  const integrity = ledger.verifyIntegrity();
  assert.equal(integrity.valid, true);
  const steps = { journal, stage, apply, reindex, candidate_lookup: candidateLookup };
  for (const [name, result] of Object.entries(steps))
    assert.ok(
      result.duration_ms <= maxStepMs,
      `${name} exceeded ${maxStepMs}ms: ${result.duration_ms}ms`,
    );

  process.stdout.write(
    `${JSON.stringify({
      profile: "single_node_sqlite_capacity_gate",
      journal_writes: journalWrites,
      import_rows: importRows,
      fuzzy_index_rows: policy.indexed_rows,
      max_step_ms: maxStepMs,
      steps,
      peak_rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      integrity_checked: integrity.checked,
      status: "passed",
    })}\n`,
  );
} finally {
  ledger.close();
}

function measured(name, operation) {
  const started = performance.now();
  operation();
  const duration = performance.now() - started;
  return {
    name,
    duration_ms: Math.round(duration),
    operations_per_second:
      name === "journal_write"
        ? Math.round((journalWrites / duration) * 1000)
        : name === "import_stage" || name === "import_apply" || name === "fuzzy_reindex"
          ? Math.round((importRows / duration) * 1000)
          : Math.round(1000 / duration),
  };
}

function boundedEnv(name, fallback, minimum, maximum) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum)
    throw new Error(`${name} must be a whole number from ${minimum} through ${maximum}`);
  return value;
}
