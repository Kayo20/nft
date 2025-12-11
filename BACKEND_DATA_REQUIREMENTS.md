# TreeFi Backend Data Requirements Analysis

## Overview
This document outlines all data that should be fetched from the backend for each page and section of the TreeFi frontend application, organized by feature and endpoint.

---

## 1. AUTHENTICATION & SESSION

### 1.1 Endpoints (Already Implemented)

#### `POST /api/auth/nonce`
- **Purpose**: Generate a one-time nonce for SIWE message signing
- **Request**: `{ "address": "0x..." }`
- **Response**: `{ "nonce": "string" }`
- **Frontend**: `src/lib/apiAuth.ts` → `requestNonce()`
- **Status**: ✅ Implemented (`netlify/functions/auth-nonce.ts`)

#### `POST /api/auth/verify`
- **Purpose**: Verify SIWE signature and create authenticated session
- **Request**: `{ "message": "string", "signature": "string" }`
- **Response**: `{ "ok": true, "address": "0x..." }`
- **Side Effect**: Sets `treefi_session` HttpOnly cookie
- **Frontend**: `src/lib/apiAuth.ts` → `verifySiwe()`
- **Status**: ✅ Implemented (`netlify/functions/auth-verify.ts`)
- **Notes**: 
  - Upserts user into Supabase `users` table
  - Creates JWT token in cookie
  - Accepts dev-mode Origin header bypass

#### `POST /api/auth/logout`
- **Purpose**: Clear session
- **Request**: (empty body, credentials included)
- **Response**: `{ "ok": true }`
- **Side Effect**: Clears `treefi_session` cookie
- **Frontend**: `src/lib/apiAuth.ts` → `logout()`
- **Status**: ✅ Implemented (`netlify/functions/auth-logout.ts`)

---

## 2. USER PROFILE & INVENTORY

### 2.1 Dashboard Page (`/dashboard`)

#### Required Data

| Component | Data | Source | Notes |
|-----------|------|--------|-------|
| **Header** | Connected wallet address | `useWallet()` hook | From MetaMask |
| **Player Profile Card** | Total trees count | `useNFTs()` → `nfts.length` | Current: mock from `mockApi.ts` |
| **Player Profile Card** | Trees planted count | `useNFTs()` → filtered by `slotIndex` | Current: 0 (local state) |
| **Player Profile Card** | Daily yield | `useNFTs()` → sum of `dailyYield` | Should come from DB |
| **Player Profile Card** | TF balance | Currently hardcoded (1234.56) | ⚠️ **Needs backend** |
| **Land Overview** | Tree list with details | `useNFTs(address)` | Image, rarity, power, dailyYield |
| **Land Slots** | Slot assignments | Local state (9 slots) | Current: client-side only |
| **Token Balances** | TF token balance | Currently hardcoded | ⚠️ **Needs backend** |
| **Token Balances** | BNB balance | Currently hardcoded (0.5432) | ⚠️ **Needs backend** (wallet RPC) |
| **Items Inventory** | Water count | `useItems()` → `inventory.water` | Current: mock |
| **Items Inventory** | Fertilizer count | `useItems()` → `inventory.fertilizer` | Current: mock |
| **Items Inventory** | Anti-Bug count | `useItems()` → `inventory.antiBug` | Current: mock |

#### Backend Endpoints Needed

**Already Using:**
- `GET /.netlify/functions/get-nfts?owner=0x...` (returns NFTs for wallet)

**NEW - Token Balances:**
```
GET /api/user/balances?address=0x...
Response: {
  "tfBalance": number,
  "maticBalance": number,
  "ethBalance": number
}
```

**NEW - User Profile Summary:**
```
GET /api/user/profile?address=0x...
Response: {
  "address": string,
  "createdAt": ISO8601,
  "totalTrees": number,
  "totalPower": number,
  "dailyYield": number,
  "profile": object
}
```

---

### 2.2 Inventory Page (`/inventory`)

#### Required Data

| Component | Data | Source | Notes |
|-----------|------|--------|-------|
| **Header Info** | Wallet display | `useWallet()` | From session |
| **Land Management** | Multiple lands list | Currently hardcoded (1 land) | Future: fetch from DB |
| **Land Details** | Land slots (9 per land) | Local state | Placeholder NFTs |
| **Land Details** | Trees in slots | `useNFTs()` | Current slot assignments |
| **Land Navigation** | Land pages | State variable | Current: static 1 land |
| **Token Balances** | TF & MATIC | Same as Dashboard | ⚠️ **Needs backend** |
| **Items Inventory** | Item counts | `useItems()` | Water, Fertilizer, Anti-Bug |

#### Backend Endpoints Needed

**NEW - User Lands:**
```
GET /api/user/lands?address=0x...
Response: [
  {
    "id": number,
    "address": string,
    "season": number,
    "name": string,
    "slots": number,
    "createdAt": ISO8601
  }
]
```

