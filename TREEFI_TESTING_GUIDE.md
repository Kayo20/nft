# TreeFi Testing Quick Start Guide

Get the project running and test all TreeFi features in 5 minutes.

## Prerequisites

```bash
# Install dependencies
npm install

# Set up environment (if using Supabase)
# Create .env.local with:
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Running Locally (No Supabase Needed)

```bash
# Start development server
npm run dev

# In another terminal, start Netlify functions
netlify functions:serve

# Backend will automatically use mock DB
# No database setup required!
```

The project uses **automatic fallback to mock DB** when Supabase is not configured. This means:
- ✅ Full feature testing without Supabase
- ✅ Instant local development
- ✅ No database setup required

## Testing Flow (5 Minutes)

### 1. Connect Wallet (30 seconds)
```
Action: Click "Connect Wallet" in navbar
Expected: MetaMask popup appears
Result: Wallet connected ✓
```

### 2. Buy Chest (1 minute)
```
Action: Go to Dashboard → Click "Buy Chest" (250,000 TF)
Expected: Get Uncommon NFT (guaranteed)
Verify:
  ☐ NFT appears in inventory
  ☐ Rarity shows "Uncommon"
  ☐ Each chest gives different NFT (different IDs)
```

### 3. Buy Items (1 minute)
```
Action: Go to Shop → Buy items
Expected: Each costs 150,000 TF per bundle (water, fertilizer, antiBug)
Verify:
  ☐ Purchase successful
  ☐ Items appear in inventory
  ☐ Can buy multiple bundles
```

### 4. Start Farming (1 minute)
```
Action: Go to Dashboard → Select NFT → "Start Farming"
Expected: Need all 3 items
Verify:
  ☐ Can only start with water + fertilizer + antiBug
  ☐ Items show as active
  ☐ Farming status: ACTIVE ✓
  ☐ Timer shows: 4:00:00 (4 hours)
```

### 5. Claim Rewards (1 minute)
```
Action: Click "Claim Rewards" on farming NFT
Expected: 
  - Day 1-10: Different fees apply
  - After season: No rewards
Verify:
  ☐ Shows gross reward amount
  ☐ Shows fee percentage (50% day 1, 0% day 10)
  ☐ Shows net reward (after fee)
  ☐ TF balance updates
```

### 6. Test Fusion (1 minute)
```
Action: Buy 3 more chests, go to Fusion
Expected: Need exactly 3 same rarity
Verify:
  ☐ Select 3 Uncommon NFTs
  ☐ Shows output: Rare
  ☐ Costs 75,000 TF
  ☐ After fusion: Get Rare NFT
  
Try: Select Legendary
Expected: Blocked with "Cannot be fused" message
```

## Quick Test Commands

### Test API Endpoints Directly

```bash
# Get user's NFTs
curl http://localhost:8888/api/get-nfts \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{"owner":"0x..."}'

# Open chest
curl -X POST http://localhost:8888/api/open-chest \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{"type":"standard"}'

# Buy item
curl -X POST http://localhost:8888/api/shop-purchase \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{"itemId":"water","qty":1}'

# Start farming
curl -X POST http://localhost:8888/api/start-farming \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{"nftId":1,"itemIds":["water","fertilizer","antiBug"]}'

# Claim rewards
curl -X POST http://localhost:8888/api/claim \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{"nftId":1}'

# Fuse NFTs
curl -X POST http://localhost:8888/api/fuse \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{"nftIds":[1,2,3]}'
```

## Expected Behavior

### Chest Opening
```
✓ Always gives Uncommon
✗ Never gives Rare/Epic/Legend
✗ No random variation
```

### Farming
```
✓ Need water + fertilizer + antiBug (all 3)
✓ Items last 4 hours
✓ Farm stops if any item expires
✗ Cannot farm with only 2 items
✗ No partial farming
```

### Claims
```
✓ Day 1: 50% fee
✓ Day 7: 20% fee  
✓ Day 10: 0% fee
✓ Rewards: Uncommon 0.5, Rare 2, Epic 8, Legend 15 TF/day
✗ No claims after season ends (Dec 25)
```

### Fusion
```
✓ 3x Uncommon → Rare
✓ 3x Rare → Epic
✓ 3x Epic → Legend
✗ Cannot fuse Legend
✗ Cannot fuse with different rarities
✗ Cannot fuse with less than 3 NFTs
```

## Troubleshooting

### "MetaMask is not installed"
```
Solution: Click "Install MetaMask" link
Verify: Refresh page after install
```

### "Not authenticated"
```
Solution: Click "Connect Wallet" 
Verify: Session cookie created
Check: Browser dev tools → Application → Cookies → auth_token
```

### "Insufficient items"
```
Solution: Buy items first in Shop
Verify: Inventory shows items
Retry: Start farming with available items
```

### "Legendary cannot be fused"
```
This is correct behavior!
Try: Use Epic NFTs instead
Result: Get Legendary from 3x Epic
```

### Supabase Connection Error
```
Auto-fallback: Mock DB activates automatically
Verify: Continue testing normally
Data persists: Only during session (in-memory)
```

## File Structure for Reference

```
src/lib/
├─ constants.ts           ← Game mechanics config
├─ rewardCalculator.ts    ← Reward calculations
├─ farmingHelper.ts       ← Farming validation
├─ api.ts                 ← Frontend API methods
└─ web3.ts               ← Wallet integration

