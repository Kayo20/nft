import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";

// TreeFi Constants (duplicated for backend)
const ITEM_CONSUMPTION_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client not configured');
}

interface StartFarmingRequest {
  nftId: number;
  itemIds: ('water' | 'fertilizer' | 'antiBug')[];
}

export const handler: Handler = async (event: any) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  
  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: "request body required" }) };
    
    let body: StartFarmingRequest;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid JSON" }) };
    }

    const { nftId, itemIds, txHash } = body;
    if (!nftId || !itemIds || !Array.isArray(itemIds) || !txHash) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "nftId, itemIds array and txHash required" }) };
    }

    // TreeFi Spec: Must have all 3 items (water, fertilizer, antiBug)
    const requiredItems = new Set(['water', 'fertilizer', 'antiBug']);
    const providedItems = new Set(itemIds);
    
    if (providedItems.size !== 3) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "must provide all 3 items: water, fertilizer, antiBug" }) };
    }

    for (const item of requiredItems) {
      if (!providedItems.has(item as any)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `missing item: ${item}` }) };
      }
    }

    // Authenticate using session cookie
    const session = verifySession(event.headers.cookie);
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "not authenticated" }) };
    }
    const address = session.address;

    // Verify the on-chain transaction corresponds to the fixed transaction fee
    try {
      const ok = await (await import('./_utils/web3')).verifyERC20Transfer(txHash, (await import('../../src/lib/constants')).TF_TOKEN_CONTRACT, (await import('../../src/lib/constants')).GAME_WALLET, (await import('../../src/lib/constants')).TRANSACTION_FEE_TF);
      if (!ok) return { statusCode: 400, headers, body: JSON.stringify({ error: 'on-chain tx verification failed' }) };
    } catch (err) {
      console.error('tx verification error', err);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'tx verification error' }) };
    }

    if (!supabase) {
      // Mock implementation (accept any txHash in mock mode)
      const currentTime = Date.now();
      const expiresAt = currentTime + ITEM_CONSUMPTION_INTERVAL; // 4 hours
      
      const activeItems = itemIds.map(itemId => ({
        itemId,
        expiresAt,
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          nftId,
          farmingStarted: new Date().toISOString(),
          activeItems,
          durationMs: ITEM_CONSUMPTION_INTERVAL,
          durationHours: 4,
          txHash,
          message: "Farming started (mock)",
        }),
      };
    }
    // Get user ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", address)
      .single();

    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "user not found" }) };
    }

    // Verify NFT ownership
    const { data: nft, error: nftErr } = await supabase
      .from("nfts")
      .select("*")
      .eq("id", nftId)
      .eq("owner_address", address)
      .single();

    if (nftErr || !nft) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "NFT not found or not owned by user" }) };
    }

    // Verify user has all items in inventory
    const { data: inventories, error: invErr } = await supabase
      .from("inventories")
      .select("item_id, qty")
      .eq("user_id", user.id)
      .in("item_id", itemIds);

    if (invErr) throw invErr;

    const inventoryMap = new Map((inventories as any[]).map((inv: any) => [inv.item_id, inv.qty]));
    for (const itemId of itemIds) {
      if ((inventoryMap.get(itemId) || 0) <= 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `insufficient ${itemId}` }) };
      }
    }

    // Deduct items from inventory
    for (const itemId of itemIds) {
      const current = inventoryMap.get(itemId) || 0;
      const inventoryId = (inventories as any[]).find((inv: any) => inv.item_id === itemId)?.id;
      if (inventoryId) {
        await supabase
          .from("inventories")
          .update({ qty: (current as number) - 1, updated_at: new Date().toISOString() })
          .eq("id", inventoryId);
      }
    }

    // Create/update farming state
    const currentTime = Date.now();
    const expiresAt = currentTime + ITEM_CONSUMPTION_INTERVAL; // 4 hours
    
    const activeItems = itemIds.map(itemId => ({
      itemId,
      expiresAt,
    }));

    const { data: farmingData, error: farmErr } = await supabase
      .from("farming_state")
      .upsert({
        user_id: user.id,
        nft_id: nftId,
        nft_rarity: nft.rarity,
        farming_started: new Date().toISOString(),
        active_items: activeItems,
        is_farming_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,nft_id' })
      .select()
      .single();

    if (farmErr) throw farmErr;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        nftId,
        nftRarity: nft.rarity,
        farmingStarted: farmingData.farming_started,
        activeItems,
        durationMs: ITEM_CONSUMPTION_INTERVAL,
        durationHours: 4,
        farmingUntil: new Date(expiresAt).toISOString(),
        message: "All 3 items active - farming in progress",
      }),
    };
  } catch (err: any) {
    console.error("farming error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
