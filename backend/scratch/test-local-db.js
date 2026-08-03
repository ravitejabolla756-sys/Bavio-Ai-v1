const { Client } = require('pg');

async function test() {
  const connectionStrings = [
    'postgresql://postgres:kingofindianocean@127.0.0.1:5432/postgres',
    'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    'postgresql://postgres:@127.0.0.1:5432/postgres',
  ];

  for (const conn of connectionStrings) {
    console.log('Testing connection string:', conn);
    const client = new Client({ connectionString: conn });
    try {
      await client.connect();
      console.log('✅ Connected successfully!');
      const res = await client.query('SELECT NOW()');
      console.log('Server time:', res.rows[0].now);
      await client.end();
      break;
    } catch (err) {
      console.error('❌ Failed:', err.message);
    }
  }
}

test();
