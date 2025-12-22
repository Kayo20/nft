#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';

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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  await fs.promises.writeFile(destPath, Buffer.from(buffer));
}

async function walkDir(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const nested = await walkDir(full);
      files.push(...nested);
    } else if (e.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function pinDirectoryToPinata(tmpRoot, name = 'treefi-nft-images') {
  const form = new FormData();

  const files = await walkDir(tmpRoot);
  for (const f of files) {
    const rel = path.relative(tmpRoot, f).replace(/\\/g, '/');
    // Pinata supports filename to carry the relative path, which preserves folder structure
    form.append('file', fs.createReadStream(f), { filename: rel });
  }

  form.append('pinataOptions', JSON.stringify({ wrapWithDirectory: true }));
  form.append('pinataMetadata', JSON.stringify({ name }));

  const headers = Object.assign(form.getHeaders(), {
    pinata_api_key: PINATA_KEY,
    pinata_secret_api_key: PINATA_SECRET,
  });

  console.log('Uploading to Pinata (this may take several minutes)...');

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json; // expect { IpfsHash, PinSize, Timestamp }
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
      const { data, error } = await supabase.storage.from(BUCKET).list(r, { limit: 1000 });
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

    const resp = await pinDirectoryToPinata(tmpRoot, 'treefi-nft-images');
    console.log('Pinata response:', resp);
    console.log('Pinned CID:', resp.IpfsHash);

    console.log('\nNext steps:');
    console.log(` - Set Netlify env IPFS_IMAGES_ROOT=ipfs://${resp.IpfsHash}`);
    console.log(' - Or run: node tools/generate-manifest.js with IPFS_IMAGES_ROOT set to generate and upload manifest.json to Supabase');

    // cleanup
    fs.rmSync(tmpRoot, { recursive: true, force: true });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

if (require.main === module) main();
