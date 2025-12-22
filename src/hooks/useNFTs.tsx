import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { resolveIpfsMetadata } from '../lib/ipfs';

export function useNFTs(ownerAddress?: string) {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerAddress) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase.from('nfts').select('*').eq('owner_address', ownerAddress);
        if (error) throw error;
        const resolved = await Promise.all((data || []).map(async (n: any) => {
          let meta = n.metadata;
          let resolvedMeta: any = null;
          let imageUrl: string | null = null;

          // Case A: metadata is a string (CID or ipfs:// or an http URL)
          if (meta && typeof meta === 'string') {
            const fetched = await resolveIpfsMetadata(meta);
            if (fetched) {
              if (fetched.type === 'json') resolvedMeta = fetched.data;
              if (fetched.type === 'asset') imageUrl = fetched.url;
            }
          }

          // Case B: metadata is an object with image pointing to IPFS / CID / URL
          if (!resolvedMeta && meta && typeof meta === 'object') {
            resolvedMeta = meta;
            if (meta.image && typeof meta.image === 'string') {
              // If image is ipfs:// or CID or http(s), try to resolve
              const fetchedImg = await resolveIpfsMetadata(meta.image);
              if (fetchedImg) {
                if (fetchedImg.type === 'json') resolvedMeta = { ...resolvedMeta, imageMetadata: fetchedImg.data };
                if (fetchedImg.type === 'asset') imageUrl = fetchedImg.url;
              }
            }
          }

          // Prefer imageUrl from metadata.image if present, else metadata.image field if it's already a URL
          if (!imageUrl && resolvedMeta && typeof resolvedMeta === 'object' && resolvedMeta.image && typeof resolvedMeta.image === 'string' && /^https?:\/\//i.test(resolvedMeta.image)) {
            imageUrl = resolvedMeta.image;
          }

          // Attach the best metadata and resolved image for the UI
          const finalMeta = resolvedMeta || (typeof meta === 'object' ? meta : null);
          const finalImage = imageUrl || n.image_url || (finalMeta && finalMeta.image) || null;

          return { ...n, metadata: finalMeta, image: finalImage, image_url_resolved: imageUrl };
        }));
        if (!mounted) return;
        setNfts(resolved);
      } catch (e: any) {
        setError(e?.message || 'Failed to load NFTs');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [ownerAddress]);

  return { nfts, loading, error };
}
