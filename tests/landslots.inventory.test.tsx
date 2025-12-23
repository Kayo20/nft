import { describe, it, expect, vi } from 'vitest';
import { totalSelectedCounts, availableFor, remainingFor, canStartForSlot } from '../src/components/dashboard/landslotsUtils';

describe('landslots utils inventory enforcement', () => {
  it('computes selected counts and availability correctly', () => {
    const selectedMap = {
      0: new Set(['water','fertilizer','antiBug']),
      1: new Set(['fertilizer']),
      2: new Set([]),
    } as any;
    const inventory = { water: 1, fertilizer: 2, antiBug: 1 };

    const counts = totalSelectedCounts(selectedMap as any);
    expect(counts.water).toBe(1);
    expect(counts.fertilizer).toBe(2);
    expect(counts.antiBug).toBe(1);

    // water should not be available for slot 2 (already used)
    expect(availableFor('water', [], selectedMap as any, inventory)).toBe(false);
    // fertilizer not available for slot 2 either
    expect(availableFor('fertilizer', [], selectedMap as any, inventory)).toBe(false);
    // antiBug not available
    expect(availableFor('antiBug', [], selectedMap as any, inventory)).toBe(false);

    // remaining for slot 0 (which already contains items) should be 1 for each
    expect(remainingFor('water', ['water'], selectedMap as any, inventory)).toBe(1);
    expect(remainingFor('fertilizer', ['fertilizer'], selectedMap as any, inventory)).toBe(1);
    expect(remainingFor('antiBug', ['antiBug'], selectedMap as any, inventory)).toBe(1);

    // can start for slot 0 should be true
    expect(canStartForSlot(['water','fertilizer','antiBug'], selectedMap as any, inventory)).toBe(true);
  });
});