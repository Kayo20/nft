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
          // If metadata looks like an IPFS uri or CID, resolve it
          if (meta && typeof meta === 'string' && (meta.startsWith('ipfs://') || /^[a-zA-Z0-9]{46,}/.test(meta))) {
            const fetched = await resolveIpfsMetadata(meta);
            if (fetched) meta = fetched;
          } else if (meta && typeof meta === 'object' && meta.image && typeof meta.image === 'string' && meta.image.startsWith('ipfs://')) {
            const fetched = await resolveIpfsMetadata(meta.image);
            if (fetched) meta = { ...meta, imageMetadata: fetched };
          }
          return { ...n, metadata: meta };
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
