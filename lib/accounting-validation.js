export const VALIDATION_RESULTS = [
  "not_tested",
  "pass",
  "pass_with_configuration",
  "defect",
  "policy_decision",
  "out_of_scope",
];

export const VALIDATION_TOPICS = [
  ["ASC-105", "ASC 105", "Policy governance"],
  ["ASC-205-210", "ASC 205/210", "Presentation and going concern"],
  ["ASC-220", "ASC 220", "Comprehensive income"],
  ["ASC-230", "ASC 230", "Cash flows"],
  ["ASC-250-275", "ASC 250/275", "Policies, estimates and risks"],
  ["ASC-260", "ASC 260", "Earnings per share"],
  ["ASC-305-320", "ASC 305/320", "Cash and debt securities"],
  ["ASC-321", "ASC 321", "Equity securities"],
  ["ASC-323", "ASC 323", "Equity method and tax-credit investments"],
  ["ASC-325", "ASC 325", "Other investments"],
  ["ASC-326", "ASC 326", "Credit losses"],
  ["ASC-340-40", "ASC 340-40", "Contract acquisition costs"],
  ["ASC-350-40-985-20", "ASC 350-40/985-20", "Software costs"],
  ["ASC-350-360", "ASC 350/360", "Impairment and long-lived assets"],
  ["ASC-410", "ASC 410", "Asset retirement obligations"],
  ["ASC-450", "ASC 450", "Contingencies"],
  ["ASC-460", "ASC 460", "Guarantees"],
  ["ASC-470", "ASC 470", "Debt"],
  ["ASC-480", "ASC 480", "Instrument classification"],
  ["ASC-606", "ASC 606", "Revenue and contract modifications"],
  ["ASC-718", "ASC 718", "Stock compensation"],
  ["ASC-740", "ASC 740", "Income taxes"],
  ["ASC-805", "ASC 805", "Business combinations"],
  ["ASC-810", "ASC 810", "Consolidation and VIEs"],
  ["ASC-820", "ASC 820", "Fair value"],
  ["ASC-830", "ASC 830", "Foreign currency"],
  ["ASC-835-20", "ASC 835-20", "Capitalized interest"],
  ["ASC-842", "ASC 842", "Leases"],
  ["ASC-855", "ASC 855", "Subsequent events"],
];

export const VALIDATION_OUTPUTS = [
  ["TRIAL-BALANCE", "Trial balance"],
  ["INCOME-STATEMENT", "Income statement"],
  ["BALANCE-SHEET", "Balance sheet"],
  ["CASH-FLOW", "Cash-flow statement"],
  ["COMPREHENSIVE-INCOME", "Statement of comprehensive income"],
  ["CHANGES-IN-EQUITY", "Statement of changes in equity"],
  ["GAAP-DISCLOSURES", "GAAP disclosures"],
  ["AR-RECONCILIATION", "AR, billed/unbilled and invoice reconciliation"],
  ["INVESTMENT-RECONCILIATION", "Investment subledger-to-GL reconciliation"],
  ["FIXED-ASSET-RECONCILIATION", "Fixed-asset subledger-to-GL reconciliation"],
];

