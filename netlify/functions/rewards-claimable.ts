import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, securityHeaders } from "./_utils/auth";
import { verifySession } from "./_utils/auth";

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client initialization failed:', e);
}

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // Verify session
    const session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
    }

    const address = session.address;

    // Fetch user's accumulated rewards from NFTs
    const { data: nfts } = await supabase
      .from("nfts")
      .select("accumulatedRewards, dailyYield, lastFarmed")
      .eq("owner", address)
      .catch(() => ({ data: [] }));

    const nftList = nfts || [];

    // Calculate total accumulated rewards (sum of all NFTs)
    let totalAccumulated = 0;
    nftList.forEach((nft: any) => {
      totalAccumulated += nft.accumulatedRewards || 0;
      // Add accrued rewards since last farm if applicable
      if (nft.lastFarmed && nft.dailyYield) {
        const lastFarmedTime = new Date(nft.lastFarmed).getTime();
        const now = Date.now();
        const hoursSinceFarmed = (now - lastFarmedTime) / (1000 * 60 * 60);
        const accrued = (nft.dailyYield / 24) * hoursSinceFarmed;
        totalAccumulated += accrued;
      }
    });

    // Get last claim time
    const { data: userProfile } = await supabase
      .from("users")
      .select("profile")
      .eq("wallet_address", address)
      .single()
      .catch(() => ({ data: null }));

    const lastClaimAt = userProfile?.profile?.lastClaimAt ? new Date(userProfile.profile.lastClaimAt) : null;
    const now = new Date();

    // Calculate days since last claim
    let daysSinceLastClaim = 0;
    if (lastClaimAt) {
      const diffMs = now.getTime() - lastClaimAt.getTime();
      daysSinceLastClaim = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Fee schedule: 30% → 0% over 10 days
    // Formula: max(0, 30 - (daysSinceLastClaim * 3))
    const feePercentage = Math.max(0, 30 - daysSinceLastClaim * 3);

    // Calculate net amount
    const netAmount = totalAccumulated * (1 - feePercentage / 100);
    const claimableNow = totalAccumulated;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        address,
        totalAccumulated,
        claimableNow,
        feePercentage,
        netAmount,
        lastClaimAt: lastClaimAt?.toISOString() || null,
        daysSinceLastClaim,
      }),
    };
  } catch (err: any) {
    console.error("rewards-claimable error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
