import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', SUPABASE_URL);
console.log('Using key present:', !!SUPABASE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  try {
    const sql = `SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;`;

    const { data, error } = await supabase.rpc('sql', { sql_text: sql });
    // Supabase doesn't expose raw SQL via RPC; fallback to using from('pg_catalog.pg_tables')
    if (error) {
      // Try alternate: query pg_catalog.pg_tables via REST-like builder
      const { data: t2, error: e2 } = await supabase.from('pg_catalog.pg_tables').select('schemaname, tablename').neq('schemaname','pg_catalog');
      if (e2) {
        console.error('Error listing tables (both methods failed):', e2);
      } else {
        console.log('Tables (via pg_catalog.pg_tables):', t2.slice(0,50));
      }
    } else {
      console.log('Tables (via sql rpc):', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
})();