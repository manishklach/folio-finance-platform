import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const sourceArg = process.argv.find((value) => value.startsWith("--source="));
const targetArg = process.argv.find((value) => value.startsWith("--target="));
if (!sourceArg || !targetArg)
  throw new Error("Usage: npm run restore -- --source=/backup/path --target=/empty/restore/path");
const source = resolve(sourceArg.slice("--source=".length));
const target = resolve(targetArg.slice("--target=".length));
if (!existsSync(join(source, "manifest.json"))) throw new Error("Backup manifest not found");
mkdirSync(target, { recursive: true });
if (readdirSync(target).length) throw new Error("Restore target must be empty");
const manifest = JSON.parse(readFileSync(join(source, "manifest.json"), "utf8"));
for (const file of manifest.files) {
  const from = join(source, file.backup);
  const actual = createHash("sha256").update(readFileSync(from)).digest("hex");
  if (actual !== file.sha256) throw new Error(`Backup checksum mismatch: ${file.backup}`);
  const name = file.kind === "platform" ? "platform.db" : join("tenants", `${file.org_id}.db`);
  const destination = join(target, name);
  mkdirSync(resolve(destination, ".."), { recursive: true });
  copyFileSync(from, destination);
}
process.stdout.write(
  `${JSON.stringify({ restored_to: target, databases: manifest.files.length })}\n`,
);
