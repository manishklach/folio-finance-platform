import { readFileSync } from "node:fs";

// Production secrets must be mounted as files by the deployment's secret manager.
// Local development may use .env through Node's --env-file-if-exists flag.
export function secret(name, { required = false } = {}) {
  const file = process.env[`${name}_FILE`];
  let value = file ? readFileSync(file, "utf8").trim() : process.env[name];
  if (process.env.NODE_ENV === "production" && value && !file)
    throw new Error(`${name} must be provided through ${name}_FILE in production`);
  if (required && !value) throw new Error(`${name} is required`);
  value = value?.trim();
  return value || undefined;
}
