import { spawnSync } from "node:child_process";
import { validateOperationsConfig } from "../lib/operations-config.js";

const result = validateOperationsConfig(process.env);
if (!process.argv.includes("--skip-compose")) {
  const compose = spawnSync(
    "docker",
    ["compose", "-f", "compose.production.yml", "config", "--quiet"],
    { stdio: "inherit" },
  );
  if (compose.error) throw compose.error;
  if (compose.status !== 0) throw new Error("Production Compose configuration is invalid");
}
process.stdout.write(`${JSON.stringify(result)}\n`);
