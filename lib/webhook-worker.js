import { createLedger } from "./db.js";
import { runWithRequestContext } from "./request-context.js";
import { applyWebhookEvent } from "./webhook-application.js";

export async function processNextWebhookDelivery(
  platform,
  { leaseSeconds = 60, maxAttempts = 8 } = {},
) {
  const delivery = platform.claimWebhookDelivery({ leaseSeconds });
  if (!delivery) return null;
  let ledger;
  try {
    const organization = platform.organizationById(delivery.org_id);
    if (!organization) throw new Error("Webhook organization is unavailable");
    ledger = createLedger(organization.database_path, { seed: true, orgId: organization.id });
    const connection = ledger.integrationConnection(delivery.connection_id);
    if (connection.provider !== delivery.provider || connection.status !== "active")
      throw new Error("Webhook integration connection is unavailable");
    const application = await runWithRequestContext(
      {
        actor: `webhook.${delivery.provider}`,
        orgId: organization.id,
        role: "system",
        requestId: `webhook-delivery:${delivery.id}`,
      },
      () =>
        ledger.applyExternalEvent(delivery.provider, delivery.event_id, delivery.payload_hash, () =>
          applyWebhookEvent(delivery.provider, delivery.payload, ledger, connection),
        ),
    );
    platform.webhookRecord(
      delivery.provider,
      delivery.event_id,
      organization.id,
      delivery.payload_hash,
      "processed",
      application.result,
    );
    const completed = platform.completeWebhookDelivery(delivery.id, application);
    return { delivery: completed, application };
  } catch (error) {
    const failed = platform.failWebhookDelivery(delivery.id, safeWorkerError(error), {
      maxAttempts,
    });
    return { delivery: failed, error: safeWorkerError(error), cause: error };
  } finally {
    ledger?.close();
  }
}

function safeWorkerError(error) {
  if (error?.statusCode && error.statusCode < 500) return String(error.message).slice(0, 500);
  return "Webhook processing failed";
}
