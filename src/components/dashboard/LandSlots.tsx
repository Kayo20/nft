import { Card, CardContent } from '@/components/ui/card';
import { TreePine, Plus, Droplet, Leaf, Bug } from 'lucide-react';
import { NFTTree } from '@/types';
import { Badge } from '@/components/ui/badge';
import { RARITY_COLORS } from '@/lib/constants';
import { isFarmingActive, getTimeUntilFarmingStops } from '@/lib/farmingHelper';
import { useEffect, useState } from 'react';
  onSlotClick: (slotIndex: number) => void;
  onAddTree?: (slotIndex: number) => void;
  slots?: number; // default 9
  className?: string;
}

export const LandSlots = ({ trees, onSlotClick, onAddTree, onStartFarming, transferInProgress = false, transferAction = null, verifyingTx = false, slots = 9, className = '' }: LandSlotsProps) => {
  // Track selected items per slot
  const [selectedMap, setSelectedMap] = useState<Record<number, Set<'water'|'fertilizer'|'antiBug'>>>({});

  useEffect(() => {
    // Clear selections for slots that lost their tree
    setSelectedMap(prev => {
      const next: Record<number, Set<'water'|'fertilizer'|'antiBug'>> = {};
      for (let i = 0; i < slots; i++) {
        if (trees[i]) {
          next[i] = prev[i] || new Set();
        }
      }
      return next;
    });
  }, [trees, slots]);

  const toggleSelectItem = (slotIndex: number, item: 'water'|'fertilizer'|'antiBug') => {
    setSelectedMap(prev => {
      const copy = { ...prev };
      const set = new Set(copy[slotIndex] || []);
      if (set.has(item)) set.delete(item); else set.add(item);
      copy[slotIndex] = set;
      return copy;
    });
  };

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Use the trees array directly as slots (should be length = slots)
  const slotArr = Array.from({ length: slots }, (_, i) => trees[i]);

  return (
    <div className="relative">
      {/* Festive Land Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB]/20 via-[#90EE90]/10 to-[#8B4513]/20 dark:from-[#1E3A8A]/20 dark:via-[#166534]/10 dark:to-[#78350F]/20 rounded-lg" />
      
      {/* Snow effect on land */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0ic25vdyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSI1IiBjeT0iNSIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPjxjaXJjbGUgY3g9IjI1IiBjeT0iMTUiIHI9IjEuNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMiIvPjxjaXJjbGUgY3g9IjE1IiBjeT0iMzAiIHI9IjEiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjI1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3Nub3cpIi8+PC9zdmc+')] opacity-30" />
      
      <div className={`relative grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 p-4 ${className}`}>
        {slotArr.map((tree, index) => {
          const selected = Array.from(selectedMap[index] || []);
          const farmingState: any = (tree as any)?.farmingState;
          const activeItems = farmingState?.active_items || [];
          const isActive = farmingState ? isFarmingActive(activeItems.map((a: any) => ({ itemId: a.itemId, expiresAt: a.expiresAt })), Date.now()) : false;
          const timeLeft = farmingState ? getTimeUntilFarmingStops(activeItems.map((a: any) => ({ itemId: a.itemId, expiresAt: a.expiresAt })), Date.now()) : 0;
          return (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-all border-2 border-gray-200 dark:border-gray-700 hover:border-[#0F5F3A] dark:hover:border-[#22C55E] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            onClick={() => onSlotClick(index)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center min-h-[200px]">
                {tree ? (
                  <>
                    <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 mb-3 rounded-lg overflow-hidden shadow-md relative">
                      {(() => {
                        const candidate = tree && ((tree as any).image_url_resolved || tree.image || tree.image_url || (tree.metadata && tree.metadata.image));
                        const imgSrc = (candidate && String(candidate).trim()) ? String(candidate) : null;
                        if (imgSrc) {
                          return (
                            <img
                              src={imgSrc}
                              alt={`Tree ${tree ? tree.id : 'empty'}`}
                              className="w-full h-full object-contain"
                              style={{ background: 'none', display: 'block' }}
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          );
                        }
                        // No image available — render an empty container to preserve layout
                        return <div className="w-full h-full" aria-hidden />;
                      })()}

                      {/* Active/Not Active badge */}
                      <div className="absolute top-2 left-2">
                        {isActive ? (
                          <Badge className="bg-green-600 text-white text-xs">Active • {formatTimeLeft(timeLeft)}</Badge>
                        ) : (
                          <Badge className="bg-gray-400 text-white text-xs">Not active</Badge>
                        )}
                      </div>
                    </div>
                  <Badge
                    className="text-xs mb-1"
                    style={{ backgroundColor: RARITY_COLORS[(tree.rarity || tree.metadata?.rarity || '').toLowerCase()] || '#999', color: 'white' }}
                  >
                    {tree.rarity}
                  </Badge>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Power {tree.power}</p>
                  {/* Selected item indicators + Start Farming button */}
                  <div className="flex gap-2 mt-3 items-center">
                    {(['water','fertilizer','antiBug'] as const).map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={e => { e.stopPropagation(); toggleSelectItem(index, item); }}
                        className={`p-1 rounded ${selected.includes(item) ? 'ring-2 ring-offset-1 ring-green-400 bg-green-50 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'} transition min-w-[36px] min-h-[28px] flex items-center justify-center`}
                        title={`Toggle ${item}`}
                      >
                        {item === 'water' && <Droplet className="w-4 h-4 text-blue-500" />}
                        {item === 'fertilizer' && <Leaf className="w-4 h-4 text-green-600" />}
                        {item === 'antiBug' && <Bug className="w-4 h-4 text-yellow-600" />}
                      </button>
                    ))}

                    <div className="ml-2">
                      <button
                        type="button"
                        disabled={!(['water','fertilizer','antiBug'].every(i => selected.includes(i))) || isActive }
                        onClick={async (e) => { e.stopPropagation(); if (onStartFarming) await onStartFarming(index, selected as any); }}
                        className={`px-3 py-1 rounded ${(['water','fertilizer','antiBug'].every(i => selected.includes(i)) && !isActive) ? 'bg-[#0F5F3A] text-white hover:bg-[#166C47]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                      >
                        Start Farming
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="w-16 h-16 mb-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:bg-green-100 dark:hover:bg-green-900 transition-all focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      if (onAddTree) onAddTree(index);
                      else onSlotClick(index);
                    }}
                  >
                    <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Add Tree</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Festive decorations */}
      <div className="absolute top-2 left-2 text-2xl opacity-50">🎄</div>
      <div className="absolute top-2 right-2 text-2xl opacity-50">⛄</div>
      <div className="absolute bottom-2 left-2 text-2xl opacity-50">🎁</div>
      <div className="absolute bottom-2 right-2 text-2xl opacity-50">❄️</div>
    </div>
  );
};