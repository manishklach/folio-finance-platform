import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhookSignature({
  provider,
  rawBody,
  headers,
  signingSecret,
  nowSeconds = Math.floor(Date.now() / 1000),
  stripeToleranceSeconds = 300,
}) {
  if (provider === "stripe")
    return verifyStripeSignature({
      rawBody,
      signatureHeader: headers["stripe-signature"],
      signingSecret,
      nowSeconds,
      toleranceSeconds: stripeToleranceSeconds,
    });
  const expected = createHmac("sha256", signingSecret).update(rawBody).digest("hex");
  return constantEqual(expected, String(headers["x-folio-signature"] || ""));
}

export function verifyStripeSignature({
  rawBody,
  signatureHeader,
  signingSecret,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
}) {
  if (!Number.isInteger(toleranceSeconds) || toleranceSeconds < 1 || toleranceSeconds > 900)
    return false;
  const parts = String(signatureHeader || "")
    .split(",")
    .map((part) => part.trim().split("=", 2));
  const timestamp = Number(parts.find(([key]) => key === "t")?.[1]);
  const signatures = parts
    .filter(([key, value]) => key === "v1" && value)
    .map(([, value]) => value);
  if (!Number.isSafeInteger(timestamp) || !signatures.length) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
  const expected = createHmac("sha256", signingSecret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest("hex");
  return signatures.some((signature) => constantEqual(expected, signature));
}

function constantEqual(expected, supplied) {
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
