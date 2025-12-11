// Deprecated mock API stub — backend endpoints are now provided.
// This file remains for historical reference only. Do NOT import it in application code.

export const mockApi = {
  _deprecated: true,
};
    new URL('../assets/uncommon/14.png', import.meta.url).href,
    new URL('../assets/uncommon/15.png', import.meta.url).href,
    new URL('../assets/uncommon/16.png', import.meta.url).href,
    new URL('../assets/uncommon/17.png', import.meta.url).href,
    new URL('../assets/uncommon/18.png', import.meta.url).href,
    new URL('../assets/uncommon/19.png', import.meta.url).href,
    new URL('../assets/uncommon/20.png', import.meta.url).href,
    new URL('../assets/uncommon/21.png', import.meta.url).href,
    new URL('../assets/uncommon/22.png', import.meta.url).href,
    new URL('../assets/uncommon/23.png', import.meta.url).href,
    new URL('../assets/uncommon/24.png', import.meta.url).href,
    new URL('../assets/uncommon/25.png', import.meta.url).href,
    new URL('../assets/uncommon/26.png', import.meta.url).href,
    new URL('../assets/uncommon/27.png', import.meta.url).href,
    new URL('../assets/uncommon/28.png', import.meta.url).href,
    new URL('../assets/uncommon/29.png', import.meta.url).href,
    new URL('../assets/uncommon/30.png', import.meta.url).href,
    new URL('../assets/uncommon/31.png', import.meta.url).href,
    new URL('../assets/uncommon/32.png', import.meta.url).href,
    new URL('../assets/uncommon/33.png', import.meta.url).href,
    new URL('../assets/uncommon/34.png', import.meta.url).href,
    new URL('../assets/uncommon/35.png', import.meta.url).href,
    new URL('../assets/uncommon/36.png', import.meta.url).href,
    new URL('../assets/uncommon/37.png', import.meta.url).href,
    new URL('../assets/uncommon/38.png', import.meta.url).href,
    new URL('../assets/uncommon/39.png', import.meta.url).href,
    new URL('../assets/uncommon/40.png', import.meta.url).href,
  ],
  Rare: [
    new URL('../assets/rare/1.png', import.meta.url).href,
    new URL('../assets/rare/2.png', import.meta.url).href,
    new URL('../assets/rare/3.png', import.meta.url).href,
  ],
  Epic: [
    new URL('../assets/epic/1.png', import.meta.url).href,
    new URL('../assets/epic/2.png', import.meta.url).href,
    new URL('../assets/epic/3.png', import.meta.url).href,
  ],
  Legendary: [
    new URL('../assets/legendary/1.png', import.meta.url).href,
    new URL('../assets/legendary/2.png', import.meta.url).href,
    new URL('../assets/legendary/3.png', import.meta.url).href,
    new URL('../assets/legendary/4.png', import.meta.url).href,
    new URL('../assets/legendary/5.png', import.meta.url).href,
    new URL('../assets/legendary/6.png', import.meta.url).href,
    new URL('../assets/legendary/7.png', import.meta.url).href,
    new URL('../assets/legendary/8.png', import.meta.url).href,
    new URL('../assets/legendary/9.png', import.meta.url).href,
    new URL('../assets/legendary/10.png', import.meta.url).href,
  ],
};

