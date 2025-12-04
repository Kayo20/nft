import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useItems } from '@/hooks/useItems';
import { useNFTs } from '@/hooks/useNFTs';
import { openChest } from '@/lib/api';
import { ItemCard } from '@/components/shop/ItemCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { ITEMS } from '@/lib/constants';
import { ShoppingBag, Coins, Info, Gift, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Shop() {
  const { wallet } = useWallet();
  const demoAddress = wallet.address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const { inventory, isLoading, purchaseItem, refetch } = useItems(demoAddress);
  const { refetch: refetchNFTs } = useNFTs(demoAddress);
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [showChestDialog, setShowChestDialog] = useState(false);
  const [openingChest, setOpeningChest] = useState(false);

  const handlePurchase = async (itemId: string) => {
    setPurchasingItem(itemId);
    
    try {
      const success = await purchaseItem(itemId, 1);
      
      if (success) {
        toast.success('Purchase successful!', {
          description: 'Item has been added to your inventory',
        });
      } else {
        toast.error('Purchase failed', {
          description: 'Please try again',
        });
      }
    } catch (error) {
      toast.error('Transaction failed', {
        description: 'An error occurred during purchase',
      });
    } finally {
      setPurchasingItem(null);
    }
  };

  const handleOpenChest = async () => {
    setOpeningChest(true);
    try {
      const result = await openChest('standard');
      if (result && result.nft) {
        toast.success('Chest opened!', { description: `You received a ${result.nft.rarity} tree` });
        // refetch NFTs and inventory
        refetchNFTs();
        refetch();
      } else {
        toast.error('Chest open failed');
      }
      setShowChestDialog(false);
    } catch (error) {
      toast.error('Failed to open chest');
    } finally {
      setOpeningChest(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">TreeFi Shop</h1>
        <p className="text-gray-600 dark:text-gray-400">Purchase items and chests with TF tokens</p>
      </motion.div>

      {/* Info Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Alert className="mb-8 border-[#166C47] dark:border-[#22C55E] bg-[#0F5F3A]/5 dark:bg-[#22C55E]/5">
          <Info className="h-4 w-4 text-[#0F5F3A] dark:text-[#22C55E]" />
          <AlertDescription className="text-gray-900 dark:text-white">
            All purchases use TF tokens to burn supply and stabilize the token for long-term growth. Items are required every 4 hours for optimal tree production.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* TF Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card className="border-2 border-[#E2B13C]/50 dark:border-[#FCD34D]/50 bg-gradient-to-r from-[#E2B13C]/10 to-[#E2B13C]/5 dark:from-[#FCD34D]/10 dark:to-[#FCD34D]/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Your TF Balance</CardTitle>
            <Coins className="w-6 h-6 text-[#E2B13C] dark:text-[#FCD34D]" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">0.00 TF</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Available for purchases</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chest Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">NFT Chests</h2>
        <Card className="border-2 border-[#C43B3B]/50 dark:border-[#EF4444]/50 bg-gradient-to-br from-[#C43B3B]/10 to-[#C43B3B]/5 dark:from-[#EF4444]/10 dark:to-[#EF4444]/5 hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C43B3B] to-[#A83232] dark:from-[#EF4444] dark:to-[#DC2626] flex items-center justify-center text-white text-3xl">
                  🎁
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">Mystery Chest</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Open to mint a random tree NFT</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-[#0F5F3A] dark:text-[#22C55E] mb-1">10 TF</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Per chest</p>
              </div>
              <Button
                onClick={() => setShowChestDialog(true)}
                className="bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white gap-2"
              >
                <Gift className="w-4 h-4" />
                Open Chest
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Items Section */}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Farming Items</h2>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-gray-900">
              <CardHeader>
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-32 mt-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Items Grid */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {ITEMS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <ItemCard
                item={item}
                inventory={inventory[item.id as keyof typeof inventory]}
                onPurchase={handlePurchase}
                isPurchasing={purchasingItem === item.id}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Usage Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-12"
      >
        <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900 dark:text-white">How to Use Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F5F3A] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Purchase Items with TF</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Buy Fertilizer, Water, and Anti Bug items from the shop using TF tokens (burns supply)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F5F3A] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Apply to Trees Every 4 Hours</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Add Items" button on the land overview to apply items to all planted trees
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F5F3A] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Boost Production</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Each item provides production boosts: Fertilizer (+4%), Water (+3%), Anti Bug (+3%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chest Opening Dialog */}
      <Dialog open={showChestDialog} onOpenChange={setShowChestDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-[#E2B13C] dark:text-[#FCD34D]" />
              Open Mystery Chest
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Open a chest to mint a random tree NFT
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-lg text-gray-900 dark:text-white mb-2">Cost: 10 TF</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You have a chance to get Uncommon (50%), Rare (30%), Epic (15%), or Legendary (5%) trees
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChestDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleOpenChest} 
              disabled={openingChest}
              className="bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626]"
            >
              {openingChest ? 'Opening...' : 'Open Chest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}