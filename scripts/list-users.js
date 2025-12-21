#!/usr/bin/env node
/*
List users from Supabase (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
Usage: node scripts/list-users.js
*/

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await supabase.from('users').select('*').limit(1000);
  if (error) {
    console.error('Failed to list users:', error);
    process.exit(1);
  }
  console.log(`Found ${data.length} users`);
  console.log(JSON.stringify(data, null, 2));
})();