**NEW - Land State:**
```
GET /api/land/:landId
Response: {
  "id": number,
  "slots": [
    { "index": 0, "nftId": number | null },
    ...
  ],
  "lastItemsApplied": ISO8601 | null
}
```

**NEW - Update Land Slots (Add/Remove Tree):**
```
POST /api/land/:landId/slots
Body: { "slotIndex": number, "nftId": number | null }
Response: { "ok": true, "slot": { "index": number, "nftId": number | null } }
```

---

### 2.3 Profile Page (`/profile`)

#### Required Data

| Component | Data | Source | Notes |
|-----------|------|--------|-------|
| **Wallet Info** | Connected wallet | Session/useWallet | From MetaMask |
| **Wallet Info** | Network (Polygon) | Static or useWallet | Hardcoded OK |
| **Wallet Info** | MATIC balance | `wallet.balance` | Current: from ethers.getBalance() |
| **TF Token Balance** | TF token amount | Currently hardcoded (0.00) | ⚠️ **Needs backend** |
| **Trees by Rarity** | Tree count by rarity | `useNFTs()` | Grouped from NFT list |
| **Trees by Rarity** | Total power by rarity | Calculated from NFTs | Derived from `power` field |
| **Collection Stats** | Total trees | `useNFTs().length` | Current |
| **Collection Stats** | Total power | Sum of all `power` | Derived |
| **Collection Stats** | Daily yield | Sum of all `dailyYield` | Derived |

#### Backend Endpoints Needed

- Same as Dashboard / already covered by `GET /api/user/balances`

---

## 3. SHOP & ITEMS

### 3.1 Shop Page (`/shop`)

#### Required Data

| Component | Data | Source | Notes |
|-----------|------|--------|-------|
| **TF Balance Display** | Player's TF balance | Currently hardcoded (0.00) | ⚠️ **Needs backend** |
| **Item Catalog** | List of all shop items | `ITEMS` constant + `useItems()` | Currently: mock items |
| **Item Card** | Item details (name, price, image) | `ITEMS` constant | Static in codebase |
| **Item Card** | Current inventory count | `useItems()` → `inventory[itemId]` | Current: mock |
| **Chest** | Chest price | Hardcoded (10 TF) | OK as constant |
| **Chest** | Chest type availability | Static for now | Future: fetch from DB |

#### Backend Endpoints Needed

**Already Using:**
- `POST /.netlify/functions/shop-purchase` (purchase item)
- `POST /.netlify/functions/open-chest` (open chest)

**NEW - User Inventory:**
```
GET /api/user/inventory?address=0x...
Response: {
  "water": number,
  "fertilizer": number,
  "antiBug": number
}
```

---

### 3.2 Item Purchase & Usage

#### `POST /api/shop/purchase`
- **Purpose**: Purchase an item with TF tokens
- **Request**: `{ "itemId": string, "quantity": number }`
- **Response**: `{ "ok": true, "inventory": { "water": number, ... } }`
- **Frontend**: `useItems()` hook → `purchaseItem()`
- **Status**: ✅ Implemented (`netlify/functions/shop-purchase.ts`)
- **Backend Logic**: 
  - Verify user balance >= cost
  - Deduct TF from user
  - Increment item count in `inventories` table
  - Return updated inventory

#### `POST /api/shop/use-items`
- **Purpose**: Apply items to planted trees (increases production temporarily)
- **Request**: `{ "landId": number, "itemIds": ["water", "fertilizer", ...] }`
- **Response**: `{ "ok": true, "boosts": { "production": number } }`
- **Status**: ⚠️ **NOT IMPLEMENTED**
- **Backend Logic**:
  - Verify items are available
  - Deduct items from inventory
  - Calculate boost multipliers
  - Update farm state with bonus duration (4 hours)

---

## 4. FARMING & REWARDS

### 4.1 Claim Page (`/claim`)

#### Required Data

| Component | Data | Source | Notes |
|-----------|------|--------|-------|
| **TF Balance** | Current wallet TF | Currently hardcoded (0) | ⚠️ **Needs backend** |
| **Claimable Amount** | Accumulated rewards | Currently hardcoded (156.78) | ⚠️ **Needs backend** |
| **Fee Percentage** | Claim fee based on days | Currently hardcoded (30%) | ⚠️ **Needs calculation** |
| **Days Since Claim** | Days elapsed since last claim | Currently hardcoded (5) | ⚠️ **Needs backend** |
| **Net Amount** | Calculated: gross - fee | Derived from gross & fee | OK (client-side calc) |

#### Backend Endpoints Needed

