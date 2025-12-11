# TreeFi Specification Implementation Complete

This document tracks the complete implementation of the TreeFi gaming mechanics specification.

## Specification Overview

TreeFi is a blockchain-based farming game with the following mechanics:

### 1. NFT Rarity System
- **Uncommon**: Only obtained from Chest purchases
- **Rare**: Only obtained through fusion (3x Uncommon → Rare)
- **Epic**: Only obtained through fusion (3x Rare → Epic)
- **Legendary**: Only obtained through fusion (3x Epic → Legendary)
- **Legend Cannot Be Fused**: Legendary NFTs cannot be fused further

### 2. Daily Rewards (Farming)
Rewards are earned only when farming is **active** (all 3 items are active):

| Rarity | Daily Reward |
|--------|-------------|
| Uncommon | 0.5 TF |
| Rare | 2 TF |
| Epic | 8 TF |
| Legendary | 15 TF |

### 3. Farming System
**Requirements**: All 3 items must be **simultaneously active** for farming to generate rewards:
- **Water Bundle**: 10 TF per bundle, 10 units, 4-hour duration
- **Fertilizer Bundle**: 10 TF per bundle, 10 units, 4-hour duration
- **Anti Bug Bundle**: 10 TF per bundle, 10 units, 4-hour duration

**If any item expires**, farming stops immediately and no rewards are generated.

### 4. Claim Fee Schedule
Season 0 is 10 days (Dec 15 - Dec 25, 2024)

| Day | Fee |
|-----|-----|
| 1 | 50% |
| 2 | 45% |
| 3 | 40% |
| 4 | 35% |
| 5 | 30% |
| 6 | 25% |
| 7 | 20% |
| 8 | 15% |
| 9 | 10% |
| 10 | 0% |

**After Season 0 ends**: No rewards can be claimed.

### 5. Chest Purchase
- **Cost**: 50 TF per chest
- **Guaranteed Output**: Always Uncommon NFT (100% drop rate)

### 6. Fusion Rules
**Cost** (deducted in Polygon via fusion contracts):
- 3x Uncommon → Rare: 50 TF
- 3x Rare → Epic: 150 TF
- 3x Epic → Legend: 500 TF
- Legendary cannot be fused

**Input Validation**:
- Exactly 3 NFTs of same rarity required
- Cannot fuse Legendary
- All input NFTs must be active

**Output**:
- Returns single NFT of next rarity tier
- Input NFTs are marked as "burned"

### 7. Season 0 Configuration
- **Start**: December 15, 2024 00:00:00 UTC
- **End**: December 25, 2024 00:00:00 UTC
- **Duration**: 10 days
- **When Season Ends**: Rewards can no longer be claimed

## Implementation Status

### ✅ Completed

#### Constants (`src/lib/constants.ts`)
- [x] `DAILY_REWARDS`: 0.5, 2, 8, 15 TF per rarity
- [x] `SEASON_ZERO_START` & `SEASON_ZERO_END`: Dec 15-25, 2024
- [x] `SEASON_ZERO_DURATION`: 10 days in milliseconds
- [x] `ITEMS`: water, fertilizer, antiBug (10 TF each)
- [x] `ITEM_BUNDLE_SIZE`: 10 units per bundle
- [x] `ITEM_CONSUMPTION_INTERVAL`: 4 hours
- [x] `CLAIM_FEE_SCHEDULE`: 10-step fee schedule (50%→0%)
- [x] `FUSION_COST`: 50, 150, 500, 0 TF
- [x] `FUSION_RULES`: Explicit 3x validation + Legend prevention

#### Types (`src/types/index.ts`)
- [x] `ActiveItem`: Item with expiry timestamp
- [x] `FarmingState`: Per-NFT farming tracking
- [x] `SeasonInfo`: Season details (active, daysRemaining, etc.)
- [x] Updated `UserInventory`: Added `tfBalance`
- [x] Updated `ClaimInfo`: Added `seasonActive` flag

#### Helper Libraries
- [x] `src/lib/rewardCalculator.ts`: Calculate daily rewards, claim fees, season status
- [x] `src/lib/farmingHelper.ts`: Validate farming state, check item requirements

