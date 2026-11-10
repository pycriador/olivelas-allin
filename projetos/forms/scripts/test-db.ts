import pg from 'pg';

async function test() {
  const regions = ['sa-east-1', 'us-east-1', 'us-west-1', 'eu-central-1', 'ap-southeast-1'];
  for (const r of regions) {
    for (const port of [6543, 5432]) {
      const host = `aws-0-${r}.pooler.supabase.com`;
      const client = new pg.Client({
        host,
        port,
        user: 'postgres.pkbjoxzqllextmtmjoia',
        password: 'viDXv2XHa8cdU6Sz',
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 4000,
      });
      try {
        console.log(`Testing ${host}:${port}...`);
        await client.connect();
        console.log(`>>> SUCCESS with ${host}:${port}!`);
        const res = await client.query('SELECT current_database(), version()');
        console.log('Query result:', res.rows[0]);
        await client.end();
        return { host, port, user: 'postgres.pkbjoxzqllextmtmjoia' };
      } catch (e: any) {
        console.log(`Failed ${host}:${port}: ${e.message}`);
        try { await client.end(); } catch (_) {}
      }
    }
  }

  // Also test direct IPv6
  try {
    console.log('Testing direct IPv6 [2600:1f11:c29:8b02:40d:2acb:4ced:a813]:5432...');
    const client = new pg.Client({
      host: '2600:1f11:c29:8b02:40d:2acb:4ced:a813',
      port: 5432,
      user: 'postgres',
      password: 'viDXv2XHa8cdU6Sz',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });
    await client.connect();
    console.log('>>> SUCCESS with direct IPv6!');
    const res = await client.query('SELECT current_database(), version()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (e: any) {
    console.log(`Direct IPv6 failed: ${e.message}`);
  }
}

test();
