import { Item } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Coins, Droplets, Sprout, Bug } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  inventory: number;
  onPurchase: (itemId: string) => void;
  isPurchasing: boolean;
}

export const ItemCard = ({ item, inventory, onPurchase, isPurchasing }: ItemCardProps) => {
  // Use Lucide icons for farming items to match dashboard inventory
  let IconComp: React.ReactNode = item.icon;
  if (item.id === 'water') {
    IconComp = <Droplets className="w-5 h-5 text-[#3B82F6] dark:text-[#60A5FA]" />;
  } else if (item.id === 'fertilizer') {
    IconComp = <Sprout className="w-5 h-5 text-[#22C55E] dark:text-[#4ADE80]" />;
  } else if (item.id === 'antiBug') {
    IconComp = <Bug className="w-5 h-5 text-[#EF4444] dark:text-[#F87171]" />;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow border-2 border-[#166C47]/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="mb-2">
              <div className="w-10 h-10 flex items-center justify-center">{IconComp}</div>
            </div>
            <Badge variant="secondary" className="bg-[#0F5F3A] text-white">
              Own: {inventory}
            </Badge>
          </div>
          <CardTitle className="text-xl text-[#1F2937]">{item.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-[#6B7280]">{item.description}</p>
          
          <div className="flex items-center justify-between p-3 bg-[#FDECEC] rounded-lg">
            <span className="text-sm font-medium text-[#6B7280]">Boost</span>
            <span className="text-lg font-bold text-[#0F5F3A]">{item.boost}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#E2B13C]/20 to-[#E2B13C]/10 rounded-lg">
            <span className="text-sm font-medium text-[#6B7280] flex items-center gap-1">
              <Coins className="w-4 h-4" />
              Cost
            </span>
            <span className="text-lg font-bold text-[#0F5F3A]">{item.cost.toLocaleString()} TF</span>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={() => onPurchase(item.id)}
            disabled={isPurchasing}
            className="w-full bg-[#C43B3B] hover:bg-[#A83232] text-white"
          >
            {isPurchasing ? 'Purchasing...' : 'Purchase'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};