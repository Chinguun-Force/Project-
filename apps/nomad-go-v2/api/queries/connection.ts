import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";
import * as schema from "@db/schema";

let sql: postgres.Sql;
let instance: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (!instance) {
    sql = postgres(env.databaseUrl);
    instance = drizzle(sql, { schema });
  }
  return instance;
}
