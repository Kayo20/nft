import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";
import { getNftsByOwner as mockGetNftsByOwner } from "./_utils/mock_db";

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  console.log('get-nfts: SUPABASE_URL', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/https?:\/\//, '') : 'none');
} catch (e) {
  console.warn('Supabase client not configured, using mock DB for get-nfts');
  console.warn('get-nfts: SUPABASE_URL env:', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/https?:\/\//, '') : 'none');
}

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  
  try {
    const ownerParam = event.queryStringParameters?.owner;

    // If owner param not provided, try to read from session cookie
    let owner = ownerParam;
    if (!owner) {
      const session = verifySession(event.headers.cookie);
      if (session) {
        owner = session.address;
      }
    }

    if (!owner) return { statusCode: 400, headers, body: JSON.stringify({ error: "owner query param or session required" }) };

    if (!supabase) {
      const nfts = mockGetNftsByOwner(owner.toLowerCase());
      return { statusCode: 200, headers, body: JSON.stringify({ nfts }) };
    }

    const { data, error } = await supabase
      .from("nfts")
      .select("id, owner_address, rarity, power, daily_yield, image_url, metadata, status, created_at")
      .eq("owner_address", owner.toLowerCase())
      .eq("status", "active");

    if (error) throw error;
    return { statusCode: 200, headers, body: JSON.stringify({ nfts: data || [] }) };
  } catch (err: any) {
    console.error("get-nfts error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
