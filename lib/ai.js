import { toCents } from "./accounting.js";

const SYSTEM_PROMPT = `You are an accounting copilot. Create a conservative draft journal entry from the user's description.
Never claim the entry is posted. Use only the supplied chart of accounts. Debits must equal credits exactly.
If the information is ambiguous, choose the most conservative reasonable treatment and explain what a human reviewer must verify.
Amounts are integer cents. Return only the requested structured result.`;

export async function proposeJournal(description, accounts) {
  if (!description?.trim()) throw Object.assign(new Error("Describe the transaction first"), { statusCode: 400 });
  if (process.env.OPENAI_API_KEY) {
    try {
      return await proposeWithOpenAI(description, accounts);
    } catch (error) {
      console.warn("OpenAI draft failed; using deterministic fallback:", error.message);
    }
  }
  return fallbackProposal(description, accounts);
}

async function proposeWithOpenAI(description, accounts) {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["date", "memo", "rationale", "confidence", "lines"],
    properties: {
      date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      memo: { type: "string" },
      rationale: { type: "string" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      lines: {
        type: "array", minItems: 2,
        items: {
          type: "object", additionalProperties: false,
          required: ["account_id", "debit_cents", "credit_cents", "description"],
          properties: {
            account_id: { type: "integer" }, debit_cents: { type: "integer", minimum: 0 },
            credit_cents: { type: "integer", minimum: 0 }, description: { type: "string" }
          }
        }
      }
    }
  };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      instructions: SYSTEM_PROMPT,
      input: `Transaction: ${description}\nToday: ${new Date().toISOString().slice(0, 10)}\nChart of accounts:\n${accounts.map(a => `${a.id}: ${a.code} ${a.name} (${a.type})`).join("\n")}`,
      text: { format: { type: "json_schema", name: "journal_draft", strict: true, schema } }
    })
  });
  if (!response.ok) throw new Error(`OpenAI API returned ${response.status}`);
  const body = await response.json();
  const outputText = body.output_text || body.output?.flatMap(item => item.content || []).find(c => c.type === "output_text")?.text;
  if (!outputText) throw new Error("OpenAI returned no structured draft");
  const proposal = JSON.parse(outputText);
  const allowed = new Set(accounts.map(a => a.id));
  if (proposal.lines.some(line => !allowed.has(line.account_id))) throw new Error("AI selected an unknown account");
  return { ...proposal, provider: "openai" };
}

function fallbackProposal(description, accounts) {
  const text = description.toLowerCase();
  const account = code => accounts.find(a => a.code === code);
  const amountMatch = description.match(/(?:\$|usd\s*)?([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? toCents(amountMatch[1]) : 0;
  if (!amount) throw Object.assign(new Error("Include an amount, for example: Paid $1,200 for AWS hosting"), { statusCode: 400 });

  let debit = account("5100");
  let credit = account("1000");
  let rationale = "Classified as a software expense paid from operating cash.";
  if (/aws|azure|gcp|cloud|hosting|compute/.test(text)) { debit = account("5000"); rationale = "Classified as cloud infrastructure expense."; }
  else if (/payroll|salary|wage/.test(text)) { debit = account("5200"); rationale = "Classified as payroll expense."; }
  else if (/marketing|advert|campaign/.test(text)) { debit = account("5300"); rationale = "Classified as marketing expense."; }
  else if (/subscription|customer|revenue|sale|invoice/.test(text)) {
    debit = /invoice|receivable/.test(text) ? account("1100") : account("1000");
    credit = account("4000"); rationale = "Classified as subscription revenue; confirm revenue timing before posting.";
  } else if (/prepaid|annual/.test(text)) { debit = account("1200"); rationale = "Classified as a prepaid asset; establish an amortization schedule after review."; }
  if (/on account|unpaid|bill|payable/.test(text) && credit?.type !== "revenue") credit = account("2000");

  return {
    date: new Date().toISOString().slice(0, 10), memo: description.trim(), rationale,
    confidence: "medium", provider: "local-rules",
    lines: [
      { account_id: debit.id, debit_cents: amount, credit_cents: 0, description: debit.name },
      { account_id: credit.id, debit_cents: 0, credit_cents: amount, description: credit.name }
    ]
  };
}
