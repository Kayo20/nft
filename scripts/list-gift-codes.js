#!/usr/bin/env node

/**
 * List Gift Codes Script
 * Usage:
 * 1. Set env vars (or create a .env file):
 *    SUPABASE_URL=https://your-project.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 2. Run: node scripts/list-gift-codes.js
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
  console.error('❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listCodes(limit = 4) {
  try {
    const { data, error } = await supabase.from('gift_codes').select('id,code,claimed,claimed_by,claimed_at').order('id', { ascending: true }).limit(limit);
    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('No gift codes found.');
      return;
    }

    console.log(`Showing up to ${limit} gift codes:\n`);
    for (const row of data) {
      console.log(`${row.id || '-'}  ${row.code}  claimed: ${row.claimed ? 'yes' : 'no'}${row.claimed ? ` by ${row.claimed_by || '-'} at ${row.claimed_at || '-'}` : ''}`);
    }
  } catch (err) {
    console.error('Error fetching gift codes:', err.message || err);
    process.exit(1);
  }
}

listCodes();
