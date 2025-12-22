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
  const raw = (code || '').trim();
  const normalized = raw.toUpperCase();
  const normalizedAlnum = normalized.replace(/[^A-Z0-9]/g, '');
  if (!supabase && REQUIRE_SUPABASE) {
    throw new Error('Gift codes require Supabase in production');
  }
  if (supabase) {
    // Prefer normalized_code (added by migration) for exact lookups
    // Try both the raw normalized and an alphanumeric-only normalized (strips dashes/spaces)
    let query = await supabase.from('gift_codes').select('*').eq('normalized_code', normalized).limit(1).single();
    if (!(query && query.data) && !query?.error) {
      query = await supabase.from('gift_codes').select('*').eq('normalized_code', normalizedAlnum).limit(1).single();
    }

    // Fallbacks for legacy rows: exact uppercased code, then case-insensitive match on trimmed
    if (!(query && query.data) && !query?.error) {
      query = await supabase.from('gift_codes').select('*').eq('code', normalized).limit(1).single();
    }
    if (!(query && query.data) && !query?.error) {
      // try a lenient match stripping non-alnum characters from stored code via ilike on normalized-ish pattern
      const pattern = `%${raw.replace(/[^A-Za-z0-9]/g, '')}%`;
      query = await supabase.from('gift_codes').select('*').ilike('code', pattern).limit(1).single();
    }

    const { data, error } = query || { data: null, error: null };
    if (error || !data) return null;
    return { id: data.id, code: data.code, claimed: data.claimed, claimedBy: data.claimed_by, claimedAt: data.claimed_at } as GiftRecord;
  }
  // In-memory lookup: support both raw and alnum
  return IN_MEMORY[raw] || IN_MEMORY[normalized] || IN_MEMORY[normalizedAlnum] || null;
}

export async function claimCode(code: string, address: string, metadata: any = null): Promise<{ success: boolean; message: string }> {
  const raw = (code || '').trim();
  const normalized = raw.toUpperCase();
  const normalizedAlnum = normalized.replace(/[^A-Z0-9]/g, '');
  if (!supabase && REQUIRE_SUPABASE) {
    throw new Error('Gift codes require Supabase in production');
  }
  if (supabase) {
    // Find existing record with tolerant lookup
    let query = await supabase.from('gift_codes').select('*').eq('normalized_code', normalized).limit(1).single();
    if (!(query && query.data) && !query?.error) {
      query = await supabase.from('gift_codes').select('*').eq('normalized_code', normalizedAlnum).limit(1).single();
    }
    if (!(query && query.data) && !query?.error) {
      query = await supabase.from('gift_codes').select('*').eq('code', normalized).limit(1).single();
    }
    if (!(query && query.data) && !query?.error) {
      query = await supabase.from('gift_codes').select('*').ilike('code', raw).limit(1).single();
    }

    const { data: existing, error: qErr } = query || { data: null, error: null };
    if (qErr) {
      console.warn('claimCode query error', qErr);
      return { success: false, message: 'Invalid gift code' };
    }
    if (!existing) return { success: false, message: 'Invalid gift code' };
    if (existing.claimed) return { success: false, message: 'This gift code has already been claimed' };

    // Use id for update to avoid case/collation mismatches; also update normalized_code if missing
    const updates: any = { claimed: true, claimed_by: address, claimed_at: new Date().toISOString() };
    if (!existing.normalized_code || existing.normalized_code !== normalizedAlnum) updates.normalized_code = normalizedAlnum;

    const { error: updErr } = await supabase.from('gift_codes').update(updates).eq('id', existing.id);
    if (updErr) {
      console.error('claimCode update failed', updErr);
      return { success: false, message: 'Failed to claim code' };
    }

    try {
      await supabase.from('gift_code_claims').insert([{ gift_code_id: existing.id, claimer: address, metadata }]);
    } catch (e) {
      console.warn('Failed to log claim in gift_code_claims (table missing or error):', e?.message || e);
    }

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
