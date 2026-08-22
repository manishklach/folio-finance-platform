import PDFDocument from "pdfkit";

const reportNames = {
  trial_balance: "Trial Balance",
  income_statement: "Income Statement",
  balance_sheet: "Balance Sheet",
  cash_flow: "Cash Flow Statement",
};

export function financialReport(ledger, type, asOf = new Date().toISOString().slice(0, 10)) {
  if (!reportNames[type]) throw problem("Unknown financial report", 404);
  const accounts = ledger.trialBalance();
  let rows;
  if (type === "trial_balance") {
    rows = accounts.map((account) => ({
      code: account.code,
      account: account.name,
      debit_cents: ["asset", "expense"].includes(account.type)
        ? Math.max(0, account.balance_cents)
        : Math.max(0, -account.balance_cents),
      credit_cents: ["liability", "equity", "revenue"].includes(account.type)
        ? Math.max(0, account.balance_cents)
        : Math.max(0, -account.balance_cents),
    }));
  } else if (type === "income_statement") {
    rows = accounts
      .filter((account) => ["revenue", "expense"].includes(account.type))
      .map((account) => ({
        section: account.type,
        account: account.name,
        amount_cents: account.balance_cents,
      }));
    rows.push({
      section: "total",
      account: "Net income",
      amount_cents: ledger.dashboard().net_income_cents,
    });
  } else if (type === "balance_sheet") {
    rows = accounts
      .filter((account) => ["asset", "liability", "equity"].includes(account.type))
      .map((account) => ({
        section: account.type,
        account: account.name,
        amount_cents: account.balance_cents,
      }));
  } else {
    const cashFlow = ledger.cashFlow(asOf.slice(0, 4));
    rows = Object.entries(cashFlow)
      .filter(([, value]) => typeof value === "number")
      .map(([section, amount_cents]) => ({ section, amount_cents }));
  }
  return { type, title: reportNames[type], as_of: asOf, currency: "USD", rows };
}

export function reportCsv(report) {
  const headers = [...new Set(report.rows.flatMap((row) => Object.keys(row)))];
  return [headers, ...report.rows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

export function reportPdf(report) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const document = new PDFDocument({ size: "LETTER", margin: 54, info: { Title: report.title } });
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
    document
      .fontSize(20)
      .text("Folio", { continued: true })
      .fontSize(10)
      .text("  GAAP financial reporting");
    document.moveDown().fontSize(16).text(report.title);
    document
      .fontSize(9)
      .fillColor("#4b5563")
      .text(`As of ${report.as_of} | Currency ${report.currency}`);
    document.moveDown().fillColor("#111827");
    for (const row of report.rows) {
      const label = row.account || String(row.section || "").replaceAll("_", " ");
      const cents = row.amount_cents ?? row.debit_cents ?? row.credit_cents ?? 0;
      document.fontSize(9).text(label, { continued: true, width: 360 });
      document.text(formatMoney(cents), { align: "right" });
      if (document.y > 700) document.addPage();
    }
    document
      .moveDown()
      .fontSize(7)
      .fillColor("#6b7280")
      .text(
        "Generated from posted double-entry records. Review period configuration and consolidation scope before external use.",
      );
    document.end();
  });
}

function csvCell(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function formatMoney(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
function problem(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
