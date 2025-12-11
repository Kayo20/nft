export type Rarity = 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface NFTTree {
  id: number;
  rarity: Rarity;
  level: number;
  power: number; // Added power attribute
  dailyYield: number;
  health: number;
  image: string;
  lastWatered: number;
  lastFertilized: number;
  lastBugTreated: number;
  slotIndex?: number; // For land slot positioning
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  cost: number;
  boost: string;
}

// Item instance with expiry time for farming
export interface ActiveItem {
  id: string;
  itemId: 'water' | 'fertilizer' | 'antiBug';
  expiresAt: number; // milliseconds
}

// Farming state per NFT
export interface FarmingState {
  nftId: number;
  nftRarity: Rarity;
  farmingStarted: number; // timestamp
  activeItems: ActiveItem[]; // All 3 required items
  lastClaimedAt: number;
  accumulatedRewards: number;
  isFarmingActive: boolean; // true if all 3 items are active
}

export interface UserInventory {
  fertilizer: number;
  water: number;
  antiBug: number;
  tfBalance: number; // TF token balance
}

export interface ClaimInfo {
  nftId: number;
  amount: number;
  daysSinceLastClaim: number;
  feePercentage: number;
  netAmount: number;
  seasonActive: boolean;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string;
  isConnected: boolean;
}

export interface ChestBundle {
  id: string;
  name: string;
  quantity: number;
  price: number;
  icon: string;
}

// Season 0: 10-day season starting Dec 15, 2024
export interface SeasonInfo {
  seasonNumber: number;
  startDate: number; // timestamp
  endDate: number; // timestamp
  daysRemaining: number;
  isActive: boolean;
  totalDuration: number; // in days
}