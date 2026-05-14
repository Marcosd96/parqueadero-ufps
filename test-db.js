const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('Connecting to:', process.env.DATABASE_URL.split('@')[1]);
    const res = await pool.query('SELECT NOW()');
    console.log('Success:', res.rows[0]);
  } catch (err) {
    console.error('Connection failed:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

test();
