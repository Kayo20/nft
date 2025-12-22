import { NFTTree } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RARITY_COLORS, ITEM_CONSUMPTION_INTERVAL } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Droplets, Leaf, Bug, Zap } from 'lucide-react';

interface TreeCardProps {
  tree: NFTTree;
  onClick?: () => void;
  selected?: boolean;
}

export const TreeCard = ({ tree, onClick, selected }: TreeCardProps) => {
  const rarityColor = RARITY_COLORS[tree.rarity];
  const now = Date.now();
  const PLACEHOLDER = new URL('../../assets/images/trees/placeholder-tree.svg', import.meta.url).href;
  
  const needsWater = now - tree.lastWatered > ITEM_CONSUMPTION_INTERVAL;
  const needsFertilizer = now - tree.lastFertilized > ITEM_CONSUMPTION_INTERVAL;
  const needsBugTreatment = now - tree.lastBugTreated > ITEM_CONSUMPTION_INTERVAL;

  // Defensive image source: use placeholder when tree.image is falsy or blank
  const imgSrc = (tree.image && String(tree.image).trim()) ? String(tree.image) : PLACEHOLDER;
  if (!tree.image || !String(tree.image).trim()) {
    // Helpful debug output when an image is missing — include resolved metadata where available
    // eslint-disable-next-line no-console
    console.warn(`TreeCard: missing image for tree #${tree.id}, using placeholder`, { id: tree.id, image: tree.image, image_url: (tree as any).image_url, image_url_resolved: (tree as any).image_url_resolved, metadata: (tree as any).metadata });
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        className={`cursor-pointer transition-all ${
          selected
            ? 'ring-2 ring-[#0F5F3A] dark:ring-[#22C55E] shadow-lg'
            : 'hover:shadow-md'
        } ${tree.rarity === 'Legendary' ? 'animate-pulse' : ''} bg-white dark:bg-gray-900`}
        onClick={onClick}
        style={{
          borderColor: rarityColor,
          borderWidth: 2,
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <Badge
                style={{ backgroundColor: rarityColor }}
                className="text-white mb-2"
              >
                {tree.rarity}
              </Badge>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tree #{tree.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 dark:text-gray-400">Level</p>
              <p className="text-lg font-bold text-[#0F5F3A] dark:text-[#22C55E]">{tree.level}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Tree Image */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-[#0F5F3A]/10 to-[#166C47]/10">
            <img
              src={imgSrc}
              alt={`Tree ${tree.id}`}
              data-original-src={tree.image || ''}
              className="w-full h-full object-contain"
              style={{ display: 'block', background: 'none' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
            />
            {tree.rarity === 'Legendary' && (
              <div className="absolute inset-0 bg-gradient-to-t from-[#E2B13C]/30 to-transparent animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Zap className="w-4 h-4" />
                Power
              </span>
              <span className="font-semibold text-[#0F5F3A] dark:text-[#22C55E]">{tree.power}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Health</span>
                <span className="font-medium text-gray-900 dark:text-white">{tree.health}%</span>
              </div>
              <Progress value={tree.health} className="h-2" />
            </div>
          </div>

          {/* Item Status */}
          <div className="flex gap-2 pt-2 border-t border-[#166C47]/20 dark:border-[#22C55E]/20">
            <div
              className={`flex-1 flex items-center justify-center gap-1 p-2 rounded ${
                needsWater ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              }`}
            >
              <Droplets className="w-3 h-3" />
              <span className="text-xs font-medium">{needsWater ? 'Need' : 'OK'}</span>
            </div>
            <div
              className={`flex-1 flex items-center justify-center gap-1 p-2 rounded ${
                needsFertilizer ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              }`}
            >
              <Leaf className="w-3 h-3" />
              <span className="text-xs font-medium">{needsFertilizer ? 'Need' : 'OK'}</span>
            </div>
            <div
              className={`flex-1 flex items-center justify-center gap-1 p-2 rounded ${
                needsBugTreatment ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              }`}
            >
              <Bug className="w-3 h-3" />
              <span className="text-xs font-medium">{needsBugTreatment ? 'Need' : 'OK'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};