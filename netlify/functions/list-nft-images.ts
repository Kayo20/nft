import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Prefer the server-side service role key for listing (secure in Netlify functions),
// fall back to anon/VITE names for flexibility during local dev
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_URL_CLEAN = (SUPABASE_URL || '').replace(/\/+$/, '');
const BUCKET = process.env.VITE_NFT_IMAGES_BUCKET || process.env.NFT_IMAGES_BUCKET || 'nft-images';

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const rarities = ['uncommon','rare','epic','legendary'];
    const images: Array<any> = [];

    for (const r of rarities) {
      // Debug: ensure storage listing works (service role key usually required)
      // console.log('Using key:', SUPABASE_KEY ? 'present' : 'missing');
      const { data, error } = await supabase.storage.from(BUCKET).list(r, { limit: 100 });
      if (error) {
        console.warn('list error for', r, error.message || error);
        continue;
      }
      (data || []).forEach(f => images.push({
        rarity: r,
        file: f.name,
        url: `${SUPABASE_URL_CLEAN}/storage/v1/object/public/${BUCKET}/${r}/${f.name}`
      }));
    }

    return { statusCode: 200, headers, body: JSON.stringify({ images }) };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
