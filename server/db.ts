import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';

// Use the DATABASE_URL environment variable provided by Replit
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});

const db = drizzle(pool);

export { pool, db };