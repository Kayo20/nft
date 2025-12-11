import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useNFTs } from '@/hooks/useNFTs';
import { useItems } from '@/hooks/useItems';
import { useUserLands, useLandDetails } from '@/hooks/useUserLands';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandSlots } from '@/components/dashboard/LandSlots';
import { SeasonBadge } from '@/components/dashboard/SeasonBadge';
import { motion } from 'framer-motion';
import {
  TreePine,
  Coins,
  Wallet,
  ShoppingBag,
  Zap,
  Package,
} from 'lucide-react';
import { ITEMS } from '@/lib/constants';
import { toast } from 'sonner';

export default function Inventory() {
  const { wallet } = useWallet();
  const demoAddress = wallet.address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const { nfts, isLoading } = useNFTs(demoAddress);
  const { inventory } = useItems(demoAddress);
  
  // Fetch lands from backend
  const { lands = [], isLoading: landsLoading } = useUserLands(demoAddress);
  const [currentLand, setCurrentLand] = useState(0);
  
  // Fetch details for current land
  const currentLandId = lands.length > 0 ? lands[currentLand]?.id : null;
  const { landData } = useLandDetails(currentLandId, landsLoading || lands.length === 0);

  const handleSlotClick = (slotIndex: number) => {
    toast.info(`Slot ${slotIndex + 1} clicked`);
  };

  const handleAddItems = () => {
    toast.success('Items added to all trees!', {
      description: 'Your trees will produce for the next 4 hours',
    });
  };

  // Get current land data - use real data from backend if available
  const currentLandData = landData || (lands.length > 0 ? lands[currentLand] : null);
  const landSlotCount = currentLandData?.slots || 9; // Default to 9 if not available
  
  // Initialize landSlots from backend slot data, or empty if no data
  const [landSlots] = useState(() => {
    if (currentLandData?.slot_data && Array.isArray(currentLandData.slot_data)) {
      return currentLandData.slot_data;
    }
    return Array(landSlotCount).fill(null);
  });

  const handleAddTree = (slotIndex: number) => {
    toast.info(`Adding tree to slot ${slotIndex + 1}...`);
    // In a real implementation, this would call the backend to update the slot
  };

  const totalYield = nfts.reduce((sum, nft) => sum + nft.dailyYield, 0);
  const plantedTrees = landSlots.filter(slot => slot !== null).length;
  const totalPower = nfts.reduce((sum, nft) => sum + nft.power, 0);
  const displayAddress = wallet.address || demoAddress;

  return (
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
              Inventory
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your items, trees, land, and balance
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
                <p className="text-2xl font-bold">{nfts.length}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Planted</p>
                <p className="text-2xl font-bold">{plantedTrees}/9</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Total Power</p>
                <p className="text-2xl font-bold">{totalPower}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Daily Yield</p>
                <p className="text-2xl font-bold">{totalYield} TF</p>
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
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <TreePine className="w-5 h-5 text-[#0F5F3A] dark:text-[#22C55E]" />
                  {currentLandData?.name || `Land ${currentLand + 1}`} ({landSlotCount} Slots)
                </CardTitle>
                <Button
                  onClick={handleAddItems}
                  className="bg-[#0F5F3A] hover:bg-[#166C47] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Add Items
                </Button>
              </div>
              {/* Land page navigation */}
              <div className="flex justify-center gap-2 mt-4">
                {lands.map((land, idx) => (
                  <button
                    key={land.id}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                      idx === currentLand
                        ? 'bg-[#0F5F3A] text-white border-[#0F5F3A] dark:bg-[#22C55E] dark:border-[#22C55E]'
                        : 'bg-white text-[#0F5F3A] border-gray-300 dark:bg-gray-900 dark:text-[#22C55E] dark:border-gray-700'
                    }`}
                    onClick={() => setCurrentLand(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
                {lands.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading lands...</p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                <div className="min-w-[320px] max-w-full mx-auto">
                  <LandSlots
                    trees={landSlots}
                    onSlotClick={handleSlotClick}
                    onAddTree={handleAddTree}
                    slots={landSlotCount}
                    className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center">
                Add items every 4 hours to keep your trees producing
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Token Balances */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
                    <div className="w-8 h-8 rounded-full bg-[#8247E5] dark:bg-[#A855F7] flex items-center justify-center text-white text-xs font-bold">
                      M
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">MATIC</span>
                  </div>
                  <span className="font-bold text-[#8247E5] dark:text-[#A855F7]">
                    {maticBalance.toFixed(4)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Items Inventory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <ShoppingBag className="w-5 h-5 text-[#3B82F6] dark:text-[#60A5FA]" />
                  Items Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {['water', 'fertilizer', 'antiBug'].map((key) => {
                  const item = ITEMS.find(i => i.id === key) || ITEMS.find(i => i.id.toLowerCase() === key);
                  const count = key === 'water' ? inventory.water : key === 'fertilizer' ? inventory.fertilizer : inventory.antiBug;

                  return (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-3">
                        {item?.image ? (
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded" />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-xl">{item?.icon}</div>
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">{item?.name || key}</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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
                <span>Buy Items</span>
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
                onClick={() => window.location.href = '/profile'}
              >
                <Wallet className="w-6 h-6" />
                <span>Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}