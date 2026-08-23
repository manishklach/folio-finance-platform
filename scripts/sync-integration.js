import { resolve } from "node:path";
import { createLedger } from "../lib/db.js";
import { synchronizeProviderConnection } from "../lib/provider-adapters.js";
import { secret } from "../lib/secrets.js";

const options = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((value) => value.startsWith("--") && value.includes("="))
    .map((value) => value.slice(2).split(/=(.*)/s, 2)),
);
if (!options.database || !options.connection)
  throw new Error("Usage: npm run integrations:sync -- --database=<tenant.db> --connection=<id>");

const ledger = createLedger(resolve(options.database), { seed: false });
try {
  const result = await synchronizeProviderConnection({
    ledger,
    connectionId: options.connection,
    trigger: options.trigger || "scheduled",
    credentialResolver: (reference) => secret(reference, { required: true }),
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status !== "succeeded") process.exitCode = 1;
} finally {
  ledger.close();
}
