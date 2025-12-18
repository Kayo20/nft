# TreeFi Implementation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER FRONTEND                        │
│  Dashboard | Shop | Fusion | Claim | Inventory | Wallet     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ (REST API + SIWE Auth)
┌─────────────────────────────────────────────────────────────┐
│                    NETLIFY FUNCTIONS                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Authentication Layer                                 │  │
│  │  • auth-nonce.ts → Generate SIWE nonce              │  │
│  │  • auth-verify.ts → Verify signature & create JWT   │  │
│  │  • auth-logout.ts → Clear session                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Game Logic Functions (All with Mock DB Fallback)    │  │
│  │                                                       │  │
│  │  CHEST SYSTEM                                        │  │
│  │  • open-chest.ts → Always Uncommon (250,000 TF)          │  │
│  │                                                       │  │
│  │  FARMING SYSTEM ✨                                  │  │
│  │  • start-farming.ts → Activate all 3 items          │  │
│  │  • claim.ts → Claim rewards with fee schedule       │  │
│  │                                                       │  │
│  │  FUSION SYSTEM                                       │  │
│  │  • fuse.ts → 3x same → next tier (Legend blocked)   │  │
│  │                                                       │  │
│  │  SHOP SYSTEM                                         │  │
│  │  • shop-purchase.ts → Buy items (150,000 TF each)        │  │
│  │                                                       │  │
│  │  NFT SYSTEM                                          │  │
│  │  • get-nfts.ts → Fetch user's NFTs                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Utility Layers                                       │  │
│  │  • auth.ts → SIWE, JWT, session management          │  │
│  │  • validation.ts → Input validation schemas         │  │
│  │  • mock_db.ts → In-memory DB (local dev)            │  │
│  │  • in_memory_nonce.ts → Nonce persistence           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    ↓                     ↓
┌─────────────┐    ┌──────────────────┐
│  Supabase   │    │  Local Dev       │
│   (Prod)    │    │  (Mock DB)       │
│             │    │                  │
│ • users     │    │ • nfts           │
│ • nfts      │    │ • items          │
│ • items     │    │ • inventories    │
│ • farming   │    │ • farming_state  │
│ • claims    │    │ • transactions   │
│ • seasons   │    │ • nonces         │
│ • nonces    │    └──────────────────┘
└─────────────┘
```

## Data Flow - Farm to Claim Journey

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: SETUP (User's First Game)                          │
└─────────────────────────────────────────────────────────────┘

  [User]
    ↓
  Buy Chest (250,000 TF)
    ↓
  [open-chest] → Uncommon NFT (guaranteed)
    ↓
  Inventory: [Uncommon #1]


┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: FARMING PREPARATION                                │
└─────────────────────────────────────────────────────────────┘

  [User]
    ↓
  Buy Items (150,000 TF × 3)
    ↓
  [shop-purchase] × 3 → water, fertilizer, antiBug
    ↓
  Inventory: [Uncommon #1, water ×1, fertilizer ×1, antiBug ×1]


┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: START FARMING                                      │
└─────────────────────────────────────────────────────────────┘

  [User] Selects: NFT #1 + water + fertilizer + antiBug
    ↓
  [start-farming]
    • Validates all 3 items in inventory
    • Deducts items from inventory
    • Creates farming_state record
    • Sets expiry: NOW + 4 hours
    ↓
  FARMING ACTIVE = TRUE ✓
  Rewards start accumulating:
    → Uncommon: 0.5 TF/day
    → Rare: 2 TF/day
    → Epic: 8 TF/day
    → Legend: 15 TF/day


┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: FARMING IN PROGRESS (0-4 hours)                    │
└─────────────────────────────────────────────────────────────┘

  Time: 0 hours
    ↓
  Items Active: [water ✓, fertilizer ✓, antiBug ✓]
  Farming Status: ACTIVE → Earning 0.5 TF/day


  Time: 2 hours
    ↓
  Items Active: [water ✓, fertilizer ✓, antiBug ✓]
  Farming Status: ACTIVE → Still earning
  Accumulated: 0.042 TF


  Time: 4 hours (One item expires)
    ↓
  Items Active: [water ✗, fertilizer ✗, antiBug ✗]
  Farming Status: INACTIVE → No more rewards


┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: RESUME OR CLAIM                                    │
└─────────────────────────────────────────────────────────────┘

  Option A: RESUME FARMING
    ↓
  [User] Buy more items (150,000 TF × 3)
    ↓
  [start-farming] again
    ↓
  Accumulate more rewards


  Option B: CLAIM REWARDS
    ↓
  [User] Claims on Day 7 of Season 0
    ↓
  [claim]
    • Gross Rewards: 0.042 TF (accumulated)
    • Fee Percentage: 20% (Day 7)
    • Fee Amount: 0.0084 TF
    • Net Reward: 0.0336 TF
    ↓
  Receive 0.0336 TF → Added to wallet
  Inventory: [Uncommon #1, 0 items]


┌─────────────────────────────────────────────────────────────┐
│ PHASE 6: UPGRADE VIA FUSION                                 │
└─────────────────────────────────────────────────────────────┘

  [User] Wants to upgrade from Uncommon → Rare
    ↓
  Needs: 3 × Uncommon NFTs
    ↓
  [fuse]
    • Validates exactly 3 NFTs
    • Validates all Uncommon
    • Validates not Legend
    • Deducts 75,000 TF from balance
    • Creates new Rare NFT
    • Marks 3 inputs as "burned"
    ↓
  Result: New Rare NFT
  Inventory: [Rare #2, 0 items]
  Balance: -75,000 TF
```

