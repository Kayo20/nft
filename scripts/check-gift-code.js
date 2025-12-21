#!/usr/bin/env node
/*
Check single gift code record in Supabase using service role key.
Usage: node scripts/check-gift-code.js THE_CODE
*/

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const code = process.argv[2];
if (!code) {
  console.error('Usage: node scripts/check-gift-code.js THE_CODE');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const norm = String(code || '').trim().toUpperCase();
  // Try normalized_code, then code, then ilike
  let q = await supabase.from('gift_codes').select('*').eq('normalized_code', norm).limit(1).single();
  if (!q.data && !q.error) q = await supabase.from('gift_codes').select('*').eq('code', norm).limit(1).single();
  if (!q.data && !q.error) q = await supabase.from('gift_codes').select('*').ilike('code', String(code).trim()).limit(1).single();

  if (q.error) {
    console.error('Query error:', q.error);
    process.exit(1);
  }
  if (!q.data) {
    console.log('Not found');
    process.exit(0);
  }
  console.log(JSON.stringify(q.data, null, 2));
})();