// Mock NFT data generator
export const generateMockNFTs = (count: number = 10): NFTTree[] => {
  const rarities: Rarity[] = ['Uncommon', 'Rare', 'Epic', 'Legendary'];
  const trees: NFTTree[] = [];

  // Sample images for each rarity (replace with your actual filenames if needed)
  const rarityImages: Record<string, string[]> = {
    Uncommon: [
      new URL('../assets/uncommon/1.png', import.meta.url).href,
      new URL('../assets/uncommon/3.png', import.meta.url).href,
      new URL('../assets/uncommon/4.png', import.meta.url).href,
      new URL('../assets/uncommon/5.png', import.meta.url).href,
      new URL('../assets/uncommon/6.png', import.meta.url).href,
      new URL('../assets/uncommon/7.png', import.meta.url).href,
      new URL('../assets/uncommon/8.png', import.meta.url).href,
      new URL('../assets/uncommon/9.png', import.meta.url).href,
      new URL('../assets/uncommon/10.png', import.meta.url).href,
      new URL('../assets/uncommon/11.png', import.meta.url).href,
      new URL('../assets/uncommon/12.png', import.meta.url).href,
      new URL('../assets/uncommon/13.png', import.meta.url).href,
      new URL('../assets/uncommon/14.png', import.meta.url).href,
      new URL('../assets/uncommon/15.png', import.meta.url).href,
      new URL('../assets/uncommon/16.png', import.meta.url).href,
      new URL('../assets/uncommon/17.png', import.meta.url).href,
      new URL('../assets/uncommon/18.png', import.meta.url).href,
      new URL('../assets/uncommon/19.png', import.meta.url).href,
      new URL('../assets/uncommon/20.png', import.meta.url).href,
      new URL('../assets/uncommon/21.png', import.meta.url).href,
      new URL('../assets/uncommon/22.png', import.meta.url).href,
      new URL('../assets/uncommon/23.png', import.meta.url).href,
      new URL('../assets/uncommon/24.png', import.meta.url).href,
      new URL('../assets/uncommon/25.png', import.meta.url).href,
      new URL('../assets/uncommon/26.png', import.meta.url).href,
      new URL('../assets/uncommon/27.png', import.meta.url).href,
      new URL('../assets/uncommon/28.png', import.meta.url).href,
      new URL('../assets/uncommon/29.png', import.meta.url).href,
      new URL('../assets/uncommon/30.png', import.meta.url).href,
      new URL('../assets/uncommon/31.png', import.meta.url).href,
      new URL('../assets/uncommon/32.png', import.meta.url).href,
      new URL('../assets/uncommon/33.png', import.meta.url).href,
      new URL('../assets/uncommon/34.png', import.meta.url).href,
      new URL('../assets/uncommon/35.png', import.meta.url).href,
      new URL('../assets/uncommon/36.png', import.meta.url).href,
      new URL('../assets/uncommon/37.png', import.meta.url).href,
      new URL('../assets/uncommon/38.png', import.meta.url).href,
      new URL('../assets/uncommon/39.png', import.meta.url).href,
      new URL('../assets/uncommon/40.png', import.meta.url).href,
    ],
    Rare: [
      new URL('../assets/rare/1.png', import.meta.url).href,
      new URL('../assets/rare/2.png', import.meta.url).href,
      new URL('../assets/rare/3.png', import.meta.url).href,
    ],
    Epic: [
      new URL('../assets/epic/1.png', import.meta.url).href,
      new URL('../assets/epic/2.png', import.meta.url).href,
      new URL('../assets/epic/3.png', import.meta.url).href,
    ],
    Legendary: [
      new URL('../assets/legendary/1.png', import.meta.url).href,
      new URL('../assets/legendary/2.png', import.meta.url).href,
      new URL('../assets/legendary/3.png', import.meta.url).href,
      new URL('../assets/legendary/4.png', import.meta.url).href,
      new URL('../assets/legendary/5.png', import.meta.url).href,
      new URL('../assets/legendary/6.png', import.meta.url).href,
      new URL('../assets/legendary/7.png', import.meta.url).href,
      new URL('../assets/legendary/8.png', import.meta.url).href,
      new URL('../assets/legendary/9.png', import.meta.url).href,
      new URL('../assets/legendary/10.png', import.meta.url).href,
    ],
  };

  for (let i = 0; i < count; i++) {
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const baseYield = rarity === 'Uncommon' ? 10 : rarity === 'Rare' ? 25 : rarity === 'Epic' ? 50 : 100;
    const power = RARITY_POWER[rarity];
    // Pick a random image for the rarity
    const images = RARITY_IMAGES[rarity] || [];
    const image = images.length > 0 ? images[i % images.length] : RARITY_IMAGES.Uncommon[0];

    trees.push({
      id: i + 1,
      rarity,
      level: Math.floor(Math.random() * 10) + 1,
      power,
      dailyYield: baseYield + Math.floor(Math.random() * 20),
      health: Math.floor(Math.random() * 30) + 70,
      image,
      lastWatered: Date.now() - Math.random() * 4 * 60 * 60 * 1000,
      lastFertilized: Date.now() - Math.random() * 4 * 60 * 60 * 1000,
      lastBugTreated: Date.now() - Math.random() * 4 * 60 * 60 * 1000,
      slotIndex: i < 9 ? i : undefined,
    });
  }

  return trees;
};

