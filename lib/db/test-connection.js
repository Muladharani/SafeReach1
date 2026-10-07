import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not configured.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    await client.query("SELECT NOW()");

    console.log("Success: Connected to the database.");
  } catch (error) {
    console.error(
      "Database connection failed. Please ensure your host and credentials are correct."
    );

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown database connection error.");
    }

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

testConnection();
