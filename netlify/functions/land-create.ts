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

    const address = (session.address || '').toLowerCase();

    const slots = 9;
    const newLand = {
      owner: address,
      season: 0,
      name: 'Land 1',
      slots,
      createdAt: new Date().toISOString(),
    };

    if (!supabase) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'supabase not configured' }) };
    }

    // Insert land
    const { data: createdLands, error: landErr } = await supabase
      .from('lands')
      .insert([newLand])
      .select();

    if (landErr || !createdLands || createdLands.length === 0) {
      console.error('Failed to create land', landErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to create land' }) };
    }

    const created = createdLands[0];

    // Create empty slot rows for this land
    const slotInserts = Array.from({ length: slots }).map((_, i) => ({ land_id: created.id, slot_index: i, nft_id: null }));

    const { data: slotsCreated, error: slotsErr } = await supabase
      .from('land_slots')
      .insert(slotInserts)
      .select();

    if (slotsErr) {
      console.warn('Failed to create land_slots rows:', slotsErr);
      // not fatal - continue
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, land: created }),
    };
  } catch (err: any) {
    console.error('land-create error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal server error' }) };
  }
};
