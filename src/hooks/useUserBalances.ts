import { useQuery } from '@tanstack/react-query';
import { getUserBalances } from '@/lib/apiUser';

export const useUserBalances = (address: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userBalances', address],
    queryFn: async () => {
      if (!address) {
        return { address: '', tfBalance: 0, bnbBalance: 0, ethBalance: 0 };
      }
      try {
        return await getUserBalances();
      } catch (err) {
        console.error('Failed to fetch balances:', err);
        return { address: '', tfBalance: 0, bnbBalance: 0, ethBalance: 0 };
      }
    },
    enabled: !!address,
  });

  return {
    tfBalance: data?.tfBalance || 0,
    bnbBalance: data?.bnbBalance || 0,
    ethBalance: data?.ethBalance || 0,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch balances') : null,
    refetch,
  };
};
