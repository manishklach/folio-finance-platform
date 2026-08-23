import assert from "node:assert/strict";
import test from "node:test";
import {
  createAccountingValidationPack,
  evaluateAccountingValidationPack,
  VALIDATION_OUTPUTS,
  VALIDATION_TOPICS,
} from "../lib/accounting-validation.js";

const commit = "a".repeat(40);
const evidenceFields = [
  "fact_pattern_ref",
  "policy_ref",
  "source_evidence_ref",
  "expected_memo_ref",
  "calculation_trace_ref",
  "journal_ref",
  "subledger_ref",
  "gl_reconciliation_ref",
  "statement_ref",
  "disclosure_ref",
  "judgment_ref",
];

test("accounting validation pack includes every Topic and reporting output", () => {
  const pack = createAccountingValidationPack({ commit, version: "v0.3.0-rc.1" });
  assert.equal(pack.cases.length, VALIDATION_TOPICS.length + VALIDATION_OUTPUTS.length);
  const result = evaluateAccountingValidationPack(pack);
  assert.equal(result.valid, true);
  assert.equal(result.ready, false);
  assert.equal(result.summary.not_tested, pack.cases.length);
});

test("accounting validation gate requires traceable evidence and qualified approval", () => {
  const pack = createAccountingValidationPack({
    commit,
    version: "v0.3.0-rc.1",
    imageDigest: `sha256:${"b".repeat(64)}`,
  });
  for (const item of pack.cases) {
    item.result = "pass";
    for (const field of evidenceFields) item[field] = `evidence://${item.id}/${field}`;
  }
  Object.assign(pack.reviewer, {
    firm: "Independent Accounting LLP",
    name: "Qualified Reviewer",
    qualification: "CPA",
    license_or_jurisdiction: "TEST-ONLY",
    independence_or_role: "Independent reviewer",
    evidence_system: "evidence://validation/v0.3.0-rc.1",
  });
  Object.assign(pack.signoff, {
    status: "approved",
    approver_name: "Qualified Reviewer",
    approval_date: "2026-08-23",
    evidence_ref: "evidence://validation/signoff",
    conclusion: "Test fixture approval",
  });
  assert.deepEqual(evaluateAccountingValidationPack(pack).blockers, []);
  assert.equal(evaluateAccountingValidationPack(pack).ready, true);

  const topic = pack.cases[0];
  topic.result = "defect";
  pack.findings.push({
    id: "ACCT-001",
    case_id: topic.id,
    severity: "high",
    status: "open",
    description: "Test-only finding",
    owner: "Engineering",
    due_date: "2026-09-30",
  });
  const failed = evaluateAccountingValidationPack(pack);
  assert.equal(failed.ready, false);
  assert.match(failed.blockers.join(" "), /ACCT-001 is open high/);

  topic.result = "pass";
  Object.assign(pack.findings[0], {
    status: "remediated",
    remediation_commit: "c".repeat(40),
    retest_result: "pass",
    retest_evidence_ref: "evidence://validation/ACCT-001/retest",
  });
  assert.equal(evaluateAccountingValidationPack(pack).ready, true);
});

test("accounting validation detects missing scope and invalid finding lineage", () => {
  const pack = createAccountingValidationPack({ commit, version: "rc" });
  pack.cases.shift();
  pack.cases[0].result = "out_of_scope";
  const output = pack.cases.find(({ kind }) => kind === "output");
  output.result = "out_of_scope";
  output.scope_basis_ref = "evidence://invalid-output-scope";
  pack.findings.push({
    id: "ACCT-INVALID",
    case_id: "missing-case",
    severity: "urgent",
    status: "done",
    description: "Invalid fixture",
    owner: "Test",
    due_date: "2026-09-30",
  });
  const result = evaluateAccountingValidationPack(pack);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /missing required case/);
  assert.match(result.errors.join(" "), /scope_basis_ref/);
  assert.match(result.errors.join(" "), /required reporting output/);
  assert.match(result.errors.join(" "), /unknown case/);
});
