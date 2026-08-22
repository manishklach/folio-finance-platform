import { createHash } from "node:crypto";

export const ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"];

export function toCents(value) {
  const number = typeof value === "number" ? value : Number(String(value).replace(/[$,]/g, ""));
  if (!Number.isFinite(number)) throw new Error("Amount must be a valid number");
  return Math.round(number * 100);
}

export function fromCents(cents) {
  return Number((Number(cents) / 100).toFixed(2));
}

export function validateJournal(entry, accountIds = null) {
  const errors = [];
  if (!entry?.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) errors.push("A valid entry date is required");
  if (!entry?.memo?.trim()) errors.push("A memo is required");
  if (!Array.isArray(entry?.lines) || entry.lines.length < 2) errors.push("At least two journal lines are required");

  let debits = 0;
  let credits = 0;
  for (const [index, line] of (entry?.lines || []).entries()) {
    const debit = Number(line.debit_cents || 0);
    const credit = Number(line.credit_cents || 0);
    if (!Number.isInteger(debit) || debit < 0 || !Number.isInteger(credit) || credit < 0) {
      errors.push(`Line ${index + 1} has an invalid amount`);
    }
    if ((debit > 0) === (credit > 0)) errors.push(`Line ${index + 1} must contain either a debit or a credit`);
    if (!Number.isInteger(Number(line.account_id))) errors.push(`Line ${index + 1} needs an account`);
    if (accountIds && !accountIds.has(Number(line.account_id))) errors.push(`Line ${index + 1} references an unknown account`);
    debits += debit;
    credits += credit;
  }
  if (debits === 0 || credits === 0) errors.push("The entry must have non-zero debits and credits");
  if (debits !== credits) errors.push(`Entry is out of balance by ${fromCents(Math.abs(debits - credits)).toFixed(2)}`);
  return { valid: errors.length === 0, errors, debit_cents: debits, credit_cents: credits };
}

export function canonicalJournalHash(entry, lines) {
  const canonical = JSON.stringify({
    id: entry.id,
    date: entry.entry_date,
    memo: entry.memo,
    lines: [...lines]
      .map(({ account_id, debit_cents, credit_cents, description }) => ({ account_id, debit_cents, credit_cents, description: description || "" }))
      .sort((a, b) => a.account_id - b.account_id || a.debit_cents - b.debit_cents),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function normalBalance(type, debitCents, creditCents) {
  return ["asset", "expense"].includes(type) ? debitCents - creditCents : creditCents - debitCents;
}
