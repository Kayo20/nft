import { describe, it, expect, vi } from 'vitest';
import * as openChestFn from '../netlify/functions/open-chest';

vi.mock('../netlify/functions/_utils/auth', () => ({
  verifySession: vi.fn(() => ({ address: '0xabc' })),
  corsHeaders: () => ({}),
  securityHeaders: () => ({}),
}));

vi.mock('../netlify/functions/_utils/web3', () => ({
  verifyERC20Transfer: async () => true,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'nfts') return {
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 1, owner_address: '0xabc', rarity: 'Uncommon' } }) }) }),
      };
      if (table === 'users') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'uuid-1' } }) }) }) };
      return { insert: () => ({ select: async () => ({ data: [] }) }) };
    }
  })
}));

describe('open-chest function', () => {
  it('returns 400 if txHash missing', async () => {
    const evt: any = { httpMethod: 'POST', body: JSON.stringify({ type: 'standard' }), headers: {} };
    const res = await (openChestFn as any).handler(evt);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeDefined();
  });

  it('opens chest when txHash provided and verified', async () => {
    const evt: any = { httpMethod: 'POST', body: JSON.stringify({ type: 'standard', txHash: '0xdead' }), headers: { cookie: 'token=abc' } };
    const res = await (openChestFn as any).handler(evt);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.nft).toBeDefined();
    expect(body.nft.rarity).toBe('Uncommon');
  });
});
