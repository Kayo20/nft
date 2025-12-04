type NFT = {
  id: number;
  owner_address: string;
  rarity: string;
  power: number;
  daily_yield: number;
  health: number;
  image_url?: string | null;
  metadata?: any;
  status: string;
  created_at: string;
};

type Item = { id: string; name: string; description?: string; price: number; image_url?: string };

type FarmingState = {
  id: number;
  nftId: number;
  userAddress: string;
  rarity: string;
  farmingStarted: string;
  activeItems: Array<{ itemId: string; expiresAt: number }>;
  lastClaimedAt: string;
  isFarmingActive: boolean;
};

const nfts = new Map<number, NFT>();
const items = new Map<string, Item>();
const inventories = new Map<string, Map<string, number>>(); // user -> (itemId -> qty)
const farmingStates = new Map<number, FarmingState>(); // nftId -> farming state
const transactions: any[] = [];

let nextId = 1;
let nextFarmingId = 1;

export function resetMockData() {
  nfts.clear();
  items.clear();
  inventories.clear();
  farmingStates.clear();
  transactions.length = 0;
  nextId = 1;
  nextFarmingId = 1;
  // Seed items per TreeFi Spec: 10 TF per bundle, 10 units per bundle
  items.set('water', { id: 'water', name: 'Pure Water Bundle (10 units)', price: 10 }); // 10 TF per bundle
  items.set('fertilizer', { id: 'fertilizer', name: 'Fertilizer Bundle (10 units)', price: 10 });
  items.set('antiBug', { id: 'antiBug', name: 'Anti Bug Bundle (10 units)', price: 10 });
}

export function getNftsByOwner(owner: string) {
  const list: NFT[] = [];
  for (const nft of nfts.values()) {
    if (nft.owner_address.toLowerCase() === owner.toLowerCase() && nft.status === 'active') list.push(nft);
  }
  return list;
}

export function insertNft(nftData: Partial<NFT>): NFT {
  const id = nextId++;
  const nft: NFT = {
    id,
    owner_address: (nftData.owner_address || '').toLowerCase(),
    rarity: nftData.rarity || 'uncommon',
    power: nftData.power || 0,
    daily_yield: nftData.daily_yield || 0,
    health: nftData.health || 100,
    image_url: nftData.image_url || null,
    metadata: nftData.metadata || null,
    status: nftData.status || 'active',
    created_at: new Date().toISOString(),
  };
  nfts.set(id, nft);
  return nft;
}

export function getNftsByIds(ids: Array<number | string>) {
  return ids.map(id => nfts.get(Number(id))).filter(Boolean);
}

export function burnNfts(ids: Array<number | string>) {
  for (const id of ids) {
    const n = nfts.get(Number(id));
    if (n) n.status = 'burned';
  }
}

export function getItemById(itemId: string) {
  return items.get(itemId);
}

export function createTransaction(user: string, type: string, amount: number, meta: any) {
  const tx = { id: transactions.length + 1, user_address: user, type, amount, metadata: meta, created_at: new Date().toISOString() };
  transactions.push(tx);
  return tx;
}

export function upsertInventory(user: string, itemId: string, qty: number) {
  let userInv = inventories.get(user.toLowerCase());
  if (!userInv) {
    userInv = new Map<string, number>();
    inventories.set(user.toLowerCase(), userInv);
  }
  const prev = userInv.get(itemId) || 0;
  userInv.set(itemId, prev + qty);
}

// Farming state functions
export function startFarming(
  nftId: number,
  userAddress: string,
  rarity: string,
  itemIds: string[]
): FarmingState {
  const farmingState: FarmingState = {
    id: nextFarmingId++,
    nftId,
    userAddress: userAddress.toLowerCase(),
    rarity,
    farmingStarted: new Date().toISOString(),
    activeItems: itemIds.map(itemId => ({
      itemId,
      expiresAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
    })),
    lastClaimedAt: new Date().toISOString(),
    isFarmingActive: true,
  };
  farmingStates.set(nftId, farmingState);
  return farmingState;
}

export function getFarmingState(nftId: number): FarmingState | undefined {
  return farmingStates.get(nftId);
}

export function updateFarmingState(nftId: number, updates: Partial<FarmingState>): FarmingState | undefined {
  const state = farmingStates.get(nftId);
  if (!state) return undefined;
  
  const updated = { ...state, ...updates };
  farmingStates.set(nftId, updated);
  return updated;
}

// initialize
resetMockData();

export function debugState() {
  return { nfts: Array.from(nfts.values()), items: Array.from(items.values()), inventories: Array.from(inventories.entries()), transactions };
}
