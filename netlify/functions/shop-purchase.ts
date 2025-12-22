import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { PurchaseRequestSchema, validateRequest } from "./_utils/validation";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";
import { getItemById as mockGetItemById, createTransaction as mockCreateTransaction, upsertInventory as mockUpsertInventory } from "./_utils/mock_db";
import { verifyERC20Transfer } from "./_utils/web3";
import { TF_TOKEN_CONTRACT, GAME_WALLET } from '../../src/lib/constants';

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client not configured, using mock DB for shop-purchase');
}

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

    const validation = validateRequest(PurchaseRequestSchema, body);
    if (!validation.valid) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
    }
    const { itemId, qty, txHash } = validation.data!;

    // Authenticate using session cookie
    const session = verifySession(event.headers.cookie);
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "not authenticated" }) };
    }
    const address = session.address;

    // Fetch item (persisted or mock)
    if (!supabase) {
      const item = mockGetItemById(itemId);
      if (!item) return { statusCode: 400, headers, body: JSON.stringify({ error: "item not found (mock)" }) };
      const total = Number(item.price || 0) * Number(qty);
      // In mock mode, we can't verify on-chain txs — accept txHash for local dev
      const tx = mockCreateTransaction(address, 'purchase', total, { itemId, qty, txHash });
      mockUpsertInventory(address, itemId, qty);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tx }) };
    }

    // Fetch item
    const { data: item, error: itemErr } = await supabase.from("items").select("*").eq("id", itemId).single();
    if (itemErr || !item) return { statusCode: 400, headers, body: JSON.stringify({ error: "item not found" }) };

    const total = Number(item.price || 0) * Number(qty);

    // txHash is required and must correspond to item total + transaction fee
    if (!txHash) return { statusCode: 400, headers, body: JSON.stringify({ error: 'txHash required' }) };
    try {
      const expected = total + (await import('../../src/lib/constants')).TRANSACTION_FEE_TF;
      const verified = await verifyERC20Transfer(txHash, TF_TOKEN_CONTRACT, GAME_WALLET, expected);
      if (!verified) return { statusCode: 400, headers, body: JSON.stringify({ error: 'on-chain tx verification failed' }) };
    } catch (err) {
      console.error('tx verification error', err);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'tx verification error' }) };
    }

    // Resolve user UUID by wallet address and use user_id in inventories/transactions
    const { data: userRow, error: userErr } = await supabase.from('users').select('id, wallet_address').eq('wallet_address', address).single();
    if (userErr || !userRow) return { statusCode: 500, headers, body: JSON.stringify({ error: 'user lookup failed' }) };
    const userId = userRow.id;

    // Create transaction row (include on-chain tx hash and fee information)
    const feeAmount = (await import('../../src/lib/constants')).TRANSACTION_FEE_TF;
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert([{ user_id: userId, type: "purchase", amount: total, fee: feeAmount, total_paid: total + feeAmount, metadata: { itemId, qty, txHash } }])
      .select()
      .single();
    if (txErr) throw txErr;

    const { data: inv } = await supabase.from("inventories").select("id, qty").eq("user_id", userId).eq("item_id", itemId).single();
    if (inv && inv.id) {
      await supabase.from("inventories").update({ qty: Number(inv.qty) + Number(qty) }).eq("id", inv.id);
    } else {
      await supabase.from("inventories").insert([{ user_id: userId, item_id: itemId, qty }]);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tx }) };
  } catch (err: any) {
    console.error("shop-purchase error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
