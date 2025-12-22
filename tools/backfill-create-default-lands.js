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
    const { data: lands } = await supabase.from('lands').select('*').eq('owner', addr).limit(1).catch(() => ({ data: [] }));
    if (lands && lands.length > 0) continue; // already has land

    console.log('User %s has no land, creating default land', addr);
    if (!dryRun) {
      const defaultLand = { owner: addr, season: 0, name: 'Land 1', slots: 9 };
      const { data: upserted } = await supabase.from('lands').upsert(defaultLand, { onConflict: ['owner'] }).select().catch((e) => { console.error('land upsert failed for', addr, e); return { data: null }; });
      const landRow = (upserted && upserted.length) ? upserted[0] : (await supabase.from('lands').select('*').eq('owner', addr).single().catch(() => ({ data: null }))).data;
      if (landRow && landRow.id) {
        const slotInserts = [];
        for (let i = 0; i < (landRow.slots || 9); i++) slotInserts.push({ landId: landRow.id, slotIndex: i });
        await supabase.from('land_slots').upsert(slotInserts, { onConflict: ['landId', 'slotIndex'] }).select().catch((e) => { console.error('failed to upsert slots for', addr, e); });
        createdLands++;
      }
    }
  }

  console.log('Done. Created %d default lands (dryRun=%s)', createdLands, dryRun);
}

main().catch((e) => { console.error('Backfill error', e); process.exit(1); });
