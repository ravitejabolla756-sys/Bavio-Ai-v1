require('dotenv').config();
const db = require('../database/db');

async function main() {
  try {
    const res = await db.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'businesses'`
    );
    console.log('Columns in businesses table:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.pool.end();
  }
}

main();
