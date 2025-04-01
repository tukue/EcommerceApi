import pkg from 'pg';
const { Pool } = pkg;

// Create a new pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});

// Query helper function
const query = (text, params) => pool.query(text, params);
const connect = () => pool.connect();

export { pool, query, connect };