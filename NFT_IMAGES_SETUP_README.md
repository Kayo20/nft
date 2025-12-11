# NFT Image Upload - Documentation Summary

This folder now contains comprehensive guides for uploading your 4 NFT rarities to Supabase Storage.

## Documents Created

### 1. **COMPLETE_NFT_SETUP.md** ⭐ START HERE
- **Best for:** Step-by-step walkthrough with all details
- **Length:** Complete guide (15 min execution)
- **Contains:**
  - Get Supabase credentials
  - Create Storage bucket
  - Upload images (automatic or manual)
  - Configure environment variables
  - Restart server & test
  - Browser verification
  - Troubleshooting links

**👉 Start with this if you want the full picture**

---

### 2. **QUICK_START_IMAGES.md** ⚡ FOR THE IMPATIENT
- **Best for:** Just want to get it done fast
- **Length:** 5 minute version
- **Contains:**
  - Credentials (step 1)
  - Create bucket (step 2)
  - Upload options A/B
  - Environment setup
  - Test verification
  - Quick troubleshooting

**👉 Use this if you're experienced and want just the essentials**

---

### 3. **NFT_UPLOAD_GUIDE.md** 📚 DETAILED REFERENCE
- **Best for:** Understanding what's happening
- **Length:** In-depth technical guide
- **Contains:**
  - Overview of 56 images
  - Manual upload instructions (detailed)
  - Automated upload script explanation
  - Backend code updates
  - Database integration (optional)
  - Security notes
  - Summary & next steps

**👉 Use this to understand the architecture**

---

### 4. **NFT_TROUBLESHOOTING.md** 🔧 PROBLEM SOLVING
- **Best for:** When something doesn't work
- **Length:** Common issues + solutions
- **Contains:**
  - 8 common problems with solutions
  - Verification checklist
  - Debug commands
  - Support resources

**👉 Use this when you hit issues**

---

### 5. **scripts/upload-nfts.js** 🤖 AUTOMATED SCRIPT
- **Best for:** Uploading all 56 images at once
- **Contains:**
  - Reads images from `src/assets/{rarity}/`
  - Uploads to Supabase Storage
  - Shows progress with emoji feedback
  - Error handling & retry logic
  - Summary with verification

**👉 Run: `node scripts/upload-nfts.js`**

---

## Your NFT Assets

```
src/assets/
├── uncommon/      (40 images)
├── rare/          (3 images)
├── epic/          (3 images)
└── legendary/     (10 images)
Total: 56 NFT images
```

---

## Backend Code Updated

### `netlify/functions/_utils/mock_db.ts`

Added:
- `SUPABASE_URL` - From environment variables
- `NFT_IMAGES_BUCKET` - Bucket name
- `getRandomImageUrl(rarity)` - Generates random image per rarity
- Demo NFT seeding with Supabase URLs

Now when backend generates mock NFTs, each one has a random Supabase image URL.

---

## Quick Start (5 minutes)

1. **Get credentials:**
   ```
   Go to https://app.supabase.com > Settings > API
   Copy Project URL and anon public key
   ```

2. **Create bucket:**
   ```
   Supabase Storage > New Bucket
   Name: nft-images
   Privacy: Public
   ```

3. **Upload images:**
   ```bash
   npm install @supabase/supabase-js
   
   export SUPABASE_URL="https://..."
   export SUPABASE_KEY="eyJ..."
   
   node scripts/upload-nfts.js
   ```

4. **Update environment:**
   ```bash
   # .env.local
   VITE_SUPABASE_URL=https://...
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_NFT_IMAGES_BUCKET=nft-images
   ```

5. **Test:**
   ```bash
   npm run dev
   # Go to Dashboard - should see images!
   ```

---

## File Structure After Upload

Supabase Storage will have:
```
nft-images/
├── uncommon/1.png through 40.png
├── rare/1.png through 3.png
├── epic/1.png through 3.png
└── legendary/1.png through 10.png
```

Each accessible via:
```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/nft-images/{rarity}/{number}.png
```

---

## What Gets Generated

When backend calls `getNftsByOwner()`:

Each NFT gets an image URL like:
```json
{
  "id": 1,
  "name": "Uncommon Tree #1",
  "rarity": "Uncommon",
  "image": "https://abcdef123.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png",
  "power": 12,
  "dailyYield": 5
}
```

The image URL is **randomly selected** from available images for that rarity.

---

## Environment Variables Required

Add to `.env.local`:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_NFT_IMAGES_BUCKET=nft-images
```

These are used by:
- Backend `mock_db.ts` - To generate image URLs
- Frontend hooks - To fetch from `/api/get-nfts`

---

## Testing Checklist

After following any guide:

- [ ] Images uploaded to Supabase
- [ ] `.env.local` has 3 environment variables
- [ ] Dev server restarted (`npm run dev`)
- [ ] Dashboard page loads
- [ ] NFT images visible and loaded
- [ ] Browser DevTools shows Supabase URLs in Network
- [ ] No 404 or broken image errors

---

## Next Phase: Real Data

After images are working:

1. **User Profile Data:**
   - Query real user from Supabase `users` table
   - Get actual NFT count, power, daily yield

2. **Inventory Data:**
   - Fetch real item counts from `inventories` table
   - Update when items purchased

3. **Farming Rewards:**
   - Calculate based on NFT power × rarity multiplier
   - Implement fee schedule (30% → 0% over 10 days)
   - Track accumulated rewards per user

4. **Land System:**
   - Fetch user lands from new `lands` table
   - Display slot assignments
   - Allow planting/removing trees

---

## Questions?

- **How do images work?** → See `NFT_UPLOAD_GUIDE.md`
- **How do I upload?** → See `COMPLETE_NFT_SETUP.md`
- **Something's broken** → See `NFT_TROUBLESHOOTING.md`
- **Just give me the commands** → See `QUICK_START_IMAGES.md`

---

## Summary

You now have:
✅ 4 comprehensive guides
✅ 1 automated upload script
✅ 1 updated backend file
✅ Clear documentation for every step
✅ Troubleshooting for common issues

**Total setup time: 5-15 minutes depending on upload method**

Good luck! 🚀

