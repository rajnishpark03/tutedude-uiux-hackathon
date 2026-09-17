// Creates the registrations table in your Neon database.
// Usage: DATABASE_URL=postgresql://... npm run db:setup
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in, then run:\n  set -a; source .env; set +a; npm run db:setup");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, "..", "db", "schema.sql"), "utf8");
const sql = neon(url);

// Run each statement separately (the serverless driver runs one statement per call).
// Newer driver versions accept sql(text); older ones expose sql.query(text).
const run = (text) => (typeof sql.query === "function" ? sql.query(text) : sql(text));
const statements = schema.split(";").map((s) => s.trim()).filter(Boolean);
for (const statement of statements) {
  await run(statement);
}
const [{ count }] = await sql`SELECT count(*)::int AS count FROM registrations`;
console.log(`Table "registrations" is ready. Current rows: ${count}`);
