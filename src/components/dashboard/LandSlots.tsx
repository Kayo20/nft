import { Card, CardContent } from '@/components/ui/card';
import { TreePine, Plus, Droplet, Leaf, Bug } from 'lucide-react';
import { NFTTree } from '@/types';
import { Badge } from '@/components/ui/badge';
import { RARITY_COLORS } from '@/lib/constants';



interface LandSlotsProps {
  trees: NFTTree[];
  onSlotClick: (slotIndex: number) => void;
  onAddTree?: (slotIndex: number) => void;
  slots?: number; // default 9
  className?: string;
}

export const LandSlots = ({ trees, onSlotClick, onAddTree, slots = 9, className = '' }: LandSlotsProps) => {
  // Mock item usage handler
  const handleUseItem = (slotIndex: number, item: 'water' | 'fertilizer' | 'antiBug') => {
    // For now, just show a toast or alert
    window?.toast?.success?.(`Used ${item} on slot ${slotIndex + 1}`) || alert(`Used ${item} on slot ${slotIndex + 1}`);
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
        {slotArr.map((tree, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-all border-2 border-gray-200 dark:border-gray-700 hover:border-[#0F5F3A] dark:hover:border-[#22C55E] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            onClick={() => onSlotClick(index)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center min-h-[200px]">
                {tree ? (
                  <>
                    <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 mb-3 rounded-lg overflow-hidden shadow-md">
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
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          );
                        }
                        // No image available — render an empty container to preserve layout
                        return <div className="w-full h-full" aria-hidden />;
                      })()}
                    </div>
                  <Badge
                    className="text-xs mb-1"
                    style={{ backgroundColor: RARITY_COLORS[(tree.rarity || tree.metadata?.rarity || '').toLowerCase()] || '#999', color: 'white' }}
                  >
                    {tree.rarity}
                  </Badge>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Power {tree.power}</p>
                  {/* Item buttons */}
                  <div className="flex gap-1 mt-2">
                      <button
                        type="button"
                        className="p-0.5 rounded bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition min-w-[24px] min-h-[24px] flex items-center justify-center"
                        title="Add Water"
                        onClick={e => { e.stopPropagation(); handleUseItem(index, 'water'); }}
                      >
                        <Droplet className="w-3 h-3 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        className="p-0.5 rounded bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 transition min-w-[24px] min-h-[24px] flex items-center justify-center"
                        title="Add Fertilizer"
                        onClick={e => { e.stopPropagation(); handleUseItem(index, 'fertilizer'); }}
                      >
                        <Leaf className="w-3 h-3 text-green-600" />
                      </button>
                      <button
                        type="button"
                        className="p-0.5 rounded bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition min-w-[24px] min-h-[24px] flex items-center justify-center"
                        title="Add Anti-Bug"
                        onClick={e => { e.stopPropagation(); handleUseItem(index, 'antiBug'); }}
                      >
                        <Bug className="w-3 h-3 text-yellow-600" />
                      </button>
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