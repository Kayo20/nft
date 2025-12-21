import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";

const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn("Supabase client not configured for mint-nft");
}

function pickImageForRarity(manifest: any, rarity: string) {
  const list = (manifest?.images || []).filter((i: any) => String(i.rarity || '').toLowerCase() === rarity.toLowerCase());
  if (!list || list.length === 0) return null;
  // choose random image from rarity 
  return list[Math.floor(Math.random() * list.length)].url;
}

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'request body required' }) };
    const body = JSON.parse(event.body);
    const { name, rarity, ownerWallet } = body || {};
    if (!name || !rarity) return { statusCode: 400, headers, body: JSON.stringify({ error: 'name and rarity are required' }) };

    const session = verifySession(event.headers.cookie);
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'not authenticated' }) };
    }

    const caller = session.address;
    let owner = caller;

    // allow admin override with secret header
    if (ownerWallet) {
      const adminSecret = process.env.MINT_ADMIN_SECRET;
      const headerSecret = event.headers['x-admin-secret'];
      if (!adminSecret || headerSecret !== adminSecret) {
        // reject override unless caller equals ownerWallet
        if ((ownerWallet || '').toLowerCase() !== (caller || '').toLowerCase()) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'owner mismatch or missing admin secret' }) };
        }
      } else {
        owner = ownerWallet;
      }
    }

    // fetch manifest from Supabase public storage
    const BUCKET = process.env.NFT_IMAGES_BUCKET || process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';
    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    if (!SUPABASE_URL) return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_URL not configured' }) };

    const manifestUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/manifest.json`;
    const manifestRes = await fetch(manifestUrl);
    if (!manifestRes.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: 'failed to fetch manifest', status: manifestRes.status }) };
    const manifest = await manifestRes.json();
    const imageUrl = pickImageForRarity(manifest, rarity);
    if (!imageUrl) return { statusCode: 400, headers, body: JSON.stringify({ error: 'no image found for requested rarity' }) };

    // Build metadata
    const metadata = {
      name,
      description: 'A powerful NFT item',
      image: imageUrl,
      attributes: [{ trait_type: 'Rarity', value: rarity }],
      createdAt: new Date().toISOString(),
    };

    // Pin metadata JSON to Pinata
    const pinataKey = process.env.PINATA_API_KEY;
    const pinataSecret = process.env.PINATA_SECRET_API_KEY;
    if (!pinataKey || !pinataSecret) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Pinata credentials not configured' }) };

    const pinRes = await fetch(PINATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: pinataKey,
        pinata_secret_api_key: pinataSecret,
      } as any,
      body: JSON.stringify({ pinataMetadata: { name: `${name}-${Date.now()}` }, pinataContent: metadata }),
    });

    if (!pinRes.ok) {
      const txt = await pinRes.text();
      console.error('Pinata error', pinRes.status, txt);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Pinata pin failed', details: txt }) };
    }

    const pinJson = await pinRes.json();
    const cid = pinJson?.IpfsHash;
    const metadataUrl = `ipfs://${cid}`;

    // Insert record into Supabase nfts table
    if (!supabase) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase service not available' }) };

    // Try to insert with a metadata_cid column; if that fails, insert metadata_cid into metadata
    try {
      const { data, error } = await supabase.from('nfts').insert([
        {
          owner_address: (owner || '').toLowerCase(),
          rarity,
          name,
          image_url: imageUrl,
          metadata: metadata,
          metadata_cid: cid,
        },
      ]).select().single();

      if (error) throw error;

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, metadataUrl, cid, nft: data }) };
    } catch (err: any) {
      console.warn('Insert with metadata_cid failed; trying fallback. Error:', err?.message || err);
      // fallback: attach cid to metadata and insert
      try {
        const fallbackMeta = { ...metadata, metadata_cid: cid };
        const { data: data2, error: err2 } = await supabase.from('nfts').insert([
          {
            owner_address: (owner || '').toLowerCase(),
            rarity,
            name,
            image_url: imageUrl,
            metadata: fallbackMeta,
          },
        ]).select().single();

        if (err2) throw err2;

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, metadataUrl, cid, nft: data2 }) };
      } catch (err3: any) {
        console.error('Final insert failed', err3);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to save NFT in DB', details: err3?.message || String(err3) }) };
      }
    }
  } catch (error: any) {
    console.error('mint-nft error', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
