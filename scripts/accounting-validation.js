import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createAccountingValidationPack,
  evaluateAccountingValidationPack,
} from "../lib/accounting-validation.js";

const [command = "check"] = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const option = (name, fallback = "") =>
  process.argv.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3) ||
  fallback;
const path = resolve(option(command === "init" ? "output" : "input", "accounting-validation.json"));

if (command === "init") {
  const force = process.argv.includes("--force");
  if (existsSync(path) && !force)
    throw new Error(`Refusing to overwrite ${path}; pass --force to replace it`);
  const commit = option(
    "commit",
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  );
  const pack = createAccountingValidationPack({
    commit,
    version: option("version", "release-candidate"),
    imageDigest: option("image-digest"),
  });
  writeFileSync(path, `${JSON.stringify(pack, null, 2)}\n`, { flag: force ? "w" : "wx" });
  process.stdout.write(`${JSON.stringify({ created: path, cases: pack.cases.length })}\n`);
} else if (["check", "gate"].includes(command)) {
  const pack = JSON.parse(readFileSync(path, "utf8"));
  const result = evaluateAccountingValidationPack(pack);
  process.stdout.write(`${JSON.stringify({ input: path, ...result }, null, 2)}\n`);
  if (!result.valid || (command === "gate" && !result.ready)) process.exitCode = 1;
} else {
  throw new Error("Usage: accounting-validation init|check|gate [--input=path] [--output=path]");
}
