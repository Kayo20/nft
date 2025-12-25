import { useState, useEffect } from 'react';
import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useNFTs } from '@/hooks/useNFTs';
import { useItems } from '@/hooks/useItems';
import { useUserLands, useLandDetails, useUpdateLandSlot } from '@/hooks/useUserLands';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandSlots } from '@/components/dashboard/LandSlots';
import { SeasonBadge } from '@/components/dashboard/SeasonBadge';
import { getUserBalances, getUserLands as getUserLandsApi, getUserLandsDetailed as getUserLandsDetailedApi, updateLandSlot as updateLandSlotApi, createUserLand as createUserLandApi } from '@/lib/apiUser';
import { motion } from 'framer-motion';
import {
  TreePine,
  Coins,
  Wallet,
  ShoppingBag,
  TrendingUp,
  Droplets,
  Sprout,
  Bug,
  Gift,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { transferERC20 } from '@/lib/web3';
import { TF_TOKEN_CONTRACT, GAME_WALLET, TRANSACTION_FEE_TF } from '@/lib/constants';
import { startFarming as startFarmingApi, getFarmingStates } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';


class DashboardErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // You can log error here
    // console.error(error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-600 text-center mt-10">Something went wrong in the Dashboard. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

export default function Dashboard() {
  const { wallet } = useWallet();
  const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const displayAddress = wallet.address || demoAddress;
  const { nfts: allNFTs, isLoading } = useNFTs(displayAddress);
  const { inventory, refetch: refetchItems } = useItems(displayAddress);
  const [tfBalance, setTfBalance] = useState(0);
  const [bnbBalance, setBnbBalance] = useState(0);

  // Fetch balances from backend
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const balances = await getUserBalances();
        setTfBalance(balances.tfBalance || 0);
        setBnbBalance(balances.bnbBalance || 0);
      } catch (err) {
        console.error('Failed to fetch balances:', err);
      }
    };
    if (wallet.isConnected) {
      fetchBalances();
    }
  }, [wallet.isConnected]);

  // Always keep a full array of 9 slots, each slot is either a tree (with slotIndex) or undefined
  const SLOT_COUNT = 9;
  const [landSlots, setLandSlots] = useState<(typeof allNFTs[0])[]>(Array(SLOT_COUNT).fill(undefined));
  // Load user lands & slots (persisted in Supabase)
  const { lands = [], isLoading: landsLoading, refetch: refetchLands } = useUserLands(displayAddress);
  const currentLandId = lands.length > 0 ? lands[0].id : null;
  const { landData, refetch: refetchLandDetails } = useLandDetails(currentLandId);
  const { mutateAsync: updateSlot } = useUpdateLandSlot(currentLandId);

  // When land details load, merge into local landSlots for UI
  useEffect(() => {
    if (landData && landData.slotData) {
      // Map slotData nftIds to actual user's nft objects when available
      setLandSlots(prev => prev.map((s, i) => {
        const slot = landData.slotData.find((sd: any) => sd.index === i);
        if (!slot) return s;
        if (!slot.nftId) return undefined;
        const nftObj = allNFTs.find(n => n.id === slot.nftId) || { id: slot.nftId, rarity: 'Uncommon', power: 0 };
        return { ...nftObj, slotIndex: i } as any;
      }));
    }
  }, [landData, allNFTs]);

  // Farming and transfer UI state
  const [transferInProgress, setTransferInProgress] = useState(false);
  const [transferAction, setTransferAction] = useState<string | null>(null);
  const [verifyingTx, setVerifyingTx] = useState(false);

  // Fetch farming states for the current user's NFTs and merge into landSlots
  const fetchAndMergeFarming = async () => {
    try {
      const res: any = await getFarmingStates();
      const farmingStates: any[] = res.farmingStates || [];
      if (!farmingStates || farmingStates.length === 0) return;
      setLandSlots(prev => prev.map(slot => {
        if (!slot) return slot;
        const match = farmingStates.find(s => s.nftId === slot.id || s.nft_id === slot.id);
        if (match && match.farming) {
          return { ...slot, farmingState: match.farming };
        }
        if (match && (match.farming_started || match.active_items)) {
          return { ...slot, farmingState: { farming_started: match.farming_started, active_items: match.active_items, is_farming_active: match.is_farming_active } };
        }
        return slot;
      }));
    } catch (e) {
      // ignore; not critical
      // console.debug('Failed to fetch farming states', e);
    }
  };

  // Load farming states whenever NFTs or landSlots change
  useEffect(() => {
    if (!isLoading && allNFTs) {
      fetchAndMergeFarming();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, allNFTs]);

  // Start farming handler (transfers TF fee then calls start-farming API)
  const handleStartFarming = async (slotIndex: number, itemIds: ('water' | 'fertilizer' | 'antiBug')[]) => {
    const slot = landSlots[slotIndex];
    if (!slot) {
      toast.error('No tree in slot');
      return;
    }
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet to start farming');
      return;
    }
    try {
      setTransferInProgress(true);
      setTransferAction('start-farming');
      toast('Please confirm the TF transaction to start farming (transaction fee)...', { duration: 4000 });
      const receipt = await transferERC20(TF_TOKEN_CONTRACT, GAME_WALLET, String(TRANSACTION_FEE_TF));
      const txHash = (receipt && (receipt.transactionHash || (receipt as any).hash)) || undefined;
      setTransferInProgress(false);
      setVerifyingTx(true);

      const result = await startFarmingApi(slot.id, itemIds, txHash);
      setVerifyingTx(false);

      if (result && (result.ok || result.farmingStarted)) {
        // update slot farmingState
        const farmingState = {
          farming_started: result.farmingStarted || result.farming_started || new Date().toISOString(),
          active_items: result.activeItems || result.active_items || itemIds.map(id => ({ itemId: id, expiresAt: Date.now() + 4 * 60 * 60 * 1000 })),
          is_farming_active: true,
        };
        setLandSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, farmingState } : s));
        // refresh inventory counts
        try { refetchItems(); } catch (e) { /* ignore */ }
        toast.success('Farming started — Active for 4 hours');
      } else {
        toast.error('Failed to start farming');
      }
    } catch (err) {
      setTransferInProgress(false);
      setVerifyingTx(false);
      console.error('start farming failed', err);
      toast.error('Start farming failed');
    }
  };

  // Show loading state while NFTs are loading
  if (isLoading) {
    return <div className="text-center py-20 text-lg text-gray-600">Loading your dashboard...</div>;
  }

  const handleSlotClick = async (slotIndex: number) => {
    if (isLoading || !allNFTs || allNFTs.length === 0) {
      toast.info('NFTs are loading, please wait...');
      return;
    }
    toast.info(`Slot ${slotIndex + 1} clicked`);
    if (!landSlots[slotIndex]) {
      // Find a random NFT not already in land
      const availableNFT = allNFTs.find(nft => !landSlots.some(t => t && t.id === nft.id));
      if (availableNFT) {
        // Require wallet connection to persist planting to Supabase
        if (!wallet.isConnected) {
          toast.error('Connect your wallet to save planted NFTs to your account.');
          return;
        }

        // Persist to Supabase if we have a land
        if (currentLandId) {
          try {
            const res = await updateSlot({ slotIndex, nftId: availableNFT.id });
            const persistedNftId = res?.slot?.nftId ?? null;
            if (persistedNftId === null) {
              toast.error('Failed to persist NFT to DB');
              return;
            }
            // Use persisted id to update local UI
            const nftObj = allNFTs.find(n => n.id === persistedNftId) || { id: persistedNftId, rarity: 'Uncommon', power: 0 };
            setLandSlots(prev => {
              const copy = [...prev];
              copy[slotIndex] = { ...nftObj, slotIndex } as any;
              return copy;
            });
            // Refresh to ensure DB is reflected
            try { await refetchLands(); } catch (e) { /* ignore */ }
            try { await refetchLandDetails(); } catch (e) { /* ignore */ }
            toast.success('NFT planted to land and saved!');
            return;
          } catch (e: any) {
            console.error('Failed to update slot:', e);
            const msg = e?.message || JSON.stringify(e) || '';

            // If the land was deleted or not found on server (but client thought it existed), try to re-create a persisted land and retry once
            if (String(msg).toLowerCase().includes('land not found') || String(msg).toLowerCase().includes('missing landid') || String(msg).toLowerCase().includes('forbidden: not owner')) {
              toast.error('Land not found or not owned on server — attempting to create a new persisted land and retrying...');
              try {
                const created = await createUserLandApi();
                if (created && created.id) {
                  try {
                    await updateLandSlotApi(created.id, slotIndex, availableNFT.id);
                    // Refresh queries so hooks reflect DB state
                    try { await refetchLands(); } catch (e) { /* ignore */ }
                    try { await refetchLandDetails(); } catch (e) { /* ignore */ }
                    setLandSlots(prev => {
                      const copy = [...prev];
                      copy[slotIndex] = { ...availableNFT, slotIndex } as any;
                      return copy;
                    });
                    toast.success('NFT planted to your new land and saved!');
                    return;
                  } catch (retryErr: any) {
                    console.error('Retry update after create failed', retryErr);
                    toast.error(`Retry failed: ${retryErr?.message || String(retryErr)}`);
                    return;
                  }
                }
                toast.error('Failed to create persisted land for your account');
                return;
              } catch (createErr: any) {
                console.error('Failed to create land after land not found:', createErr);
                toast.error(`Failed to create persisted land: ${createErr?.message || String(createErr)}`);
                return;
              }
            }

            toast.error(`Failed to plant NFT: ${msg || 'Unknown error'}`);
            return;
          }
        }

        // If no current land, ask backend to create default land (user-lands will insert default).
        try {
          const newLandsResp = await getUserLandsDetailedApi();
          if (newLandsResp.warning) {
            console.warn('user-lands warning:', newLandsResp.warning);
            toast.error(`Server warning: ${newLandsResp.warning}`);
          }

          let newLand = (newLandsResp.lands && newLandsResp.lands.length > 0) ? newLandsResp.lands[0] : null;

          // If the returned land is an in-memory fallback (id starts with 'local-') or persisted is false try creating a persistent land
          if (!newLand || String(newLand.id).startsWith('local-') || newLandsResp.persisted === false) {
            try {
              const created = await createUserLandApi();
              if (created && created.id) {
                newLand = created;
              } else {
                // no persisted land created
                toast.error('Server failed to create a persisted land for your account. Please check server logs or contact support.');
                return;
              }
            } catch (createErr: any) {
              console.warn('createUserLand failed', createErr);
              toast.error(`Failed to create land: ${createErr?.message || String(createErr)}`);
              return;
            }
          }

          if (newLand && newLand.id) {
            // Persist directly via API helper (we don't have mutate for this new land id)
            await updateLandSlotApi(newLand.id, slotIndex, availableNFT.id);
            // Refresh queries so hooks reflect DB state
            try { await refetchLands(); } catch (e) { /* ignore */ }
            try { await refetchLandDetails(); } catch (e) { /* ignore */ }
            // Optimistic local update
            setLandSlots(prev => {
              const copy = [...prev];
              copy[slotIndex] = { ...availableNFT, slotIndex } as any;
              return copy;
            });
            toast.success('NFT planted to your land and saved!');
            return;
          }
        } catch (e: any) {
          console.warn('Failed to create default land or persist slot:', e);
          const msg = e?.message || JSON.stringify(e) || 'Failed to persist NFT to your account.';
          toast.error(`Failed to persist NFT: ${msg}`);
          return;
        }

        // Fallback: do NOT add locally. We require persistence to a server land for user-owned slots.
        // Inform the user and abort the operation.
        toast.error('Failed to persist NFT to your account — no persisted land available. Please try again or contact support.');
        return;
      } else {
        toast.error('No available NFTs to add.');
      }
    }
  };

  const totalYield = landSlots.reduce((sum, nft) => sum + (nft?.daily_yield || nft?.dailyYield || 0), 0);
  const plantedTrees = landSlots.filter(nft => nft).length;

  if (isLoading || !allNFTs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-gray-600 dark:text-gray-300">Loading NFTs...</span>
      </div>
    );
  }

    return (
      <DashboardErrorBoundary>
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              TreeFi Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your trees, claim rewards, and grow your collection
            </p>
          </div>
          <SeasonBadge />
        </div>
      </motion.div>

      {/* Player Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-[#0F5F3A] to-[#166C47] dark:from-[#166C47] dark:to-[#22C55E] text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm opacity-90">
                  {wallet.isConnected ? 'Connected Wallet' : 'Demo Wallet (Connect for real data)'}
                </p>
                <p className="text-lg font-mono font-bold">
                  {displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-90">Total Trees</p>
                <p className="text-2xl font-bold">{landSlots.filter(t => t).length}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Planted</p>
                <p className="text-2xl font-bold">{plantedTrees}/9</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Daily Yield</p>
                <p className="text-2xl font-bold">{totalYield} TF</p>
              </div>
              <div>
                <p className="text-sm opacity-90">TF Balance</p>
                <p className="text-2xl font-bold">{tfBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Land Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          {(transferInProgress || verifyingTx) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Alert className="border-[#0F5F3A] dark:border-[#22C55E] bg-[#0F5F3A]/5 dark:bg-[#22C55E]/5">
                <AlertDescription className="text-gray-900 dark:text-white">
                  {transferInProgress ? (
                    'Waiting for transaction signature in wallet...'
                  ) : (
                    'Verifying transaction on-chain...'
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <TreePine className="w-5 h-5 text-[#0F5F3A] dark:text-[#22C55E]" />
                Land Overview (9 Slots)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LandSlots trees={landSlots} onSlotClick={handleSlotClick} onStartFarming={handleStartFarming} onRemoveTree={async (slotIndex:number) => {
                    if (!currentLandId) {
                      // No persisted land — do not modify local state. Require server persistence for removals.
                      toast.error('Cannot remove tree: no persisted land found for your account.');
                      return;
                    }
                    try {
                      const res = await updateSlot({ slotIndex, nftId: null });
                      const persistedNftId = res?.slot?.nftId ?? null;
                      if (persistedNftId !== null) {
                        toast.error('Failed to remove tree from DB');
                        return;
                      }
                      // Update local UI and refresh server data
                      setLandSlots(prev => prev.map((s,i) => i===slotIndex? undefined: s));
                      try { await refetchLands(); } catch (e) { /* ignore */ }
                      try { await refetchLandDetails(); } catch (e) { /* ignore */ }
                      toast.success('Tree removed from slot');
                    } catch (e) {
                      console.error('failed to remove slot', e);
                      toast.error('Failed to remove tree');
                    }
                  }} transferInProgress={transferInProgress} transferAction={transferAction} verifyingTx={verifyingTx} inventory={inventory} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Token Balances */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Coins className="w-5 h-5 text-[#E2B13C] dark:text-[#FCD34D]" />
                  Token Balances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0F5F3A] dark:bg-[#22C55E] flex items-center justify-center text-white text-xs font-bold">
                      TF
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">TreeFi Token</span>
                  </div>
                  <span className="font-bold text-[#0F5F3A] dark:text-[#22C55E]">
                    {tfBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E2B13C] dark:bg-[#FCD34D] flex items-center justify-center text-white text-xs font-bold">
                      BNB
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">BNB</span>
                  </div>
                  <span className="font-bold text-[#E2B13C] dark:text-[#FCD34D]">
                    {bnbBalance.toFixed(4)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Items Inventory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <ShoppingBag className="w-5 h-5 text-[#3B82F6] dark:text-[#60A5FA]" />
                  Items Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-[#3B82F6] dark:text-[#60A5FA]" />
                    <span className="text-sm text-gray-900 dark:text-white">Water</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{inventory.water}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-[#22C55E] dark:text-[#4ADE80]" />
                    <span className="text-sm text-gray-900 dark:text-white">Fertilizer</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{inventory.fertilizer}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-[#EF4444] dark:text-[#F87171]" />
                    <span className="text-sm text-gray-900 dark:text-white">Anti-Bug</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{inventory.antiBug}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                className="h-auto py-4 flex-col gap-2 bg-[#0F5F3A] hover:bg-[#166C47] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white"
                onClick={() => window.location.href = '/shop'}
              >
                <ShoppingBag className="w-6 h-6" />
                <span>Buy Bundles</span>
              </Button>
              <Button
                className="h-auto py-4 flex-col gap-2 bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white"
                onClick={() => window.location.href = '/claim'}
              >
                <Coins className="w-6 h-6" />
                <span>Claim TF</span>
              </Button>
              <Button
                className="h-auto py-4 flex-col gap-2 bg-[#A855F7] hover:bg-[#9333EA] dark:bg-[#C084FC] dark:hover:bg-[#A855F7] text-white"
                onClick={() => window.location.href = '/fusion'}
              >
                <Zap className="w-6 h-6" />
                <span>Fusion</span>
              </Button>
              <Button
                className="h-auto py-4 flex-col gap-2 bg-[#E2B13C] hover:bg-[#D4A02C] dark:bg-[#FCD34D] dark:hover:bg-[#FDE047] text-gray-900"
                onClick={() => toast.info('Gift code redemption coming soon!')}
              >
                <Gift className="w-6 h-6" />
                <span>Redeem Code</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </DashboardErrorBoundary>
  );
}