**NEW - Claimable Rewards:**
```
GET /api/rewards/claimable?address=0x...
Response: {
  "totalAccumulated": number,
  "claimableNow": number,
  "feePercentage": number,
  "netAmount": number,
  "lastClaimAt": ISO8601 | null,
  "daysSinceLastClaim": number
}
```

#### `POST /api/rewards/claim`
- **Purpose**: Claim accumulated TF rewards
- **Request**: `{ "address": string }`
- **Response**: `{ "ok": true, "claimed": number, "newBalance": number }`
- **Status**: ✅ Implemented (`netlify/functions/claim.ts`)
- **Backend Logic**:
  - Calculate claimable amount from farming data
  - Apply fee schedule (decreases daily)
  - Transfer net amount to user wallet
  - Record claim in `transactions` table
  - Update user's claimable balance to 0

---

## 5. FUSION SYSTEM

### 5.1 Fusion Page (`/fusion`)

#### Required Data

| Component | Data | Source | Notes |
|-----------|------|--------|-------|
| **NFT Selector** | User's NFT list | `useNFTs(address)` | Current: mock |
| **Selected Trees** | 3 tree slots | Local state | Client-side |
| **Result Preview** | Target rarity | Calculated from selection | Derived |
| **Fusion Cost** | TF cost for fusion | `FUSION_COST` constant | Hardcoded per rarity |
| **User Balance** | TF tokens | Not checked currently | ⚠️ **Should validate** |

#### `POST /api/fusion`
- **Purpose**: Fuse 3 same-rarity NFTs into 1 higher-rarity NFT
- **Request**: `{ "nftIds": [number, number, number] }`
- **Response**: `{ "ok": true, "newNft": NFTTree }`
- **Status**: ✅ Implemented (`netlify/functions/fuse.ts`)
- **Backend Logic**:
  - Verify 3 NFTs belong to user
  - Verify all same rarity
  - Verify rarity < Legendary
  - Verify user has TF to pay cost
  - Deduct TF from user
  - Burn 3 old NFTs (mark as deleted)
  - Mint 1 new NFT (higher rarity)
  - Update inventory

---

## 6. NFT MANAGEMENT

### 6.1 Get NFTs

#### `GET /api/nfts?owner=0x...`
- **Purpose**: Fetch all NFTs owned by wallet
- **Response**: 
```json
{
  "nfts": [
    {
      "id": number,
      "tokenId": string,
      "owner": string,
      "rarity": "Uncommon" | "Rare" | "Epic" | "Legendary",
      "name": string,
      "image": string,
      "power": number,
      "dailyYield": number,
      "lastFarmed": ISO8601 | null,
      "accumulatedRewards": number,
      "health": number
    }
  ]
}
```
- **Status**: ✅ Implemented (`netlify/functions/get-nfts.ts`)
- **Frontend**: `src/hooks/useNFTs.ts` hooks into this

#### `POST /api/nfts/open-chest`
- **Purpose**: Open a chest to mint random NFT
- **Request**: `{ "type": "standard" | "premium" }`
- **Response**: 
```json
{
  "ok": true,
  "nft": {
    "id": number,
    "rarity": string,
    "name": string,
    "image": string,
    "power": number,
    "dailyYield": number
  }
}
```
- **Status**: ✅ Implemented (`netlify/functions/open-chest.ts`)
- **Backend Logic**:
  - Verify user has 10 TF (standard) or 50 TF (premium)
  - Deduct TF
  - Generate random rarity based on weights
  - Mint NFT with randomized attributes
  - Return new NFT

---

## 7. FARMING & PRODUCTION

### 7.1 Start Farming / Apply Items

#### `POST /api/farming/start`
- **Purpose**: Apply items to tree to boost production for 4 hours
- **Request**: 
```json
{
  "landId": number,
  "itemIds": ["water", "fertilizer", "antiBug"]
}
```
- **Response**: `{ "ok": true, "boosts": { "production": 1.10 } }`
- **Status**: ✅ Implemented (`netlify/functions/start-farming.ts`)
- **Backend Logic**:
  - Verify items in inventory
  - Deduct items
  - Apply multiplier (e.g., 1.04x per fertilizer, 1.03x per water)
  - Set boost duration to 4 hours
  - Record in `farming_history` table

#### Farming State Needed Per NFT

For each NFT in inventory, backend should track:
- `lastFarmed`: Last time farming was updated
- `accumulatedRewards`: TF earned since last claim
- `currentBoostUntil`: ISO8601 timestamp when current boost expires
- `boostMultiplier`: Current production multiplier (1.0 to ~1.15)

---

## 8. LAYOUT & GLOBAL DATA

### 8.1 Navbar
- **Wallet Connection Status**: From `useWallet()` → Session cookie
- **Navigation Links**: Static (hardcoded)
- **Theme Toggle**: Local state

### 8.2 Bottom Navigation
- **Active Page Indicator**: From React Router location
- **Navigation Links**: Static

