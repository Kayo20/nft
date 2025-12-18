import { Item, Rarity } from '@/types';

// Updated to BNB Smart Chain network
export const BNB_CHAIN_ID = 56;
export const BNB_TESTNET_CHAIN_ID = 97;

export const RARITY_COLORS: Record<Rarity, string> = {
  Uncommon: '#6B7280',
  Rare: '#3B82F6',
  Epic: '#A855F7',
  Legendary: '#E2B13C',
};

export const RARITY_ORDER: Rarity[] = ['Uncommon', 'Rare', 'Epic', 'Legendary'];

// Power levels for each rarity
export const RARITY_POWER: Record<Rarity, number> = {
  Uncommon: 100,
  Rare: 400,
  Epic: 1400,
  Legendary: 5000,
};

// Daily TF rewards per rarity (TreeFi Spec)
export const DAILY_REWARDS: Record<Rarity, number> = {
  Uncommon: 0.5,
  Rare: 2,
  Epic: 8,
  Legendary: 15,
};

// Season 0 configuration (10-day season)
export const SEASON_ZERO_START = new Date('2024-12-15T00:00:00Z').getTime();
export const SEASON_ZERO_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days in ms
export const SEASON_ZERO_END = SEASON_ZERO_START + SEASON_ZERO_DURATION;

// Items sold in TF bundles (10 units per bundle, 4 hours duration each)
// All 3 items must be active for farming to work
export const ITEMS: Item[] = [
  {
    id: 'water',
    name: 'Pure Water Bundle',
    description: '10 units, 4 hours duration',
    icon: '💧',
    cost: 150000, // Cost in TF per bundle
    boost: 'Required for farming',
  },
  {
    id: 'fertilizer',
    name: 'Fertilizer Bundle',
    description: '10 units, 4 hours duration',
    icon: '🌿',
    cost: 150000,
    boost: 'Required for farming',
  },
  {
    id: 'antiBug',
    name: 'Anti Bug Bundle',
    description: '10 units, 4 hours duration',
    icon: '🦟',
    cost: 150000,
    boost: 'Required for farming',
  },
];

// Chest and item prices in TF
export const CHEST_PRICE = 250000; // TF tokens per chest

// Updated claim fee schedule for 10-day Season 0
// Day 1: 50% fee, Day 10: 0% fee
export const CLAIM_FEE_SCHEDULE = [
  { day: 1, fee: 50 },
  { day: 2, fee: 45 },
  { day: 3, fee: 40 },
  { day: 4, fee: 35 },
  { day: 5, fee: 30 },
  { day: 6, fee: 25 },
  { day: 7, fee: 20 },
  { day: 8, fee: 15 },
  { day: 9, fee: 10 },
  { day: 10, fee: 0 },
];

export const ITEM_CONSUMPTION_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
export const ITEM_BUNDLE_SIZE = 10; // units per bundle

// Fusion mechanics (BNB Chain-based)
// Fusion rules: 3x Uncommon→Rare, 3x Rare→Epic, 3x Epic→Legend
// Legend cannot be fused further
export const FUSION_COST: Record<Rarity, number> = {
  Uncommon: 75000, // TF equivalent on BNB Chain
  Rare: 150000,
  Epic: 450000,
  Legendary: 0, // Cannot fuse legendary
};

export const FUSION_RULES = {
  Uncommon: { inputCount: 3, outputRarity: 'Rare' as Rarity },
  Rare: { inputCount: 3, outputRarity: 'Epic' as Rarity },
  Epic: { inputCount: 3, outputRarity: 'Legendary' as Rarity },
  Legendary: { canFuse: false }, // Cannot fuse legendary
};

// Transaction fee: fixed cost per in-game wallet transaction
// NOTE: This represents the fee in TF token units (same units as other TF constants). The USD equivalent is $0.10.
export const TRANSACTION_FEE_TF = 10000; // small fixed fee (adjust as needed)
export const TRANSACTION_FEE_USD = 0.10;

// Total supply: 1B TF
export const TOTAL_SUPPLY = '1B TF';

// Token contract and game wallet
export const TF_TOKEN_CONTRACT = '0x349fd86a4a5c8d6778d1efeb1adea4337c214444';
export const GAME_WALLET = '0x368273810a75f738eb4c4b6d00b8c37d998055b2';