import { createLedger } from "../lib/db.js";
import { createPlatform } from "../lib/platform.js";
import { applyWebhookEvent } from "../lib/webhook-application.js";

const [, , phase, platformDatabasePath, tenantDatabaseDirectory] = process.argv;
if (!new Set(["after-claim", "after-tenant-commit"]).has(phase))
  throw new Error("Unknown webhook crash-test phase");

const platform = createPlatform(platformDatabasePath, tenantDatabaseDirectory);
const delivery = platform.claimWebhookDelivery({ leaseSeconds: 10 });
if (!delivery) throw new Error("No webhook delivery was available");

if (phase === "after-tenant-commit") {
  const organization = platform.organizationById(delivery.org_id);
  if (!organization) throw new Error("Webhook organization is unavailable");
  const ledger = createLedger(organization.database_path, { seed: true, orgId: organization.id });
  try {
    const connection = ledger.integrationConnection(delivery.connection_id);
    ledger.applyExternalEvent(delivery.provider, delivery.event_id, delivery.payload_hash, () =>
      applyWebhookEvent(delivery.provider, delivery.payload, ledger, connection),
    );
  } finally {
    ledger.close();
  }
}

process.stdout.write(`${JSON.stringify({ phase, delivery_id: delivery.id })}\n`);
setInterval(() => {}, 1_000);
