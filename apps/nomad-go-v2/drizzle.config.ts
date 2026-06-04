import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit introspection must use a DIRECT Postgres connection (port 5432).
 * Supabase transaction pooler (6543) causes "checkValue.replace" crashes on pull/push.
 *
 * Prefer DATABASE_URL_DIRECT in .env (Supabase → Settings → Database → Direct connection).
 * Fallback: rewrite pooler port 6543 → 5432 on DATABASE_URL.
 */
function getDrizzleConnectionUrl(): string {
  const direct = process.env.DATABASE_URL_DIRECT?.trim();
  if (direct) return direct;

  const pooled = process.env.DATABASE_URL?.trim();
  if (!pooled) {
    throw new Error(
      "DATABASE_URL or DATABASE_URL_DIRECT is required for drizzle commands",
    );
  }

  if (pooled.includes(":6543")) {
    return pooled.replace(":6543", ":5432");
  }

  return pooled;
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  introspect: {
    casing: "preserve",
  },
  dbCredentials: {
    url: getDrizzleConnectionUrl(),
  },
});
