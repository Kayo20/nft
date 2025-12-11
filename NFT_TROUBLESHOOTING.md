# NFT Image Upload Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: "Bucket 'nft-images' not found"

**Error Message:**
```
error: Bucket 'nft-images' does not exist
```

**Cause:** Supabase Storage bucket doesn't exist yet

**Solution:**
1. Go to https://app.supabase.com
2. Select your TreeFi project
3. Click **Storage** (left sidebar)
4. Click **New Bucket**
5. Enter name: `nft-images`
6. Select **Public**
7. Click **Create Bucket**
8. Run upload script again

---

### Issue 2: "Invalid API key" or "Unauthorized"

**Error Message:**
```
error: Invalid API key (is it malformed?)
```

**Cause:** Wrong API key or missing credentials

**Solution:**
1. Go to https://app.supabase.com > Select Project > Settings > API
2. Copy the correct values:
   - **Project URL** - starts with `https://`
   - **anon public** - starts with `eyJ`
3. Update environment variables:
   ```bash
   export SUPABASE_URL="https://your-project-id.supabase.co"
   export SUPABASE_KEY="eyJ..." # Copy from "anon public"
   ```
4. Run script again

**Common Mistakes:**
- ❌ Using **service_role** key (should use **anon public**)
- ❌ Forgetting `https://` in URL
- ❌ Old/expired keys (regenerate in Settings > API)

---

### Issue 3: Images Return 404 Not Found

**Symptom:**
- Script says "Upload complete" ✓
- Dashboard shows broken image icons
- Browser DevTools shows 404 for image URLs

**Cause:** Bucket is Private, not Public

**Solution:**
1. Go to Supabase Storage
2. Click `nft-images` bucket
3. Click **Settings** (gear icon)
4. Ensure **Public** is selected (not Private)
5. Refresh browser

**Alternative Check:**
1. Go to Supabase Storage > `nft-images` bucket
2. Right-click an image > **Copy Public URL**
3. Open URL in new tab - should show image
4. If it shows access denied, bucket is Private

---

### Issue 4: CORS Error in Browser Console

**Error Message:**
```
Access to image at 'https://...' from origin 'http://localhost:8888' 
has been blocked by CORS policy
```

**Cause:** Frontend domain not allowed to access images

**Solution:**
1. Go to Supabase > Settings > **Storage** (or **CORS Policy**)
2. Add your frontend domains:
   - `http://localhost:8888` (for local dev)
   - `https://yourdomain.com` (for production)
3. Click **Save**
4. Refresh browser

**Note:** Public Supabase buckets usually allow all CORS by default. If this error occurs, make sure bucket is Public.

---

### Issue 5: Images Don't Load on Dashboard

**Symptom:**
- Script ran successfully
- Images exist in Supabase (checked Storage)
- Page loads but no images appear
- No errors in console

**Cause 1: Environment variables not set**

**Solution:**
1. Check `.env.local` has:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_NFT_IMAGES_BUCKET=nft-images
   ```
2. Restart dev server: `npm run dev`
3. Check in browser DevTools > Console - you should see the URL being used

**Cause 2: Backend not using new mock_db.ts**

**Solution:**
1. Verify you edited `netlify/functions/_utils/mock_db.ts`
2. Check file has `getRandomImageUrl()` function
3. Stop dev server (`Ctrl+C`)
4. Start again: `npm run dev`
5. Check Network tab - image URLs should be from Supabase

---

### Issue 6: Script Says "Upload complete" but Some Images Missing

**Symptom:**
```
Upload complete!
Uploaded: 45 images
Errors: 11 images
```

**Cause:** File permission or file reading issues

**Solution:**
1. Check source files exist:
   ```bash
   ls src/assets/uncommon/ | wc -l  # Should show 40
   ls src/assets/rare/ | wc -l      # Should show 3
   ```
2. Check file permissions:
   ```bash
   chmod 644 src/assets/*/*.png
   ```
3. Run script again

---

### Issue 7: "Cannot find module 'supabase/supabase-js'"

**Error Message:**
```
node: error: Cannot find module '@supabase/supabase-js'
```

**Cause:** Missing npm dependency

**Solution:**
```bash
npm install @supabase/supabase-js
npm run dev
```

---

### Issue 8: Images Load But Are Placeholder/Wrong

**Symptom:**
- Images load successfully
- But they show placeholder or wrong rarity images

**Cause:** Backend `mock_db.ts` not configured properly

**Solution:**
1. Check `netlify/functions/_utils/mock_db.ts` has:
   ```typescript
   const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
   const NFT_IMAGES_BUCKET = process.env.VITE_NFT_IMAGES_BUCKET || 'nft-images';
   
   function getRandomImageUrl(rarity: string): string {
     // Should generate URLs like:
     // https://project.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png
   }
   ```
2. Verify insertNft() is called with `image_url: getRandomImageUrl(rarity)`
3. Restart dev server

---

## Verification Checklist

✅ **After uploading, verify everything:**

- [ ] Supabase bucket `nft-images` exists and is **Public**
- [ ] All folders exist: `uncommon/`, `rare/`, `epic/`, `legendary/`
- [ ] Total files: 56 (40+3+3+10)
- [ ] `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Backend `mock_db.ts` has `getRandomImageUrl()` function
- [ ] Dev server restarted: `npm run dev`
- [ ] Browser refreshed (Ctrl+Shift+R for hard refresh)
- [ ] DevTools Network tab shows images loading from Supabase
- [ ] Dashboard/Inventory pages display NFT images

---

## Quick Debug Commands

### Check Supabase Connection
```bash
# In browser console on any page:
fetch('/api/get-nfts?owner=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
  .then(r => r.json())
  .then(d => console.log(d.nfts[0].image_url))
```

This should print a Supabase image URL like:
```
https://abc123.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png
```

### Check Environment Variables
```bash
# In terminal:
grep VITE_ .env.local
```

Should show:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_NFT_IMAGES_BUCKET=nft-images
```

### Test Image URL Directly
1. Copy image URL from Network tab
2. Open in new browser tab
3. Should display the NFT image
4. If 404: bucket is Private, not Public

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs/guides/storage
- **Supabase Dashboard:** https://app.supabase.com
- **Project Status:** Check Settings > API > "Capabilities" for any restrictions

---

## Next Steps After Fixing

Once images load successfully:

1. ✅ Images are now stored in Supabase (globally distributed)
2. ✅ Backend randomly picks image per rarity
3. ✅ Frontend caches images for 1 hour (saves bandwidth)
4. Next: Set up real Supabase database seed data for NFTs, inventory, rewards

