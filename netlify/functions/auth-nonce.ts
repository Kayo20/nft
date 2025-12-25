import { Handler } from "@netlify/functions";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NonceRequestSchema, validateRequest } from "./_utils/validation";
import { corsHeaders, securityHeaders } from "./_utils/auth";
import { getNonce, setNonce, clearExpired } from "./_utils/in_memory_nonce";

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client initialization failed, will use in-memory store:', e);
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

    const validation = validateRequest(NonceRequestSchema, body);
    if (!validation.valid) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
    }
    const { address } = validation.data!;

    const addr = address.toLowerCase();
    const now = Date.now();

    // Try Supabase first, fallback to in-memory store
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('nonces')
          .select('nonce, expires_at')
          .eq('address', addr)
          .single();
        
        if (!error && data && data.nonce && data.expires_at) {
          const expires = new Date(data.expires_at).getTime();
          if (expires > now) {
            return { statusCode: 200, headers, body: JSON.stringify({ nonce: data.nonce }) };
          }
        }
      }
    } catch (e) {
      console.warn('Supabase query failed, checking memory store:', e);
    }

    // Check in-memory store
    clearExpired();
    const stored = getNonce(addr);
    if (stored && stored.expiresAt > now) {
      return { statusCode: 200, headers, body: JSON.stringify({ nonce: stored.nonce }) };
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // Store in memory (always works)
    setNonce(addr, nonce, expiresAt);

    // Try to persist to Supabase
    let persistedToDb = false;
    try {
      if (supabase) {
        const expiresAtIso = new Date(expiresAt).toISOString();
        const { error: upError } = await supabase.from('nonces').upsert({ address: addr, nonce, expires_at: expiresAtIso }, { onConflict: ['address'] });
        if (!upError) persistedToDb = true;
      }
    } catch (e) {
      console.warn('Failed to persist nonce to Supabase, using memory store:', e);
    }

    // TEMP LOG: show when nonces are created (enable in dev/testing or set DEBUG_NONCES=true)
    try {
      const debugNonces = process.env.DEBUG_NONCES === 'true' || process.env.NODE_ENV !== 'production';
      if (debugNonces) {
        console.log('auth-nonce: created nonce', { address: addr, nonce, expiresAt: new Date(expiresAt).toISOString(), persistedToDb });
      }
    } catch (e) {
      // ignore logging errors
    }

    // Also set a short-lived HttpOnly cookie with the nonce so verify can read it
    const cookie = `treefi_nonce=${nonce}; Path=/; Max-Age=${Math.floor((expiresAt - now) / 1000)}; SameSite=Strict; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}`;

    return { statusCode: 200, headers: { ...headers, 'Set-Cookie': cookie }, body: JSON.stringify({ nonce }) };
  } catch (err: any) {
    console.error("auth-nonce error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