#### Backend Functions

##### `netlify/functions/open-chest.ts`
- [x] Enforce Uncommon-only rarity (100% drop rate)
- [x] No random rarity selection - always Uncommon
- [x] Fall back to mock DB for local dev

##### `netlify/functions/fuse.ts`
- [x] Validate exactly 3 NFTs of same rarity
- [x] **Prevent Legendary fusion** with explicit check
- [x] Enforce strict rarity progression (3x same → next tier)
- [x] Return single NFT (not multiple)
- [x] Mark input NFTs as "burned"
- [x] Fall back to mock DB

##### `netlify/functions/shop-purchase.ts`
- [x] Item pricing: 10 TF per bundle (all items)
- [x] Bundle concept integrated (10 units per bundle)
- [x] Deduct inventory on purchase
- [x] Transaction logging

##### `netlify/functions/start-farming.ts` ✨ NEW
- [x] Require all 3 items (water, fertilizer, antiBug)
- [x] Validate item availability in inventory
- [x] Deduct items from inventory
- [x] Set 4-hour expiry on all items
- [x] Create farming state with active=true
- [x] Only active if all 3 items are active

##### `netlify/functions/claim.ts` ✨ NEW
- [x] Calculate daily reward by rarity (0.5/2/8/15 TF)
- [x] Calculate days since last claim
- [x] Apply claim fee based on season day (50%→0%)
- [x] Validate season is active
- [x] Return gross/fee/net breakdown
- [x] Update last_claimed_at timestamp
- [x] Fall back to mock DB

#### Database Schema (`supabase/migrations/001_init_schema.sql`)
- [x] Updated `items` table: water, fertilizer, antiBug (10 TF each)
- [x] Created `seasons` table: season_number, start_date, end_date
- [x] Created `farming_state` table: nft_id, active_items, is_farming_active
- [x] Created `claim_history` table: Track claims and rewards
- [x] RLS policies: User-scoped access control
- [x] Pre-populated Season 0 (Dec 15-25, 2024)

#### Mock DB (`netlify/functions/_utils/mock_db.ts`)
- [x] Correct item pricing (10 TF per bundle)
- [x] `startFarming()`: Create farming state
- [x] `getFarmingState()`: Retrieve farming data
- [x] `updateFarmingState()`: Update farming progress
- [x] Farming state persistence across requests

#### Frontend API (`src/lib/api.ts`)
- [x] `startFarming(nftId, itemIds)`: Activate farming with 3 items
- [x] `claimRewards(nftId)`: Claim accumulated rewards

### 🔄 Frontend UI (Ready for Implementation)

The following frontend pages should be updated to display the TreeFi mechanics:

#### `src/pages/Dashboard.tsx`
- [ ] Display farming status for each NFT
- [ ] Show active items and remaining duration
- [ ] Display daily rewards (based on rarity)
- [ ] Show Season 0 countdown timer
- [ ] Claim button with fee schedule breakdown

#### `src/pages/Shop.tsx`
- [ ] Display item bundles: water, fertilizer, antiBug
- [ ] Show bundle pricing: 10 TF each
- [ ] Indicate "10 units, 4 hours duration"
- [ ] Purchase form with quantity selector

#### `src/pages/Fusion.tsx`
- [ ] Disable Legendary NFTs (show "Cannot be fused" message)
- [ ] Validate 3x same rarity requirement
- [ ] Show fusion cost (50/150/500 TF by rarity)
- [ ] Display output rarity preview

#### `src/pages/Claim.tsx`
- [ ] Show current season day (1-10)
- [ ] Display claim fee percentage
- [ ] Calculate net rewards after fee
- [ ] Show countdown until season end

### 📋 Additional Endpoints Ready

These endpoints are implemented and ready for frontend integration:

