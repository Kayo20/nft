# NFT Image System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          YOUR LOCAL MACHINE                                 │
│                                                                              │
│  src/assets/                                                                │
│  ├── uncommon/        ▶ [UPLOAD]                                           │
│  ├── rare/           ▶ node scripts/upload-nfts.js                        │
│  ├── epic/           ▶                                                      │
│  └── legendary/      ▶                                                      │
│                                                                              │
│  .env.local          (Contains Supabase credentials)                        │
│                                                                              │
│  netlify/functions/_utils/mock_db.ts                                        │
│  ├── getRandomImageUrl(rarity)  ← Reads VITE_SUPABASE_URL                 │
│  └── Generates URLs when creating NFTs                                      │
│                                                                              │
└────────────────┬──────────────────────────────────────────────────────────┘
                 │
                 │ npm run dev
                 │
┌────────────────▼──────────────────────────────────────────────────────────┐
│                       SUPABASE CLOUD (CDN)                                 │
│                                                                              │
│  Storage Bucket: nft-images/                                               │
│  ├── uncommon/1.png through 40.png  ────┐                                 │
│  ├── rare/1.png through 3.png          │                                  │
│  ├── epic/1.png through 3.png          │                                  │
│  └── legendary/1.png through 10.png    │                                  │
│                                        │                                   │
│  Public URLs:                          │                                   │
│  https://xyz.supabase.co/storage/v1/   │                                  │
│  object/public/nft-images/uncommon/1.png                                   │
│                                                                              │
└───────────────┬──────────────────────────────┬─────────────────────────────┘
                │                              │
                │                              │
         GET /api/get-nfts              Browser fetches
         (from backend)                  image files
                │                              │
┌───────────────▼──────────────────────────────▼─────────────────────────────┐
│                       YOUR WEB BROWSER                                      │
│                     http://localhost:8888                                   │
│                                                                              │
│  Frontend receives NFT data:                                               │
│  {                                                                          │
│    id: 1,                                                                   │
│    rarity: "Uncommon",                                                      │
│    name: "Uncommon Tree #1",                                               │
│    image: "https://xyz.supabase.co/storage/.../uncommon/5.png" ◄──┐      │
│    power: 12,                                                       │      │
│    dailyYield: 5                                                    │      │
│  }                                                                   │      │
│                                                                     │       │
│  Dashboard/Inventory pages display:                                │       │
│  <img src={nft.image} />  ────────────────────────────────────────┘       │
│                                                                              │
│  Images render with correct rarity colors:                                 │
│  🟤 Uncommon    🟤 Rare    🟡 Epic    ✨ Legendary                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: How Images Load

### 1️⃣ Upload Phase (You do this once)

```
Your Computer
    │
    ├─ node scripts/upload-nfts.js
    │   ├─ Reads: src/assets/uncommon/*.png
    │   ├─ Reads: src/assets/rare/*.png
    │   ├─ Reads: src/assets/epic/*.png
    │   └─ Reads: src/assets/legendary/*.png
    │
    └─▶ Supabase.createClient(URL, KEY)
        │
        └─▶ storage.from('nft-images').upload(path, file)
            │
            └─▶ Supabase Storage (UPLOADED ✓)
```

### 2️⃣ Initialization Phase (Happens on npm run dev)

```
Dev Server Starts
    │
    └─▶ netlify/functions/_utils/mock_db.ts loads
        │
        ├─ Reads: process.env.VITE_SUPABASE_URL
        ├─ Reads: process.env.VITE_NFT_IMAGES_BUCKET
        │
        └─▶ getRandomImageUrl(rarity) ready to use
            │
            └─▶ Generates URLs like:
                https://xyz.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png
```

### 3️⃣ Request Phase (When user loads Dashboard)

```
Browser
    │
    └─▶ GET /api/get-nfts?owner=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
        │
        └─▶ netlify/functions/get-nfts.ts
            │
            └─▶ mock_db.getNftsByOwner(owner)
                │
                └─▶ Returns array of NFT objects with image URLs:
                    [
                      {
                        id: 1,
                        image: "https://xyz.supabase.co/.../uncommon/5.png"
                      },
                      {
                        id: 2,
                        image: "https://xyz.supabase.co/.../rare/1.png"
                      }
                    ]
```

### 4️⃣ Render Phase (Frontend displays images)

