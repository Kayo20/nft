import { describe, it, expect } from 'vitest';
import { canAfford } from '../src/lib/economics';

describe('canAfford', () => {
  it('returns true when balance covers price + fee', () => {
    expect(canAfford(260000, 250000, 10000)).toBe(true);
  });

  it('returns false when balance is insufficient', () => {
    expect(canAfford(249999, 250000, 10000)).toBe(false);
  });

  it('handles string balances', () => {
    expect(canAfford('260000', 250000, 10000)).toBe(true);
  });

  it('returns false with zero balance', () => {
    expect(canAfford(0, 250000, 10000)).toBe(false);
  });
});
