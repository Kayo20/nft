import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { OpenChestSchema, validateRequest } from "./_utils/validation";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";
import { insertNft as mockInsertNft } from "./_utils/mock_db";
import { verifyERC20Transfer } from './_utils/web3';
import { TF_TOKEN_CONTRACT, GAME_WALLET, CHEST_PRICE } from '../../src/lib/constants';

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client not configured, using mock DB for open-chest');
}

const PROBS = [
  // TreeFi Spec: Chests only give Uncommon rarity NFTs
  { rarity: "Uncommon", p: 1.0 }, // 100% Uncommon from chests
];

function pickRarity() {
  // Always return Uncommon per TreeFi spec
  return "Uncommon";
}

const POWER_MAP: Record<string, number> = {
  Uncommon: 100,
  Rare: 400,
  Epic: 1400,
  Legendary: 5000,
};

export const handler: Handler = async (event) => {
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

    const validation = validateRequest(OpenChestSchema, body);
    if (!validation.valid) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
    }
    const { type, txHash } = validation.data!;

    // Authenticate using session cookie
    const session = verifySession(event.headers.cookie);
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "not authenticated" }) };
    }
    const address = session.address;

    const rarity = pickRarity();
    const power = POWER_MAP[rarity] || 0;

    if (!supabase) {
      const created = mockInsertNft({ owner_address: address, rarity, power, metadata: { chest_type: type, txHash } });
      return { statusCode: 200, headers, body: JSON.stringify({ nft: created }) };
    }

    // Require an on-chain txHash and verify it corresponds to chest price + transaction fee
    if (!txHash) return { statusCode: 400, headers, body: JSON.stringify({ error: 'txHash required' }) };
    try {
      const expected = CHEST_PRICE + (await import('../../src/lib/constants')).TRANSACTION_FEE_TF;
      const verified = await verifyERC20Transfer(txHash, TF_TOKEN_CONTRACT, GAME_WALLET, expected);
      if (!verified) return { statusCode: 400, headers, body: JSON.stringify({ error: 'on-chain tx verification failed' }) };
    } catch (err) {
      console.error('tx verification error', err);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'tx verification error' }) };
    }

    const { data: created, error: insertErr } = await supabase
      .from("nfts")
      .insert([
        {
          owner_address: address,
          rarity,
          power,
          daily_yield: 0,
          health: 100,
          image_url: null,
          metadata: { chest_type: type, txHash },
          status: "active",
        },
      ])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Log chest purchase transaction (use user_id)
    try {
      const fee = (await import('../../src/lib/constants')).TRANSACTION_FEE_TF;
      const { data: userRow, error: uErr } = await supabase.from('users').select('id').eq('wallet_address', address).single();
      const userId = (userRow && userRow.id) ? userRow.id : null;
      await supabase.from('transactions').insert([{ user_id: userId, type: 'chest', amount: CHEST_PRICE, fee, total_paid: CHEST_PRICE + fee, metadata: { type, txHash } }]);
    } catch (err) {
      console.warn('Failed to log chest transaction', err);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ nft: created }) };
  } catch (err: any) {
    console.error("open-chest error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
