import { stripeWebhookPage } from "./provider-adapters.js";

export function applyWebhookEvent(provider, event, ledger, connection = null) {
  if (provider === "stripe" && connection) {
    const run = ledger.startIntegrationSync({ connection_id: connection.id, trigger: "webhook" });
    return ledger.ingestIntegrationPage({ sync_run_id: run.id, ...stripeWebhookPage(event) });
  }
  if (provider === "stripe" && event.type === "payment.received")
    return ledger.recordPayment(event.data);
  if (provider === "stripe" && event.type === "invoice.created")
    return ledger.createInvoice(event.data);
  if (provider === "payroll" && event.type === "payroll.posted") {
    const draft = ledger.createDraft({ ...event.data, source: "payroll_webhook" });
    return ledger.postJournal(draft.id);
  }
  if (provider === "expenses" && event.type === "expense.posted") {
    const draft = ledger.createDraft({ ...event.data, source: "expense_webhook" });
    return ledger.postJournal(draft.id);
  }
  const error = new Error("Unsupported webhook event");
  error.statusCode = 422;
  throw error;
}
