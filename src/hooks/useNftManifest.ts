import { useEffect, useState } from 'react';

type ManifestImage = { rarity: string; name: string; url: string };

export function useNftManifest() {
  const [images, setImages] = useState<ManifestImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
      const BUCKET = (import.meta.env.VITE_NFT_IMAGES_BUCKET as string) || 'nft-images';
      if (!SUPABASE_URL) return;

      const manifestUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/manifest.json`;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
        const json = await res.json();
        const list: ManifestImage[] = (json.images || []).map((i: any) => ({
          rarity: String(i.rarity || '').toLowerCase(),
          name: i.name,
          url: i.url,
        }));
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
