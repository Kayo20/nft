# Quick Start: NFT Images Setup (5 Minutes)

## Step 1: Get Your Supabase Credentials (2 min)

1. Open https://app.supabase.com
2. Click your **TreeFi** project
3. Go to **Settings** > **API**
4. Copy these two values:
   - **Project URL** (looks like `https://abcdef123.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 2: Create Storage Bucket (1 min)

1. In Supabase, click **Storage** (left sidebar)
2. Click **New Bucket**
3. Name: `nft-images`
4. Choose **Public**
5. Click **Create Bucket**

## Step 3: Upload Images (2 min)

### Option A: Automatic (Fastest)

```bash
# Install dependency (one time only)
npm install @supabase/supabase-js

# Set your Supabase credentials
export SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
export SUPABASE_KEY="YOUR_ANON_KEY"

# Run the upload script
node scripts/upload-nfts.js
```

Expected output:
```
🚀 Starting NFT image upload to Supabase...

📦 Processing UNCOMMON NFTs...
  Found 40 images
  ✅ uncommon/1.png
  ✅ uncommon/2.png
  ...
✅ Upload complete!
   Uploaded: 56 images
```

### Option B: Manual (Drag & Drop)

1. In Supabase Storage, click `nft-images` bucket
2. Click **Upload**
3. Select all files from `src/assets/uncommon/` (40 files)
4. Repeat for `rare/`, `epic/`, `legendary/`

## Step 4: Update Environment

Add to `.env.local`:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_NFT_IMAGES_BUCKET=nft-images
```

## Step 5: Update Backend Code

Edit `netlify/functions/_utils/mock_db.ts` and replace the `image` field generation with:

```typescript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const NFT_IMAGES_BUCKET = process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';

// Add this function
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

// In generateMockNFTs, change:
// image: `...` (old)
// to:
// image: getRandomImage(rarity)
```

## Step 6: Test

```bash
npm run dev
```

1. Go to Dashboard or Inventory
2. Open DevTools > Network
3. Check that images load from Supabase URLs:
   ```
   https://your-project.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png
   ```

---

## Troubleshooting

### Script says "Bucket not found"
→ Create bucket manually in Supabase Storage (Step 2)

### Images return 404
→ Check bucket is **Public**, not Private

### Environment variables not loading
→ Restart dev server: `npm run dev`

### CORS errors
→ Go to Supabase Settings > Storage, add `http://localhost:8888`

---

## What's Happening

Your project now:
1. ✅ Stores 56 NFT images in Supabase Storage
2. ✅ Serves them via CDN (fast, global)
3. ✅ Backend picks random image per rarity
4. ✅ Frontend displays real NFT images
5. ✅ Images cached for 1 hour (saves bandwidth)

**Total setup time: ~5 minutes**

