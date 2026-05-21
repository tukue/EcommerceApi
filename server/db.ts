import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);

export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to database");
    const result = await client.query("SELECT NOW()");
    console.log("Database time:", result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}

export { pool, db };
