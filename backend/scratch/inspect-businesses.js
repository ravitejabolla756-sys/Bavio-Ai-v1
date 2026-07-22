const db = require('../database/db');
async function run() {
  const enumRes = await db.query(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE typname = 'plan_type'
  `);
  console.log('plan_type Enum values:', enumRes.rows.map(r => r.enumlabel));
}
run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
