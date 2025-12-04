import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CLAIM_FEE_SCHEDULE } from '@/lib/constants';
import { Clock, TrendingDown } from 'lucide-react';

interface ClaimProgressProps {
  daysSinceLastClaim: number;
}

export const ClaimProgress = ({ daysSinceLastClaim }: ClaimProgressProps) => {
  const currentDay = Math.min(daysSinceLastClaim, 10);
  const progressPercentage = (currentDay / 10) * 100;
  const currentFee = CLAIM_FEE_SCHEDULE.find(f => f.day === currentDay)?.fee || 0;

  return (
    <Card className="border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#3B82F6] dark:text-[#60A5FA]" />
          Claim Progress (Season 0 - 10 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Days Since Last Claim</span>
            <span className="font-semibold text-gray-900 dark:text-white">{currentDay} / 10</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-[#C43B3B] dark:text-[#EF4444]" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Current Fee</span>
          </div>
          <span className="text-2xl font-bold text-[#C43B3B] dark:text-[#EF4444]">{currentFee}%</span>
        </div>

        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <p>• Day 1: 50% fee → Day 10: 0% fee</p>
          <p>• Wait longer to maximize your rewards!</p>
        </div>
      </CardContent>
    </Card>
  );
};