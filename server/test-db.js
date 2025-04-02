// server/test-db.js
import pkg from 'pg';
const { Pool } = pkg;

// Encode the special characters in the password
const password = encodeURIComponent('i!H#oSF3zKG4');

const connectionString = `postgresql://postgres:${password}@localhost:5434/ecommerce_db`;


const pool = new Pool({
  connectionString: connectionString
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database');
    
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    
    client.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

testConnection();
