# NFT Image Setup - Complete Checklist

Use this checklist to ensure everything is properly configured.

---

## ✅ Pre-Setup Verification

- [ ] You have access to https://app.supabase.com
- [ ] Your TreeFi project is visible in Supabase Dashboard
- [ ] You have 56 NFT images in `src/assets/`:
  - [ ] `uncommon/` - 40 images (1.png to 40.png)
  - [ ] `rare/` - 3 images (1.png to 3.png)
  - [ ] `epic/` - 3 images (1.png to 3.png)
  - [ ] `legendary/` - 10 images (1.png to 10.png)

---

## 📋 Step 1: Get Supabase Credentials

- [ ] Opened https://app.supabase.com
- [ ] Selected TreeFi project
- [ ] Went to Settings > API
- [ ] Copied **Project URL** (starts with `https://`)
- [ ] Copied **anon public** key (starts with `eyJ`)
- [ ] Saved both in safe location (not committed to git)

**Your credentials:**
```
Project URL: https://____________________
Anon Key: eyJ__________________________
```

---

## 🪣 Step 2: Create Storage Bucket

- [ ] Went to Supabase > Storage
- [ ] Clicked "New Bucket"
- [ ] Named it exactly: `nft-images`
- [ ] Selected **Public** (not Private!)
- [ ] Clicked "Create Bucket"
- [ ] Confirmed bucket appears in Storage list

---

## 📤 Step 3: Upload Images

### Option A: Automated Script

- [ ] Ran: `npm install @supabase/supabase-js`
- [ ] Set environment variables:
  - [ ] `SUPABASE_URL="https://..."`
  - [ ] `SUPABASE_KEY="eyJ..."`
- [ ] Ran: `node scripts/upload-nfts.js`
- [ ] Script completed successfully with "✅ Upload complete"
- [ ] Shows "Uploaded: 56 images"

### Option B: Manual Upload

- [ ] Uploaded all files from `src/assets/uncommon/` (40 files)
- [ ] Uploaded all files from `src/assets/rare/` (3 files)
- [ ] Uploaded all files from `src/assets/epic/` (3 files)
- [ ] Uploaded all files from `src/assets/legendary/` (10 files)
- [ ] Total in Supabase Storage: 56 images
- [ ] All organized in folders: `uncommon/`, `rare/`, `epic/`, `legendary/`

### Verify Upload

- [ ] Went to Supabase > Storage > `nft-images`
- [ ] See folders: `uncommon/`, `rare/`, `epic/`, `legendary/`
- [ ] Clicked on one image to see public URL
- [ ] URL format looks like: `https://xxx.supabase.co/storage/v1/object/public/nft-images/...`

---

## 🔧 Step 4: Configure Environment

- [ ] Created/edited `.env.local` in project root
- [ ] Added 3 variables:
  ```bash
  VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  VITE_NFT_IMAGES_BUCKET=nft-images
  ```
- [ ] `.env.local` is in `.gitignore` (never committed)
- [ ] Verified all 3 variables are present and correct

---

## 🔌 Step 5: Verify Backend Code

- [ ] Opened `netlify/functions/_utils/mock_db.ts`
- [ ] Located these constants:
  ```typescript
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
  const NFT_IMAGES_BUCKET = process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';
  ```
- [ ] Located function `getRandomImageUrl(rarity: string)`
- [ ] Function generates URLs like: `https://xyz.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png`
- [ ] Function is called in `resetMockData()` when creating demo NFTs

---

## 🚀 Step 6: Restart Dev Server

- [ ] Stopped current dev server (Ctrl+C)
- [ ] Ran: `npm run dev`
- [ ] Saw output: `Local: http://localhost:8888/`
- [ ] Dev server running without errors

---

## 🧪 Step 7: Test in Browser

- [ ] Opened http://localhost:8888 in browser
- [ ] Navigated to Dashboard or Inventory page
- [ ] Page loads without errors
- [ ] NFT images are visible
- [ ] Images have correct rarity appearance:
  - [ ] Uncommon - brownish tones
  - [ ] Rare - silverish tones
  - [ ] Epic - golden tones
  - [ ] Legendary - special/glowing appearance

---

## 🔍 Step 8: Verify DevTools Network

- [ ] Opened DevTools (F12)
- [ ] Clicked Network tab
- [ ] Navigated to Dashboard again
- [ ] Found request named `get-nfts`
- [ ] Clicked on request to view Response
- [ ] Response JSON shows `image` field with URLs like:
  ```json
  "image": "https://xyz.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png"
  ```

