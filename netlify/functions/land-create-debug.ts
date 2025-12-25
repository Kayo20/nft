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
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    const session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    if (!session) return { statusCode: 401, headers, body: JSON.stringify({ error: 'unauthorized' }) };
    const address = (session.address || '').toLowerCase();

    const result: any = { ok: true, address, supabaseConfigured: !!supabase };

    try {
      // basic connectivity
      const { data: landsCount } = await supabase.from('lands').select('id').limit(1);
      result.landsSample = (landsCount || []).length;
    } catch (e) {
      result.landsError = String(e?.message || e);
    }

    // Try idempotent upsert of a debug land for this user
    try {
      const debugLand = { owner: address, season: 0, name: 'Debug Land', slots: 9 };
      const { data: upserted, error: upsertErr } = await supabase.from('lands').upsert([debugLand], { onConflict: ['owner'] }).select();
      result.upsert = { ok: true, upserted: upserted && upserted[0] ? upserted[0] : null };
      if (upsertErr) {
        result.upsert.ok = false;
        result.upsert.error = String(upsertErr?.message || upsertErr);
      }
    } catch (e) {
      result.upsert = { ok: false, error: String(e?.message || e) };
    }

    // Try to insert slots for the debug land (idempotent)
    try {
      const { data: landRow } = await supabase.from('lands').select('*').eq('owner', address).single();
      if (landRow && landRow.id) {
        const slotInserts = Array.from({ length: 9 }).map((_, i) => ({ land_id: landRow.id, slot_index: i, nft_id: null }));
        const { error: slotsErr } = await supabase.from('land_slots').upsert(slotInserts, { onConflict: ['land_id', 'slot_index'] });
        result.slots = { ok: !slotsErr, error: slotsErr ? String(slotsErr?.message || slotsErr) : null };
      } else {
        result.slots = { ok: false, error: 'no landRow after upsert' };
      }
    } catch (e) {
      result.slots = { ok: false, error: String(e?.message || e) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err: any) {
    console.error('land-create-debug error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal server error', details: String(err?.message || err) }) };
  }
};