#!/usr/bin/env node
/*
  Run SQL migration files in supabase/migrations against a Postgres DB.

  Usage:
    SUPABASE_DB_URL="postgres://..." node scripts/run-migrations.js

  It reads all .sql files in `supabase/migrations` in filename order and executes them.
*/
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

const DB_URL = process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('ERROR: SUPABASE_DB_URL (Postgres connection string) required in env to run migrations.');
  console.error('Set it for example in .env.local as SUPABASE_DB_URL="postgres://..." and re-run `npm run migrate`.');
  process.exit(1);
}

const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.error('ERROR: migrations directory not found:', migrationsDir);
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
if (files.length === 0) {
  console.log('No migration files found in', migrationsDir);
  process.exit(0);
}

const client = new Client({ connectionString: DB_URL });

(async () => {
  try {
    await client.connect();
    for (const file of files) {
      const fp = path.join(migrationsDir, file);
      console.log('\n== Running migration:', file);
      const sql = fs.readFileSync(fp, 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('  -> OK');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('  -> FAILED:', err.message || err);
        throw err;
      }
    }
    console.log('\nAll migrations applied successfully.');
  } catch (err) {
    console.error('\nMigration process failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
