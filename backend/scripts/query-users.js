const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: '1234',
    database: 'donarapp',
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, username, email FROM "user" ORDER BY id LIMIT 50;');
    console.log('rows:', res.rows);
  } catch (err) {
    console.error('error querying DB:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
