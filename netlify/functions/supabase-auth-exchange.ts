import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client initialization failed in supabase-auth-exchange:', e);
}

// WARNING: This endpoint issues a short-lived, safe token to the client to allow
// client-side Supabase auth (optional). It only issues a token for an existing
// authenticated session (validated by treefi_session cookie). It does NOT return
// the service role key. Use with caution and review security policy before enabling
// in production.

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    const session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    if (!session) return { statusCode: 401, headers, body: JSON.stringify({ error: 'not authenticated' }) };

    const address = session.address;

    if (!supabase) return { statusCode: 500, headers, body: JSON.stringify({ error: 'supabase not configured' }) };

    // Ensure a corresponding Supabase Auth user exists with an identifier linked to this wallet.
    // We create a user using the service role key but do not expose service key to the client.
    const email = `${address}@treefi.local`;

    try {
      // Create user if not exists using admin API
      const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        user_metadata: { wallet_address: address },
        email_confirm: true,
      });
      if (createErr) {
        // If user exists, ignore the error
        console.warn('createUser response', createErr.message || createErr);
      }
    } catch (e) {
      // ignore create errors for idempotence
      console.warn('supabase admin.createUser failed (ignored):', e);
    }

    // Generate a signed, short-lived JWT for the client to use with supabase-js.
    // IMPORTANT: This uses the admin RPC `generate_signin_token` which may not exist on your project.
    // This is a conservative attempt; if not available, return a friendly message to use server-side endpoints.

    try {
      // Attempt to call a Postgres RPC that creates a custom_token for the user. If your project
      // has a secure function `rpc_generate_signin_token(address)` you can implement it and return a token.
      const { data } = await supabase.rpc('rpc_generate_signin_token', { wallet_address: address });
      if (data && data[0] && data[0].token) {
        return { statusCode: 200, headers, body: JSON.stringify({ token: data[0].token }) };
      }
    } catch (e) {
      console.warn('rpc_generate_signin_token not available or failed:', e?.message || e);
    }

    // Fallback: return user id so client can continue using server-side protected endpoints
    const { data: userRow } = await supabase.from('users').select('id, wallet_address').eq('wallet_address', address).single();

    // Ensure default land exists for this user (idempotent)
    try {
      const defaultLand = { owner: address, season: 0, name: 'Land 1', slots: 9 };
      await supabase.from('lands').upsert(defaultLand, { onConflict: ['owner'] }).select().catch(() => ({ data: null }));
      const { data: land } = await supabase.from('lands').select('*').eq('owner', address).single().catch(() => ({ data: null }));
      if (land && land.id) {
        const slots = land.slots || 9;
        const slotInserts = [];
        for (let i = 0; i < slots; i++) slotInserts.push({ landId: land.id, slotIndex: i });
        await supabase.from('land_slots').upsert(slotInserts, { onConflict: ['landId', 'slotIndex'] }).select().catch(() => ({ data: null }));
      }
    } catch (e) {
      console.warn('supabase-auth-exchange: failed to ensure default land for user', e?.message || e);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, user: userRow, note: 'No client token issued; use server endpoints for protected operations' }) };
  } catch (err: any) {
    console.error('supabase-auth-exchange error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal server error' }) };
  }
};