const REQUIRED_CASE_REFS = [
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

export function createAccountingValidationPack({ commit, version, imageDigest = "" }) {
  const common = {
    result: "not_tested",
    reviewer_notes: "",
    fact_pattern_ref: "",
    policy_ref: "",
    source_evidence_ref: "",
    expected_memo_ref: "",
    calculation_trace_ref: "",
    journal_ref: "",
    subledger_ref: "",
    gl_reconciliation_ref: "",
    statement_ref: "",
    disclosure_ref: "",
    judgment_ref: "",
    scope_basis_ref: "",
  };
  return {
    schema_version: 1,
    release: {
      version,
      commit,
      image_digest: imageDigest,
      candidate_date: new Date().toISOString().slice(0, 10),
    },
    reviewer: {
      firm: "",
      name: "",
      qualification: "",
      license_or_jurisdiction: "",
      independence_or_role: "",
      evidence_system: "",
    },
    cases: [
      ...VALIDATION_TOPICS.map(([key, topic, title]) => ({
        id: `TOPIC-${key}`,
        kind: "topic",
        topic,
        title,
        areas: ["policy", "calculation", "journal", "reconciliation", "disclosure"],
        ...common,
      })),
      ...VALIDATION_OUTPUTS.map(([key, title]) => ({
        id: `OUTPUT-${key}`,
        kind: "output",
        topic: "Financial reporting",
        title,
        areas: ["calculation", "reconciliation", "statement", "disclosure"],
        ...common,
      })),
    ],
    findings: [],
    signoff: {
      status: "not_requested",
      approver_name: "",
      approval_date: "",
      evidence_ref: "",
      conclusion: "",
    },
  };
}

export function evaluateAccountingValidationPack(pack) {
  const errors = [];
  const blockers = [];
  if (pack?.schema_version !== 1) errors.push("schema_version must be 1");
  if (!/^\w[\w.-]*$/.test(pack?.release?.version || "")) errors.push("release.version is required");
  if (!/^[a-f0-9]{40}$/.test(pack?.release?.commit || ""))
    errors.push("release.commit must be a full 40-character Git commit");
  if (pack?.release?.image_digest && !/^sha256:[a-f0-9]{64}$/.test(pack.release.image_digest))
    errors.push("release.image_digest must be an sha256 digest");
  if (!pack?.release?.image_digest) blockers.push("release.image_digest is incomplete");
  const cases = Array.isArray(pack?.cases) ? pack.cases : [];
  const findings = Array.isArray(pack?.findings) ? pack.findings : [];
  const requiredIds = [
    ...VALIDATION_TOPICS.map(([key]) => `TOPIC-${key}`),
    ...VALIDATION_OUTPUTS.map(([key]) => `OUTPUT-${key}`),
  ];
  const caseIds = cases.map(({ id }) => id);
  for (const id of requiredIds)
    if (!caseIds.includes(id)) errors.push(`missing required case ${id}`);
  if (new Set(caseIds).size !== caseIds.length) errors.push("case IDs must be unique");
  const findingIds = findings.map(({ id }) => id);
  if (new Set(findingIds).size !== findingIds.length) errors.push("finding IDs must be unique");

  for (const item of cases) {
    if (!VALIDATION_RESULTS.includes(item.result)) errors.push(`${item.id} has an invalid result`);
    if (["pass", "pass_with_configuration"].includes(item.result)) {
      for (const field of REQUIRED_CASE_REFS)
        if (!String(item[field] || "").trim())
          errors.push(`${item.id}.${field} is required to pass`);
      if (item.result === "pass_with_configuration" && !String(item.reviewer_notes || "").trim())
        errors.push(`${item.id}.reviewer_notes is required for pass_with_configuration`);
    }
    if (item.result === "out_of_scope" && !String(item.scope_basis_ref || "").trim())
      errors.push(`${item.id}.scope_basis_ref is required for out_of_scope`);
    if (item.kind === "output" && item.result === "out_of_scope")
      errors.push(`${item.id} is a required reporting output and cannot be out_of_scope`);
    if (item.result === "defect" && !findings.some(({ case_id }) => case_id === item.id))
      errors.push(`${item.id} is a defect without a tracked finding`);
    if (["not_tested", "defect", "policy_decision"].includes(item.result))
      blockers.push(`${item.id} result is ${item.result}`);
  }

  for (const finding of findings) {
    if (!/^ACCT-[A-Z0-9-]+$/.test(finding.id || ""))
      errors.push(`${finding.id || "finding"} must use an ACCT-* ID`);
    if (!caseIds.includes(finding.case_id)) errors.push(`${finding.id} references an unknown case`);
    for (const field of ["description", "owner", "due_date"])
      if (!String(finding[field] || "").trim()) errors.push(`${finding.id}.${field} is required`);
    if (finding.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(finding.due_date))
      errors.push(`${finding.id}.due_date must be YYYY-MM-DD`);
    if (!["critical", "high", "medium", "low"].includes(finding.severity))
      errors.push(`${finding.id} has an invalid severity`);
    if (!["open", "remediated", "accepted"].includes(finding.status))
      errors.push(`${finding.id} has an invalid status`);
    if (finding.status === "remediated") {
      if (!/^[a-f0-9]{40}$/.test(finding.remediation_commit || ""))
        errors.push(`${finding.id}.remediation_commit is required when remediated`);
      if (finding.retest_result !== "pass" || !String(finding.retest_evidence_ref || "").trim())
        errors.push(`${finding.id} requires a passing retest and evidence`);
    }
    if (finding.status === "accepted" && !String(finding.risk_acceptance_ref || "").trim())
      errors.push(`${finding.id}.risk_acceptance_ref is required when accepted`);
    if (
      finding.status === "open" ||
      (finding.status === "accepted" && ["critical", "high"].includes(finding.severity))
    )
      blockers.push(`${finding.id} is ${finding.status} ${finding.severity}`);
  }

  const reviewer = pack?.reviewer || {};
  for (const field of [
    "firm",
    "name",
    "qualification",
    "license_or_jurisdiction",
    "independence_or_role",
    "evidence_system",
  ])
    if (!String(reviewer[field] || "").trim()) blockers.push(`reviewer.${field} is incomplete`);
  const signoff = pack?.signoff || {};
  if (!["not_requested", "pending", "approved", "rejected"].includes(signoff.status))
    errors.push("signoff.status is invalid");
  if (signoff.status !== "approved") blockers.push("accounting sign-off is not approved");
  else {
    for (const field of ["approver_name", "approval_date", "evidence_ref", "conclusion"])
      if (!String(signoff[field] || "").trim())
        errors.push(`signoff.${field} is required for approval`);
    if (signoff.approval_date && !/^\d{4}-\d{2}-\d{2}$/.test(signoff.approval_date))
      errors.push("signoff.approval_date must be YYYY-MM-DD");
  }

  return {
    valid: errors.length === 0,
    ready: errors.length === 0 && blockers.length === 0,
    errors,
    blockers,
    summary: VALIDATION_RESULTS.reduce(
      (result, status) => ({
        ...result,
        [status]: cases.filter(({ result: caseResult }) => caseResult === status).length,
      }),
      { cases: cases.length, findings: findings.length },
    ),
  };
}
