import { useState, useEffect } from 'react';
import { NFTTree } from '@/types';
import { getNFTs } from '@/lib/api';

export const useNFTs = (address: string | null) => {
  const [nfts, setNfts] = useState<NFTTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getNFTs(address);
      setNfts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFTs';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [address]);

  return {
    nfts,
    isLoading,
    error,
    refetch: fetchNFTs,
  };
};