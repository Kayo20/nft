import { describe, it, expect, vi } from 'vitest';
import * as fn from '../netlify/functions/land-update-slots';

// Mock auth verification and headers
vi.mock('../netlify/functions/_utils/auth', () => ({
  verifySession: vi.fn(() => ({ address: '0xabc' })),
  corsHeaders: () => ({}),
  securityHeaders: () => ({}),
}));

// Mock Supabase client behavior
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => {
    const mockDb: any = {
      lastTable: null,
      lastEq: null,
      from(table: string) {
        this.lastTable = table;
        return this.chain;
      },
      chain: {
        select: function () { return mockDb.chain; },
        eq: function (col: string, val: any) { mockDb.lastEq = { col, val }; return mockDb.chain; },
        order: function () { return mockDb.chain; },
        single: async function () {
          if (mockDb.lastTable === 'lands') return { data: { id: 1, owner: '0xabc', slots: 9 } };
          if (mockDb.lastTable === 'nfts') return { data: null };
          return { data: null };
        },
        insert: async function (payload: any) { return { data: payload } },
        upsert: function (payload: any) { return { select: async () => ({ data: Array.isArray(payload) ? payload : [payload] }) } },
        update: function () { return { eq: () => ({ eq: () => ({ select: async () => ({ data: [] }) }) }) } },
      }
    };
    return mockDb;
  }
}));

describe('land-update-slots', () => {
  it('upserts slot with nft and returns ok', async () => {
    const event: any = { httpMethod: 'POST', headers: {}, path: '/.netlify/functions/land-update-slots/land/1/slots', body: JSON.stringify({ slotIndex: 2, nftId: 42 }) };
    const res: any = await (fn as any).handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.slot.index).toBe(2);
    expect(body.slot.nftId).toBe(42);
  });

  it('removes nft from slot (nftId null) and returns ok', async () => {
    const event: any = { httpMethod: 'POST', headers: {}, path: '/.netlify/functions/land-update-slots/land/1/slots', body: JSON.stringify({ slotIndex: 2, nftId: null }) };
    const res: any = await (fn as any).handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.slot.index).toBe(2);
    expect(body.slot.nftId).toBe(null);
  });
});
