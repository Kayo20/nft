import { describe, it, expect } from 'vitest';
import { computeClaim } from '../../netlify/functions/claim';

describe('computeClaim helper', () => {
  it('computes rewards when farming active and time passed since last claim', () => {
    const now = Date.now();
    const expiresAt = now + 4 * 60 * 60 * 1000; // 4 hours
    const farmingState = {
      nft_rarity: 'Rare',
      farming_started: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // started 2 hours ago
      last_claimed_at: new Date(now - 60 * 60 * 1000).toISOString(), // 1 hour ago
      active_items: [ { itemId: 'water', expiresAt }, { itemId: 'fertilizer', expiresAt }, { itemId: 'antiBug', expiresAt } ],
    } as any;

    const out = computeClaim(farmingState, now, 0);
    expect(out.ok).toBe(true);
    expect(out.grossRewards).toBeGreaterThan(0);
    expect(out.daysSinceLastClaim).toBeGreaterThan(0);
  });

  it('returns error when there are no rewards available yet', () => {
    const now = Date.now();
    const expiresAt = now + 60 * 60 * 1000; // 1 hour
    const farmingState = {
      nft_rarity: 'Rare',
      farming_started: new Date(now - 10 * 60 * 1000).toISOString(), // started 10 minutes ago
      last_claimed_at: new Date(now).toISOString(), // just claimed now
      active_items: [ { itemId: 'water', expiresAt }, { itemId: 'fertilizer', expiresAt }, { itemId: 'antiBug', expiresAt } ],
    } as any;

    const out = computeClaim(farmingState, now, 0);
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/no rewards/i);
  });
});
