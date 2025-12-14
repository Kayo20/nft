#!/usr/bin/env node
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

const DB_URL = process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('ERROR: SUPABASE_DB_URL required to check the database.');
  process.exit(1);
}

const client = new Client({ connectionString: DB_URL });

(async () => {
  try {
    await client.connect();
    const res = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'nfts';");
    if (res.rows.length === 0) {
      console.log('Table `nfts` not found in any schema.');
    } else {
      console.log('Found `nfts` table at:');
      res.rows.forEach(r => console.log(`  - ${r.table_schema}.${r.table_name}`));
      const sample = await client.query('SELECT * FROM nfts LIMIT 5;');
      console.log('\nSample rows (up to 5):', sample.rows);
    }
  } catch (err) {
    console.error('Error checking nfts table:', err.message || err);
  } finally {
    await client.end();
  }
})();