```bash
# Start farming with all 3 items
POST /api/start-farming
{ "nftId": 1, "itemIds": ["water", "fertilizer", "antiBug"] }

# Claim accumulated rewards
POST /api/claim
{ "nftId": 1 }

# Purchase items
POST /api/shop-purchase
{ "itemId": "water", "qty": 1 }

# Fuse NFTs (validates 3x same rarity)
POST /api/fuse
{ "nftIds": [1, 2, 3] }

# Open chest (always Uncommon)
POST /api/open-chest
{ "type": "standard" }
```

## Key Implementation Details

### Season 0 Timing
```typescript
Start: December 15, 2024 00:00:00 UTC
End: December 25, 2024 00:00:00 UTC
Duration: 10 days (864,000,000 milliseconds)
```

### Farming Logic
```typescript
// Farming is ONLY active if:
// 1. All 3 items (water, fertilizer, antiBug) are active
// 2. None of the items have expired
// 3. Season 0 is active (Dec 15-25)

// If ANY item expires → farming stops immediately
// No partial rewards for missing items
```

### Reward Calculation
```typescript
Daily Reward = DAILY_REWARDS[rarity] * daysSinceLastClaim
Gross = Daily Reward
Fee = Gross * (feePercentage / 100)
Net = Gross - Fee

// Fee schedule based on season day (1-10)
// After season ends: rewards cannot be claimed
```

### Fusion Validation
```typescript
// Must have exactly 3 NFTs
if (nftIds.length !== 3) fail

// All must be same rarity
if (rarities.size !== 1) fail

// Cannot be Legendary
if (currentRarity === "Legendary") fail

// Output rarity is fixed
Uncommon + Uncommon + Uncommon → Rare
Rare + Rare + Rare → Epic
Epic + Epic + Epic → Legendary
```

## Testing Checklist

### Local Testing (Mock DB)
- [ ] Connect wallet → SIWE auth works
- [ ] Buy chest → Receive Uncommon NFT
- [ ] Purchase items → Water, fertilizer, antiBug (10 TF each)
- [ ] Start farming → All 3 items required
- [ ] Claim rewards → Fee schedule applies
- [ ] Fuse 3x Uncommon → Get Rare
- [ ] Fuse 3x Rare → Get Epic
- [ ] Fuse 3x Epic → Get Legendary
- [ ] Try fuse Legendary → Blocked with error
- [ ] Check Season 0 countdown (Dec 15-25)

### Production Testing (Supabase)
- [ ] Database migrations applied
- [ ] Seasons table pre-populated
- [ ] Farming state persists across sessions
- [ ] Claim history tracks all claims
- [ ] RLS policies enforce user ownership

## File Manifest

### Created
- `src/lib/rewardCalculator.ts` - Reward & fee calculations
- `src/lib/farmingHelper.ts` - Farming state validation
- `netlify/functions/claim.ts` - Claim rewards endpoint
- `netlify/functions/start-farming.ts` - Start farming endpoint

### Updated
- `src/lib/constants.ts` - Season 0, item pricing, rewards, fusion rules
- `src/types/index.ts` - FarmingState, ActiveItem, SeasonInfo types
- `src/lib/api.ts` - New endpoints: startFarming, claimRewards
- `netlify/functions/open-chest.ts` - Enforce Uncommon-only
- `netlify/functions/fuse.ts` - Strict validation + Legend prevention
- `netlify/functions/_utils/mock_db.ts` - Farming state methods
- `supabase/migrations/001_init_schema.sql` - New tables & RLS policies

## Next Steps

1. **Frontend UI Implementation**: Update Dashboard, Shop, Fusion, Claim pages
2. **Season 0 Deployment**: Deploy database migrations to Supabase
3. **Testing**: Run full testing checklist against mock and real database
4. **Monitoring**: Track claim fees, farming participation, fusion rates
5. **Season 1 Planning**: Prepare config for next season with different mechanics

## Version History

- **v1.0.0** (Current): Full TreeFi specification implementation
  - Rarity system with Uncommon-only chests
  - Fusion rules: 3x same → next tier, Legend non-fusible
  - Farming system: All 3 items required, 4-hour duration
  - Daily rewards: 0.5/2/8/15 TF by rarity
  - 10-day Season 0 with progressive claim fees
  - Complete backend implementation with mock DB support
