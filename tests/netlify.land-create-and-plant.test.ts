import { describe, it, expect, vi } from 'vitest';
import * as createFn from '../netlify/functions/land-create';
import * as updateFn from '../netlify/functions/land-update-slots';

// Mock auth verification and headers
vi.mock('../netlify/functions/_utils/auth', () => ({
  verifySession: vi.fn(() => ({ address: '0xabc' })),
  corsHeaders: () => ({}),
  securityHeaders: () => ({}),
}));

// Mock Supabase client behavior with a simple in-memory store
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => {
    const store: any = {
      lands: [],
      land_slots: [],
      nfts: [],
      lastTable: null,
      query: {
        filters: {},
      },
      from(table: string) {
        this.lastTable = table;
        this.query = { filters: {} };
        return this.chain;
      },
      chain: {
        select(this: any) { return this; },
        order(this: any) { return this; },
        eq(this: any, col: string, val: any) { this.parent.query.filters[col] = val; return this; },
        single: async function (this: any) {
          const table = this.parent.lastTable;
          const filters = this.parent.query.filters || {};
          if (table === 'lands') {
            const byId = filters.id !== undefined ? this.parent.lands.find((l:any) => String(l.id) === String(filters.id)) : null;
            const byOwner = filters.owner !== undefined ? this.parent.lands.find((l:any) => l.owner === filters.owner) : null;
            const found = byId || byOwner || null;
            return { data: found };
          }
          if (table === 'nfts') {
            const found = this.parent.nfts.find((n:any) => String(n.id) === String(filters.id)) || null;
            return { data: found };
          }
          if (table === 'land_slots') {
            const found = this.parent.land_slots.find((r:any) => r.land_id === filters.land_id && r.slot_index === filters.slot_index) || null;
            return { data: found };
          }
          return { data: null };
        }.bind({ parent: null }),
        insert: async function (this: any, payload: any) {
          const parent = this.parent;
          const table = parent.lastTable;
          if (table === 'lands') {
            const created = payload.map((p:any, i:number) => ({ ...p, id: parent.lands.length + 1 + i }));
            parent.lands.push(...created);
            return { data: created };
          }
          if (table === 'land_slots') {
            const created = payload.map((p:any) => ({ ...p }));
            parent.land_slots.push(...created);
            return { data: created };
          }
          if (table === 'nfts') {
            const created = payload.map((p:any) => ({ ...p }));
            parent.nfts.push(...created);
            return { data: created };
          }
          return { data: payload };
        }.bind({ parent: null }),
        upsert: function (this: any, payload: any, opts?: any) {
          const parent = this.parent;
          const table = parent.lastTable;
          if (table === 'land_slots') {
            // simple upsert based on land_id+slot_index
            const row = payload[0];
            const existing = parent.land_slots.find((r:any) => r.land_id === row.land_id && r.slot_index === row.slot_index);
            if (existing) {
              existing.nft_id = row.nft_id;
              return { select: async () => ({ data: [existing] }) };
            }
            const inserted = { ...row };
            parent.land_slots.push(inserted);
            return { select: async () => ({ data: [inserted] }) };
          }
          return { select: async () => ({ data: payload }) };
        }.bind({ parent: null }),
        update: function (this: any, changes: any) {
          const parent = this.parent;
          const table = parent.lastTable;
          return { eq: function (col: string, val: any) {
            return { eq: function (col2: string, val2: any) {
              // handle update chain for land_slots.update(...).eq('land_id', landId).eq('slot_index', slotIndex)
              if (table === 'land_slots') {
                const row = parent.land_slots.find((r:any) => r.land_id === val && r.slot_index === val2);
                if (row) {
                  Object.assign(row, changes);
                  return { select: async () => ({ data: [row] }) };
                }
                return { select: async () => ({ data: [] }) };
              }
              return { select: async () => ({ data: [] }) };
            } }
          } }
        }.bind({ parent: null }),
        catch() { return { data: null }; },
      }
    } as any;

    // Bind parent pointers so inner functions can access store
    store.chain.parent = store;
    store.chain.single = store.chain.single.bind({ parent: store });
    store.chain.insert = store.chain.insert.bind({ parent: store });
    store.chain.upsert = store.chain.upsert.bind({ parent: store });
    store.chain.update = store.chain.update.bind({ parent: store });

    return store;
  }
}));

describe('land-create and persist flow', () => {
  it('creates a new persisted land with 9 empty slots', async () => {
    const event: any = { httpMethod: 'POST', headers: {}, path: '/.netlify/functions/land-create', body: '{}' };
    const res: any = await (createFn as any).handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.land).toBeTruthy();
    expect(body.land.owner).toBe('0xabc');
    // Inspect mock supabase store
    const supa = ((await import('@supabase/supabase-js')) as any).createClient();
    expect(supa.lands.length).toBeGreaterThan(0);
    expect(supa.land_slots.length).toBe(9);
  });

  it('creates a land then persists an nft to a slot via land-update-slots', async () => {
    const createEvent: any = { httpMethod: 'POST', headers: {}, path: '/.netlify/functions/land-create', body: '{}' };
    const createRes: any = await (createFn as any).handler(createEvent);
    const created = JSON.parse(createRes.body).land;
    expect(created).toBeTruthy();

    const landId = created.id;
    // Plant nft id 99 to slot 3
    const plantEvent: any = { httpMethod: 'POST', headers: {}, path: `/.netlify/functions/land-update-slots/land/${landId}/slots`, body: JSON.stringify({ slotIndex: 3, nftId: 99 }) };

    const res: any = await (updateFn as any).handler(plantEvent);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.slot.index).toBe(3);
    expect(body.slot.nftId).toBe(99);

    // Ensure the mock DB has the slot recorded
    const supa = ((await import('@supabase/supabase-js')) as any).createClient();
    const row = supa.land_slots.find((r:any) => r.land_id === landId && r.slot_index === 3);
    expect(row).toBeTruthy();
    expect(row.nft_id).toBe(99);
  });
});
