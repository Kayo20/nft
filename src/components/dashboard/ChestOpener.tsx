import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Sparkles } from 'lucide-react';
import { openChest } from '@/lib/api';
import { NFTTree } from '@/types';
import { Badge } from '@/components/ui/badge';
import { RARITY_COLORS } from '@/lib/constants';
import { toast } from 'sonner';

export const ChestOpener = () => {
  const [giftCode, setGiftCode] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [newTree, setNewTree] = useState<NFTTree | null>(null);

  const handleOpenChest = async (useGiftCode: boolean = false) => {
    setIsOpening(true);
    try {
      const result = await openChest(useGiftCode ? giftCode : undefined);
      if (result.success && result.tree) {
        setNewTree(result.tree);
        setShowResult(true);
        if (useGiftCode) {
          setGiftCode('');
        }
      }
    } catch (error) {
      toast.error('Failed to open chest');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <>
      <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Package className="w-5 h-5 text-[#C43B3B] dark:text-[#EF4444]" />
            NFT Chest Opener
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter gift code..."
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value)}
              className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            />
            <Button
              onClick={() => handleOpenChest(true)}
              disabled={!giftCode || isOpening}
              className="bg-[#C43B3B] hover:bg-[#A83232] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white"
            >
              Redeem
            </Button>
          </div>
          <Button
            onClick={() => handleOpenChest(false)}
            disabled={isOpening}
            className="w-full bg-[#0F5F3A] hover:bg-[#166C47] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isOpening ? 'Opening...' : 'Open Chest (10 USDT)'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-gray-900 dark:text-white">
              🎉 Congratulations!
            </DialogTitle>
          </DialogHeader>
          {newTree && (
            <div className="text-center space-y-4 py-4">
              <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden">
                <img src={newTree.image} alt="New Tree" className="w-full h-full object-cover" />
              </div>
              <Badge
                className="text-lg px-4 py-1"
                style={{ backgroundColor: RARITY_COLORS[newTree.rarity], color: 'white' }}
              >
                {newTree.rarity}
              </Badge>
              <p className="text-gray-600 dark:text-gray-400">
                Daily Yield: <span className="font-bold text-[#0F5F3A] dark:text-[#22C55E]">{newTree.dailyYield} TF</span>
              </p>
              <Button
                onClick={() => setShowResult(false)}
                className="w-full bg-[#0F5F3A] hover:bg-[#166C47] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white"
              >
                Awesome!
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};