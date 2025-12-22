#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';

import pinataSDK from '@pinata/sdk';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PINATA_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = process.env.NFT_IMAGES_BUCKET || process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';

if (!PINATA_KEY || !PINATA_SECRET) {
  console.error('Missing Pinata keys (PINATA_API_KEY, PINATA_SECRET_API_KEY). Set them in .env.local or env.');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase URL or key (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const pinata = pinataSDK(PINATA_KEY, PINATA_SECRET);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  await fs.promises.writeFile(destPath, Buffer.from(buffer));
}

async function main() {
  try {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'treefi-pin-'));
    console.log('Downloading images into', tmpRoot);

    const rarities = ['uncommon', 'rare', 'epic', 'legendary'];
    let total = 0;

    for (const r of rarities) {
      const dir = path.join(tmpRoot, r);
      fs.mkdirSync(dir, { recursive: true });
      console.log('Listing supabase files for', r);
      const { data, error } = await supabase.storage.from(BUCKET).list(r, { limit: 100 });
      if (error) {
        console.warn('Could not list folder', r, error.message || error);
        continue;
      }
      for (const f of data || []) {
        const fileUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${r}/${f.name}`;
        const dest = path.join(dir, f.name);
        console.log('Downloading', fileUrl);
        await downloadFile(fileUrl, dest);
        total++;
      }
    }

    if (total === 0) {
      console.error('No files found to pin. Exiting.');
      process.exit(1);
    }

    console.log('Files downloaded:', total, 'Now pinning directory to Pinata...');

    // Use pinata.pinFromFs to pin the whole folder recursively
    const options = {
      pinataMetadata: {
        name: 'treefi-nft-images'
      }
    };

    const res = await pinata.pinFromFs(tmpRoot, options);
    console.log('Pinata response:', res);
    console.log('Pinned CID:', res.IpfsHash);

    console.log('\nNext steps:');
    console.log(` - Set Netlify env IPFS_IMAGES_ROOT=ipfs://${res.IpfsHash}`);
    console.log(' - Or run: node tools/generate-manifest.js with IPFS_IMAGES_ROOT set to generate and upload manifest.json to Supabase');

    // cleanup
    fs.rmSync(tmpRoot, { recursive: true, force: true });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
