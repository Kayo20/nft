import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useItems } from '@/hooks/useItems';
import { useNFTs } from '@/hooks/useNFTs';
import { openChest } from '@/lib/api';
import { redeemGiftCode } from '@/lib/api';
import { ItemCard } from '@/components/shop/ItemCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { ITEMS, CHEST_PRICE, TF_TOKEN_CONTRACT, GAME_WALLET, TRANSACTION_FEE_TF, BUY_TF_LINK } from '@/lib/constants';
import { useUserBalances } from '@/hooks/useUserBalances';
import { transferERC20 } from '@/lib/web3';
import { ShoppingBag, Coins, Info, Gift, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Shop() {
  const { wallet } = useWallet();
  const demoAddress = wallet.address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const { inventory, isLoading, purchaseItem, refetch } = useItems(demoAddress);
  const { refetch: refetchNFTs } = useNFTs(demoAddress);
  const { tfBalance, tfBalanceSource } = useUserBalances(wallet.address);
  const chestTotal = CHEST_PRICE + TRANSACTION_FEE_TF;
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [showChestDialog, setShowChestDialog] = useState(false);
  const [openingChest, setOpeningChest] = useState(false);
  const [transferInProgress, setTransferInProgress] = useState(false);
  const [transferAction, setTransferAction] = useState<string | null>(null);
  const [verifyingTx, setVerifyingTx] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<any | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);

  const handlePurchase = async (itemId: string) => {
    setPurchasingItem(itemId);
    
    try {
      // Ensure item exists and calculate total cost
      const item = ITEMS.find(i => i.id === itemId);
      const qty = 1;
      if (!item) throw new Error('Item not found');

      const total = Number(item.cost) * qty;
      const expectedTotal = total + TRANSACTION_FEE_TF;

      // Ensure user has enough TF
      if (Number(tfBalance) < expectedTotal) {
        toast.error(`Insufficient TF balance: need ${expectedTotal.toLocaleString()} TF to purchase this item`);
        setPurchasingItem(null);
        return;
      }

      // Prompt user to sign the TF transfer to the game wallet (item total + transaction fee)
      setTransferInProgress(true);
      setTransferAction('purchase');
      toast('Please confirm the TF transfer (including transaction fee) in your wallet...', { duration: 4000 });
      const receipt = await transferERC20(TF_TOKEN_CONTRACT, GAME_WALLET, String(expectedTotal));
      const txHash = (receipt && (receipt.transactionHash || (receipt as any).hash)) || undefined;

      setTransferInProgress(false);
      setVerifyingTx(true);
      try {
        const success = await purchaseItem(itemId, qty, txHash);
        setVerifyingTx(false);
        if (success) {
          toast.success('Purchase successful!', {
            description: 'Item has been added to your inventory',
          });
        } else {
          toast.error('Purchase failed', {
            description: 'Please try again',
          });
        }
      } catch (err: any) {
        setVerifyingTx(false);
        toast.error('Purchase failed', { description: err?.message || String(err) });
      }
    } catch (error: any) {
      setTransferInProgress(false);
      setVerifyingTx(false);
      toast.error('Transaction failed', { description: error?.message || String(error) });
    } finally {
      setPurchasingItem(null);
    }
  };

  const handleOpenChest = async () => {
    setOpeningChest(true);
    try {
      // Transfer TF to game wallet for chest purchase (price + tx fee)
      setTransferInProgress(true);
      setTransferAction('chest');
      toast('Please confirm the TF transfer for chest (including transaction fee) in your wallet...', { duration: 4000 });
      const expected = chestTotal;
      let txHash: string | undefined = undefined;

      try {
        const receipt = await transferERC20(TF_TOKEN_CONTRACT, GAME_WALLET, String(expected));
        txHash = (receipt && (receipt.transactionHash || (receipt as any).hash)) || undefined;
      } catch (txErr: any) {
        // Show detailed revert reason if available and keep dialog open so user may redeem a code
        const rawMsg = txErr?.reason || txErr?.error?.message || txErr?.message || String(txErr);
        const m = String(rawMsg).match(/reverted: ?"([^"]+)"/i);
        const reason = m ? m[1] : rawMsg;
        toast.error('Failed to open a chest', { description: reason });
        setTransferInProgress(false);
        setOpeningChest(false);
        // Do not close the chest dialog so user can redeem gift code
        return;
      }

      setTransferInProgress(false);
      setVerifyingTx(true);

      try {
        const result = await openChest('standard', txHash);
        setVerifyingTx(false);
        if (result && result.nft) {
          toast.success('Chest opened!', { description: `You received a ${result.nft.rarity} tree` });
          // refetch NFTs and inventory
          refetchNFTs();
          refetch();
          setShowChestDialog(false); // only close on success
        } else {
          toast.error('Chest open failed');
        }
      } catch (err: any) {
        setVerifyingTx(false);
        const rawMsg = err?.reason || err?.error?.message || err?.message || String(err);
        const m = String(rawMsg).match(/reverted: ?"([^"]+)"/i);
        const reason = m ? m[1] : rawMsg;
        toast.error('Failed to open a chest', { description: reason });
        // Keep dialog open so user can redeem OG code or retry
      }
    } catch (error: any) {
      setTransferInProgress(false);
      setVerifyingTx(false);
      toast.error('Failed to open chest', { description: error?.message || String(error) });
    } finally {
      setOpeningChest(false);
    }
  };

  const handleRedeemGiftCode = async () => {
    if (!giftCode.trim()) {
      toast.error('Please enter a gift code');
      return;
    }

    setValidatingCode(true);
    try {
      const result = await redeemGiftCode(giftCode.trim());
      if (result.success && result.tree) {
        toast.success('Gift code redeemed!', { description: `You received a free ${result.tree.rarity} tree` });
        setGiftCode('');
        refetchNFTs();
        setShowChestDialog(false);
      } else {
        toast.error('Redemption failed', { description: result.message });
      }
    } catch (error) {
      toast.error('Failed to redeem gift code');
    } finally {
      setValidatingCode(false);
    }
  };

  const runTransferDiagnostic = async () => {
    setDiagLoading(true);
    setDiagError(null);
    try {
      const res = await (await import('@/lib/api')).checkTfTransfer();
      setDiagResult(res);
    } catch (err: any) {
      setDiagError(err?.message || String(err));
      setDiagResult(null);
    } finally {
      setDiagLoading(false);
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
            <div className="text-4xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">{Number(tfBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} TF</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Source: {tfBalanceSource} • <a href={BUY_TF_LINK} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#0F5F3A] dark:text-[#22C55E]">Buy TF</a></p>
          </CardContent>
        </Card>
      </motion.div>

        {/* Transfer / Verification Status */}
        {(transferInProgress || verifyingTx) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Alert className="border-[#0F5F3A] dark:border-[#22C55E] bg-[#0F5F3A]/5 dark:bg-[#22C55E]/5">
              <AlertDescription className="text-gray-900 dark:text-white">
                {transferInProgress ? (
                  transferAction === 'chest' ? 'Waiting for chest payment signature in wallet...' : 'Waiting for purchase signature in wallet...'
                ) : (
                  'Verifying transaction on-chain...'
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

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
                <p className="text-3xl font-bold text-[#0F5F3A] dark:text-[#22C55E] mb-1">{CHEST_PRICE.toLocaleString()} TF</p>
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
              <img src="/chest.png" alt="Chest" className="w-24 h-24 mx-auto mb-4 object-contain" />
              <p className="text-lg text-gray-900 dark:text-white mb-2">Cost: {CHEST_PRICE.toLocaleString()} TF</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chests contain only <strong>Uncommon</strong> trees. Higher rarities (Rare, Epic, Legendary) are obtainable only via Fusion (3× same rarity → next rarity).
              </p>
            </div>

            {/* Gift Code Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Have a gift code? Claim a free tree!</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter gift code (e.g., OG-TREE-00001-XXXX)"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value)}
                  disabled={validatingCode}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
                <Button
                  onClick={handleRedeemGiftCode}
                  disabled={validatingCode || !giftCode.trim()}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                >
                  {validatingCode ? 'Validating...' : 'Redeem'}
                </Button>
              </div>

              {/* Transfer diagnostic */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Having trouble with token transfers? Run a transfer diagnostic to check common restrictions.</p>
                <div className="flex items-center gap-2">
                  <Button onClick={runTransferDiagnostic} disabled={diagLoading} className="bg-[#0F5F3A] dark:bg-[#22C55E] text-white">
                    {diagLoading ? 'Checking...' : 'Run Transfer Diagnostic'}
                  </Button>
                  {diagResult && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 ml-3">
                      {diagResult.checks?.paused ? <div>Token contract is <strong>paused</strong></div> : null}
                      {diagResult.checks?.userBlacklisted ? <div>Your wallet is <strong>restricted/blacklisted</strong></div> : null}
                      {diagResult.checks?.gameBlacklisted ? <div>Game wallet is <strong>restricted/blacklisted</strong></div> : null}
                      {!diagResult.checks?.paused && !diagResult.checks?.userBlacklisted && !diagResult.checks?.gameBlacklisted && <div>No obvious transfer restrictions detected.</div>}
                    </div>
                  )}
                  {diagError && <div className="text-sm text-red-500 ml-3">{diagError}</div>}
                </div>
              </div>
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