```
Frontend receives data
    │
    └─▶ useNFTs(address) hook
        │
        ├─ Stores NFT array in React Query cache
        │
        └─▶ Component renders:
            <img src={nft.image} alt={nft.name} />
            │
            ├─ Image URL: https://xyz.supabase.co/.../uncommon/5.png
            │
            └─▶ Browser fetches from Supabase CDN
                │
                └─▶ Image displays in Dashboard/Inventory ✓
```

---

## File Dependencies

```
.env.local
    │
    ├─▶ netlify/functions/_utils/mock_db.ts
    │   └─ Reads: VITE_SUPABASE_URL
    │   └─ Reads: VITE_NFT_IMAGES_BUCKET
    │   └─ Generates image URLs
    │
    ├─▶ scripts/upload-nfts.js
    │   └─ Reads: SUPABASE_URL (environment variable)
    │   └─ Reads: SUPABASE_KEY (environment variable)
    │   └─ Uploads files to Supabase
    │
    └─▶ Frontend components
        └─ Display images from /api/get-nfts response
```

---

## Image Selection Logic

### How Backend Picks Random Image

```typescript
function getRandomImageUrl(rarity: string): string {
  // Map of max images per rarity
  const maxImages = {
    'uncommon': 40,
    'rare': 3,
    'epic': 3,
    'legendary': 10
  }[rarity];
  
  // Random number between 1 and maxImages
  const randomNum = Math.floor(Math.random() * maxImages) + 1;
  // randomNum for uncommon: 1-40
  // randomNum for rare: 1-3
  // randomNum for epic: 1-3
  // randomNum for legendary: 1-10
  
  // Build URL
  return `${SUPABASE_URL}/storage/v1/object/public/nft-images/${rarity}/${randomNum}.png`;
  
  // Example output:
  // https://abc123.supabase.co/storage/v1/object/public/nft-images/uncommon/15.png
}
```

Every NFT gets a random image from its rarity folder.

---

## URL Structure

```
Base Supabase URL:
https://YOUR_PROJECT_ID.supabase.co

Storage endpoint:
/storage/v1/object/public/

Bucket name:
nft-images

Image location:
/{rarity}/{number}.png

Full URL example:
https://abc123.supabase.co/storage/v1/object/public/nft-images/uncommon/5.png
                                                        ▲                ▲    ▲
                                                   Bucket Name    Folder  File
```

---

## Environment Variables

```
┌─────────────────────────────────────────────────────┐
│ .env.local (local development)                     │
├─────────────────────────────────────────────────────┤
│ VITE_SUPABASE_URL=https://abc123.supabase.co       │
│ VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...  │
│ VITE_NFT_IMAGES_BUCKET=nft-images                  │
└─────────────────────────────────────────────────────┘
     ▲
     │
     └─▶ Used by backend at: process.env.VITE_SUPABASE_URL
         Used by upload script at: process.env.SUPABASE_URL
```

---

## Caching Strategy

```
Browser fetch of image:
GET https://xyz.supabase.co/.../uncommon/5.png

Response headers (set by Supabase):
Cache-Control: 3600  (cache for 1 hour)

First request: ✓ Downloads from CDN (100ms)
Next 59 minutes: ✓ Serves from browser cache (0ms)
After 1 hour: ✓ Refreshes from CDN
```

---

## Troubleshooting Diagram

```
Images don't load?
    │
    ├─ Check bucket is PUBLIC
    │   └─ Supabase Storage > Settings > Public
    │
    ├─ Check environment variables
    │   └─ Verify .env.local has 3 variables
    │
    ├─ Check backend uses them
    │   └─ netlify/functions/_utils/mock_db.ts
    │
    ├─ Check images uploaded
    │   └─ Supabase Storage > nft-images folder
    │
    └─ Test image URL directly
        └─ Paste URL in browser
            ├─ Loads: ✓ Bucket is public
            └─ 404: ✗ Check path is correct
```

---

## Performance

```
Image loaded once:
  └─ 100ms (first download from CDN)

Subsequent loads (within 1 hour):
  └─ 0ms (from browser cache)

56 images × 100ms:
  └─ 5.6 seconds (total load time)
  └─ After first load: ~0ms (all cached)
```

---

## Summary

The system works like this:

1. **Upload**: You run script to send 56 images to Supabase Storage
2. **Storage**: Images stored globally in CDN with public access
3. **Backend**: When user loads Dashboard, server picks random image URL per NFT
4. **Frontend**: Browser receives NFT data with Supabase image URLs
5. **Display**: Frontend displays images from Supabase CDN

Result: Fast, globally distributed NFT images! 🚀

