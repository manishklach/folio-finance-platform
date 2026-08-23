import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { migratePlatform, platformMigrationStatus } from "../lib/platform.js";

const direction = process.argv.includes("--down") ? "down" : "up";
const checkOnly = process.argv.includes("--check");
const targetArgument = process.argv.find((argument) => argument.startsWith("--target="));
const target = targetArgument ? Number(targetArgument.slice("--target=".length)) : null;
const path = resolve(process.env.PLATFORM_DB_PATH || "data/platform.db");
mkdirSync(dirname(path), { recursive: true });
const db = new DatabaseSync(path);
db.exec("PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;");
const before = platformMigrationStatus(db, target);
const changed = checkOnly ? [] : migratePlatform(db, direction, target);
const after = platformMigrationStatus(db, target);
db.close();
process.stdout.write(
  `${JSON.stringify({ database: path, direction, check_only: checkOnly, before, changed, after })}\n`,
);
