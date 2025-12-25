#!/usr/bin/env node
// Normalize owner addresses to lowercase in lands, nfts and users
// Usage: node tools/backfill-normalize-owner-addresses.js [--dry-run]

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const dryRun = process.argv.includes('--dry-run');

async function normalizeTable(table, column) {
  console.log(`Normalizing ${table}.${column}`);
  const { data: rows, error } = await supabase.from(table).select('id, ' + column);
  if (error) { console.error('Failed to fetch', table, error); return; }
  for (const r of rows) {
    const val = r[column];
    if (!val) continue;
    const lower = String(val).toLowerCase();
    if (val !== lower) {
      console.log(`Will update ${table} id=${r.id} ${column}=${val} -> ${lower}`);
      if (!dryRun) {
        const { error: up } = await supabase.from(table).update({ [column]: lower }).eq('id', r.id);
        if (up) console.error('Update failed', up);
      }
    }
  }
}

async function main() {
  console.log('Starting normalization (dryRun=%s)...', dryRun);
  await normalizeTable('lands', 'owner');
  await normalizeTable('nfts', 'owner_address');
  await normalizeTable('users', 'wallet_address');
  console.log('Done');
}

main().catch(e => { console.error('Script error', e); process.exit(1); });
