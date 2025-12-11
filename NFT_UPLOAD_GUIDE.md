# NFT Rarity Upload Guide - Supabase Storage

This guide walks you through uploading your 4 NFT rarities to Supabase Storage and configuring your backend to fetch from there.

## Overview

You have:
- **Uncommon**: 40 images (`uncommon/1.png` to `uncommon/40.png`)
- **Rare**: 3 images (`rare/1.png` to `rare/3.png`)
- **Epic**: 3 images (`epic/1.png` to `epic/3.png`)
- **Legendary**: 10 images (`legendary/1.png` to `legendary/10.png`)

**Total: 56 unique NFT images**

---

## Step 1: Create Supabase Storage Bucket

### 1a. Go to Supabase Dashboard

1. Open https://app.supabase.com
2. Sign in with your account
3. Select your **TreeFi project**
4. Click **Storage** in the left sidebar

### 1b. Create "nft-images" Bucket

1. Click **New Bucket**
2. Name it: `nft-images`
3. Choose **Public** (so images are accessible via URL)
4. Click **Create Bucket**

### 1c. Set Bucket Settings

1. Click the bucket name `nft-images`
2. Click **Settings** (gear icon)
3. Ensure **Public** is selected
4. Note the **Bucket URL** format - it will be:
   ```
   https://<project-id>.supabase.co/storage/v1/object/public/nft-images/
   ```

---

## Step 2: Upload NFT Images

### Option A: Manual Upload (Easy, No Code)

1. In Supabase Storage, click `nft-images` bucket
2. Create folders by uploading files:

**For Uncommon (40 images):**
1. Click **Upload**
2. Select all 40 files from `src/assets/uncommon/`
3. Click **Upload**
4. Supabase will organize them in the root (or create `/uncommon/` folder if you drag-and-drop)

Repeat for Rare, Epic, and Legendary.

**Result structure in Supabase:**
```
nft-images/
├── uncommon/
│   ├── 1.png
│   ├── 2.png
│   ├── ...
│   └── 40.png
├── rare/
│   ├── 1.png
│   ├── 2.png
│   └── 3.png
├── epic/
│   ├── 1.png
│   ├── 2.png
│   └── 3.png
└── legendary/
    ├── 1.png
    ├── 2.png
    ├── ...
    └── 10.png
```

---

### Option B: Automated Upload Script (Code-Based - Faster)

If you have 56+ images, this is faster. Create this script:

**File: `scripts/upload-nfts.js`**

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Your Supabase credentials (from Settings > API)
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY'; // Use anon key for uploads

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadNFTs() {
  const rarities = ['uncommon', 'rare', 'epic', 'legendary'];
  
  for (const rarity of rarities) {
    console.log(`\nUploading ${rarity} NFTs...`);
    
    const dir = path.join(__dirname, `../src/assets/${rarity}`);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileData = fs.readFileSync(filePath);
      const storagePath = `${rarity}/${file}`;
      
      try {
        const { error } = await supabase.storage
          .from('nft-images')
          .upload(storagePath, fileData, {
            cacheControl: '3600',
            upsert: true, // Replace if exists
          });
        
        if (error) throw error;
        console.log(`✓ Uploaded ${storagePath}`);
      } catch (err) {
        console.error(`✗ Failed to upload ${storagePath}:`, err.message);
      }
    }
  }
  
  console.log('\n✅ Upload complete!');
}

uploadNFTs();
```

**To run:**

```bash
# Install dependencies
npm install @supabase/supabase-js

# Get your Supabase credentials:
# 1. Go to https://app.supabase.com
# 2. Select your project
# 3. Click Settings > API
# 4. Copy "Project URL" and "anon public" key

# Edit scripts/upload-nfts.js with your credentials

# Run the upload
node scripts/upload-nfts.js
```

---

## Step 3: Update Backend to Use Supabase Images

### 3a. Update Environment Variables

Add to your `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_NFT_IMAGES_BUCKET=nft-images
```

### 3b. Update NFT Generation Function

**File: `netlify/functions/_utils/mock_db.ts`**

Find the `generateMockNFTs` function and update it:

```typescript
import { createClient } from '@supabase/supabase-js';

