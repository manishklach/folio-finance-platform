import PDFDocument from "pdfkit";

const reportNames = {
  trial_balance: "Trial Balance",
  income_statement: "Income Statement",
  balance_sheet: "Balance Sheet",
  cash_flow: "Cash Flow Statement",
  comprehensive_income: "Statement of Comprehensive Income",
  changes_in_equity: "Statement of Changes in Equity",
};

export function financialReport(
  ledger,
  type,
  asOf = new Date().toISOString().slice(0, 10),
  from = `${asOf.slice(0, 4)}-01-01`,
) {
  if (!reportNames[type]) throw problem("Unknown financial report", 404);
  const accounts = ledger.trialBalance(
    asOf,
    ["income_statement", "comprehensive_income"].includes(type) ? from : null,
  );
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
    const netIncome = rows.reduce(
      (sum, row) => sum + (row.section === "revenue" ? row.amount_cents : -row.amount_cents),
      0,
    );
    rows.push({
      section: "total",
      account: "Net income",
      amount_cents: netIncome,
    });
  } else if (type === "balance_sheet") {
    rows = accounts
      .filter((account) => ["asset", "liability", "equity"].includes(account.type))
      .map((account) => ({
        section: account.type,
        account: account.name,
        amount_cents: account.balance_cents,
      }));
    const currentEarnings = accounts
      .filter((account) => ["revenue", "expense"].includes(account.type))
      .reduce(
        (sum, account) =>
          sum + (account.type === "revenue" ? account.balance_cents : -account.balance_cents),
        0,
      );
    rows.push({
      section: "equity",
      account: "Current-period earnings",
      amount_cents: currentEarnings,
    });
  } else if (type === "cash_flow") {
    const cashFlow = ledger.cashFlow(asOf, from);
    rows = Object.entries(cashFlow)
      .filter(([, value]) => typeof value === "number")
      .map(([section, amount_cents]) => ({ section, amount_cents }));
  } else if (type === "comprehensive_income") {
    const incomeAccounts = accounts.filter((account) =>
      ["revenue", "expense"].includes(account.type),
    );
    const netIncome = incomeAccounts.reduce(
      (sum, account) =>
        sum + (account.type === "revenue" ? account.balance_cents : -account.balance_cents),
      0,
    );
    const oci = ledger.ociItems(asOf, from).reduce((sum, item) => sum + item.net_cents, 0);
    rows = [
      { section: "net_income", account: "Net income", amount_cents: netIncome },
      {
        section: "other_comprehensive_income",
        account: "Other comprehensive income",
        amount_cents: oci,
      },
      { section: "total", account: "Comprehensive income", amount_cents: netIncome + oci },
    ];
  } else {
    const dayBefore = new Date(`${from}T00:00:00Z`);
    dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
    const opening = ledger
      .trialBalance(dayBefore.toISOString().slice(0, 10))
      .filter((account) => ["asset", "liability"].includes(account.type))
      .reduce(
        (sum, account) =>
          sum + (account.type === "asset" ? account.balance_cents : -account.balance_cents),
        0,
      );
    const ending = ledger
      .trialBalance(asOf)
      .filter((account) => ["asset", "liability"].includes(account.type))
      .reduce(
        (sum, account) =>
          sum + (account.type === "asset" ? account.balance_cents : -account.balance_cents),
        0,
      );
    const period = ledger.trialBalance(asOf, from);
    const netIncome = period
      .filter((account) => ["revenue", "expense"].includes(account.type))
      .reduce(
        (sum, account) =>
          sum + (account.type === "revenue" ? account.balance_cents : -account.balance_cents),
        0,
      );
    const oci = ledger.ociItems(asOf, from).reduce((sum, item) => sum + item.net_cents, 0);
    rows = [
      { section: "opening", account: "Opening equity", amount_cents: opening },
      { section: "income", account: "Net income", amount_cents: netIncome },
      { section: "oci", account: "Other comprehensive income", amount_cents: oci },
      {
        section: "owner_and_other",
        account: "Owner, NCI, and other equity changes",
        amount_cents: ending - opening - netIncome - oci,
      },
      { section: "ending", account: "Ending equity", amount_cents: ending },
    ];
  }
  return { type, title: reportNames[type], from, as_of: asOf, currency: "USD", rows };
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
      document.fontSize(9).text(label, { continued: true, width: 300 });
      if (report.type === "trial_balance")
        document.text(`${formatMoney(row.debit_cents)}  |  ${formatMoney(row.credit_cents)}`, {
          align: "right",
        });
      else document.text(formatMoney(row.amount_cents ?? 0), { align: "right" });
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
