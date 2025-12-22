import { useEffect, useState } from 'react';
import { NFTTree } from '@/types';

import { useNftManifest } from './useNftManifest';

export const useNFTs = (address: string | null) => {
  const [nfts, setNfts] = useState<NFTTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { images: manifestImages, isLoading: manifestLoading } = useNftManifest();

  const fetchNFTs = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const api = await import('@/lib/api');
      const data = await api.getNFTs(address);

      // If manifest exists, enrich NFTs missing images
      const enriched = mapNftsWithManifest(data || [], manifestImages);

      setNfts(enriched);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFTs';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait until manifest finished loading (if present) before fetching NFTs
    if (manifestLoading) return;
    fetchNFTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, manifestLoading]);

  return {
    nfts,
    isLoading,
    error,
    refetch: fetchNFTs,
  };
}

export function mapNftsWithManifest(nfts: any[], manifestImages: { rarity: string; name: string; url: string }[]) {
  return (nfts || []).map((n: any) => {
    const copy = { ...n } as any;
    if (!copy.image || copy.image === null || copy.image === '') {
      const rarity = (copy.rarity || 'uncommon').toLowerCase();
      const candidates = (manifestImages || []).filter(m => m.rarity === rarity).map(m => m.url);
      if (candidates.length > 0) {
        copy.image = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
    return copy;
  });
}