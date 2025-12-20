#!/usr/bin/env node

/**
 * Import Gift Codes into Supabase
 * Usage:
 * 1. Ensure .env.local contains SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 2. node scripts/import-gift-codes.js [path]
 *    default path: scripts/generated-gift-codes.csv
 *
 * The script will upsert codes by `code` to avoid duplicates.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Prefer .env.local when present
const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local')) ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local or environment.');
  process.exit(1);
}

const fileArg = process.argv[2] || 'scripts/generated-gift-codes.csv';
const filePath = path.resolve(process.cwd(), fileArg);

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function ensureTableExists() {
  try {
    const { data, error } = await supabase.from('gift_codes').select('id').limit(1);
    if (error) {
      if (String(error.message).toLowerCase().includes('does not exist')) {
        console.error('❌ The table `public.gift_codes` does not exist in your database.');
        console.error('\nRun this SQL in Supabase SQL editor to create it:\n');
        console.error("CREATE TABLE IF NOT EXISTS public.gift_codes (\n  id serial PRIMARY KEY,\n  code text NOT NULL UNIQUE,\n  claimed boolean NOT NULL DEFAULT false,\n  claimed_by text,\n  claimed_at timestamptz\n);\n");
        process.exit(1);
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Error checking for gift_codes table:', err.message || err);
    process.exit(1);
  }
}

function parseCsv(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // Expect first line header possibly 'code'
  if (lines.length === 0) return [];
  const start = lines[0].toLowerCase() === 'code' ? 1 : 0;
  return lines.slice(start).map(l => ({ code: l }));
}

async function upsertCodes(rows) {
  try {
    // Use upsert with onConflict 'code' to avoid duplicates
    const { data, error } = await supabase.from('gift_codes').upsert(rows, { onConflict: 'code' });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error upserting gift codes:', err.message || err);
    process.exit(1);
  }
}

async function main() {
  await ensureTableExists();
  const rows = parseCsv(filePath);
  if (rows.length === 0) {
    console.log('No codes found in file.');
    return;
  }

  console.log(`Attempting to upsert ${rows.length} codes...`);
  const inserted = await upsertCodes(rows);
  console.log(`✅ Upsert complete. Total returned rows: ${inserted.length}`);
  process.exit(0);
}

main();
