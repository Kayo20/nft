import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";
import { getFarmingState as mockGetFarmingState } from "./_utils/mock_db";

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client not configured, using mock DB for farming states');
}

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  try {
    const session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    if (!session) return { statusCode: 401, headers, body: JSON.stringify({ error: 'unauthorized' }) };
    const address = (session.address || '').toLowerCase();

    if (!supabase) {
      // In mock mode, return farming states for NFTs owned by this address from the mock DB
      // _utils/mock_db exposes getFarmingState and we can inspect all nfts
      const { getAllNfts } = await import('./_utils/mock_db');
      const nfts = getAllNfts(address);
      const states = nfts.map((n: any) => ({ nftId: n.id, farming: mockGetFarmingState(n.id) })).filter(s => s.farming);
      return { statusCode: 200, headers, body: JSON.stringify({ farmingStates: states }) };
    }

    // Supabase mode: lookup user id by wallet address
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address)
      .single();

    if (!user) return { statusCode: 200, headers, body: JSON.stringify({ farmingStates: [] }) };

    const { data: states, error } = await supabase
      .from('farming_state')
      .select('nft_id, farming_started, active_items, is_farming_active')
      .eq('user_id', user.id);

    if (error) throw error;

    return { statusCode: 200, headers, body: JSON.stringify({ farmingStates: states || [] }) };
  } catch (err: any) {
    console.error('get-farming-states error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal server error' }) };
  }
};
