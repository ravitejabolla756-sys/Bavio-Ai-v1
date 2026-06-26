require('dotenv').config();
const db = require('../database/db');

async function main() {
  try {
    const res = await db.query(
      `SELECT conname, pg_get_constraintdef(oid) 
       FROM pg_constraint 
       WHERE conrelid = 'users'::regclass`
    );
    console.log('Constraints on users table:');
    res.rows.forEach(row => {
      console.log(`- ${row.conname}: ${row.pg_get_constraintdef}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.pool.end();
  }
}

main();
