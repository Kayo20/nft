import { config } from 'dotenv';
import { createClient } from "@supabase/supabase-js";

config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
// Prefer service role key for listing buckets during local testing
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const BUCKET = process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Bucket:', BUCKET);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  try {
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      console.log('\nAvailable buckets:', buckets.map(b => b.name));
    }

    // List images in each rarity folder
    const rarities = ['uncommon', 'rare', 'epic', 'legendary'];
    for (const rarity of rarities) {
      console.log(`\nListing ${rarity} folder:`);
      const { data, error } = await supabase.storage.from(BUCKET).list(rarity, { limit: 100 });
      
      if (error) {
        console.error(`  Error:`, error.message);
      } else {
        console.log(`  Files found: ${(data || []).length}`);
        (data || []).forEach(f => {
          console.log(`    - ${f.name}`);
        });
      }
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
  }
})();
