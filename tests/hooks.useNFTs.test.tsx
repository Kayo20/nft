import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import * as ipfs from '../src/lib/ipfs';
import { useNFTs } from '../src/hooks/useNFTs';

// Mock supabase client
vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [
        { id: 1, owner_address: '0xabc', rarity: 'Uncommon', metadata: 'ipfs://Qm123' }
      ], error: null })
    }))
  }
}));

vi.spyOn(ipfs, 'resolveIpfsMetadata').mockImplementation(async (uri: string) => ({ name: 'IPFS META', uri }));

describe('useNFTs hook', () => {
  it('loads nfts and resolves ipfs metadata', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNFTs('0xabc'));
    await waitForNextUpdate();
    expect(result.current.nfts.length).toBeGreaterThan(0);
    expect(result.current.nfts[0].metadata).toEqual({ name: 'IPFS META', uri: 'ipfs://Qm123' });
  });
});
