import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Award } from 'lucide-react';
import { getSeasonInfo } from '@/lib/api';
import { SeasonInfo } from '@/types';

export const SeasonBadge = () => {
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);

  useEffect(() => {
    const fetchSeasonInfo = async () => {
      const info = await getSeasonInfo();
      setSeasonInfo(info);
    };
    
    fetchSeasonInfo();
    // Refresh every minute to keep days remaining up-to-date
    const interval = setInterval(fetchSeasonInfo, 1000 * 60);
    return () => clearInterval(interval);
  }, []);
  if (!seasonInfo) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge className="bg-[#E2B13C] dark:bg-[#FCD34D] text-gray-900 px-4 py-2 text-sm">
        <Award className="w-4 h-4 mr-2 inline" />
        Season {seasonInfo.seasonNumber}
      </Badge>
      <Badge variant="outline" className="px-4 py-2 text-sm border-[#0F5F3A] dark:border-[#22C55E] text-[#0F5F3A] dark:text-[#22C55E]">
        <Clock className="w-4 h-4 mr-2 inline" />
        {seasonInfo.daysRemaining} days left
      </Badge>
    </div>
  );
};