## Database Schema Relationships

```
┌────────────────────┐
│ users              │
├────────────────────┤
│ id (UUID)          │
│ wallet_address (*)│  ← Primary identifier
│ profile (JSON)     │
│ created_at         │
└────────┬───────────┘
         │
         ├─────────────────────────┬─────────────────────────┐
         ↓                         ↓                         ↓
    ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ nfts        │  │ farming_state    │  │ claim_history    │
    ├─────────────┤  ├──────────────────┤  ├──────────────────┤
    │ id          │  │ id               │  │ id               │
    │ owner(*)    │  │ user_id (FK)     │  │ user_id (FK)     │
    │ rarity      │  │ nft_id (FK) ────┼──→ nft_id (FK)      │
    │ power       │  │ active_items[]   │  │ season_number(*)│
    │ status      │  │ is_farming_       │  │ gross_rewards   │
    │ created_at  │  │   active         │  │ fee_percentage  │
    │             │  │ last_claimed_at  │  │ net_rewards     │
    └─────────────┘  │ updated_at       │  │ claimed_at      │
         ↑           └──────────────────┘  └──────────────────┘
         │
         └─────────────────────────────────┐
                                           ↓
                                    ┌───────────────┐
                                    │ inventories   │
                                    ├───────────────┤
                                    │ id            │
                                    │ user_id (FK)  │
                                    │ item_id (FK)──┼→ items
                                    │ qty           │
                                    └───────────────┘

┌──────────────┐
│ items        │
├──────────────┤
│ id (*)       │  "water", "fertilizer", "antiBug"
│ name         │
│ price        │  150,000 TF each
│ type         │  "farming"
├──────────────┤
│ water        │
│ fertilizer   │
│ antiBug      │
└──────────────┘

┌──────────────┐
│ seasons      │
├──────────────┤
│ season_num(*) Season 0 only (Dec 15-25, 2024)
│ start_date   │
│ end_date     │
└──────────────┘
```

## Farming State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    FARMING STATE MACHINE                     │
└─────────────────────────────────────────────────────────────┘

Initial State: NO FARMING
    │
    ├─ User buys items (water, fertilizer, antiBug)
    │  Inventory: [items ×1 each]
    │
    ↓
    [start-farming] Called
    ├─ Validate: Have all 3 items?
    │  YES → Continue | NO → Error
    │
    ├─ Deduct items from inventory
    │
    ├─ Create farming_state
    │  {
    │    nftId: 1,
    │    activeItems: [
    │      { itemId: 'water', expiresAt: NOW+4h },
    │      { itemId: 'fertilizer', expiresAt: NOW+4h },
    │      { itemId: 'antiBug', expiresAt: NOW+4h }
    │    ],
    │    isFarmingActive: true
    │  }
    │
    ↓
FARMING ACTIVE ✓
    │
    ├─ Accumulate rewards: dailyReward × hoursActive / 24
    │
    ├─ User checks status (every 60s update):
    │  → All 3 items active? YES → FARMING ACTIVE ✓
    │  → Any item expired? YES → FARMING INACTIVE ✗
    │  → Season ended? YES → NO REWARDS ✗
    │
    ├─ Time passes... items expire after 4 hours
    │
    ↓
