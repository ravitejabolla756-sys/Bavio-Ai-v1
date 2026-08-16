require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../database/db');

async function checkSchema() {
  const tables = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Public tables in DB:', tables.rows.map(r => r.table_name));

  const businessesCols = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'businesses'
    ORDER BY ordinal_position;
  `);
  console.log('\nBusinesses table columns:', businessesCols.rows.map(r => `${r.column_name} (${r.data_type})`));
  process.exit(0);
}

checkSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
