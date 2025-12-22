import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ipfs from '../src/lib/ipfs';
import { mapNftsWithManifest } from '../src/hooks/useNFTs';

vi.spyOn(ipfs, 'resolveIpfsMetadata').mockImplementation(async (uri: string) => ({ name: 'IPFS META', uri }));

describe('mapNftsWithManifest', () => {
  it('enriches missing images from manifest', () => {
    const nfts = [{ id: 1, owner_address: '0xabc', rarity: 'Uncommon', image: '' }];
    const manifest = [{ rarity: 'uncommon', name: '1.png', url: 'https://ipfs.test/1.png' }];
    const res = mapNftsWithManifest(nfts, manifest);
    expect(res[0].image).toBeDefined();
    expect(res[0].image).toContain('ipfs.test');
  });

  it('keeps existing images', () => {
    const nfts = [{ id: 1, owner_address: '0xabc', rarity: 'Uncommon', image: 'https://example/test.png' }];
    const res = mapNftsWithManifest(nfts, []);
    expect(res[0].image).toBe('https://example/test.png');
  });
});