// Mock API functions
export const mockApi = {
  connectWallet: async (): Promise<{ address: string; chainId: number; balance: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      address: '0x' + Math.random().toString(16).substr(2, 40),
      chainId: 137, // Polygon
      balance: (Math.random() * 10).toFixed(4),
    };
  },

  getNFTs: async (address: string): Promise<NFTTree[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockNFTs(12);
  },

  getUserItems: async (address: string): Promise<UserInventory> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      fertilizer: Math.floor(Math.random() * 50),
      water: Math.floor(Math.random() * 50),
      antiBug: Math.floor(Math.random() * 50),
    };
  },

  purchaseItem: async (itemId: string, qty: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  },

  consumeItems: async (nftId: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  },

  getClaimable: async (nftId: number): Promise<ClaimInfo> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const daysSince = Math.floor(Math.random() * 10) + 1;
    const feeData = CLAIM_FEE_SCHEDULE.find(f => f.day === Math.min(daysSince, 10)) || CLAIM_FEE_SCHEDULE[9];
    const amount = Math.random() * 100 + 50;
    const netAmount = amount * (1 - feeData.fee / 100);

    return {
      nftId,
      amount,
      daysSinceLastClaim: daysSince,
      feePercentage: feeData.fee,
      netAmount,
    };
  },

  claim: async (nftId: number): Promise<{ success: boolean; amount: number }> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      amount: Math.random() * 100 + 50,
    };
  },

  fuseNFTs: async (nftIds: number[]): Promise<{ success: boolean; newNFT: NFTTree | null }> => {
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    if (nftIds.length !== 3) {
      return { success: false, newNFT: null };
    }

    const newRarityIndex = Math.min(RARITY_ORDER.indexOf('Rare') + 1, RARITY_ORDER.length - 1);
    const newRarity = RARITY_ORDER[newRarityIndex];
    const power = RARITY_POWER[newRarity];
    
    const imgs = RARITY_IMAGES[newRarity] || [];
    const newNFT: NFTTree = {
      id: Math.floor(Math.random() * 10000),
      rarity: newRarity,
      level: 1,
      power,
      dailyYield: newRarity === 'Rare' ? 25 : newRarity === 'Epic' ? 50 : 100,
      health: 100,
      image: imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : RARITY_IMAGES.Uncommon[0],
      lastWatered: Date.now(),
      lastFertilized: Date.now(),
      lastBugTreated: Date.now(),
    };

    return { success: true, newNFT };
  },

  getTokenBalance: async (address: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return 0; // Start with zero balance
  },

  openChest: async (giftCode?: string): Promise<{ success: boolean; tree: NFTTree | null }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
     // TreeFi Spec: Chests only give Uncommon rarity NFTs
     const selectedRarity: Rarity = 'Uncommon';
   
     const baseYield = 10;
    const power = RARITY_POWER[selectedRarity];
    
    const chestImgs = RARITY_IMAGES[selectedRarity] || [];
    const tree: NFTTree = {
      id: Math.floor(Math.random() * 10000),
      rarity: selectedRarity,
      level: 1,
      power,
      dailyYield: baseYield + Math.floor(Math.random() * 5),
      health: 100,
      image: chestImgs.length > 0 ? chestImgs[Math.floor(Math.random() * chestImgs.length)] : RARITY_IMAGES.Uncommon[0],
      lastWatered: Date.now(),
      lastFertilized: Date.now(),
      lastBugTreated: Date.now(),
    };
    
    return { success: true, tree };
  },

  purchaseBundle: async (bundleId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  },

  redeemGiftCode: async (code: string): Promise<{ success: boolean; reward: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      reward: '10 OG Chests',
    };
  },

  getSeasonInfo: async (): Promise<SeasonInfo> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const targetDate = new Date('2025-12-17T00:00:00Z').getTime();
    const now = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((targetDate - now) / (24 * 60 * 60 * 1000)));
    
    return {
      seasonNumber: 0,
      startDate: targetDate - 10 * 24 * 60 * 60 * 1000,
      endDate: targetDate,
      daysRemaining,
    };
  },

  validateGiftCode: async (code: string): Promise<{ valid: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    // In real implementation, this would validate against backend gift codes
    const giftCodes = JSON.parse(localStorage.getItem('giftCodes') || '[]') as GiftCode[];
    return validateGiftCode(code, giftCodes);
  },

  redeemGiftCode: async (code: string, address: string): Promise<{ success: boolean; tree: NFTTree | null; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get gift codes from localStorage (in real app, this would be backend)
    let giftCodes = JSON.parse(localStorage.getItem('giftCodes') || '[]') as GiftCode[];
    
    // Initialize gift codes if not exists
    if (giftCodes.length === 0) {
      giftCodes = generateGiftCodes(100);
      localStorage.setItem('giftCodes', JSON.stringify(giftCodes));
    }
    
    const result = claimGiftCode(code, address, giftCodes);
    localStorage.setItem('giftCodes', JSON.stringify(giftCodes));
    
    if (!result.success) {
      return { success: false, tree: null, message: result.message };
    }
    
    // Generate free Uncommon tree
    const chestImgs = RARITY_IMAGES['Uncommon'] || [];
    const tree: NFTTree = {
      id: Math.floor(Math.random() * 10000),
      rarity: 'Uncommon',
      level: 1,
      power: RARITY_POWER['Uncommon'],
      dailyYield: 10 + Math.floor(Math.random() * 5),
      health: 100,
      image: chestImgs.length > 0 ? chestImgs[Math.floor(Math.random() * chestImgs.length)] : RARITY_IMAGES.Uncommon[0],
      lastWatered: Date.now(),
      lastFertilized: Date.now(),
      lastBugTreated: Date.now(),
    };
    
    return { success: true, tree, message: result.message };
  },
};