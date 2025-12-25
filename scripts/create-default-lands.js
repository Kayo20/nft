#!/usr/bin/env node
// Script to create default lands + land_slots for users missing them
// Usage: node scripts/create-default-lands.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log('Fetching users...');
  const { data: users, error: usersErr } = await supabase.from('users').select('id, wallet_address');
  if (usersErr) {
    console.error('Failed to fetch users', usersErr);
    process.exit(1);
  }

  for (const u of users) {
    const owner = (u.wallet_address || '').toLowerCase();
    if (!owner) continue;

    const { data: lands } = await supabase.from('lands').select('*').eq('owner', owner).limit(1);
    if (lands && lands.length > 0) {
      console.log(`User ${owner} already has land id=${lands[0].id}`);
      continue;
    }

    console.log(`Creating default land for ${owner}...`);
    const newLand = { owner: owner, season: 0, name: 'Land 1', slots: 9, created_at: new Date().toISOString() };
    const { data: created, error: createErr } = await supabase.from('lands').insert([newLand]).select();
    if (createErr || !created || created.length === 0) {
      console.error('Failed to create land for', owner, createErr);
      continue;
    }
    const landRecord = created[0];
    // create slots
    const slotInserts = Array.from({ length: newLand.slots }).map((_, i) => ({ land_id: landRecord.id, slot_index: i, nft_id: null }));
    const { data: slotCreated, error: slotErr } = await supabase.from('land_slots').insert(slotInserts).select();
    if (slotErr) {
      console.error('Failed to create slots for land', landRecord.id, slotErr);
    } else {
      console.log(`Created land ${landRecord.id} and ${slotCreated.length} slots for ${owner}`);
    }
  }

  console.log('Done');
  process.exit(0);
}

main().catch(err => { console.error('Script error', err); process.exit(1); });
