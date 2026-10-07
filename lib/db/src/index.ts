import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

const { Pool } = pg;

export let pool: any = null;
let dbInstance: any;

if (process.env.MOCK_DB === "true" || !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("REGION")) {
  console.log("⚠️ USING IN-MEMORY MOCK DATABASE (PGlite) ⚠️");
  const client = new PGlite();
  dbInstance = drizzlePglite(client, { schema });
  
  // Create tables using the generated SQL
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sqlPath = path.resolve(__dirname, "../../../lib/db/drizzle/0000_normal_dormammu.sql");
    console.log("Checking SQL Path:", sqlPath);
    console.log("Does it exist?", fs.existsSync(sqlPath));
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, "utf-8");
      client.exec(sql).then(() => console.log("Mock database initialized.")).catch(e => console.error("Mock DB init error:", e));
    } else {
      console.error("SQL MIGRATION NOT FOUND at", sqlPath);
    }
  } catch (err) {
    console.error("Could not run migration on mock DB", err);
  }
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  dbInstance = drizzle(pool, { schema });
}

export const db = dbInstance as ReturnType<typeof drizzle<typeof schema>>;

export * from "./schema";
