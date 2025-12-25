#!/usr/bin/env node
// Backfill script: ensure every user has a default land and slots
// Usage: node tools/backfill-create-default-lands.js [--dry-run]

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const dryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('Starting backfill (dryRun=%s)...', dryRun);

  // fetch users
  const { data: users, error: usersErr } = await supabase.from('users').select('wallet_address');
  if (usersErr) throw usersErr;
  console.log('Found %d users', users.length);

  let createdLands = 0;
  for (const u of users) {
    const addr = u.wallet_address;
    // check if land exists
    const { data: lands, error: landsErr } = await supabase.from('lands').select('*').eq('owner', addr).limit(1);
    if (landsErr) {
      console.error('land lookup failed for', addr, landsErr);
      continue;
    }
    if (lands && lands.length > 0) continue; // already has land

    console.log('User %s has no land, creating default land', addr);
    if (!dryRun) {
      const defaultLand = { owner: addr, season: 0, name: 'Land 1', slots: 9 };
      const { data: upserted, error: upsertErr } = await supabase.from('lands').upsert(defaultLand, { onConflict: ['owner'] }).select();
      if (upsertErr) {
        console.error('land upsert failed for', addr, upsertErr);
      }
      const { data: singleData, error: singleErr } = await supabase.from('lands').select('*').eq('owner', addr).single();
      if (singleErr) {
        console.error('land lookup failed for', addr, singleErr);
      }
      const landRow = (upserted && upserted.length) ? upserted[0] : singleData;
      if (landRow && landRow.id) {
        const slotInserts = [];
        for (let i = 0; i < (landRow.slots || 9); i++) slotInserts.push({ land_id: landRow.id, slot_index: i });
        const { error: slotsErr } = await supabase.from('land_slots').upsert(slotInserts, { onConflict: ['land_id', 'slot_index'] });
        if (slotsErr) {
          console.error('failed to upsert slots for', addr, slotsErr);
        }
        createdLands++;
      }
    }
  }

  console.log('Done. Created %d default lands (dryRun=%s)', createdLands, dryRun);
}

main().catch((e) => { console.error('Backfill error', e); process.exit(1); });
