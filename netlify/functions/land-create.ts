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

    // Ensure a users row exists (some installs may not have user row pre-created)
    try {
      const { data: userRow } = await supabase.from('users').select('*').eq('wallet_address', address).single().catch(() => ({ data: null }));
      if (!userRow) {
        try {
          await supabase.from('users').insert([{ wallet_address: address }]);
        } catch (e) {
          console.warn('Failed to insert minimal users row:', e);
          // continue - FK might still allow insert if user row is optional in local setups
        }
      }
    } catch (e) {
      // ignore
    }

    // Use upsert to create or return existing land for this owner (onConflict by owner)
    try {
      const { data: upserted, error: upsertErr } = await supabase
        .from('lands')
        .upsert([newLand], { onConflict: ['owner'] })
        .select();

      if (upsertErr) {
        console.error('Failed to upsert land', upsertErr);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to create land' }) };
      }

      const created = (upserted && upserted[0]) ? upserted[0] : null;
      if (!created) {
        console.error('Upsert returned no land row', upserted);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to create land' }) };
      }

      // Ensure land_slots exist (upsert ensures idempotency)
      const slotInserts = Array.from({ length: slots }).map((_, i) => ({ land_id: created.id, slot_index: i, nft_id: null }));
      try {
        const { error: slotsErr } = await supabase.from('land_slots').upsert(slotInserts, { onConflict: ['land_id', 'slot_index'] });
        if (slotsErr) console.warn('Failed to upsert land_slots rows:', slotsErr);
      } catch (e) {
        console.warn('Failed to upsert land_slots rows (exception):', e);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, land: created }),
      };
    } catch (e: any) {
      console.error('Failed to upsert or prepare land:', e);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to create land' }) };
    }
  } catch (err: any) {
    console.error('land-create error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal server error' }) };
  }
};
