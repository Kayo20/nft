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

    // If an IPFS root is configured on the server, prefer it (set via Netlify env: IPFS_IMAGES_ROOT)
    const IPFS_ROOT = process.env.IPFS_IMAGES_ROOT || process.env.VITE_IPFS_IMAGES_ROOT || '';
    if (IPFS_ROOT) {
      try {
        const ipfsLib = await import('../../src/lib/ipfs');
        const imagesFromIpfs: Array<any> = [];
        for (const r of rarities) {
          const candidates = [`${IPFS_ROOT.replace(/\/$/, '')}/${r}`, `${IPFS_ROOT.replace(/\/$/, '')}/${r.charAt(0).toUpperCase()+r.slice(1)}`];
          for (const candidate of candidates) {
            const urls = await ipfsLib.listIpfsFolder(candidate);
            if (urls && urls.length) {
              urls.forEach(u => imagesFromIpfs.push({ rarity: r, name: u.split('/').pop(), url: u }));
              break;
            }
          }
        }
        if (imagesFromIpfs.length) return { statusCode: 200, headers, body: JSON.stringify({ images: imagesFromIpfs, source: 'ipfs-root' }) };
      } catch (e) {
        console.warn('IPFS root listing failed:', e?.message || e);
      }
    }

    // First, try to read per-rarity IPFS folder CIDs from Supabase (table: nft_image_roots)
    try {
      const { data: roots, error: rootsErr } = await supabase.from('nft_image_roots').select('rarity, cid, gateway_url, ipfs_path');
      if (!rootsErr && roots && roots.length) {
        const imagesFromRoots: Array<any> = [];
        for (const rrow of roots) {
          const r = String(rrow.rarity || '').toLowerCase();
          const candidateRoot = rrow.gateway_url || (rrow.cid ? `${(IPFS_ROOT || process.env.IPFS_GATEWAY || '').replace(/\/$/, '')}/${rrow.cid}` : null);
          if (!candidateRoot) continue;
          try {
            const urls = await (await import('../../src/lib/ipfs')).listIpfsFolder(candidateRoot);
            if (urls && urls.length) {
              urls.forEach(u => imagesFromRoots.push({ rarity: r, name: u.split('/').pop(), url: u }));
            }
          } catch (e) {
            console.warn('listing ipfs for root', candidateRoot, 'failed', e?.message || e);
          }
        }
        if (imagesFromRoots.length) return { statusCode: 200, headers, body: JSON.stringify({ images: imagesFromRoots, source: 'nft-image-roots' }) };
      }
    } catch (e) {
      console.warn('nft_image_roots listing failed:', e?.message || e);
    }

    // Fallback to Supabase storage listing
    const images: Array<any> = [];

    for (const r of rarities) {
      const { data, error } = await supabase.storage.from(BUCKET).list(r, { limit: 100 });
      if (error) {
        console.warn('list error for', r, error.message || error);
        continue;
      }
      (data || []).forEach(f => images.push({
        rarity: r,
        name: f.name,
        url: `${SUPABASE_URL_CLEAN}/storage/v1/object/public/${BUCKET}/${r}/${f.name}`
      }));
    }

    // If Supabase storage had no images (e.g., local dev), try local assets fallback
    let source = 'supabase-storage';
    if (!images.length) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const cwd = process.cwd();
        const assetsBase = path.join(cwd, 'src', 'assets');
        const raritiesLocal = ['uncommon','rare','epic','legendary'];
        for (const r of raritiesLocal) {
          const dir = path.join(assetsBase, r);
          try {
            const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp|svg)$/i.test(f));
            files.forEach(f => images.push({ rarity: r, name: f, url: `/src/assets/${r}/${f}` }));
          } catch (e) {
            // ignore if directory missing
          }
        }
        if (images.length) source = 'local-assets';
      } catch (e) {
        // ignore fallback errors
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ images, source }) };
  } catch (err: any) {
    console.error('list-nft-images error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
