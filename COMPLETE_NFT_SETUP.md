# Complete Step-by-Step NFT Upload Implementation

## What You'll Accomplish

After following this guide:
- ✅ Upload 56 NFT images to Supabase Storage
- ✅ Backend randomly picks images by rarity
- ✅ Dashboard/Inventory displays real NFT images from Supabase
- ✅ Images cached globally for performance

**Time Required:** 15 minutes

---

## Step 1: Prepare Your Credentials (2 minutes)

### 1.1 Open Supabase Dashboard

1. Go to https://app.supabase.com
2. Log in with your account
3. Find your **TreeFi** project in the list
4. Click to open it

### 1.2 Get Your API Credentials

1. Click **Settings** (bottom left, gear icon)
2. Click **API** in the left panel
3. You'll see:
   ```
   Project URL: https://abcdef123.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5...
   ```
4. **Copy and save both values** - you'll need them in a moment

---

## Step 2: Create Storage Bucket (2 minutes)

### 2.1 Navigate to Storage

1. In Supabase, click **Storage** (left sidebar)
2. Click **New Bucket** button

### 2.2 Create "nft-images" Bucket

1. **Bucket name:** `nft-images` (exactly this)
2. **Privacy:** Select **Public** (very important!)
3. Click **Create Bucket**

You'll see a confirmation: "✓ Bucket created"

---

## Step 3: Upload Images (1 minute - Automatic OR 5 minutes - Manual)

### Option A: Automatic Upload (Recommended)

**Step 3A.1: Install Dependencies**

Open terminal in your project and run:
```bash
npm install @supabase/supabase-js
```

**Step 3A.2: Set Environment Variables**

In terminal, set your credentials (replace with your actual values):

**On Mac/Linux:**
```bash
export SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
export SUPABASE_KEY="eyJ..." # Copy from "anon public" in Supabase
```

**On Windows PowerShell:**
```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
$env:SUPABASE_KEY="eyJ..."
```

**Step 3A.3: Run Upload Script**

```bash
node scripts/upload-nfts.js
```

You should see:
```
🚀 Starting NFT image upload to Supabase...

📦 Processing UNCOMMON NFTs...
  Found 40 images
  ✅ uncommon/1.png
  ✅ uncommon/2.png
  ✅ uncommon/3.png
  ...
  ✅ uncommon/40.png

📦 Processing RARE NFTs...
  Found 3 images
  ✅ rare/1.png
  ✅ rare/2.png
  ✅ rare/3.png

📦 Processing EPIC NFTs...
  Found 3 images
  ✅ epic/1.png
  ✅ epic/2.png
  ✅ epic/3.png

📦 Processing LEGENDARY NFTs...
  Found 10 images
  ✅ legendary/1.png
  ✅ legendary/2.png
  ✅ legendary/3.png
  ...
  ✅ legendary/10.png

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Upload complete!
   Uploaded: 56 images
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 All images uploaded successfully!
```

**Done!** Skip to Step 4.

---

### Option B: Manual Upload (If Script Fails)

**Step 3B.1: Upload Uncommon (40 images)**

1. In Supabase, click Storage > `nft-images` bucket
2. Click **Upload** button
3. Select all files from `src/assets/uncommon/` (40 files)
4. Click **Upload**

**Step 3B.2: Upload Rare (3 images)**

1. Click **Upload** button again
2. Select all files from `src/assets/rare/` (3 files)
3. Click **Upload**

**Step 3B.3: Upload Epic (3 images)**

1. Click **Upload** button
2. Select all files from `src/assets/epic/` (3 files)
3. Click **Upload**

**Step 3B.4: Upload Legendary (10 images)**

1. Click **Upload** button
2. Select all files from `src/assets/legendary/` (10 files)
3. Click **Upload**

In Supabase Storage, you should now see:
```
nft-images/
├── uncommon/
│   ├── 1.png ✓
│   ├── 2.png ✓
│   └── ...40.png ✓
├── rare/
│   ├── 1.png ✓
│   ├── 2.png ✓
│   └── 3.png ✓
├── epic/
│   ├── 1.png ✓
│   ├── 2.png ✓
│   └── 3.png ✓
└── legendary/
    ├── 1.png ✓
    ├── 2.png ✓
    └── ...10.png ✓
```

---

## Step 4: Update Environment Variables (1 minute)

### 4.1 Edit .env.local

