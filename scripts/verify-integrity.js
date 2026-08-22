import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createLedger } from "../lib/db.js";

const platformPath = resolve(process.env.PLATFORM_DB_PATH || "data/platform.db");
const platform = new DatabaseSync(platformPath, { readOnly: true });
const organizations = platform
  .prepare("SELECT id,database_path FROM organizations WHERE status='active'")
  .all();
platform.close();
let failed = false;
const results = [];
for (const org of organizations) {
  const ledger = createLedger(org.database_path, { seed: false, orgId: org.id });
  const result = ledger.verifyIntegrity();
  ledger.close();
  results.push({ org_id: org.id, ...result });
  if (!result.valid) failed = true;
}
process.stdout.write(`${JSON.stringify({ results })}\n`);
if (failed) process.exitCode = 1;
