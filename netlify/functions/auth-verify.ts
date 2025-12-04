import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { VerifySchema, validateRequest } from "./_utils/validation";
import { corsHeaders, securityHeaders } from "./_utils/auth";
import { verifyMessage } from "ethers";
import { getNonce, deleteNonce, clearExpired } from "./_utils/in_memory_nonce";

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client initialization failed:', e);
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

    const validation = validateRequest(VerifySchema, body);
    if (!validation.valid) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
    }
    const { message, signature } = validation.data!;

    // Minimal SIWE parsing & verification (no external `siwe` lib required)
    // Extract structured fields from the message text
    const lines = message.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // Domain is the prefix before " wants you to sign" on the first non-empty line
    const firstLine = lines[0] || '';
    const domainMatch = firstLine.match(/^([^\s]+)\s+wants you to sign/i);
    const messageDomain = domainMatch ? domainMatch[1] : null;

    // Extract the address (EIP-4361 messages include the address on its own line)
    const addressLine = lines.find(l => /^0x[a-fA-F0-9]{40}$/i.test(l));
    if (!addressLine) return { statusCode: 400, headers, body: JSON.stringify({ error: "could not parse address from message" }) };
    const messageAddress = addressLine;

    // Extract nonce from message (line starting with "Nonce:")
    const nonceMatch = message.match(/Nonce:\s*([A-Za-z0-9-_]+)/i);
    if (!nonceMatch) return { statusCode: 400, headers, body: JSON.stringify({ error: "nonce not found in message" }) };
    const messageNonce = nonceMatch[1];

    // Extract chainId (line starting with "Chain ID:")
    const chainMatch = message.match(/Chain ID:\s*(\d+)/i);
    const messageChainId = chainMatch ? Number(chainMatch[1]) : null;

    // Extract URI (line starting with "URI:")
    const uriMatch = message.match(/URI:\s*(\S+)/i);
    const messageUri = uriMatch ? uriMatch[1] : null;

    // Extract Issued At
    const issuedAtMatch = message.match(/Issued At:\s*(.+)/i);
    const messageIssuedAt = issuedAtMatch ? new Date(issuedAtMatch[1]) : null;

    // Recover address from signature using ethers
    let recovered: string;
    try {
      recovered = verifyMessage(message, signature);
    } catch (e: any) {
      console.error('verifyMessage failed', e);
      return { statusCode: 401, headers, body: JSON.stringify({ error: "signature verification failed" }) };
    }

    if (recovered.toLowerCase() !== messageAddress.toLowerCase()) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "signature does not match message address" }) };
    }

    // Validate domain, chain, and issuedAt
    try {
      const expectedOrigin = process.env.APP_DOMAIN || 'http://localhost:5173';
      const expectedHost = (() => { try { return new URL(expectedOrigin).host; } catch { return expectedOrigin; } })();
      if (messageDomain && expectedHost && messageDomain.toLowerCase() !== expectedHost.toLowerCase()) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'message domain does not match APP_DOMAIN' }) };
      }

      const expectedChain = process.env.POLYGON_CHAIN_ID ? Number(process.env.POLYGON_CHAIN_ID) : 137;
      if (messageChainId && messageChainId !== expectedChain) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'message chainId is not Polygon' }) };
      }

      if (messageIssuedAt) {
        const now = Date.now();
        const issuedTs = messageIssuedAt.getTime();
        // issuedAt should not be more than 5 minutes in the future
        if (issuedTs > now + 5 * 60 * 1000) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'message issuedAt is in the future' }) };
        }
      }
    } catch (e) {
      // ignore parsing errors and continue with caution
    }

    const addr = messageAddress.toLowerCase();
    let stored = null;
    
    // Try to get nonce from Supabase first
    try {
      if (supabase) {
        const { data } = await supabase.from("nonces").select("nonce, expires_at").eq("address", addr).single().catch(() => ({ data: null }));
        stored = data;
      }
    } catch (e) {
      console.warn('Failed to fetch nonce from Supabase:', e);
    }
    
    // Fall back to in-memory store
    if (!stored) {
      clearExpired();
      const inMemory = getNonce(addr);
      if (inMemory) {
        stored = { nonce: inMemory.nonce, expires_at: new Date(inMemory.expiresAt).toISOString() };
      }
    }

    if (!stored || stored.nonce !== messageNonce) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "invalid nonce" }) };
    }

    // Check if nonce has expired
    if (stored.expires_at) {
      const expires = new Date(stored.expires_at).getTime();
      if (expires < Date.now()) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "nonce expired" }) };
      }
    }

    // Upsert user to Supabase
    try {
      if (supabase) {
        const profile = { wallet_address: addr, last_seen: new Date().toISOString() };
        await supabase.from("users").upsert({ wallet_address: addr, profile }, { onConflict: ["wallet_address"] }).catch(() => {});
        // Clear nonce from Supabase
        await supabase.from("nonces").delete().eq("address", addr).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to update Supabase:', e);
    }
    
    // Clear from in-memory store
    try { deleteNonce(addr); } catch (e) { /* ignore */ }

    // Create a signed JWT session and set as HttpOnly cookie
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not set; proceeding without session cookie');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, address: addr }),
      };
    }

    const token = jwt.sign({ address: addr }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds

    const cookie = `treefi_session=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}`;

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': cookie,
        ...headers,
      },
      body: JSON.stringify({ ok: true, address: addr }),
    };
  } catch (err: any) {
    console.error("auth-verify error", err);
    return { statusCode: 401, headers, body: JSON.stringify({ error: "verification failed" }) };
  }
};
