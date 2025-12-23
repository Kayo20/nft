import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { validateRequest } from "./_utils/validation";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";
import { insertNft as mockInsertNft } from "./_utils/mock_db";
import { getCodeRecord, claimCode } from "./_utils/gift_codes";

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client not configured, using mock DB for redeem-gift-code');
}

const POWER_MAP: Record<string, number> = {
  Uncommon: 100,
  Rare: 400,
  Epic: 1400,
  Legendary: 5000,
};


export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: "request body required" }) };

    let body: any;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      console.error('redeem-gift-code: invalid JSON', event.body);
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid JSON" }) };
    }

    const { code } = body;
    console.log('redeem-gift-code: incoming code:', code);
    if (!code || typeof code !== 'string') {
      console.warn('redeem-gift-code: missing code');
      return { statusCode: 400, headers, body: JSON.stringify({ error: "gift code required" }) };
    }

    // Authenticate using session cookie
    const session = verifySession(event.headers.cookie);
    if (!session) {
      console.warn('redeem-gift-code: not authenticated');
      return { statusCode: 401, headers, body: JSON.stringify({ error: "not authenticated" }) };
    }
    const address = session.address;
    console.log(`redeem-gift-code: session address=${address}`);
    console.log('redeem-gift-code: SUPABASE_URL', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/https?:\/\//, '') : 'none');
    // Check if code exists and is valid
    const codeRecord = await getCodeRecord(code);
    console.log('redeem-gift-code: codeRecord=', codeRecord);
    if (!codeRecord) {
      console.warn('redeem-gift-code: invalid code');
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid gift code" }) };
    }

    if (codeRecord.claimed) {
      console.warn('redeem-gift-code: already claimed');
      return { statusCode: 400, headers, body: JSON.stringify({ error: "This gift code has already been claimed" }) };
    }

    // Mark code as claimed using shared util
    const claimRes = await claimCode(code, address);
    console.log('redeem-gift-code: claimRes=', claimRes);
    if (!claimRes.success) {
      console.warn('redeem-gift-code: claim failed', claimRes.message);
      return { statusCode: 400, headers, body: JSON.stringify({ error: claimRes.message }) };
    }

    // Create free Uncommon NFT
    const rarity = "Uncommon";
    const power = POWER_MAP[rarity] || 0;

    if (!supabase) {
      const created = mockInsertNft({ owner_address: address, rarity, power, metadata: { claimed_via_gift_code: code } });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, tree: created, message: "Gift code claimed! You received a free Uncommon tree." }) };
    }

    const { data: created, error: insertErr } = await supabase
      .from("nfts")
      .insert([
        {
          owner_address: address,
          rarity,
          power,
          daily_yield: (await import('../../src/lib/constants')).DAILY_REWARDS[rarity as any] || 0,
          health: 100,
          image_url: null,
          metadata: { claimed_via_gift_code: code },
        },
      ])
      .select()
      .single();

    if (insertErr || !created) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to create NFT" }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, tree: created, message: "Gift code claimed! You received a free Uncommon tree." }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
