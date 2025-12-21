#!/usr/bin/env node
/*
Backfill and normalize gift codes in Supabase.
Usage:
  node scripts/backfill-normalize-gift-codes.js        # report duplicates, do not modify
  node scripts/backfill-normalize-gift-codes.js --fix  # normalize and merge duplicates

This script requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (service role key recommended).
*/

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const args = process.argv.slice(2);
const doFix = args.includes('--fix');

async function main() {
  console.log('Fetching gift_codes from Supabase...');
  const { data: codes, error } = await supabase.from('gift_codes').select('id, code, claimed, claimed_by, claimed_at');
  if (error) {
    console.error('Failed to fetch gift_codes:', error);
    process.exit(1);
  }

  const byNorm = new Map();
  for (const r of codes) {
    const norm = (String(r.code || '').trim()).toUpperCase();
    if (!byNorm.has(norm)) byNorm.set(norm, []);
    byNorm.get(norm).push(r);
  }

  let duplicates = 0;
  for (const [norm, rows] of byNorm.entries()) {
    if (rows.length > 1) duplicates += 1;
  }

  console.log(`Found ${codes.length} total codes; ${duplicates} normalized duplicates.`);

  if (!doFix) {
    console.log('Listing duplicates (run with --fix to attempt merge/delete):');
    for (const [norm, rows] of byNorm.entries()) {
      if (rows.length > 1) {
        console.log(`
Normalized: ${norm}
  ids: ${rows.map(r => r.id).join(', ')}
  codes: ${rows.map(r => r.code).join(' | ')}
`);
      }
    }
    console.log('Dry run finished. No changes made.');
    process.exit(0);
  }

  console.log('Starting fix: normalizing and merging duplicates...');

  // Normalize code values first
  for (const r of codes) {
    const norm = (String(r.code || '').trim()).toUpperCase();
    try {
      const { error: upErr } = await supabase.from('gift_codes').update({ code: norm, normalized_code: norm }).eq('id', r.id);
      if (upErr) console.warn(`Failed to update id=${r.id}:`, upErr.message || upErr);
    } catch (e) {
      console.warn('Update exception for id=', r.id, e.message || e);
    }
  }

  // Re-fetch after normalization
  const { data: post, error: postErr } = await supabase.from('gift_codes').select('id, code, claimed, claimed_by, claimed_at');
  if (postErr) { console.error('Failed to refetch:', postErr); process.exit(1); }

  const map2 = new Map();
  for (const r of post) {
    const norm = (String(r.code || '').trim()).toUpperCase();
    if (!map2.has(norm)) map2.set(norm, []);
    map2.get(norm).push(r);
  }

  for (const [norm, rows] of map2.entries()) {
    if (rows.length <= 1) continue;
    // pick keeper: the earliest id
    const sorted = rows.slice().sort((a,b)=>a.id - b.id);
    const keeper = sorted[0];
    const others = sorted.slice(1);
    console.log(`Merging duplicates for ${norm}: keeper=${keeper.id}, others=${others.map(o=>o.id).join(',')}`);

    // Move claims or references from others to keeper if gift_code_claims table exists
    // We'll try to update gift_code_claims.gift_code_id => keeper.id where gift_code_id IN others
    try {
      const otherIds = others.map(o => o.id);
      // Check if gift_code_claims exists by trying an update; if fails, ignore
      const { error: claimsErr } = await supabase.from('gift_code_claims').update({ gift_code_id: keeper.id }).in('gift_code_id', otherIds);
      if (claimsErr) {
        // it's ok if table doesn't exist or update fails; just log
        console.warn('Failed to update gift_code_claims references (table may not exist):', claimsErr.message || claimsErr);
      }
    } catch (e) {
      console.warn('Exception while updating claims:', e.message || e);
    }

    // Optionally, keep claimed info (if any) on keeper: if keeper not claimed and one of others is, set claimed fields
    if (!keeper.claimed) {
      const claimedRow = others.find(o => o.claimed);
      if (claimedRow) {
        try {
          const { error: upd } = await supabase.from('gift_codes').update({ claimed: true, claimed_by: claimedRow.claimed_by, claimed_at: claimedRow.claimed_at }).eq('id', keeper.id);
          if (upd) console.warn('Failed to mark keeper claimed:', upd.message || upd);
        } catch (e) {
          console.warn('Exception updating keeper claimed:', e.message || e);
        }
      }
    }

    // Delete others
    try {
      const { error: delErr } = await supabase.from('gift_codes').delete().in('id', others.map(o=>o.id));
      if (delErr) console.warn('Failed to delete duplicates:', delErr.message || delErr);
    } catch (e) {
      console.warn('Exception deleting duplicates:', e.message || e);
    }
  }

  // Attempt to create the unique index now
  try {
    const { error: idxErr } = await supabase.rpc('sql', { q: `CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_codes_normalized_code_unique ON gift_codes(normalized_code);` });
    // Note: supabase.rpc('sql') may not be available; if not, we'll simply suggest running SQL in dashboard
    if (idxErr) console.warn('Could not create unique index via RPC (run SQL in dashboard):', idxErr.message || idxErr);
    else console.log('Unique index created.');
  } catch (e) {
    console.warn('Skipping index create via RPC; run SQL manually if desired.', e.message || e);
  }

  console.log('Fix complete. Review the DB for correctness.');
}

main().catch(err => { console.error(err); process.exit(1); });
