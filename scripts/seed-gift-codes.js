#!/usr/bin/env node

/**
 * Seed Gift Codes Script
 * Usage:
 * 1. Put Supabase creds in `.env.local` (or `.env`):
 *    SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 2. Run: node scripts/seed-gift-codes.js [count]
 *    e.g. node scripts/seed-gift-codes.js 150
 *
 * The script will generate the requested number of unique gift codes
 * and insert them into the `gift_codes` table. If the table is missing
 * it will print SQL to create it and exit.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Prefer .env.local when present (local dev), otherwise fall back to .env
const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local')) ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local or environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function randSuffix(len = 4) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < len; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

function generateCode(index) {
  const suffix = randSuffix(4);
  return `OG-TREE-${String(index).padStart(5, '0')}-${suffix}`;
}

async function ensureTableExists() {
  try {
    const { data, error } = await supabase.from('gift_codes').select('id').limit(1);
    if (error) {
      if (typeof error.message === 'string' && error.message.toLowerCase().includes('does not exist')) {
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

async function fetchExistingCodes() {
  const existing = new Set();
  try {
    // Pull up to 10000 existing codes (should be plenty)
    const { data, error } = await supabase.from('gift_codes').select('code').limit(10000);
    if (error) throw error;
    for (const r of data || []) existing.add(r.code);
  } catch (err) {
    console.error('Error fetching existing gift codes:', err.message || err);
    process.exit(1);
  }
  return existing;
}

async function insertCodes(codes) {
  try {
    const rows = codes.map(c => ({ code: c }));
    const { data, error } = await supabase.from('gift_codes').insert(rows);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error inserting gift codes:', err.message || err);
    process.exit(1);
  }
}

async function main() {
  const countArg = parseInt(process.argv[2] || '150', 10);
  const desired = Number.isFinite(countArg) && countArg > 0 ? countArg : 150;

  await ensureTableExists();
  const existing = await fetchExistingCodes();

  console.log(`Existing codes: ${existing.size}`);

  const newCodes = [];
  // Start index at existing.size + 1 to keep numbering sensible but ensure uniqueness overall
  let idx = existing.size + 1;
  while (newCodes.length < desired) {
    const code = generateCode(idx);
    if (!existing.has(code) && !newCodes.includes(code)) {
      newCodes.push(code);
    }
    idx++;
    // Safety: keep idx growing even if collisions happen
  }

  console.log(`Inserting ${newCodes.length} new gift codes...`);
  const inserted = await insertCodes(newCodes);

  // Write to local file for your records
  const outPath = path.resolve(process.cwd(), 'scripts', 'generated-gift-codes.txt');
  fs.writeFileSync(outPath, inserted.map(r => r.code).join('\n'));

  console.log(`✅ Inserted ${inserted.length} gift codes. Saved to ${outPath}`);
  console.log('Sample codes:');
  for (let i = 0; i < Math.min(10, inserted.length); i++) console.log(inserted[i].code);
  process.exit(0);
}

main();
