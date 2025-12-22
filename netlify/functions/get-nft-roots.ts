import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const WORKSPACE_IPFS_GATEWAY = process.env.IPFS_GATEWAY || process.env.VITE_IPFS_GATEWAY || '';

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

// Simple in-memory cache (valid while function container is warm)
let cache: { ts: number; data: any } | null = null;
const TTL = Number(process.env.NFT_ROOTS_CACHE_TTL || '300') * 1000; // ms

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    const now = Date.now();
    if (cache && (now - cache.ts) < TTL) {
      return { statusCode: 200, headers, body: JSON.stringify({ cached: true, ttl: TTL / 1000, data: cache.data }) };
    }

    const { data: roots, error } = await supabase.from('nft_image_roots').select('rarity, cid, gateway_url, ipfs_path');
    if (error) {
      console.warn('get-nft-roots: supabase query error', error.message || error);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to query nft_image_roots' }) };
    }

    const results: any[] = [];

    // Dynamically import IPFS helper to avoid cold build issues
    const ipfsLib = await import('../../src/lib/ipfs');

    for (const row of (roots || [])) {
      const rarity = String(row.rarity || '').toLowerCase();
      const cid = row.cid || null;
      const gatewayUrl = row.gateway_url || null;
      const ipfsPath = row.ipfs_path || '';

      // Build candidate root to list
      let candidateRoot = gatewayUrl || (cid ? `${WORKSPACE_IPFS_GATEWAY.replace(/\/$/, '')}/${cid}` : null);
      if (candidateRoot && ipfsPath) {
        candidateRoot = candidateRoot.replace(/\/$/, '') + '/' + ipfsPath.replace(/^\/+/, '');
      }

      const record: any = { rarity, cid, gatewayUrl: gatewayUrl || null, candidateRoot };

      // Attempt to list sample images (limit to 50)
      try {
        if (candidateRoot) {
          const urls = await ipfsLib.listIpfsFolder(candidateRoot);
          record.images = (urls || []).slice(0, 50);
          record.imageCount = (urls || []).length;
        } else {
          record.images = [];
          record.imageCount = 0;
        }
      } catch (e) {
        record.images = [];
        record.imageCount = 0;
        console.warn('get-nft-roots: failed listing', candidateRoot, e?.message || e);
      }

      results.push(record);
    }

    const payload = { cached: false, ttl: TTL / 1000, data: results, fetchedAt: new Date().toISOString() };
    cache = { ts: now, data: payload };

    return { statusCode: 200, headers, body: JSON.stringify(payload) };
  } catch (err: any) {
    console.error('get-nft-roots error', err?.message || err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
};