import { useEffect, useState } from 'react';
import { listIpfsFolder } from '../lib/ipfs';

type ManifestImage = { rarity: string; name: string; url: string };

export async function fetchManifestImages(): Promise<ManifestImage[]> {
  // Prefer IPFS root when configured
  const IPFS_ROOT = (import.meta.env.VITE_IPFS_IMAGES_ROOT as string) || '';
  const rarities = ['uncommon', 'rare', 'epic', 'legendary'];
  const images: ManifestImage[] = [];

  if (IPFS_ROOT) {
    for (const r of rarities) {
      const candidates = [`${IPFS_ROOT.replace(/\/$/, '')}/${r}`, `${IPFS_ROOT.replace(/\/$/, '')}/${r.charAt(0).toUpperCase() + r.slice(1)}`];
      for (const candidate of candidates) {
        try {
          const urls = await listIpfsFolder(candidate);
          if (urls && urls.length) {
            urls.forEach(u => images.push({ rarity: r, name: u.split('/').pop() || u, url: u }));
            break;
          }
        } catch (e) {
          // ignore and try next
        }
      }
    }
    if (images.length) return images;
  }

  // Fallback to Supabase manifest.json
  const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const BUCKET = (import.meta.env.VITE_NFT_IMAGES_BUCKET as string) || 'nft-images';
  if (!SUPABASE_URL) return images;

  const manifestUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/manifest.json`;
  try {
    const res = await fetch(manifestUrl);
    if (!res.ok) return images;
    const json = await res.json();
    const list: ManifestImage[] = (json.images || []).map((i: any) => ({ rarity: String(i.rarity || '').toLowerCase(), name: i.name, url: i.url }));
    return list;
  } catch (e) {
    return images;
  }
}

export function useNftManifest() {
  const [images, setImages] = useState<ManifestImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const list = await fetchManifestImages();
        setImages(list);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  return { images, isLoading, error };
}