### 8.3 Footer
- **Social Links**: Static
- **Copyright**: Static

**No backend data needed for layout components.**

---

## 9. LANDING PAGE (`/`)

#### Required Data

| Component | Data | Source | Notes |
|-----------|------|--------|-------|
| **Hero Section** | Season badge | Static (Season 0) | Hardcoded OK |
| **Hero Stats** | Total supply (100M TF) | Static constant | Hardcoded OK |
| **Hero Stats** | Rarity count (4) | Static constant | Hardcoded OK |
| **Features List** | Feature cards | Static array | Hardcoded OK |
| **Rarity Display** | Sample tree per rarity | Generated from mock | Uses `generateMockNFTs()` |
| **Tokenomics** | Distribution percentages | Static array | Hardcoded OK |

**Note**: Landing page is fully static. No backend calls needed (except maybe promotional banners in future).

---

## 10. WALLET SETUP PAGE (`/wallet-setup`)

#### Required Data

| Component | Data | Source | Notes |
|-----------|------|--------|-------|
| **Connection Flow** | MetaMask detection | Browser API | No backend call |
| **Connection Flow** | SIWE nonce request | `POST /api/auth/nonce` | ✅ Existing |
| **Connection Flow** | Signature verification | `POST /api/auth/verify` | ✅ Existing |

**Note**: Page is mostly UI/UX. Uses existing auth endpoints.

---

## SUMMARY: BACKEND ENDPOINTS STATUS

### ✅ Implemented (9 endpoints)
1. `POST /api/auth/nonce` - Get SIWE nonce
2. `POST /api/auth/verify` - Verify signature & login
3. `POST /api/auth/logout` - Clear session
4. `GET /api/nfts?owner=...` - Fetch user NFTs
5. `POST /api/nfts/open-chest` - Open chest & mint NFT
6. `POST /api/shop/purchase` - Buy item
7. `POST /api/fusion` - Fuse 3 NFTs
8. `POST /api/farming/start` - Apply items to trees
9. `POST /api/rewards/claim` - Claim accumulated TF

### ⚠️ Needed (8 endpoints)
1. `GET /api/user/balances` - Token balances (TF, MATIC)
2. `GET /api/user/profile` - User profile summary
3. `GET /api/user/lands` - List of user lands
4. `GET /api/land/:id` - Land details & slot state
5. `POST /api/land/:id/slots` - Update land slots (plant/remove tree)
6. `GET /api/user/inventory` - Item counts
7. `GET /api/rewards/claimable` - Claimable rewards with fee info
8. `POST /api/shop/use-items` - Apply items to trees (same as start-farming?)

---

## DATABASE SCHEMA SUMMARY

Current schema (from `supabase/migrations/001_init_schema.sql`):

- `users`: wallet_address, profile JSONB, created_at, last_seen
- `nonces`: address, nonce, expires_at (for SIWE)
- `nfts`: owner, tokenId, rarity, image_url, power, dailyYield, metadata
- `inventories`: owner, water, fertilizer, antiBug (item counts)
- `farming_history`: owner, nftId, itemsUsed, boostApplied, duration, timestamp
- `transactions`: owner, type, amount, fee, timestamp

**Missing Tables** (consider adding):
- `lands`: id, owner, season, slots, createdAt
- `land_slots`: landId, slotIndex, nftId
- `user_balances`: owner, tfBalance, lastUpdated
- `claimable_rewards`: owner, accumulated, lastClaimAt, currentFee

---

## Implementation Priority

### Phase 1 (Critical - Data Display)
- [ ] `GET /api/user/balances` - Display correct token amounts
- [ ] `GET /api/user/inventory` - Show actual item counts
- [ ] `GET /api/rewards/claimable` - Show correct claim info

### Phase 2 (Core Features)
- [ ] `GET /api/user/lands` - Support multiple lands
- [ ] `GET /api/land/:id` - Manage land state
- [ ] `POST /api/land/:id/slots` - Plant/remove trees

### Phase 3 (Polish)
- [ ] `GET /api/user/profile` - User summary API
- [ ] Enhanced error handling & validation on all endpoints

---

## Notes for Backend Developer

1. **All user endpoints require authentication** - Check `treefi_session` JWT cookie
2. **Inventory operations are critical** - Cache invalidation needed after purchases/claims
3. **Farming state is time-based** - Consider cron jobs to auto-update claimable rewards
4. **Fee schedule** - Claim fee decreases 10% per day (30% → 0% over 10 days)
5. **NFT generation** - Use weighted randomization: Uncommon 50%, Rare 30%, Epic 15%, Legendary 5%
6. **Multipliers** - Fertilizer +4%, Water +3%, Anti-Bug +3% (stacking)
7. **All prices in TF tokens** - Item prices, chest costs, fusion costs are in `ITEMS` and `FUSION_COST` constants