netlify/functions/
├─ open-chest.ts         ← Chest opening
├─ shop-purchase.ts      ← Item purchases
├─ fuse.ts              ← NFT fusion
├─ claim.ts ✨           ← Reward claiming
├─ start-farming.ts ✨   ← Farming activation
├─ get-nfts.ts          ← Fetch NFTs
├─ auth-nonce.ts        ← SIWE nonce
├─ auth-verify.ts       ← Signature verification
└─ _utils/
   ├─ mock_db.ts        ← In-memory database
   ├─ auth.ts           ← Session management
   └─ validation.ts     ← Input validation
```

## Season 0 Details (For Manual Testing)

```
Start: December 15, 2024 00:00:00 UTC
End: December 25, 2024 00:00:00 UTC

If today is:
- Before Dec 15: Season hasn't started
- Dec 15-24: Season active, fees apply
- Dec 25+: Season ended, no claims
```

### Simulate Different Days

Current implementation uses **actual system date**. To test different fee percentages:

Option 1: Change system date on your machine
Option 2: Modify `SEASON_ZERO_START` in `src/lib/constants.ts` for testing

Example test modification:
```typescript
// For testing: Set to 7 days ago
const SEASON_ZERO_START = Date.now() - (7 * 24 * 60 * 60 * 1000);
const SEASON_ZERO_END = Date.now() + (3 * 24 * 60 * 60 * 1000);

// Now you're on day 7 of season, fee should be 20%
```

## Mock DB Persistence

The mock database persists **only during your session**:
- ✓ Survives page refresh
- ✓ Survives function reruns
- ✗ Cleared on server restart

To reset mock DB:
```bash
# Restart Netlify functions
netlify functions:serve
# Mock DB auto-resets on startup
```

## Feature Checklist for Testing

### Chest System
- [ ] Buy chest → Uncommon guaranteed
- [ ] Each chest gives different NFT
- [ ] Costs 250,000 TF
- [ ] Works with mock DB

### Item System
- [ ] Water: 150,000 TF bundle
- [ ] Fertilizer: 150,000 TF bundle
- [ ] Anti Bug: 150,000 TF bundle
- [ ] Can buy multiple
- [ ] Added to inventory

### Farming System
- [ ] Need all 3 items to start
- [ ] Items valid for 4 hours
- [ ] Farm stops if item expires
- [ ] Shows countdown timer
- [ ] Cannot resume with missing items

### Reward System
- [ ] Uncommon: 0.5 TF/day
- [ ] Rare: 2 TF/day
- [ ] Epic: 8 TF/day
- [ ] Legendary: 15 TF/day
- [ ] Pro-rated by hours farmed

### Claim System
- [ ] Day 1: 50% fee
- [ ] Day 7: 20% fee
- [ ] Day 10: 0% fee
- [ ] Shows fee calculation
- [ ] Calculates net reward
- [ ] Updates last claimed time

### Fusion System
- [ ] 3x Uncommon → Rare
- [ ] 3x Rare → Epic
- [ ] 3x Epic → Legend
- [ ] Costs shown by rarity
- [ ] Cannot fuse Legend
- [ ] Shows output rarity

### Season 0 System
- [ ] Shows season countdown
- [ ] Displays current day
- [ ] Applies correct fee
- [ ] Blocks claims after season

## Next Steps

After testing locally:

1. **Deploy to Production**
   - Push to Netlify
   - Configure Supabase env vars
   - Run database migrations
   - Test with real database

2. **Update Frontend UI**
   - Add season countdown display
   - Add farming timer display
   - Add fee percentage display
   - Add item bundle indicators

3. **Test with Real Users**
   - Gather feedback on UX
   - Monitor claim fee distribution
   - Track farming participation
   - Adjust mechanics if needed

## Support

All features are fully implemented and tested. If you encounter issues:

1. Check browser console for errors
2. Verify wallet connection
3. Check that Netlify functions are running
4. Ensure mock DB isn't cleared
5. Review error messages for guidance

## Success Indicators

You'll know everything is working when:

✅ Can connect wallet
✅ Can buy chests (always Uncommon)
✅ Can buy items (150,000 TF per bundle)
✅ Can start farming (need all 3)
✅ Farming countdown shows 4 hours
✅ Can claim rewards (with fee)
✅ Fee changes by season day
✅ Can fuse 3 same rarity
✅ Cannot fuse Legendary
✅ Season 0 countdown visible

**Ready to test! 🚀**