- [ ] Scrolled down in Network tab to see image requests
- [ ] Each image has a request like:
  ```
  https://xyz.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png
  ```
- [ ] Each image request shows:
  - [ ] Status: **200** (not 404)
  - [ ] Type: **image** (not text/html)
  - [ ] Size: Actual file size (not 0 bytes)

---

## 🎯 Step 9: Final Verification

- [ ] All NFT images display on Dashboard
- [ ] No broken image icons (❌)
- [ ] No console errors in DevTools
- [ ] Image URLs contain `.supabase.co/storage/...`
- [ ] Images appear to be from different rarities
- [ ] Page performance is good (images load quickly)
- [ ] Refresh page - images still load
- [ ] Different rarity images show different visuals

---

## 📝 Troubleshooting Checklist

If images don't show:

### 404 Errors
- [ ] Check bucket is **Public** (not Private)
  - [ ] Supabase > Storage > `nft-images` > Settings
  - [ ] Make sure "Public" is selected
- [ ] Verify image files exist in Supabase Storage
- [ ] Check image paths match: `/{rarity}/{number}.png`

### Images Don't Load
- [ ] Check `.env.local` has all 3 variables
- [ ] Check variables have correct values (no typos)
- [ ] Restart dev server after changing `.env.local`
- [ ] Hard refresh browser: Ctrl+Shift+R
- [ ] Check `mock_db.ts` has `getRandomImageUrl()` function
- [ ] Check `resetMockData()` calls `insertNft()` with image URL

### CORS Errors
- [ ] Go to Supabase > Settings > Storage (or CORS)
- [ ] Add frontend domain: `http://localhost:8888`
- [ ] Click Save
- [ ] Hard refresh browser

### Network Issues
- [ ] Check internet connection
- [ ] Check Supabase is online: https://status.supabase.com
- [ ] Try uploading a test image manually to Supabase
- [ ] Check network tab for actual error messages

---

## ✨ Success Criteria

After completing all steps, you should have:

- ✅ 56 NFT images in Supabase Storage
- ✅ Backend generating random Supabase image URLs
- ✅ Frontend displaying images from Supabase
- ✅ No console errors
- ✅ No network 404 errors
- ✅ Images visible on Dashboard and Inventory pages
- ✅ Browser Network tab shows Supabase image requests with 200 status

---

## 📚 Next Steps

Once images are working:

1. **Set up real user data:**
   - [ ] Create test user in Supabase `users` table
   - [ ] Create test NFTs in `nfts` table
   - [ ] Update `get-nfts.ts` to fetch from database

2. **Implement inventory:**
   - [ ] Create items in `inventories` table
   - [ ] Track purchases with transactions
   - [ ] Update inventory after purchases

3. **Add farming rewards:**
   - [ ] Define reward rates per NFT rarity
   - [ ] Implement claimable rewards calculation
   - [ ] Add fee schedule (30% → 0% over 10 days)

4. **Test end-to-end:**
   - [ ] Purchase items
   - [ ] Claim rewards
   - [ ] Verify calculations
   - [ ] Check database state

---

## 💾 Files Modified/Created

Created:
- [ ] `COMPLETE_NFT_SETUP.md` - Full step-by-step guide
- [ ] `QUICK_START_IMAGES.md` - 5-minute quick start
- [ ] `NFT_UPLOAD_GUIDE.md` - Detailed technical guide
- [ ] `NFT_TROUBLESHOOTING.md` - Common issues + solutions
- [ ] `NFT_SYSTEM_ARCHITECTURE.md` - System design diagrams
- [ ] `NFT_IMAGES_SETUP_README.md` - Overview of all docs
- [ ] `scripts/upload-nfts.js` - Automated upload script
- [ ] This checklist

Updated:
- [ ] `netlify/functions/_utils/mock_db.ts` - Added image URL generation
- [ ] `.env.local` - Added Supabase variables

---

## ❓ Questions?

- **I don't know my Supabase URL** → Go to app.supabase.com > Settings > API
- **Upload script fails** → Check you're using **anon public** key, not service role
- **Images show 404** → Make sure bucket is **Public**
- **No changes after restart** → Try hard refresh: Ctrl+Shift+R
- **Still stuck?** → See `NFT_TROUBLESHOOTING.md` for detailed help

---

## 🎉 Success!

When all checkboxes are complete:
- Your NFT images are stored in Supabase ✅
- Backend randomly selects images by rarity ✅
- Frontend displays images beautifully ✅
- System is ready for real user data ✅

**Total time: 5-15 minutes**

