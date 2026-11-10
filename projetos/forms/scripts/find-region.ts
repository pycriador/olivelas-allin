import pg from 'pg';

const regions = [
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-central-2',
  'eu-north-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
];

async function findRegion() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const client = new pg.Client({
      host,
      port: 5432,
      user: 'postgres.pkbjoxzqllextmtmjoia',
      password: 'viDXv2XHa8cdU6Sz',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
    try {
      await client.connect();
      console.log(`FOUND REGION! -> ${r} host: ${host}`);
      const res = await client.query('SELECT current_database(), version()');
      console.log('Result:', res.rows[0]);
      await client.end();
      return r;
    } catch (e: any) {
      if (!e.message.includes('not found') && !e.message.includes('timeout')) {
        console.log(`Region ${r} responded with different error:`, e.message);
      }
      try { await client.end(); } catch (_) {}
    }
  }
  console.log('Finished testing regions.');
}

findRegion();