ITEMS EXPIRED → FARMING PAUSES
    │
    ├─ User option A: Buy more items & restart farming
    │  [start-farming] again
    │  Back to FARMING ACTIVE ✓
    │
    ├─ User option B: Claim current rewards
    │  [claim] called
    │  ├─ Check: Farming active? (required)
    │  │  YES → Calculate rewards | NO → Error
    │  │
    │  ├─ Check: Season active? (Dec 15-25 only)
    │  │  YES → Apply fee | NO → 0 rewards
    │  │
    │  ├─ Calculate:
    │  │  gross = dailyReward × daysSinceClaim
    │  │  fee = gross × (seasonDay fee%)
    │  │  net = gross - fee
    │  │
    │  ├─ Update: last_claimed_at = NOW
    │  │
    │  ↓
    │  Receive net TF
    │  Inventory: [now empty]
    │  Farming: INACTIVE (items consumed)
    │
    └─ Back to NO FARMING → User can restart cycle
```

## Reward Calculation Timeline

```
┌─────────────────────────────────────────────────────────────┐
│ SEASON 0: Dec 15 - Dec 25, 2024 (10 days)                  │
└─────────────────────────────────────────────────────────────┘

Day 1 (Dec 15)                    Fee: 50%
  Claim: 2 TF gross → 1 TF net

Day 2 (Dec 16)                    Fee: 45%
  Claim: 2 TF gross → 1.1 TF net

Day 3 (Dec 17)                    Fee: 40%
  Claim: 2 TF gross → 1.2 TF net

Day 4 (Dec 18)                    Fee: 35%
  Claim: 2 TF gross → 1.3 TF net

Day 5 (Dec 19)                    Fee: 30%
  Claim: 2 TF gross → 1.4 TF net

Day 6 (Dec 20)                    Fee: 25%
  Claim: 2 TF gross → 1.5 TF net

Day 7 (Dec 21)                    Fee: 20%
  Claim: 2 TF gross → 1.6 TF net

Day 8 (Dec 22)                    Fee: 15%
  Claim: 2 TF gross → 1.7 TF net

Day 9 (Dec 23)                    Fee: 10%
  Claim: 2 TF gross → 1.8 TF net

Day 10 (Dec 24)                   Fee: 0%
  Claim: 2 TF gross → 2 TF net

Dec 25 onwards: SEASON ENDED
  No rewards can be claimed
```

## Error Handling Flow

```
User Request
    ↓
[Middleware] Verify Session
    ├─ No JWT? Return 401
    ├─ Invalid JWT? Return 401
    └─ Valid? Continue
         ↓
    [Function] Validate Inputs
         ├─ Missing required? Return 400
         ├─ Invalid types? Return 400
         └─ Valid? Continue
              ↓
         [Function] Check Business Rules
              ├─ Not owned by user? Return 403
              ├─ Insufficient items? Return 400
              ├─ Season ended? Return 400
              ├─ Legend fusion? Return 400
              └─ Valid? Continue
                   ↓
              [Function] Execute
                   ├─ DB error? Return 500
                   ├─ Supabase down? Use mock DB
                   └─ Success? Return 200 + data
```

## Testing Strategy

```
Local Development (Mock DB):
├─ No Supabase needed
├─ In-memory persistence
├─ Fast iteration
└─ Full feature testing

Production (Supabase):
├─ All migrations run
├─ RLS policies enforced
├─ Real data persistence
└─ OAuth + SIWE auth

Mock DB Fallback:
├─ If Supabase env vars missing
├─ Automatic failover
├─ Zero downtime testing
└─ Complete feature parity
```

## Deployment Checklist

```
Backend:
  ☐ Deploy Netlify functions
  ☐ Set SUPABASE_URL env var
  ☐ Set SUPABASE_SERVICE_ROLE_KEY env var
  ☐ Test all endpoints with mock DB

Database:
  ☐ Apply migrations to Supabase
  ☐ Verify seasons table populated
  ☐ Verify RLS policies active
  ☐ Test user data isolation

Frontend:
  ☐ Update environment URLs
  ☐ Import new helper functions
  ☐ Update UI components
  ☐ Add Season 0 countdown timer

Testing:
  ☐ Buy chest → Uncommon NFT
  ☐ Buy items → 150,000 TF each
  ☐ Start farming → All 3 required
  ☐ Wait 4 hours → Farming stops
  ☐ Claim rewards → Fee applied
  ☐ Fuse 3x Uncommon → Rare
  ☐ Try fuse Legendary → Blocked
  ☐ Season countdown → Dec 15-25
```

This architecture ensures:
✓ Clean separation of concerns
✓ Type-safe operations
✓ Graceful fallbacks
✓ Secure authentication
✓ Scalable design
✓ Offline capability (mock DB)
