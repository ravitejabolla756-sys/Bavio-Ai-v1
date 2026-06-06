import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import * as fs from 'fs';

// Load environmental variables from the root .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL environmental variable is not defined in .env file.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function executeSqlFile(filePath: string): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Running SQL script from: ${path.basename(filePath)}...`);
  await pool.query(sql);
  console.log(`  ✅ Successfully executed ${path.basename(filePath)}.`);
}

async function run() {
  console.log('═══════════════════════════════════════════════');
  console.log('       BAVIO MULTI-COUNTRY DATABASE ROUTER     ');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // 1. Run Migrations
    const migrationPath = path.join(__dirname, 'migrations', 'AddMultiCountrySupport.sql');
    await executeSqlFile(migrationPath);

    // 2. Run Seeds
    const seedPath = path.join(__dirname, 'seeds', 'multiCountryTest.sql');
    await executeSqlFile(seedPath);

    console.log('\n🎉 Database migrations and test seeds completed successfully.');
  } catch (err: any) {
    console.error('\n❌ Execution failed:');
    console.error(err.stack || err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Connection pool closed.');
  }
}

run();
