#!/usr/bin/env node

/**
 * NFT Images Upload Script for Supabase
 * 
 * Usage:
 * 1. Get your Supabase credentials from https://app.supabase.com > Settings > API
 * 2. Set environment variables or update below:
 *    export SUPABASE_URL="https://xyz.supabase.co"
 *    export SUPABASE_KEY="eyJ..."
 * 3. Run: node scripts/upload-nfts.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const BUCKET_NAME = 'nft-images';
const ASSETS_PATH = path.join(__dirname, '../src/assets');

// Validate credentials
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('\nPlease set environment variables:');
  console.error('  export SUPABASE_URL="https://your-project.supabase.co"');
  console.error('  export SUPABASE_KEY="your-anon-key"');
  console.error('\nYou can find these at: https://app.supabase.com > Settings > API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rarities = ['uncommon', 'rare', 'epic', 'legendary'];
let uploadCount = 0;
let errorCount = 0;

async function uploadNFTs() {
  console.log('🚀 Starting NFT image upload to Supabase...\n');

  for (const rarity of rarities) {
    console.log(`📦 Processing ${rarity.toUpperCase()} NFTs...`);

    const dir = path.join(ASSETS_PATH, rarity);

    // Check if directory exists
    if (!fs.existsSync(dir)) {
      console.error(`  ⚠️  Directory not found: ${dir}`);
      continue;
    }

    const files = fs.readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
      });

    console.log(`  Found ${files.length} images\n`);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const storagePath = `${rarity}/${file}`;

      try {
        // Read file
        const fileData = fs.readFileSync(filePath);

        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, fileData, {
            cacheControl: '3600', // Cache for 1 hour
            upsert: true, // Replace if already exists
            contentType: 'image/png',
          });

        if (error) {
          throw new Error(error.message);
        }

        console.log(`  ✅ ${storagePath}`);
        uploadCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`  ❌ ${storagePath} - ${err.message}`);
        errorCount++;
      }
    }

    console.log('');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Upload complete!`);
  console.log(`   Uploaded: ${uploadCount} images`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} images`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errorCount === 0) {
    console.log('🎉 All images uploaded successfully!');
    console.log('\nNext steps:');
    console.log('1. Update src/lib/api.ts with Supabase image URLs');
    console.log('2. Restart your dev server: npm run dev');
    console.log('3. Check Dashboard page to see images loading\n');
  } else {
    process.exit(1);
  }
}

// Get bucket info first to verify access
async function verifyBucket() {
  try {
    console.log('🔍 Verifying Supabase access...\n');

    // Try to list bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });

    if (error) {
      // Bucket might not exist yet, try to create it
      console.log(`⚠️  Bucket "${BUCKET_NAME}" not found or not accessible\n`);
      console.log('📌 Create it manually:');
      console.log('1. Go to https://app.supabase.com');
      console.log('2. Select your project');
      console.log('3. Click Storage > New Bucket');
      console.log(`4. Name it: ${BUCKET_NAME}`);
      console.log('5. Choose "Public"');
      console.log('6. Run this script again\n');
      process.exit(1);
    }

    console.log(`✅ Connected to Supabase`);
    console.log(`✅ Bucket "${BUCKET_NAME}" is accessible\n`);
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

// Main execution
(async () => {
  await verifyBucket();
  await uploadNFTs();
})();
