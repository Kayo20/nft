#!/usr/bin/env node

/**
 * generate-manifest.js
 *
 * Scans the `nft-images` bucket folders and creates `manifest.json` at the
 * bucket root. The manifest lists all images with rarity and public URL.
 *
 * Usage (PowerShell):
 * $env:SUPABASE_URL = "https://your-project.supabase.co"
 * $env:SUPABASE_KEY = "eyJ..."   # anon public key
 * node tools/generate-manifest.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = process.env.NFT_IMAGES_BUCKET || process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';

console.log('🔍 Checking environment variables...\n');
console.log(`SUPABASE_URL: ${SUPABASE_URL ? 'SET' : 'MISSING'}`);
console.log(`SUPABASE_KEY: ${SUPABASE_KEY ? 'SET (length: ' + SUPABASE_KEY.length + ')' : 'MISSING'}`);
console.log(`BUCKET: ${BUCKET}\n`);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
  console.error('\nSet them in PowerShell like this:');
  console.error('  $env:SUPABASE_URL="https://YOUR-PROJECT-ID.supabase.co"');
  console.error('  $env:SUPABASE_KEY="YOUR-ANON-KEY"');
  console.error('\nThen run: node tools/generate-manifest.js\n');
  process.exit(1);
}

// Validate URL format
if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('supabase.co')) {
  console.error('❌ Error: SUPABASE_URL is malformed.');
  console.error(`   Got: "${SUPABASE_URL}"`);
  console.error('   Expected format: https://YOUR-PROJECT-ID.supabase.co\n');
  process.exit(1);
}

console.log('✅ Environment variables validated.\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const rarities = ['uncommon', 'rare', 'epic', 'legendary'];

(async function main(){
  try {
    const manifest = [];

    for (const r of rarities) {
      const { data, error } = await supabase.storage.from(BUCKET).list(r, { limit: 100 });
      if (error) {
        console.warn(`Warning: could not list folder '${r}':`, error.message || error);
        continue;
      }

      for (const file of data || []) {
        manifest.push({
          rarity: r,
          name: file.name,
          url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${r}/${file.name}`
        });
      }
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      images: manifest
    };

    const json = JSON.stringify(payload, null, 2);

    // Upload manifest.json to bucket root (upsert)
    const { error: upErr } = await supabase.storage.from(BUCKET).upload('manifest.json', Buffer.from(json), {
      contentType: 'application/json',
      upsert: true
    });

    if (upErr) {
      console.error('Failed to upload manifest.json:', upErr.message || upErr);
      process.exit(1);
    }

    console.log('manifest.json uploaded successfully. Public URL:');
    console.log(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/manifest.json`);
  } catch (err) {
    console.error('Error generating manifest:', err);
    process.exit(1);
  }
})();
