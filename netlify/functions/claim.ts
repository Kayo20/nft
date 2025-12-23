import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";
import { createTransaction as mockCreateTransaction } from "./_utils/mock_db";

// TreeFi Constants (duplicated for backend)
import { DAILY_REWARDS } from '../../src/lib/constants';

const CLAIM_FEE_SCHEDULE = [
  { day: 1, fee: 50 },
  { day: 2, fee: 45 },
  { day: 3, fee: 40 },
  { day: 4, fee: 35 },
  { day: 5, fee: 30 },
  { day: 6, fee: 25 },
  { day: 7, fee: 20 },
  { day: 8, fee: 15 },
  { day: 9, fee: 10 },
  { day: 10, fee: 0 },
];

const SEASON_ZERO_START = new Date('2024-12-15T00:00:00Z').getTime();
const SEASON_ZERO_DURATION = 10 * 24 * 60 * 60 * 1000;
const SEASON_ZERO_END = SEASON_ZERO_START + SEASON_ZERO_DURATION;

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client not configured, using mock DB for claim');
}

/**
 * Get current day of Season 0
 * Returns day number (1-10) or null if season not active
 */
function getCurrentSeasonDay(currentTime: number): number | null {
  if (currentTime < SEASON_ZERO_START || currentTime > SEASON_ZERO_END) {
    return null; // Season not active
  }
  const daysPassed = (currentTime - SEASON_ZERO_START) / (24 * 60 * 60 * 1000);
  return Math.floor(daysPassed) + 1; // Day 1-10
}

/**
 * Get claim fee percentage based on day of Season 0
 */
export function getClaimFeePercentage(dayNumber: number | null): number {
  if (dayNumber === null) return 0; // Season ended, no fee
  if (dayNumber < 1 || dayNumber > 10) return 0;
  const schedule = CLAIM_FEE_SCHEDULE;
  const dayEntry = schedule.find(s => s.day === dayNumber);
  return dayEntry ? dayEntry.fee : 0;
}

/**
 * Compute claim amounts and time window for a given farming state
 */
export function computeClaim(farmingState: any, currentTime = Date.now(), feePercentage = 0) {
  const activeItems = farmingState.active_items || [];
  if (!activeItems || activeItems.length !== 3) {
    return { ok: false, error: 'farming not active - all 3 items must be active' };
  }

  const now = currentTime;
  const expiries = activeItems.map((i: any) => Number(i.expiresAt || i.expires_at || 0));
  const earliestExpiry = Math.min(...expiries);
  if (earliestExpiry <= now) {
    return { ok: false, error: 'farming not active - items expired' };
  }

  const dailyReward = (DAILY_REWARDS as any)[farmingState.nft_rarity] || 0;
  const lastClaimed = farmingState.last_claimed_at ? new Date(farmingState.last_claimed_at).getTime() : new Date(farmingState.farming_started || Date.now()).getTime();
  const effectiveEnd = Math.min(now, earliestExpiry);
  const effectiveSeconds = Math.max(0, (effectiveEnd - lastClaimed) / 1000);
  const secondsPerDay = 24 * 60 * 60;
  const daysSinceLastClaim = effectiveSeconds / secondsPerDay;

  if (effectiveSeconds <= 0) {
    return { ok: false, error: 'no rewards available to claim' };
  }

  const grossRewards = (dailyReward * daysSinceLastClaim);
  const fee = (grossRewards * feePercentage) / 100;
  const netRewards = Math.max(0, grossRewards - fee);

  return {
    ok: true,
    dailyReward,
    earliestExpiry,
    lastClaimed,
    effectiveEnd,
    effectiveSeconds,
    daysSinceLastClaim,
    grossRewards,
    fee,
    netRewards,
  };
}

export const handler: Handler = async (event: any) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  
  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: "request body required" }) };
    
    let body: any;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid JSON" }) };
    }

    const { nftId, txHash } = body;
    if (!nftId || !txHash) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "nftId and txHash required" }) };
    }

    // Verify transaction fee payment on-chain
    try {
      const { verifyERC20Transfer } = await import('./_utils/web3');
      const { TF_TOKEN_CONTRACT, GAME_WALLET, TRANSACTION_FEE_TF } = await import('../../src/lib/constants');
      const ok = await verifyERC20Transfer(txHash, TF_TOKEN_CONTRACT, GAME_WALLET, TRANSACTION_FEE_TF);
      if (!ok) return { statusCode: 400, headers, body: JSON.stringify({ error: 'on-chain tx verification failed' }) };
    } catch (err) {
      console.error('tx verification error', err);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'tx verification error' }) };
    }

    // Authenticate using session cookie
    const session = verifySession(event.headers.cookie);
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "not authenticated" }) };
    }
    const address = session.address;

    const currentTime = Date.now();
    const currentSeasonDay = getCurrentSeasonDay(currentTime);
    const feePercentage = getClaimFeePercentage(currentSeasonDay);

    if (!supabase) {
      // Mock implementation
      // For demo purposes, return mock claim data
      const mockRarity = 'Rare';
      const dailyReward = DAILY_REWARDS[mockRarity as keyof typeof DAILY_REWARDS] || 0;
      const daysSinceLastClaim = 1;
      const grossRewards = dailyReward * daysSinceLastClaim;
      const fee = (grossRewards * feePercentage) / 100;
      const netRewards = Math.max(0, grossRewards - fee);

      const mockTx = mockCreateTransaction(address, 'claim', netRewards, {
        nftId,
        seasonDay: currentSeasonDay,
        feePercentage,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          nftId,
          seasonDay: currentSeasonDay,
          seasonActive: currentSeasonDay !== null,
          grossRewards,
          feePercentage,
          fee,
          netRewards,
          tx: mockTx,
        }),
      };
    }

    // Fetch farming state for this NFT
    const { data: farmingState, error: fetchErr } = await supabase
      .from("farming_state")
      .select("*")
      .eq("nft_id", nftId)
      .eq("user_id", (await supabase.from("users").select("id").eq("wallet_address", address).single()).data?.id)
      .single();

    if (fetchErr || !farmingState) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "farming state not found" }) };
    }

    // Use computeClaim helper to validate and compute reward amounts
    const claimResult = computeClaim(farmingState, currentTime, feePercentage);
    if (!claimResult.ok) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: claimResult.error }) };
    }

    const { dailyReward, grossRewards, fee, netRewards, daysSinceLastClaim, effectiveEnd, earliestExpiry } = claimResult;

    // Log claim to history
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert([{
        user_id: farmingState.user_id,
        type: "claim",
        amount: Math.floor(netRewards * 100) / 100,
        metadata: {
          nftId,
          seasonDay: currentSeasonDay,
          feePercentage,
          grossRewards,
        },
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (txErr) throw txErr;

    // Update last claimed time to the effectiveEnd so future claims won't double-count
    await supabase
      .from("farming_state")
      .update({ last_claimed_at: new Date(effectiveEnd).toISOString(), updated_at: new Date().toISOString(), is_farming_active: earliestExpiry > Date.now() })
      .eq("id", farmingState.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        nftId,
        rarity: farmingState.nft_rarity,
        seasonDay: currentSeasonDay,
        seasonActive: currentSeasonDay !== null,
        daysSinceLastClaim: Math.floor(daysSinceLastClaim),
        dailyReward,
        grossRewards: Math.floor(grossRewards * 100) / 100,
        feePercentage,
        fee: Math.floor(fee * 100) / 100,
        netRewards: Math.floor(netRewards * 100) / 100,
        tx,
      }),
    };
  } catch (err: any) {
    console.error("claim error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
