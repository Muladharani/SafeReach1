import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export let pool: any = null;
let dbInstance: any;

if (process.env.MOCK_DB === "true" || !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("REGION")) {
  throw new Error("PGlite fallback is intentionally disabled. SafeReach must use a real Supabase/PostgreSQL database in production. Please set a valid DATABASE_URL.");
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  dbInstance = drizzle(pool, { schema });
}

export const db = dbInstance as ReturnType<typeof drizzle<typeof schema>>;

export * from "./schema";
