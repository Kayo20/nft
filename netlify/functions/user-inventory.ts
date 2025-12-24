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
    let session: any;
    try {
      session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    } catch (err) {
      console.warn('Session verification failed:', err);
      return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
    }
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
    }

    const address = session.address;

    if (!supabase) {
      // Supabase unavailable — return empty inventory as a safe fallback
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          address,
          items: [],
          water: 0,
          fertilizer: 0,
          antiBug: 0,
        }),
      };
    }

    // Resolve user UUID
    const { data: userRow, error: userErr } = await supabase.from('users').select('id').eq('wallet_address', address).single();
    const userId = userRow?.id || null;

    // Fetch inventory rows (user_id, item_id, qty)
    const { data: rows, error: invErr } = await supabase
      .from("inventories")
      .select("item_id, qty")
      .eq("user_id", userId);

    if (!rows || rows.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          address,
          items: [],
          water: 0,
          fertilizer: 0,
          antiBug: 0,
        }),
      };
    }

    // Transform to key:count map for compatibility with older UI
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[r.item_id] = Number(r.qty || 0);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        address,
        items: rows,
        water: map['water'] || 0,
        fertilizer: map['fertilizer'] || 0,
        antiBug: map['antiBug'] || 0,
      }),
    };
  } catch (err: any) {
    console.error("user-inventory error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
