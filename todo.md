# TreeFi Project Updates - Implementation Plan

## Changes Required (Based on User Requirements)

### 1. Claim Page Updates
- [x] Remove trees display from claim page
- [x] Show only: Balance, Fees, Claim button
- [x] Update to claim TF token rewards

### 2. Profile Page Updates
- [x] Remove item inventory section (moved to inventory page)
- [x] Remove NFT section (moved to inventory page)
- [x] Add trees by rarity section (Uncommon, Rare, Epic, Legendary)

### 3. Dark Mode as Default
- [x] Set dark mode as default theme
- [x] Keep theme toggle functionality

### 4. Network Change: Polygon → BNB Chain
- [x] Update all references from Polygon to BNB Chain
- [x] Update chain ID from 137 to 56
- [x] Update explorer links to BSCScan
- [x] Update network display text

### 5. Home Page Updates
- [x] Update total supply text to "100 M TF"
- [x] Update network references to BNB Chain
- [x] Update rewards info: "First 200 members (2 free mints + OG role in Discord)"
- [x] Update chest information in shop

### 6. Land Overview Updates
- [x] Make land look more festive/realistic
- [x] Add ability to add trees one by one
- [x] Add button for items (add items every 4h to start farming)

### 7. Dashboard → Inventory Page Rename
- [x] Rename Dashboard to Inventory
- [x] Set all token balances to zero initially
- [x] Remove chest section from inventory
- [x] Show: Items, Trees, Land, Balance in inventory

### 8. Shop Updates
- [x] Add chest to TreeFi shop
- [x] Update item purchases to use TF token (not USDT)
- [x] Emphasize token burning mechanism

### 9. NFT Rarity Updates
- [x] Add power attribute to NFTs
- [x] Remove exact TF rewards display
- [x] Show rarity-based power levels

### 10. Claim Fee Updates
- [x] Update to 10-day season (Season 0)
- [x] Update fee percentages for 10-day schedule
- [x] Update fee calculation logic

### 11. Items Usage
- [x] Add items button to land overview
- [x] Enable adding items every 4 hours for farming

## File Structure
- src/pages/Claim.tsx - Simplified claim interface
- src/pages/Profile.tsx - Updated with rarity sections
- src/pages/Dashboard.tsx - Renamed to Inventory
- src/pages/Landing.tsx - Updated home page
- src/pages/Shop.tsx - Added chest, updated currency
- src/lib/constants.ts - Updated network, fees, supply
- src/lib/web3.ts - Updated to BNB Chain
- src/contexts/ThemeContext.tsx - Dark mode default
- src/components/dashboard/LandSlots.tsx - Festive land design
- src/types/index.ts - Added power attribute