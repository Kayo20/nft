import { useQuery } from '@tanstack/react-query';
import { getClaimableRewards } from '@/lib/apiUser';

export interface ClaimableRewardsData {
  address: string;
  totalAccumulated: number;
  claimableNow: number;
  feePercentage: number;
  netAmount: number;
  lastClaimAt: string | null;
  daysSinceLastClaim: number;
}

export const useClaimableRewards = (address: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['claimableRewards', address],
    queryFn: async () => {
      if (!address) {
        return {
          address: '',
          totalAccumulated: 0,
          claimableNow: 0,
          feePercentage: 30,
          netAmount: 0,
          lastClaimAt: null,
          daysSinceLastClaim: 0,
        };
      }
      try {
        return await getClaimableRewards();
      } catch (err) {
        console.error('Failed to fetch claimable rewards:', err);
        return {
          address: '',
          totalAccumulated: 0,
          claimableNow: 0,
          feePercentage: 30,
          netAmount: 0,
          lastClaimAt: null,
          daysSinceLastClaim: 0,
        };
      }
    },
    enabled: !!address,
  });

  const rewards: ClaimableRewardsData = data || {
    address: '',
    totalAccumulated: 0,
    claimableNow: 0,
    feePercentage: 30,
    netAmount: 0,
    lastClaimAt: null,
    daysSinceLastClaim: 0,
  };

  return {
    ...rewards,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch rewards') : null,
    refetch,
  };
};
