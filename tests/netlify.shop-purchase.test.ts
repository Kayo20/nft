import { describe, it, expect, vi } from 'vitest';
import * as shopPurchaseFn from '../netlify/functions/shop-purchase';

vi.mock('../netlify/functions/_utils/auth', () => ({ verifySession: vi.fn(() => ({ address: '0xabc' })), corsHeaders: () => ({}), securityHeaders: () => ({}) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  from: (table: string) => {
    if (table === 'users') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'uuid-1' } }) }) }) };
    if (table === 'items') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'water', price: 150000 } }) }) }) };
    if (table === 'transactions') return { insert: () => ({ select: () => ({ single: async () => ({ data: { id: 999 } }) }) }) };
    if (table === 'inventories') return { select: (cols?: string) => {
      const builder: any = {
        eq: (_k: string, _v: any) => builder,
        single: async () => ({ data: null }),
      };
      return builder;
    }, insert: () => ({}) };
    return { select: () => ({}) };
  }
}) }));

// Mock tx verification to succeed in unit tests
vi.mock('../netlify/functions/_utils/web3', () => ({ verifyERC20Transfer: async () => true }));

describe('shop-purchase function', () => {
  it('creates inventory and transaction with user_id', async () => {
    const tx = '0x' + 'a'.repeat(64);
    const body = JSON.stringify({ itemId: 'water', qty: 1, txHash: tx });
    const evt: any = { httpMethod: 'POST', body, headers: { cookie: '' } };
    const res = await (shopPurchaseFn as any).handler(evt);
    expect(res.statusCode).toBe(200);
    const resp = JSON.parse(res.body);
    expect(resp.ok).toBe(true);
  });
});
