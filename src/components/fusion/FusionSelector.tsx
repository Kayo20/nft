import { NFTTree } from '@/types';
import { TreeCard } from '@/components/nft/TreeCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface FusionSelectorProps {
  trees: NFTTree[];
  selectedTrees: NFTTree[];
  onSelectTree: (tree: NFTTree) => void;
}

export const FusionSelector = ({ trees, selectedTrees, onSelectTree }: FusionSelectorProps) => {
  const selectedIds = new Set(selectedTrees.map(t => t.id));
  
  // Group trees by rarity
  const treesByRarity = trees.reduce((acc, tree) => {
    if (!acc[tree.rarity]) {
      acc[tree.rarity] = [];
    }
    acc[tree.rarity].push(tree);
    return acc;
  }, {} as Record<string, NFTTree[]>);

  return (
    <div className="space-y-6">
      <Alert className="border-[#166C47] bg-[#0F5F3A]/5">
        <Info className="h-4 w-4 text-[#0F5F3A]" />
        <AlertDescription className="text-[#1F2937]">
          Select 3 trees of the same rarity to fuse them into a higher rarity tree. Selected: {selectedTrees.length}/3
        </AlertDescription>
      </Alert>

      {Object.entries(treesByRarity).map(([rarity, rarityTrees]) => (
        <div key={rarity} className="space-y-3">
          <h3 className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
            {rarity} Trees
            <span className="text-sm font-normal text-[#6B7280]">({rarityTrees.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
            {rarityTrees.map((tree) => (
              <TreeCard
                key={tree.id}
                tree={tree}
                selected={selectedIds.has(tree.id)}
                onClick={() => onSelectTree(tree)}
                large={selectedIds.has(tree.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {trees.length === 0 && (
        <div className="text-center py-12 text-[#6B7280]">
          <p>No trees available for fusion</p>
        </div>
      )}
    </div>
  );
};