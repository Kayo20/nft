import { useEffect, useState } from 'react';
import { NFTTree } from '@/types';

import { useNftManifest } from './useNftManifest';
import { resolveIpfsMetadata } from '@/lib/ipfs';

export const useNFTs = (address: string | null) => {
  const [nfts, setNfts] = useState<NFTTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { images: manifestImages, isLoading: manifestLoading } = useNftManifest();

  async function resolveImage(nft: any) {
    // Determine candidate sources in order of preference
    const candidates = [nft.image, nft.image_url, nft.metadata?.image].filter(Boolean).map(String);

    // Try each candidate with resolveIpfsMetadata and return first asset URL found
    for (const c of candidates) {
      try {
        // If candidate is already an http(s) URL and not ipfs:, use as-is
        if (/^https?:\/\//i.test(c)) return { final: c, resolvedFrom: c };

        // Try resolver (handles ipfs:// and CIDs and gateway fallback)
        const r = await resolveIpfsMetadata(c);
        if (r) {
          if (r.type === 'asset' && r.url) return { final: r.url, resolvedFrom: c };
          if (r.type === 'json' && r.data) {
            // If JSON metadata includes an image field, try to resolve it
            const metaImage = r.data.image || r.data.image_url || null;
            if (metaImage) {
              if (/^https?:\/\//i.test(metaImage)) return { final: metaImage, resolvedFrom: c };
              const rr = await resolveIpfsMetadata(String(metaImage));
              if (rr && rr.type === 'asset' && rr.url) return { final: rr.url, resolvedFrom: c };
            }
          }
        }
      } catch (e) {
        // ignore and try next
      }
    }

    return { final: null, resolvedFrom: null };
  }

  const fetchNFTs = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const api = await import('@/lib/api');
      const data = await api.getNFTs(address);

      // If manifest exists, enrich NFTs missing images
      const enriched = mapNftsWithManifest(data || [], manifestImages);

      // Resolve image URLs (IPFS) for each NFT and normalize to `image` + `image_url_resolved`
      const resolved = await Promise.all(enriched.map(async (n: any) => {
        const copy = { ...n } as any;
        try {
          const r = await resolveImage(copy);
          if (r.final) {
            copy.image = r.final; // canonical image used across UI
            copy.image_url_resolved = r.final;
          } else {
            // ensure at least image is a string or null
            copy.image = copy.image || copy.image_url || (copy.metadata && copy.metadata.image) || null;
            copy.image_url_resolved = null;
          }
        } catch (e) {
          copy.image_url_resolved = null;
        }
        return copy;
      }));

      setNfts(resolved);
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

    // Listen for global NFT updates (e.g., chest opened) and refetch
    const handler = () => { fetchNFTs(); };
    window.addEventListener('nft-updated', handler);
    return () => { window.removeEventListener('nft-updated', handler); };
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