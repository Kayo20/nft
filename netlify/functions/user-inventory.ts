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

    // Fetch inventory from Supabase
    const { data: inventory } = await supabase
      .from("inventories")
      .select("*")
      .eq("owner", address)
      .single()
      .catch(() => ({ data: null }));

    // If no inventory record, return zeros
    if (!inventory) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          address,
          water: 0,
          fertilizer: 0,
          antiBug: 0,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        address,
        water: inventory.water || 0,
        fertilizer: inventory.fertilizer || 0,
        antiBug: inventory.antiBug || 0,
      }),
    };
  } catch (err: any) {
    console.error("user-inventory error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
