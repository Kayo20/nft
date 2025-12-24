import { Card, CardContent } from '@/components/ui/card';
import { TreePine, Plus, Droplet, Leaf, Bug } from 'lucide-react';
import { NFTTree } from '@/types';
import { Badge } from '@/components/ui/badge';
import { RARITY_COLORS } from '@/lib/constants';
import { isFarmingActive, getTimeUntilFarmingStops } from '@/lib/farmingHelper';
import { useEffect, useState } from 'react';
import { totalSelectedCounts as tsc, availableFor as availFor, remainingFor as remFor, canStartForSlot as canStart } from './landslotsUtils';

interface LandSlotsProps {
  trees: NFTTree[];
  onSlotClick: (slotIndex: number) => void;
  onAddTree?: (slotIndex: number) => void;
  onRemoveTree?: (slotIndex: number) => void;
  onStartFarming?: (slotIndex: number, itemIds: ('water'|'fertilizer'|'antiBug')[]) => Promise<void>;
  transferInProgress?: boolean;
  transferAction?: string | null;
  verifyingTx?: boolean;
  inventory?: { water?: number; fertilizer?: number; antiBug?: number };
  slots?: number; // default 9
  className?: string;
}


export const LandSlots = ({ trees, onSlotClick, onAddTree, onStartFarming, transferInProgress = false, transferAction = null, verifyingTx = false, inventory = { water: 0, fertilizer: 0, antiBug: 0 }, slots = 9, className = '' }: LandSlotsProps) => {
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

  // Compute how many times each item is selected across all slots to respect inventory
  // Compute how many times each item is selected across all slots to respect inventory
  const totalSelectedCounts = { water: 0, fertilizer: 0, antiBug: 0 } as Record<string, number>;
  Object.values(selectedMap).forEach(set => {
    for (const s of Array.from(set)) {
      totalSelectedCounts[s] = (totalSelectedCounts[s] || 0) + 1;
    }
  });

  const availableFor = (item: 'water'|'fertilizer'|'antiBug', selected: string[]) => {
    const invCount = (inventory && (inventory as any)[item]) || 0;
    const reserved = totalSelectedCounts[item] || 0;
    // If this slot already has it selected, allow (so user can keep/unselect)
    if (selected.includes(item)) return true;
    // Otherwise, only allow if there's at least one available after other reservations
    return (invCount - reserved) > 0;
  };

  const remainingFor = (item: 'water'|'fertilizer'|'antiBug', selected: string[]) => {
    const invCount = (inventory && (inventory as any)[item]) || 0;
    const reserved = totalSelectedCounts[item] || 0;
    const includeSelf = selected.includes(item) ? 1 : 0;
    return Math.max(0, invCount - reserved + includeSelf);
  };

  const canStartForSlot = (selected: string[]) => {
    const required: ('water'|'fertilizer'|'antiBug')[] = ['water','fertilizer','antiBug'];
    if (!required.every(i => selected.includes(i))) return false;
    // ensure each required item has at least 1 available (including this slot)
    return required.every(i => remainingFor(i, selected) >= 1);
  };



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
            <CardContent className="p-3 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px]">
                {tree ? (
                  <>
                    <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-48 lg:h-48 mb-3 rounded-lg overflow-hidden shadow-md relative group">
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
                          <Badge className="bg-green-600 text-white text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-400 text-white text-xs">Not active</Badge>
                        )}
                      </div>

                      {/* Hover overlay showing countdown when active */}
                      {isActive && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-flex flex-col items-center justify-center text-white text-sm">
                          <div className="bg-black/60 px-3 py-1 rounded">Farming ends in</div>
                          <div className="mt-2 font-mono text-lg">{formatTimeLeft(timeLeft)}</div>
                        </div>
                      )}
                    </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className="text-xs"
                      style={{ backgroundColor: RARITY_COLORS[(tree.rarity || tree.metadata?.rarity || '').toLowerCase()] || '#999', color: 'white' }}
                    >
                      {tree.rarity}
                    </Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Power {tree.power}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); if (onRemoveTree) onRemoveTree(index); }}
                      className="ml-auto text-xs px-1 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 transition"
                      title="Remove tree from slot"
                    >
                      Remove
                    </button>
                  </div>
                  {/* Selected item indicators + Start Farming button */}
                  <div className="flex gap-2 mt-3 items-center">
                    {(['water','fertilizer','antiBug'] as const).map(item => {
                      const isSelected = selected.includes(item);
                      const disabled = !availableFor(item, selected);
                      const remaining = remainingFor(item, selected);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={e => { e.stopPropagation(); if (!disabled || isSelected) toggleSelectItem(index, item); }}
                          className={`p-0.5 rounded-md ${isSelected ? 'ring-2 ring-offset-1 ring-green-400 bg-green-50 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'} transition min-w-[28px] min-h-[24px] flex items-center justify-center relative`}
                          title={`Toggle ${item}`}
                          aria-pressed={isSelected}
                          aria-disabled={disabled && !isSelected}
                        >
                          {item === 'water' && <Droplet className={`w-3 h-3 ${disabled && !isSelected ? 'opacity-40' : ''} text-blue-500`} />}
                          {item === 'fertilizer' && <Leaf className={`w-3 h-3 ${disabled && !isSelected ? 'opacity-40' : ''} text-green-600`} />}
                          {item === 'antiBug' && <Bug className={`w-3 h-3 ${disabled && !isSelected ? 'opacity-40' : ''} text-yellow-600`} />}
                          <span className="absolute -right-1 -bottom-1 bg-white dark:bg-gray-900 rounded-full px-0.5 text-[10px] font-medium border border-gray-200 dark:border-gray-700">{remaining}</span>
                        </button>
                      );
                    })}

                    <div className="ml-2">
                      <button
                        type="button"
                        disabled={!canStartForSlot(selected) || isActive}
                        onClick={async (e) => { e.stopPropagation(); if (onStartFarming) {
                          await onStartFarming(index, selected as any);
                          // Clear selection for this slot after successful start
                          setSelectedMap(prev => {
                            const copy = { ...prev };
                            delete copy[index];
                            return copy;
                          });
                        } }}
                        className={`px-2 py-0.5 rounded-md text-xs h-7 inline-flex items-center justify-center ${(canStartForSlot(selected) && !isActive) ? 'bg-[#0F5F3A] text-white hover:bg-[#166C47]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                      >
                        Farm
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
        );
        })}
      </div>
      
      {/* Festive decorations */}
      <div className="absolute top-2 left-2 text-2xl opacity-50">🎄</div>
      <div className="absolute top-2 right-2 text-2xl opacity-50">⛄</div>
      <div className="absolute bottom-2 left-2 text-2xl opacity-50">🎁</div>
      <div className="absolute bottom-2 right-2 text-2xl opacity-50">❄️</div>
    </div>
  );
};