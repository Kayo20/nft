import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as startFarmingFn from '../../netlify/functions/start-farming';
import * as claimFn from '../../netlify/functions/claim';

// Common mocks
vi.mock('../../netlify/functions/_utils/auth', () => ({
  verifySession: vi.fn(() => ({ address: '0xabc' })),
  corsHeaders: () => ({}),
  securityHeaders: () => ({}),
}));

// Mock web3 verification to always succeed
vi.mock('../../netlify/functions/_utils/web3', () => ({ verifyERC20Transfer: async () => true }));

function makeSupabaseMockForStart() {
  return {
    from: (table: string) => {
      if (table === 'users') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'user-1' } }) }) }) };
      if (table === 'nfts') return { select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 42, owner_address: '0xabc', rarity: 'Rare' } }) }) }) }) };
      if (table === 'inventories') return {
        select: () => ({ in: () => ({}) }),
        // update will be called for each inventory item
        update: () => ({ eq: () => ({}) }),
      };
      if (table === 'farming_state') return {
        upsert: () => ({ select: () => ({ single: async () => ({ data: { farming_started: new Date().toISOString() } }) }) })
      }
      return { select: () => ({}) };
    }
  } as any;
}

function makeSupabaseMockForClaim({ farmingState, transactionsResponse }: { farmingState: any, transactionsResponse?: any }) {
  return {
    from: (table: string) => {
      if (table === 'users') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: farmingState.user_id } }) }) }) };
      if (table === 'farming_state') return {
        select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: farmingState }) }) }) }),
        update: () => ({ eq: () => ({}) }),
      };
      if (table === 'transactions') return { insert: () => ({ select: () => ({ single: async () => ({ data: transactionsResponse || { id: 999 } }) }) }) };
      return { select: () => ({}) };
    }
  } as any;
}

describe('integration: start-farming + claim flows', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('start-farming succeeds and returns active items', async () => {
    // Replace supabase client used inside the function
    // Import module and set the module-level supabase mock so the handler uses it
    const startMod = await import('../../netlify/functions/start-farming');
    (startMod as any).supabase = makeSupabaseMockForStart();

    const tx = '0x' + 'a'.repeat(64);
    const body = JSON.stringify({ nftId: 42, itemIds: ['water', 'fertilizer', 'antiBug'], txHash: tx });
    const evt: any = { httpMethod: 'POST', body, headers: { cookie: '' } };

    const res = await startMod.handler(evt);
    expect(res.statusCode).toBe(200);
    const resp = JSON.parse(res.body);
    expect(resp.ok).toBe(true);
    expect(resp.activeItems).toHaveLength(3);
    expect(resp.durationHours).toBe(4);
    // mock branch returns farmingStarted instead of farmingUntil
    expect(resp.farmingStarted).toBeTruthy();
  });

  it('claim awards rewards and updates last_claimed_at', async () => {
    const now = Date.now();
    const expiresAt = now + (4 * 60 * 60 * 1000); // 4 hours ahead
    const farmingState = {
      id: 1,
      user_id: 'user-1',
      nft_id: 42,
      nft_rarity: 'Rare',
      last_claimed_at: new Date(now - 60 * 60 * 1000).toISOString(), // 1 hour ago
      active_items: [ { itemId: 'water', expiresAt }, { itemId: 'fertilizer', expiresAt }, { itemId: 'antiBug', expiresAt } ],
    };

    const mockTxResponse = { id: 123, amount: 100 };
    // Ensure the supabase module is mocked before importing the claim module
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => makeSupabaseMockForClaim({ farmingState, transactionsResponse: mockTxResponse }) }));
    const claimMod = await import('../../netlify/functions/claim');

    const tx = '0x' + 'b'.repeat(64);
    const body = JSON.stringify({ nftId: 42, txHash: tx });
    const evt: any = { httpMethod: 'POST', body, headers: { cookie: '' } };

    const res = await claimMod.handler(evt);
    expect(res.statusCode).toBe(200);
    const resp = JSON.parse(res.body);
    expect(resp.netRewards).toBeGreaterThan(0);
    expect(resp.tx).toBeTruthy();
    // daysSinceLastClaim is returned as an integer in the response
    expect(resp.daysSinceLastClaim).toBeDefined();
    // Reset the module registry so the next import picks up a clean module environment
    vi.resetModules();
  });

  it('claim returns no rewards for zero effective duration (unit check via computeClaim)', async () => {
    const now = Date.now();
    const expiresAt = now + (1 * 60 * 60 * 1000); // 1 hour ahead but last_claimed_at is very recent
    const farmingState = {
      id: 2,
      user_id: 'user-2',
      nft_id: 43,
      nft_rarity: 'Rare',
      last_claimed_at: new Date(now - 0 * 60 * 60 * 1000).toISOString(), // now
      active_items: [ { itemId: 'water', expiresAt }, { itemId: 'fertilizer', expiresAt }, { itemId: 'antiBug', expiresAt } ],
    };

    // Use computeClaim directly to validate the no-rewards case (unit-level assertion)
    const { computeClaim } = await import('../../netlify/functions/claim');
    const out = computeClaim(farmingState, now, 0);
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/no rewards/i);
  });
});
