import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { financialReport, reportCsv, reportPdf } from "../lib/reports.js";

test("posted journals are immutable at the database layer and hashes verify", () => {
  const ledger = createLedger(":memory:");
  const posted = ledger.listJournals().find((journal) => journal.status === "posted");
  assert.throws(
    () => ledger.db.prepare("UPDATE journal_entries SET memo='tampered' WHERE id=?").run(posted.id),
    /immutable/,
  );
  assert.throws(
    () => ledger.db.prepare("DELETE FROM journal_lines WHERE entry_id=?").run(posted.id),
    /immutable/,
  );
  assert.equal(ledger.verifyIntegrity().valid, true);
  ledger.close();
});

test("fiscal, bank reconciliation, attachments, close controls, tax, and exports work", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-production-"));
  const ledger = createLedger(join(root, "ledger.db"), { orgId: "test-org" });
  t.after(() => {
    ledger.close();
    rmSync(root, { recursive: true, force: true });
  });
  assert.match(
    ledger.configureFiscal({ calendar_type: "445", fiscal_year_start_month: 2 }).calendar_type,
    /445/,
  );
  assert.match(ledger.fiscalPeriod("2026-08-22"), /^FY\d{4}-P\d{2}$/);
  const cash = ledger.getAccounts().find((account) => account.code === "1000");
  const statement = ledger.importBankStatement({
    cash_account_id: cash.id,
    start_date: "2026-06-01",
    end_date: "2026-06-30",
    opening_cents: 0,
    closing_cents: 25000000,
    csv: "date,description,amount,external_id\n2026-06-01,Founder deposit,250000,bank-1",
  });
  assert.equal(statement.unmatched, 0);
  const attachment = ledger.addAttachment({
    entity_type: "invoice",
    entity_id: "1",
    filename: "proof.csv",
    mime_type: "text/csv",
    content_base64: Buffer.from("invoice,amount\n1,100").toString("base64"),
  });
  assert.equal(ledger.attachment(attachment.id).content.toString(), "invoice,amount\n1,100");
  const tax = ledger.createTaxRate({
    name: "California",
    jurisdiction: "US-CA",
    rate_basis_points: 725,
  });
  assert.equal(ledger.calculateTax(tax.id, 10000).tax_cents, 725);
  const report = financialReport(ledger, "income_statement", "2026-08-22");
  assert.match(reportCsv(report), /Net income/);
  const pdf = await reportPdf(report);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  for (const item_key of [
    "bank_reconciled",
    "ar_reviewed",
    "ap_reviewed",
    "revenue_reviewed",
    "accruals_posted",
    "integrity_verified",
  ])
    ledger.completeCloseItem({ period: "2026-09", item_key, evidence: "test evidence" });
  assert.equal(ledger.closePeriod("2026-09").status, "closed");
});
