import { createClient } from '@supabase/supabase-js';

type GiftRecord = { id?: number; code: string; claimed: boolean; claimedBy?: string | null; claimedAt?: string | null };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const REQUIRE_SUPABASE = process.env.SUPABASE_REQUIRED === 'true'; // Set in production Netlify env

let supabase: any | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    const msg = `Failed to create Supabase client for gift_codes util: ${err}`;
    if (REQUIRE_SUPABASE) throw new Error(msg);
    console.warn(`${msg}, falling back to in-memory`);
    supabase = null;
  }
} else {
  const msg = 'Supabase credentials not configured';
  if (REQUIRE_SUPABASE) throw new Error(msg);
  console.warn(`${msg}, falling back to in-memory`);
}

// In-memory fallback (dev/test only)
const IN_MEMORY: Record<string, GiftRecord> = (() => {
  if (REQUIRE_SUPABASE) throw new Error('In-memory gift codes not allowed in production mode');
  const codes: Record<string, GiftRecord> = {};
  for (let i = 1; i <= 100; i++) {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `OG-TREE-${String(i).padStart(5, '0')}-${suffix}`;
    codes[code] = { code, claimed: false };
  }
  return codes;
})();

export async function getCodeRecord(code: string): Promise<GiftRecord | null> {
  const trimmed = (code || '').trim();
  const normalized = trimmed.toUpperCase();
  if (!supabase && REQUIRE_SUPABASE) {
    throw new Error('Gift codes require Supabase in production');
  }
  if (supabase) {
    // Try exact (case-sensitive) uppercase match first for speed
    let query = await supabase.from('gift_codes').select('*').eq('code', normalized).limit(1).single();
    if (!(query && query.data) && !query.error) {
      // Fallback to case-insensitive match (handles mixed-case or legacy entries)
      query = await supabase.from('gift_codes').select('*').ilike('code', trimmed).limit(1).single();
    }
    const { data, error } = query || { data: null, error: null };
    if (error || !data) return null;
    return { id: data.id, code: data.code, claimed: data.claimed, claimedBy: data.claimed_by, claimedAt: data.claimed_at } as GiftRecord;
  }
  return IN_MEMORY[normalized] || null;
}

export async function claimCode(code: string, address: string, metadata: any = null): Promise<{ success: boolean; message: string }> {
  const normalized = code.toUpperCase();
  if (!supabase && REQUIRE_SUPABASE) {
    throw new Error('Gift codes require Supabase in production');
  }
  if (supabase) {
    // Find existing record with same tolerant lookup as getCodeRecord
    let query = await supabase.from('gift_codes').select('*').eq('code', normalized).limit(1).single();
    if (!(query && query.data) && !query.error) {
      query = await supabase.from('gift_codes').select('*').ilike('code', (code || '').trim()).limit(1).single();
    }
    const { data: existing } = query || { data: null };
    if (!existing) return { success: false, message: 'Invalid code' };
    if (existing.claimed) return { success: false, message: 'Already claimed' };

    // Use id for update to avoid case/collation mismatches
    const { error: updErr } = await supabase.from('gift_codes').update({ claimed: true, claimed_by: address, claimed_at: new Date().toISOString() }).eq('id', existing.id);
    if (updErr) return { success: false, message: 'Failed to claim code' };

    await supabase.from('gift_code_claims').insert([{ gift_code_id: existing.id, claimer: address, metadata }]);
    return { success: true, message: 'Code claimed' };
  }

  const rec = IN_MEMORY[normalized];
  if (!rec) return { success: false, message: 'Invalid code' };
  if (rec.claimed) return { success: false, message: 'Already claimed' };
  rec.claimed = true;
  rec.claimedBy = address;
  rec.claimedAt = new Date().toISOString();
  return { success: true, message: 'Code claimed' };
}

export async function listAllCodes(): Promise<GiftRecord[]> {
  if (!supabase && REQUIRE_SUPABASE) {
    throw new Error('Gift codes require Supabase in production');
  }
  if (supabase) {
    const { data } = await supabase.from('gift_codes').select('*').limit(1000);
    return (data || []).map((d: any) => ({ id: d.id, code: d.code, claimed: d.claimed, claimedBy: d.claimed_by, claimedAt: d.claimed_at }));
  }
  return Object.values(IN_MEMORY);
}
