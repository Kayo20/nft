# TreeFi Frontend Integration Guide

Quick reference for integrating TreeFi game mechanics into frontend UI components.

## Constants Reference

```typescript
import { 
  DAILY_REWARDS,           // { Uncommon: 0.5, Rare: 2, Epic: 8, Legendary: 15 }
  CLAIM_FEE_SCHEDULE,      // [{ day: 1, fee: 50 }, ..., { day: 10, fee: 0 }]
  CHEST_PRICE,             // 50 TF
  ITEM_CONSUMPTION_INTERVAL, // 4 * 60 * 60 * 1000 (4 hours)
  SEASON_ZERO_START,       // Dec 15, 2024
  SEASON_ZERO_END,         // Dec 25, 2024
  FUSION_RULES             // { Uncommon, Rare, Epic, Legendary rules }
} from '@/lib/constants';
```

## Helper Functions

### Reward Calculations
```typescript
import { getDailyReward, calculateAccumulatedRewards, getClaimFeePercentage } from '@/lib/rewardCalculator';

// Get daily reward for an NFT
const dailyReward = getDailyReward('Rare'); // Returns 2 (TF)

// Calculate total pending rewards
const pendingRewards = calculateAccumulatedRewards(
  'Epic',           // NFT rarity
  lastClaimedAt,    // milliseconds
  Date.now(),       // current time
  true,             // is farming active?
  true              // is season active?
);

// Get fee for current season day
const seasonDay = getCurrentSeasonDay(Date.now());
const fee = getClaimFeePercentage(seasonDay); // Returns 0-50
```

### Farming Validation
```typescript
import { isFarmingActive, getMissingItems } from '@/lib/farmingHelper';

// Check if farming is active
const isActive = isFarmingActive(activeItems, Date.now());

// Get which items are needed
const missing = getMissingItems(activeItems, Date.now());
// missing = ['water'] if water expired
```

## API Usage

### Start Farming
```typescript
import { startFarming } from '@/lib/api';

const response = await startFarming(nftId, ['water', 'fertilizer', 'antiBug']);
// Returns: { nftId, farmingStarted, activeItems[], durationHours: 4, message }
```

### Claim Rewards
```typescript
import { claimRewards } from '@/lib/api';

const response = await claimRewards(nftId);
// Returns: {
//   nftId, rarity, seasonDay, seasonActive,
//   daysSinceLastClaim, dailyReward,
//   grossRewards, feePercentage, fee, netRewards, tx
// }
```

### Purchase Items
```typescript
import { purchaseItem } from '@/lib/api';

const response = await purchaseItem('water', 1);
// Deducts 10 TF, adds 1 bundle of water (10 units, 4 hours)
```

### Fuse NFTs
```typescript
import { fuseNFTs } from '@/lib/api';

const response = await fuseNFTs([nftId1, nftId2, nftId3]);
// Requires: 3 same rarity, not Legendary
// Returns: { nft: { id, rarity, power, ... } }
```

### Open Chest
```typescript
import { openChest } from '@/lib/api';

const response = await openChest();
// Always returns Uncommon NFT
```

## UI Component Examples

### Season Countdown Timer
```typescript
// Show: "Season ends in 5 days 3 hours"
const daysRemaining = getDaysRemaining(Date.now());
const displayText = `Season ends in ${daysRemaining} days`;
```

### Farming Status Badge
```typescript
// Show active/inactive state
const isFarming = isFarmingActive(activeItems, Date.now());
const status = isFarming ? 'Farming Active ✓' : 'Farming Inactive ✗';
```

### Item Duration Display
```typescript
// Show item expiry countdown
const timeUntilExpiry = getTimeUntilFarmingStops(activeItems, Date.now());
const hours = Math.floor(timeUntilExpiry / 3600000);
const minutes = Math.floor((timeUntilExpiry % 3600000) / 60000);
const display = `${hours}h ${minutes}m remaining`;
```

### Claim Fee Display
```typescript
// Show progressive fee reduction
const seasonDay = getCurrentSeasonDay(Date.now());
const fee = getClaimFeePercentage(seasonDay);
const message = `Day ${seasonDay}/10 - Fee: ${fee}%`;
```

### Farming State Indicator
```typescript
// Show what's active and what's missing
const missing = getMissingItems(activeItems, Date.now());

if (missing.length === 0) {
  message = "All items active - farming!";
} else {
  message = `Farming paused - missing: ${missing.join(', ')}`;
}
```

## Type Definitions

