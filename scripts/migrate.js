import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { migratePlatform } from "../lib/platform.js";

const direction = process.argv.includes("--down") ? "down" : "up";
const path = resolve(process.env.PLATFORM_DB_PATH || "data/platform.db");
mkdirSync(dirname(path), { recursive: true });
const db = new DatabaseSync(path);
db.exec("PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;");
const changed = migratePlatform(db, direction);
db.close();
process.stdout.write(`${JSON.stringify({ database: path, direction, changed })}\n`);
