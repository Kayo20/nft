import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { PurchaseRequestSchema, validateRequest } from "./_utils/validation";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";
import { getItemById as mockGetItemById, createTransaction as mockCreateTransaction, upsertInventory as mockUpsertInventory } from "./_utils/mock_db";

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
    const { itemId, qty } = validation.data!;

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
      const tx = mockCreateTransaction(address, 'purchase', total, { itemId, qty });
      mockUpsertInventory(address, itemId, qty);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tx }) };
    }

    // Fetch item
    const { data: item, error: itemErr } = await supabase.from("items").select("*").eq("id", itemId).single();
    if (itemErr || !item) return { statusCode: 400, headers, body: JSON.stringify({ error: "item not found" }) };

    const total = Number(item.price || 0) * Number(qty);

    // Create transaction row
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert([{ user_address: address, type: "purchase", amount: total, metadata: { itemId, qty } }])
      .select()
      .single();
    if (txErr) throw txErr;

    // Upsert inventory
    const { data: inv } = await supabase.from("inventories").select("id, qty").eq("user_address", address).eq("item_id", itemId).single();
    if (inv && inv.id) {
      await supabase.from("inventories").update({ qty: Number(inv.qty) + Number(qty) }).eq("id", inv.id);
    } else {
      await supabase.from("inventories").insert([{ user_address: address, item_id: itemId, qty }]);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tx }) };
  } catch (err: any) {
    console.error("shop-purchase error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
