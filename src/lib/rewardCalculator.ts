import { Rarity } from '@/types';
import { DAILY_REWARDS, CLAIM_FEE_SCHEDULE, SEASON_ZERO_START, SEASON_ZERO_END } from './constants';

/**
 * Calculate daily reward for an NFT based on rarity
 * TreeFi Spec: 0.5 TF (Uncommon), 2 TF (Rare), 8 TF (Epic), 15 TF (Legendary)
 */
export function getDailyReward(rarity: Rarity): number {
  return DAILY_REWARDS[rarity] || 0;
}

/**
 * Calculate total accumulated rewards since last claim
 * Only if farming is active (all 3 items are active) and season is active
 */
export function calculateAccumulatedRewards(
  rarity: Rarity,
  lastClaimedAt: number,
  currentTime: number,
  isFarmingActive: boolean,
  isSeasonActive: boolean
): number {
  // No rewards if farming or season is not active
  if (!isFarmingActive || !isSeasonActive) {
    return 0;
  }

  const dailyReward = getDailyReward(rarity);
  const daysPassed = (currentTime - lastClaimedAt) / (24 * 60 * 60 * 1000);
  return daysPassed * dailyReward;
}

/**
 * Get claim fee percentage based on day of Season 0
 * TreeFi Spec: 10-day season, 50% fee day 1 → 0% fee day 10
 */
export function getClaimFeePercentage(dayNumber: number): number {
  const schedule = CLAIM_FEE_SCHEDULE;
  const dayEntry = schedule.find(s => s.day === dayNumber);
  if (dayEntry) {
    return dayEntry.fee;
  }
  // After day 10, no fee
  return dayNumber > 10 ? 0 : 0;
}

/**
 * Get current day of Season 0
 * Returns day number (1-10) or null if season not active
 */
export function getCurrentSeasonDay(currentTime: number): number | null {
  if (currentTime < SEASON_ZERO_START || currentTime > SEASON_ZERO_END) {
    return null; // Season not active
  }
  const daysPassed = (currentTime - SEASON_ZERO_START) / (24 * 60 * 60 * 1000);
  return Math.floor(daysPassed) + 1; // Day 1-10
}

/**
 * Calculate net claim amount after fee
 */
export function calculateNetClaim(
  grossRewards: number,
  feePercentage: number
): number {
  const fee = (grossRewards * feePercentage) / 100;
  return Math.max(0, grossRewards - fee);
}

/**
 * Check if Season 0 is active
 */
export function isSeasonActive(currentTime: number): boolean {
  return currentTime >= SEASON_ZERO_START && currentTime <= SEASON_ZERO_END;
}

/**
 * Get days remaining in Season 0
 */
export function getDaysRemaining(currentTime: number): number {
  if (currentTime > SEASON_ZERO_END) return 0;
  if (currentTime < SEASON_ZERO_START) return Math.ceil((SEASON_ZERO_START - currentTime) / (24 * 60 * 60 * 1000));
  return Math.ceil((SEASON_ZERO_END - currentTime) / (24 * 60 * 60 * 1000));
}
