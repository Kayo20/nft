import { Rarity } from '@/types';

/**
 * TreeFi Farming State Helper
 * All 3 items (water, fertilizer, antiBug) must be active for farming to work
 */

export interface ItemState {
  itemId: 'water' | 'fertilizer' | 'antiBug';
  expiresAt: number; // milliseconds
}

/**
 * Check if an item is currently active
 */
export function isItemActive(itemState: ItemState, currentTime: number): boolean {
  return currentTime < itemState.expiresAt;
}

/**
 * Check if farming is active (all 3 items must be active)
 */
export function isFarmingActive(activeItems: ItemState[], currentTime: number): boolean {
  if (activeItems.length !== 3) return false;

  const itemTypes = new Set(activeItems.map(i => i.itemId));
  // Must have water, fertilizer, and antiBug
  if (itemTypes.size !== 3) return false;
  if (!itemTypes.has('water') || !itemTypes.has('fertilizer') || !itemTypes.has('antiBug')) return false;

  // All must be active (not expired)
  return activeItems.every(item => isItemActive(item, currentTime));
}

/**
 * Get time until farming stops (first item expires)
 */
export function getTimeUntilFarmingStops(activeItems: ItemState[], currentTime: number): number {
  if (!isFarmingActive(activeItems, currentTime)) {
    return 0;
  }
  const minExpiry = Math.min(...activeItems.map(i => i.expiresAt));
  return Math.max(0, minExpiry - currentTime);
}

/**
 * Get which items are missing for farming
 */
export function getMissingItems(activeItems: ItemState[], currentTime: number): ('water' | 'fertilizer' | 'antiBug')[] {
  const activeItemTypes = new Set<'water' | 'fertilizer' | 'antiBug'>();

  for (const item of activeItems) {
    if (isItemActive(item, currentTime)) {
      activeItemTypes.add(item.itemId);
    }
  }

  const requiredItems: ('water' | 'fertilizer' | 'antiBug')[] = ['water', 'fertilizer', 'antiBug'];
  return requiredItems.filter(item => !activeItemTypes.has(item));
}
