import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as manifest from '../src/hooks/useNftManifest';

describe('fetchManifestImages', () => {
  beforeEach(() => {
    vi.resetModules();
    // clear env
    (process.env as any).VITE_IPFS_IMAGES_ROOT = '';
    (process.env as any).VITE_SUPABASE_URL = 'https://example.supabase.co';
    (global as any).fetch = vi.fn();
  });

  it('prefers IPFS root when configured', async () => {
    (process.env as any).VITE_IPFS_IMAGES_ROOT = 'ipfs://QmRoot';

    // mock ipfs listIpfsFolder
    vi.doMock('../src/lib/ipfs', () => ({
      listIpfsFolder: async (path: string) => {
        if (path.includes('Uncommon')) return ['https://ipfs.test/QmRoot/Uncommon/1.png'];
        return [];
      }
    }));

    const { fetchManifestImages } = await import('../src/hooks/useNftManifest');
    const imgs = await fetchManifestImages();
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs[0].url).toContain('ipfs.test');
  });

  it('calls server list endpoint when available (runtime)', async () => {
    // mock fetch to respond to the server function
    (global as any).fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ images: [{ rarity: 'rare', name: '1.png', url: 'https://ipfs.test/QmRoot/Rare/1.png' }], source: 'ipfs-root' }) });

    const { fetchManifestImages } = await import('../src/hooks/useNftManifest');
    const imgs = await fetchManifestImages();
    expect(imgs.length).toBe(1);
    expect(imgs[0].url).toContain('ipfs.test');
  });

  it('falls back to Supabase manifest when no IPFS root or empty', async () => {
    // ensure IPFS root not set
    (process.env as any).VITE_IPFS_IMAGES_ROOT = '';

    // mock fetch to return manifest.json
    (global as any).fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ images: [{ rarity: 'uncommon', name: '1.png', url: 'https://example/test/1.png' }] }) });

    const { fetchManifestImages } = await import('../src/hooks/useNftManifest');
    const imgs = await fetchManifestImages();
    expect(imgs).toEqual([{ rarity: 'uncommon', name: '1.png', url: 'https://example/test/1.png' }]);
  });
});