// Get Supabase image base URL
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const NFT_IMAGES_BUCKET = process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';

const getRandomImage = (rarity: string): string => {
  const rarityImages: Record<string, number> = {
    'Uncommon': 40,
    'Rare': 3,
    'Epic': 3,
    'Legendary': 10,
  };
  
  const maxImages = rarityImages[rarity] || 1;
  const randomNum = Math.floor(Math.random() * maxImages) + 1;
  
  return `${SUPABASE_URL}/storage/v1/object/public/${NFT_IMAGES_BUCKET}/${rarity.toLowerCase()}/${randomNum}.png`;
};

export function generateMockNFTs(owner: string, count: number = 3) {
  const rarities = ['Uncommon', 'Rare', 'Epic', 'Legendary'];
  const weights = [0.5, 0.3, 0.15, 0.05]; // 50%, 30%, 15%, 5%
  
  const nfts = [];
  
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let rarity = 'Uncommon';
    let cumulative = 0;
    
    for (let j = 0; j < rarities.length; j++) {
      cumulative += weights[j];
      if (rand <= cumulative) {
        rarity = rarities[j];
        break;
      }
    }
    
    const power = rarity === 'Uncommon' ? 10 : 
                 rarity === 'Rare' ? 15 :
                 rarity === 'Epic' ? 25 : 40;
    
    const dailyYield = rarity === 'Uncommon' ? 5 :
                       rarity === 'Rare' ? 10 :
                       rarity === 'Epic' ? 18 : 30;
    
    nfts.push({
      id: i + 1,
      tokenId: `0x${Math.random().toString(16).slice(2)}`,
      owner,
      rarity,
      name: `${rarity} Tree #${i + 1}`,
      image: getRandomImage(rarity), // ← Now uses Supabase URL
      power,
      dailyYield,
      lastFarmed: null,
      accumulatedRewards: 0,
      health: 100,
    });
  }
  
  return nfts;
}
```

### 3c. Update Frontend Image Fetching

**File: `src/hooks/useNFTs.ts`** (Already done, but verify):

```typescript
export function useNFTs(address: string) {
  return useQuery({
    queryKey: ['nfts', address],
    queryFn: async () => {
      if (!address) throw new Error('No address provided');
      
      const response = await fetch(
        `/api/get-nfts?owner=${address}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Images are now from Supabase!
      return data.nfts || [];
    },
    enabled: !!address,
  });
}
```

---

## Step 4: Display NFT Images

### Frontend Usage Example

Images are now fetched automatically in your components. They'll use the Supabase URLs:

```typescript
// In any component using NFTs
const { nfts } = useNFTs(address);

// Each NFT has image property like:
// {
//   id: 1,
//   image: "https://xyz.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png",
//   name: "Uncommon Tree #1",
//   rarity: "Uncommon",
//   ...
// }

// Display in component
<img src={nft.image} alt={nft.name} className="w-32 h-32" />
```

---

## Step 5: Verify Setup

### Test 1: Check Supabase Storage

1. Go to Supabase Dashboard > Storage
2. Click `nft-images` bucket
3. You should see folders: `uncommon/`, `rare/`, `epic/`, `legendary/`
4. Click one image to see its **public URL**

Example public URL:
```
https://abcdef123.supabase.co/storage/v1/object/public/nft-images/uncommon/1.png
```

### Test 2: Check Backend Response

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open browser DevTools > Network
3. Navigate to Dashboard or Inventory page
4. Look for request to `/api/get-nfts?owner=...`
5. In Response, check that `image` field contains Supabase URLs

Example:
```json
{
  "nfts": [
    {
      "id": 1,
      "name": "Uncommon Tree #1",
      "image": "https://project.supabase.co/storage/v1/object/public/nft-images/uncommon/1.png",
      "rarity": "Uncommon",
      ...
    }
  ]
}
```

### Test 3: Verify Images Load

1. Go to your Inventory or Dashboard page
2. You should see NFT images rendered properly
3. In DevTools > Network, images should load with 200 status
4. No broken image icons should appear

---

## Single manifest & API listing (one-link options)

If you've uploaded all images to the `nft-images` bucket you may want a single link that lists every image. Two options are provided in this repo:

- Option 1 (recommended): generate and upload `manifest.json` to the bucket root. The manifest is a single JSON file with every image URL and metadata. Once uploaded it will be available at:

  `https://<project-id>.supabase.co/storage/v1/object/public/nft-images/manifest.json`

  Use the script `tools/generate-manifest.js` (already added) to create and upload the manifest. Example (PowerShell):

  ```powershell
  $env:SUPABASE_URL = "https://<project-id>.supabase.co"
  $env:SUPABASE_KEY = "eyJ..." # anon public key
  node tools/generate-manifest.js
  ```

  The script prints the public manifest URL after success. The frontend can then fetch that single URL to receive the full list of NFT images.

- Option 2 (dynamic): call the Netlify function `/api/list-nft-images` (local route `/.netlify/functions/list-nft-images`) which lists files live from the bucket and returns JSON. This repo contains a template function at `netlify/functions/list-nft-images.ts`. Run `netlify dev` or deploy to use it.

Both options are supported: the manifest is simplest and cacheable; the function gives live results when you frequently add/remove files.

---

## Step 6: Database Integration (Optional But Recommended)

If you want to store NFT metadata in Supabase instead of generating it:

**SQL Migration: `supabase/migrations/003_nft_catalog.sql`**

```sql
-- NFT Catalog (metadata templates)
CREATE TABLE nft_catalog (
  id SERIAL PRIMARY KEY,
  rarity VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  power INTEGER NOT NULL,
  daily_yield INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert NFT catalog
INSERT INTO nft_catalog (rarity, name, image_url, power, daily_yield) VALUES
('Uncommon', 'Common Tree', 'https://.../uncommon/1.png', 10, 5),
('Rare', 'Silver Tree', 'https://.../rare/1.png', 15, 10),
('Epic', 'Golden Tree', 'https://.../epic/1.png', 25, 18),
('Legendary', 'Ancient Tree', 'https://.../legendary/1.png', 40, 30);
```

Then update your backend to fetch from database instead of generating.

---

## Troubleshooting

### Problem: Images Return 404

**Solution:**
1. Check Supabase Storage bucket is **Public** (not Private)
2. Verify image path in URL matches folder structure
3. Check image file exists in Supabase dashboard

### Problem: CORS Error When Loading Images

**Solution:**
1. Go to Supabase Dashboard > Settings > Storage
2. Add your frontend domain to CORS settings
   ```
   http://localhost:8888
   https://yourdomain.com
   ```

### Problem: Environment Variables Not Loading

**Solution:**
1. Restart dev server: `npm run dev`
2. Check `.env.local` has correct values
3. Use `console.log(process.env.VITE_SUPABASE_URL)` in backend functions to debug

### Problem: Upload Script Fails with Auth Error

**Solution:**
1. Use **anon key** (not service role key)
2. Verify key is correct: Settings > API > "anon public"
3. Make sure bucket is **Public**

---

## Security Notes

✅ **Public bucket is safe for images** - They're not sensitive data
✅ **Use anon key for uploads** - More restrictive than service role
⚠️ **Never commit `.env.local`** - It's in `.gitignore`
✅ **Cache images for 1 hour** - Reduces bandwidth (cacheControl: '3600')

---

## Summary

After completing these steps, your TreeFi NFTs will:
1. ✅ Store images in Supabase Storage
2. ✅ Fetch image URLs from backend
3. ✅ Display with correct rarity-based images
4. ✅ Load fast with CDN caching
5. ✅ Scale to thousands of NFTs

**Total time: ~15 minutes** (10 min upload + 5 min code updates)

---

## Next Steps

1. Upload images using Option A or B above
2. Update `.env.local` with Supabase credentials
3. Update `mock_db.ts` with image URL logic
4. Test by navigating to Dashboard → check DevTools Network
5. Verify images load from Supabase URLs

**Questions?** Check Supabase docs: https://supabase.com/docs/guides/storage

