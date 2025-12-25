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

    // Get TF balance from user profile (stored in Supabase)
    let tfBalance = 0;
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("users")
          .select("profile")
          .eq("wallet_address", address)
          .single();
        if (error) console.warn('user-balances: profile fetch error', error.message || error);

        if (data && data.profile && data.profile.tfBalance !== undefined) {
          tfBalance = data.profile.tfBalance;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch TF balance from Supabase:', e);
    }

    // Get BNB balance from on-chain (requires ethers provider)
    let bnbBalance = 0;
    let ethBalance = 0;
    try {
      // If BNB_RPC_URL is set, fetch balance from blockchain
      if (process.env.BNB_RPC_URL) {
        const { ethers } = await import('ethers');
        const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL);
        const balance = await provider.getBalance(address);
        // Convert from Wei to BNB (divide by 10^18)
        bnbBalance = parseFloat(ethers.formatEther(balance));
      }
    } catch (e) {
      console.warn('Failed to fetch BNB balance from RPC:', e);
      // Fallback: return 0 for BNB balance if RPC fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        address,
        tfBalance,
        bnbBalance,
        ethBalance,
      }),
    };
  } catch (err: any) {
    console.error("user-balances error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
