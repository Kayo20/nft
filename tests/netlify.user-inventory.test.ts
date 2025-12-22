import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userInventoryFn from '../netlify/functions/user-inventory';

// Mock verifySession to return a fixed address
vi.mock('../netlify/functions/_utils/auth', () => ({
  verifySession: vi.fn(() => ({ address: '0xabc' })),
  corsHeaders: () => ({}),
  securityHeaders: () => ({}),
}));

// Mock supabase client used in function file
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'users') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'uuid-123' } }) }) }) };
      if (table === 'inventories') return { select: () => ({ eq: () => ({ in: async () => ({ data: [{ item_id: 'water', qty: 1 }, { item_id: 'fertilizer', qty: 1 }] }) }) }) };
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) };
    }
  })
}));

describe('user-inventory function', () => {
  it('returns mapped inventory for user', async () => {
    const evt: any = { httpMethod: 'GET', headers: {} };
    const res = await (userInventoryFn as any).handler(evt);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.water).toBe(1);
    expect(body.fertilizer).toBe(1);
  });
});