```typescript
interface FarmingState {
  nftId: number;
  nftRarity: Rarity;
  farmingStarted: number;
  activeItems: ActiveItem[];  // [{ itemId, expiresAt }]
  lastClaimedAt: number;
  accumulatedRewards: number;
  isFarmingActive: boolean;
}

interface ActiveItem {
  itemId: 'water' | 'fertilizer' | 'antiBug';
  expiresAt: number;  // milliseconds since epoch
}

interface SeasonInfo {
  seasonNumber: number;
  startDate: number;
  endDate: number;
  daysRemaining: number;
  isActive: boolean;
  totalDuration: number;
}

interface ClaimInfo {
  nftId: number;
  amount: number;
  daysSinceLastClaim: number;
  feePercentage: number;
  netAmount: number;
  seasonActive: boolean;
}
```

## Validation Rules

### Before Starting Farming
```typescript
✓ User must have NFT
✓ User must have water bundle
✓ User must have fertilizer bundle
✓ User must have antiBug bundle
✗ Cannot farm without ALL 3 items
```

### Before Claiming Rewards
```typescript
✓ Farming must be active (all 3 items active)
✓ Season must be active (Dec 15-25)
✓ At least 1 day passed since last claim
✗ No rewards if farming inactive
✗ No rewards after season ends
```

### Before Fusing
```typescript
✓ Must select exactly 3 NFTs
✓ All 3 must be same rarity
✓ Cannot fuse Legendary
✗ Invalid if rarities don't match
✗ Invalid if trying to fuse Legendary
```

## Farm Lifecycle Example

```typescript
// Day 1: User buys items and starts farming
const items = await purchaseItem('water', 1);
await purchaseItem('fertilizer', 1);
await purchaseItem('antiBug', 1);

const farmingState = await startFarming(nftId, ['water', 'fertilizer', 'antiBug']);
// farmingUntil: timestamp + 4 hours
// isFarmingActive: true

// 2 days later: Items expired
// isFarmingActive is now false
// Farming stopped accumulating rewards

// User buys new items to resume
await purchaseItem('water', 1);
await purchaseItem('fertilizer', 1);
await purchaseItem('antiBug', 1);
await startFarming(nftId, ['water', 'fertilizer', 'antiBug']);
// isFarmingActive: true again

// Day 7 of season: User claims 2 days of accumulated rewards
const claim = await claimRewards(nftId);
// seasonDay: 7
// fee: 20%
// grossRewards: (2 * dailyReward for rarity)
// netRewards: grossRewards * 0.8
```

## Error Handling

```typescript
// Try-catch all API calls
try {
  await startFarming(nftId, items);
} catch (error) {
  // Possible errors:
  // - "must provide all 3 items: water, fertilizer, antiBug"
  // - "insufficient water"
  // - "not authenticated"
  // - "farming not active - all 3 items must be active"
  console.error(error.message);
}
```

## Performance Notes

- **Real-time Updates**: Update UI every 60 seconds for countdowns
- **Farm Status**: Check `isFarmingActive()` before showing rewards button
- **Claim Fee**: Calculate fee only when claiming (don't recalculate every render)
- **Item Expiry**: Use server timestamp from API response, not local time

## Season 0 Details

```
Start Date: 2024-12-15T00:00:00Z
End Date: 2024-12-25T00:00:00Z
Duration: 10 days

Day 1:  50% fee
Day 2:  45% fee
Day 3:  40% fee
Day 4:  35% fee
Day 5:  30% fee
Day 6:  25% fee
Day 7:  20% fee
Day 8:  15% fee
Day 9:  10% fee
Day 10: 0% fee
After:  No claims possible
```

## Daily Rewards by Rarity

```
Uncommon: 0.5 TF/day
Rare:     2.0 TF/day
Epic:     8.0 TF/day
Legendary: 15.0 TF/day
```

## Common Calculations

```typescript
// Calculate net claim amount
const net = grossRewards - (grossRewards * feePercentage / 100);

// Calculate how long farming will last
const minExpiry = Math.min(...activeItems.map(i => i.expiresAt));
const farmingHours = (minExpiry - Date.now()) / 3600000;

// Calculate reward per hour
const rewardPerDay = DAILY_REWARDS[nftRarity];
const rewardPerHour = rewardPerDay / 24;
const estimatedTotalReward = rewardPerHour * farmingHours;
```

## Testing Checklist

- [ ] Purchase items (10 TF each)
- [ ] Start farming (requires all 3 items)
- [ ] Verify farming active status
- [ ] Wait 4+ hours, verify farming stops
- [ ] Claim rewards (apply fee schedule)
- [ ] Fuse 3 same rarity (not Legend)
- [ ] Try fuse Legend (should fail)
- [ ] Check season countdown
- [ ] Verify reward amounts by rarity
- [ ] Verify claim fee by season day
