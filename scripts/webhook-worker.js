import { createPlatform } from "../lib/platform.js";
import { processNextWebhookDelivery } from "../lib/webhook-worker.js";

const once = process.argv.includes("--once");
const retryDeliveryId = process.argv
  .find((argument) => argument.startsWith("--retry-delivery="))
  ?.slice("--retry-delivery=".length);
const pollMilliseconds = boundedNumber(process.env.WEBHOOK_WORKER_POLL_MS, 100, 60_000, 1_000);
const leaseSeconds = boundedNumber(process.env.WEBHOOK_WORKER_LEASE_SECONDS, 10, 3_600, 60);
const maxAttempts = boundedNumber(process.env.WEBHOOK_WORKER_MAX_ATTEMPTS, 1, 100, 8);
const platform = createPlatform(process.env.PLATFORM_DB_PATH, process.env.TENANT_DB_DIR);
let stopping = false;

for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    stopping = true;
  });

try {
  if (retryDeliveryId) {
    const delivery = platform.retryWebhookDelivery(retryDeliveryId);
    writeDelivery("webhook_delivery_requeued", delivery);
  } else {
    do {
      const result = await processNextWebhookDelivery(platform, { leaseSeconds, maxAttempts });
      if (result) writeDelivery("webhook_delivery", result.delivery);
      if (once) break;
      if (!result && !stopping) await delay(pollMilliseconds);
    } while (!stopping);
  }
} finally {
  platform.close();
}

function boundedNumber(value, minimum, maximum, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.trunc(parsed)));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function writeDelivery(event, delivery) {
  process.stdout.write(
    `${JSON.stringify({
      event,
      delivery_id: delivery.id,
      provider: delivery.provider,
      status: delivery.status,
      attempts: delivery.attempts,
    })}\n`,
  );
}
