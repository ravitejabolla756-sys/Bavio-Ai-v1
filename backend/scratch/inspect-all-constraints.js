require('dotenv').config();
const db = require('../database/db');

async function main() {
  try {
    const res = await db.query(
      `SELECT conname, pg_get_constraintdef(pg_constraint.oid), relname 
       FROM pg_constraint 
       JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
       WHERE relname IN ('users', 'businesses')`
    );
    console.log('Constraints on users and businesses tables:');
    res.rows.forEach(row => {
      console.log(`- [${row.relname}] ${row.conname}: ${row.pg_get_constraintdef}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.pool.end();
  }
}

main();
