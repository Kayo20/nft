import { useQuery } from '@tanstack/react-query';
import { getUserBalances } from '@/lib/apiUser';
import { getERC20Balance } from '@/lib/web3';
import { TF_TOKEN_CONTRACT } from '@/lib/constants';

export const useUserBalances = (address: string | null) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['userBalances', address],
    queryFn: async () => {
      if (!address) {
        return { address: '', tfBalance: 0, bnbBalance: 0, ethBalance: 0, tfSource: 'none' };
      }
      let balances: any = { address: '', tfBalance: 0, bnbBalance: 0, ethBalance: 0, tfSource: 'server' };
      try {
        balances = await getUserBalances();
        balances.tfSource = 'server';
      } catch (err) {
        console.error('Failed to fetch balances from server:', err);
        // continue and attempt on-chain fetch
      }

      // Try to fetch TF token balance directly from MetaMask (on-chain) when available
      try {
        if (typeof window !== 'undefined' && (window as any).ethereum && address) {
          const onChain = await getERC20Balance(TF_TOKEN_CONTRACT, address);
          // convert to number and prefer on-chain value
          const onChainNum = Number(onChain) || 0;
          if (onChainNum > 0 || balances.tfBalance === 0) {
            balances.tfBalance = onChainNum;
            balances.tfSource = 'on-chain';
          }
        }
      } catch (e) {
        // ignore on-chain errors and fall back to server-stored value
        console.warn('Failed to fetch TF balance on-chain:', e);
      }

      return balances;
    },
    // Poll every 30s when wallet present and provider exists to keep on-chain balance fresh
    refetchInterval: (!!address && typeof window !== 'undefined' && (window as any).ethereum) ? 30000 : false,
    enabled: !!address,
  });

  return {
    tfBalance: data?.tfBalance || 0,
    tfBalanceSource: data?.tfSource || 'server',
    bnbBalance: data?.bnbBalance || 0,
    ethBalance: data?.ethBalance || 0,
    isLoading,
    isRefetching: (typeof (data) !== 'undefined') ? (false as boolean) : false,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch balances') : null,
    refetch,
  };
};
