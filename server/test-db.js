import { query } from './simple-db.js';

async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connection successful!');
    console.log('Current time from database:', result.rows[0].now);
    
    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nExisting tables:');
    if (tablesResult.rows.length === 0) {
      console.log('No tables found.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log('-', row.table_name);
      });
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    console.log('\nTest complete. Exiting...');
    process.exit(0);
  }
}

testConnection();