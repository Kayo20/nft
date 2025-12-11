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

    // Fetch user NFTs to calculate stats
    const { data: nfts } = await supabase
      .from("nfts")
      .select("*")
      .eq("owner", address)
      .catch(() => ({ data: [] }));

    const nftList = nfts || [];

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", address)
      .single()
      .catch(() => ({ data: null }));

    // Calculate stats from NFTs
    const totalTrees = nftList.length;
    const totalPower = nftList.reduce((sum: number, nft: any) => sum + (nft.power || 0), 0);
    const dailyYield = nftList.reduce((sum: number, nft: any) => sum + (nft.dailyYield || 0), 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        address,
        createdAt: userProfile?.created_at || new Date().toISOString(),
        totalTrees,
        totalPower,
        dailyYield,
        profile: userProfile?.profile || {},
      }),
    };
  } catch (err: any) {
    console.error("user-profile error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
