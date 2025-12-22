import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useNFTs } from '@/hooks/useNFTs';
import { NFTTree } from '@/types';
import { FusionSelector } from '@/components/fusion/FusionSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { fuseNFTs } from '@/lib/api';
import { FUSION_COST, RARITY_ORDER, TF_TOKEN_CONTRACT, GAME_WALLET, TRANSACTION_FEE_TF } from '@/lib/constants';
import { transferERC20 } from '@/lib/web3';
import { Zap, ArrowRight, Sparkles, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Fusion() {
  const { wallet } = useWallet();
  const demoAddress = wallet.address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const { nfts, refetch } = useNFTs(demoAddress);
  // slot-based selection: 3 fixed slots, null when empty
  const [selectedSlots, setSelectedSlots] = useState<Array<NFTTree | null>>([null, null, null]);
  const selectedTrees = selectedSlots.filter(Boolean) as NFTTree[];
  const [chooserIndex, setChooserIndex] = useState<number | null>(null);
  const [isFusing, setIsFusing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fusionResult, setFusionResult] = useState<NFTTree | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [transferInProgress, setTransferInProgress] = useState(false);
  const [verifyingTx, setVerifyingTx] = useState(false);

  const handleSelectTree = (tree: NFTTree) => {
    // toggle selection: if already selected, remove it; otherwise put in first empty slot
    const existsIndex = selectedSlots.findIndex(s => s?.id === tree.id);
    if (existsIndex !== -1) {
      const copy = [...selectedSlots];
      copy[existsIndex] = null;
      setSelectedSlots(copy);
      return;
    }

    // enforce rarity consistency with existing filled slots
    const filled = selectedSlots.filter(Boolean) as NFTTree[];
    if (filled.length > 0 && filled[0].rarity !== tree.rarity) {
      toast.error('Rarity mismatch', {
        description: 'You can only fuse trees of the same rarity',
      });
      return;
    }

    const firstEmpty = selectedSlots.findIndex(s => s === null);
    if (firstEmpty === -1) {
      toast.error('Maximum reached', {
        description: 'You can only select 3 trees for fusion',
      });
      return;
    }

    const copy = [...selectedSlots];
    copy[firstEmpty] = tree;
    setSelectedSlots(copy);
  };

  const assignTreeToSlot = (tree: NFTTree, index: number) => {
    // prevent duplicates
    if (selectedSlots.some(s => s?.id === tree.id)) {
      toast.error('Already selected', { description: 'This tree is already chosen' });
      return;
    }
    const filled = selectedSlots.filter(Boolean) as NFTTree[];
    if (filled.length > 0 && filled[0].rarity !== tree.rarity) {
      toast.error('Rarity mismatch', { description: 'You can only fuse trees of the same rarity' });
      return;
    }
    const copy = [...selectedSlots];
    copy[index] = tree;
    setSelectedSlots(copy);
    setChooserIndex(null);
  };

  const filledCount = selectedTrees.length;
  const canFuse = filledCount === 3 && selectedTrees.every(t => t.rarity === selectedTrees[0].rarity) && selectedTrees[0].rarity !== 'Legendary';

  const fusionCost = filledCount > 0 ? FUSION_COST[selectedTrees[0].rarity] : 0;
  const resultRarity = filledCount > 0 ? RARITY_ORDER[RARITY_ORDER.indexOf(selectedTrees[0].rarity) + 1] : null;

  const handleFusion = async () => {
    setShowConfirmDialog(false);
    setIsFusing(true);

    try {
      // Transfer TF for fusion cost + transaction fee
      if (!fusionCost) throw new Error('Invalid fusion cost');
      setTransferInProgress(true);
      toast('Please confirm the TF transfer for fusion (including transaction fee) in your wallet...', { duration: 4000 });
      const expected = fusionCost + (await import('@/lib/constants')).TRANSACTION_FEE_TF;
      const receipt = await transferERC20(TF_TOKEN_CONTRACT, GAME_WALLET, String(expected));
      const txHash = (receipt && (receipt.transactionHash || (receipt as any).hash)) || undefined;

      setTransferInProgress(false);
      setVerifyingTx(true);
      const result = await fuseNFTs(selectedTrees.map(t => t.id), txHash);
      setVerifyingTx(false);

      if (result && result.nft) {
        setFusionResult(result.nft);
        setShowResultDialog(true);
        setSelectedSlots([null, null, null]);
        await refetch();
        
        toast.success('Fusion successful!', {
          description: `You created a ${result.newNFT.rarity} tree!`,
        });
      } else {
        toast.error('Fusion failed', {
          description: 'Please try again',
        });
      }
    } catch (error) {
      setTransferInProgress(false);
      setVerifyingTx(false);
      toast.error('Transaction failed', {
        description: 'An error occurred during fusion',
      });
    } finally {
      setIsFusing(false);
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
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Tree Fusion</h1>
        <p className="text-gray-600 dark:text-gray-400">Combine 3 same-rarity trees to create a higher rarity tree</p>
      </motion.div>

      {/* Fusion Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#E2B13C] dark:text-[#FCD34D]" />
              Fusion Chamber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Selected Trees */}
              <div className="flex-1 w-full">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Selected Trees ({selectedTrees.length}/3)</p>
                <div className="grid grid-cols-3 gap-4 items-center justify-center">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className={`flex items-center justify-center bg-transparent p-2`}>
                      {selectedSlots[index] ? (() => {
                        const PLACEHOLDER = new URL('../assets/images/trees/placeholder-tree.svg', import.meta.url).href;
                      // Prefer resolved image (image_url_resolved) set during NFT enrichment, fall back to other fields
                      const candidate = selectedSlots[index] && (selectedSlots[index]!.image_url_resolved || selectedSlots[index]!.image || selectedSlots[index]!.image_url || (selectedSlots[index]!.metadata && selectedSlots[index]!.metadata.image));
                        const imgSrc = (candidate && String(candidate).trim()) ? String(candidate) : PLACEHOLDER;
                        return (
                          <img
                            src={imgSrc}
                            alt={`Tree ${selectedSlots[index]!.id}`}
                            className="w-36 h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                          />
                        );
                      })() : (
                        <button
                          onClick={() => setChooserIndex(index)}
                          className="flex flex-col items-center justify-center w-36 h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 hover:border-[#0F5F3A] transition-colors"
                          aria-label={`Add tree to slot ${index + 1}`}
                        >
                          <Plus className="w-6 h-6 mb-2" />
                          <span className="text-sm">Add Tree</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <ArrowRight className="w-8 h-8 text-[#0F5F3A] dark:text-[#22C55E]" />
              </div>

              {/* Result Preview */}
              <div className="flex-1 w-full">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Result</p>
                <div className="aspect-square flex flex-col items-center justify-center bg-transparent">
                  {resultRarity ? (
                    <>
                      <Sparkles className="w-16 h-16 text-[#E2B13C] dark:text-[#FCD34D] mb-2" />
                      <p className="text-xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">{resultRarity}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Tree</p>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm text-center">Select 3 trees to preview</span>
                  )}
                </div>
              </div>
            </div>

            {/* Fusion Info */}
            {canFuse && (
              <Alert className="mt-6 border-[#E2B13C] dark:border-[#FCD34D] bg-[#E2B13C]/5 dark:bg-[#FCD34D]/5">
                <Sparkles className="h-4 w-4 text-[#E2B13C] dark:text-[#FCD34D]" />
                <AlertDescription className="text-gray-900 dark:text-white">
                  Fusion Cost: <strong>{fusionCost.toLocaleString()} TF</strong> (+ fee <strong>{TRANSACTION_FEE_TF} TF</strong>) • Result: <strong>{resultRarity} Tree</strong>
                </AlertDescription>
              </Alert>
            )}

            {(transferInProgress || verifyingTx) && (
              <div className="mt-4">
                <Alert className="border-[#E2B13C] dark:border-[#FCD34D] bg-[#E2B13C]/5 dark:bg-[#FCD34D]/5">
                  <AlertDescription className="text-gray-900 dark:text-white">
                    {transferInProgress ? 'Waiting for fusion payment signature in wallet...' : 'Verifying fusion transaction on-chain...'}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setSelectedSlots([null, null, null])}
                variant="outline"
                disabled={selectedTrees.length === 0}
                className="flex-1 border-gray-300 dark:border-gray-700"
              >
                Clear Selection
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!canFuse || isFusing}
                className="flex-1 bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white gap-2"
              >
                <Zap className="w-4 h-4" />
                {isFusing ? 'Fusing...' : 'Start Fusion'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* NFT chooser dialog — opened when user clicks the plus on an empty slot */}
      <Dialog open={chooserIndex !== null} onOpenChange={(open) => { if (!open) setChooserIndex(null); }}>
        <DialogContent className="sm:max-w-3xl bg-white dark:bg-gray-900 max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl p-0">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Select a tree to add</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">Choose one of your NFTs to place into the selected fusion slot.</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-2 sm:px-6">
            {chooserIndex !== null && (
              <FusionSelector
                trees={nfts.map(n => {
                  const candidate = (n as any).image_url_resolved || n.image || (n as any).image_url || (n.metadata && n.metadata.image) || null;
                  return { ...n, image_url_resolved: (n as any).image_url_resolved || (candidate || null), image: n.image || candidate || null } as NFTTree;
                })}
                selectedTrees={selectedTrees}
                onSelectTree={(tree: NFTTree) => assignTreeToSlot(tree, chooserIndex)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChooserIndex(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertTriangle className="w-5 h-5 text-[#C43B3B] dark:text-[#EF4444]" />
              Confirm Fusion
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              This action cannot be undone. Your selected trees will be burned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-600 dark:text-gray-400">Trees to burn</span>
              <span className="font-semibold text-gray-900 dark:text-white">3x {selectedTrees[0]?.rarity}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-600 dark:text-gray-400">Fusion cost</span>
              <span className="font-semibold text-gray-900 dark:text-white">{fusionCost} TF</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#E2B13C]/10 dark:bg-[#FCD34D]/10 rounded-lg">
              <span className="text-xs text-gray-600 dark:text-gray-400">You will receive</span>
              <span className="font-semibold text-[#0F5F3A] dark:text-[#22C55E]">1x {resultRarity}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFusion} className="bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626]">
              Confirm Fusion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-[#E2B13C] dark:text-[#FCD34D]" />
              Fusion Successful!
            </DialogTitle>
          </DialogHeader>
          {fusionResult && (
            <div className="space-y-4 py-4">
              <div className="w-full flex items-center justify-center">
                {(() => {
                  const PLACEHOLDER = new URL('../assets/images/trees/placeholder-tree.svg', import.meta.url).href;
                  const candidate = fusionResult && ((fusionResult as any).image_url_resolved || fusionResult.image || (fusionResult as any).image_url || (fusionResult.metadata && fusionResult.metadata.image));
                  const imgSrc = (candidate && String(candidate).trim()) ? String(candidate) : PLACEHOLDER;
                  return (
                    <img
                      src={imgSrc}
                      alt={`Tree ${fusionResult.id}`}
                      className="w-48 h-48 object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                  );
                })()}
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">{fusionResult.rarity} Tree</p>
                <p className="text-gray-600 dark:text-gray-400">Tree #{fusionResult.id}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Daily Yield: <strong className="text-[#0F5F3A] dark:text-[#22C55E]">{fusionResult.dailyYield} TF</strong>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)} className="w-full bg-[#0F5F3A] hover:bg-[#166C47] dark:bg-[#22C55E] dark:hover:bg-[#16A34A]">
              Awesome!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}