Open `.env.local` in your project root (create if doesn't exist)

Add these lines:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_NFT_IMAGES_BUCKET=nft-images
```

Replace with your actual values from Supabase Settings > API

### 4.2 Verify File

Your `.env.local` should look like:
```bash
# Example (replace with your values)
VITE_SUPABASE_URL=https://abcdef123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_NFT_IMAGES_BUCKET=nft-images
```

---

## Step 5: Verify Backend Configuration (1 minute)

### 5.1 Check mock_db.ts File

Open `netlify/functions/_utils/mock_db.ts`

Verify it has these functions (should be there from our earlier update):

```typescript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const NFT_IMAGES_BUCKET = process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';

function getRandomImageUrl(rarity: string): string {
  const rarityLower = rarity.toLowerCase();
  const maxImages = rarityImageCounts[rarityLower] || 1;
  const randomNum = Math.floor(Math.random() * maxImages) + 1;
  return `${SUPABASE_URL}/storage/v1/object/public/${NFT_IMAGES_BUCKET}/${rarityLower}/${randomNum}.png`;
}
```

✅ If you see this, backend is configured correctly.

---

## Step 6: Restart Dev Server & Test (2 minutes)

### 6.1 Stop Current Server

In your terminal, stop the dev server:
```
Ctrl+C
```

### 6.2 Restart Dev Server

```bash
npm run dev
```

You should see:
```
> nft v2@1.0.0 dev
> vite

VITE v5.x.x build ready in xxxms

➜  Local:   http://localhost:8888/
```

### 6.3 Open Your App

1. Open http://localhost:8888 in your browser
2. Click **Dashboard** or **Inventory**
3. Look for NFT images

You should see images like:
- Uncommon trees (brownish)
- Rare trees (silverish)
- Epic trees (golden)
- Legendary trees (glowing/special)

---

## Step 7: Verify in Browser DevTools (2 minutes)

### 7.1 Open Network Tab

1. Press `F12` to open DevTools
2. Click **Network** tab
3. Go to Dashboard page

### 7.2 Check API Response

1. Look for a request named `get-nfts`
2. Click it to see the response
3. You should see image URLs like:
   ```json
   {
     "nfts": [
       {
         "id": 1,
         "name": "Uncommon Tree #1",
         "image": "https://abcdef123.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png",
         "rarity": "Uncommon",
         ...
       }
     ]
   }
   ```

### 7.3 Check Image Loading

1. Scroll down in Network tab
2. You should see image requests like:
   ```
   https://abcdef123.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png
   ```
3. Each should have status **200** (not 404)
4. Each should show **Type: image**

---

## Troubleshooting Quick Links

If you see errors, check:
- **404 errors on images:** Check bucket is **Public** (not Private)
- **Images won't load:** Verify `.env.local` variables are correct
- **Upload script fails:** Check you're using the **anon public** key (not service role)
- **CORS errors:** Add `http://localhost:8888` to Supabase CORS settings

See `NFT_TROUBLESHOOTING.md` for detailed solutions.

---

## What Happened Behind The Scenes

1. ✅ Images stored in Supabase Storage (globally distributed)
2. ✅ Backend `mock_db.ts` generates random image URLs per rarity
3. ✅ Frontend fetches NFTs from `/api/get-nfts`
4. ✅ Each NFT includes Supabase image URL
5. ✅ Browser displays images from CDN (fast!)

---

## Next Steps

Now that images are working:

1. **Set up real NFT database data:**
   - Create Supabase rows for user NFTs
   - Store actual token IDs
   - Link to images via rarity

2. **Implement inventory system:**
   - Store item counts in Supabase
   - Sync with purchase/claim actions

3. **Add farming rewards:**
   - Calculate daily yield per NFT
   - Track accumulated rewards
   - Implement claim fee schedule

4. **Test on multiple devices:**
   - Verify images load on mobile
   - Check image caching works

---

## Checklist: Did Everything Work?

- [ ] Images upload script completed (or manual upload done)
- [ ] All 56 images visible in Supabase Storage
- [ ] `.env.local` has Supabase credentials
- [ ] Dev server restarted
- [ ] Dashboard/Inventory shows NFT images
- [ ] DevTools Network shows Supabase URLs
- [ ] No 404 or broken image errors
- [ ] Images display with correct rarity colors

If all checked, you're done! 🎉

