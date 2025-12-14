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
    const { data, error } = await supabase.from('nfts').select('id').limit(1);
    if (error) {
      console.error('Query error:', error);
    } else {
      console.log('Query result sample:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
})();