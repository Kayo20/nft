# Chest Rarity System Update

## Summary
Updated the chest opening system so that **only Uncommon rarity trees are obtained from chests**. All other rarities (Rare, Epic, Legendary) can only be obtained through the **Fusion system**.

## Changes Made

### 1. **Frontend Mock API** (`src/lib/mockApi.ts`)
   - Removed probability-weighted rarity distribution from `openChest()` method
   - Changed from: 50% Uncommon, 30% Rare, 15% Epic, 5% Legendary
   - Changed to: 100% Uncommon guaranteed
   - Simplified logic to always return Uncommon rarity

**Before:**
```typescript
const rarities: Rarity[] = ['Uncommon', 'Rare', 'Epic', 'Legendary'];
const weights = [50, 30, 15, 5];
const random = Math.random() * 100;
// ... weighted selection logic
```

**After:**
```typescript
// TreeFi Spec: Chests only give Uncommon rarity NFTs
const selectedRarity: Rarity = 'Uncommon';
const baseYield = 10;
```

### 2. **Shop UI Update** (`src/pages/Shop.tsx`)
   - Added info alert below chest card explaining the rarity system
   - Updated chest dialog description to clarify the flow
   
**Info Alert Added:**
```
💡 Chests contain only Uncommon rarity trees. Use Fusion to obtain higher rarities!
```

**Dialog Description Updated From:**
```
You have a chance to get Uncommon (50%), Rare (30%), Epic (15%), or Legendary (5%) trees
```

**To:**
```
Get an Uncommon rarity tree. Fuse 3 Uncommon trees to create Rare, Epic, or Legendary trees!
```

### 3. **Backend Already Configured** (`netlify/functions/open-chest.ts`)
   - Backend was already set to 100% Uncommon only
   - PROBS array already contained only Uncommon with 1.0 probability
   - No changes needed - frontend now matches backend

## Game Flow

### Obtaining Different Rarities:
1. **Uncommon** → Open chests (guaranteed)
2. **Rare** → Fuse 3x Uncommon trees
3. **Epic** → Fuse 3x Rare trees
4. **Legendary** → Fuse 3x Epic trees

### Benefits:
✅ Clear progression path for players
✅ Fusion system becomes essential for advancement
✅ Encourages long-term engagement (need multiple chests)
✅ Higher rarities feel more valuable
✅ Aligns frontend with backend specification

## Testing Checklist
- [ ] Open a chest → verify only Uncommon rarity is obtained
- [ ] Check Shop page → verify info alert displays correctly
- [ ] Open chest dialog → verify updated description shows
- [ ] Try fusion → verify Rare can be created from 3x Uncommon
- [ ] Check mobile view → verify alert displays properly

## Files Modified
1. `src/lib/mockApi.ts` - Chest opening logic
2. `src/pages/Shop.tsx` - UI descriptions and info alert

All changes are backward compatible and don't affect existing NFT data.
