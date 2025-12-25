import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, securityHeaders } from "./_utils/auth";
import { verifySession } from "./_utils/auth";

interface UpdateSlotRequest {
  slotIndex: number;
  nftId: number | null;
}

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client initialization failed:', e);
}

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // Verify session
    const session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
    }

    const address = (session.address || '').toLowerCase();

    // Parse request body
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "request body required" }) };
    }

    let body: UpdateSlotRequest;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid JSON" }) };
    }

    const { slotIndex, nftId } = body;

    if (typeof slotIndex !== 'number' || slotIndex < 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid slotIndex" }) };
    }

    // Extract landId from path
    const pathSegments = event.path.split('/');
    const landId = pathSegments[pathSegments.length - 2];

    if (!landId || landId === 'land') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "missing landId" }) };
    }

    // Verify land ownership
    const { data: land, error: landErr } = await supabase
      .from("lands")
      .select("*")
      .eq("id", landId)
      .eq("owner", address)
      .single();
    if (landErr) console.warn('land-update-slots: land fetch error', landErr.message || landErr);

    if (!land) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "land not found" }) };
    }

    // If nftId is not null, verify NFT ownership and ensure NFT record exists in the DB.
    if (nftId !== null) {
      // Try to find an NFT with matching id and owner
      const { data: nftByOwner, error: nftByOwnerErr } = await supabase
        .from("nfts")
        .select("*")
        .eq("id", nftId)
        .eq("owner_address", address)
        .single();

      if (!nftByOwner) {
        // NFT not found with owner match. Try to find any NFT record by id.
        const { data: nftAny, error: nftAnyErr } = await supabase
          .from("nfts")
          .select("*")
          .eq("id", nftId)
          .single();
        if (nftAnyErr) console.warn('land-update-slots: nft lookup error', nftAnyErr.message || nftAnyErr);

        if (!nftAny) {
          // No NFT record exists — insert a minimal record so the user can plant it.
          try {
            await supabase.from('nfts').insert([{ id: nftId, owner_address: address }]);
          } catch (e) {
            console.warn('Failed to insert minimal nft record:', e);
            // If insert fails, continue — we'll let the upsert on land_slots handle persistence if possible
          }
        } else {
          // If a record exists but owner doesn't match, check if owner is empty/unknown — otherwise deny.
          const existingOwner = (nftAny as any).owner_address;
          if (existingOwner && existingOwner.toLowerCase() !== String(address).toLowerCase()) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "nft not owned by user" }) };
          }

          // Otherwise, try to set owner to this address (repair inconsistent data)
          try {
            const { error: updateOwnerErr } = await supabase.from('nfts').update({ owner_address: address }).eq('id', nftId);
            if (updateOwnerErr) console.warn('land-update-slots: failed to set owner on nft', updateOwnerErr.message || updateOwnerErr);
          } catch (e) {
            // ignore
          }
        }
      }
    }

    // Update or delete slot
    if (nftId === null) {
      // Unset the nft_id for this slot (prefer update so slot row remains present)
      try {
        const { data: updated } = await supabase
          .from("land_slots")
          .update({ nft_id: null })
          .eq("land_id", landId)
          .eq("slot_index", slotIndex)
          .select();

        // If no row existed, insert an empty slot row so subsequent reads see it
        if (!updated || updated.length === 0) {
          await supabase.from('land_slots').insert([{ land_id: landId, slot_index: slotIndex, nft_id: null }]);
        }

        // Fetch persisted row
        const { data: row, error: rowErr } = await supabase
          .from('land_slots')
          .select('*')
          .eq('land_id', landId)
          .eq('slot_index', slotIndex)
          .single();
        if (rowErr) console.warn('land-update-slots: fetch persisted row error', rowErr.message || rowErr);
        const persistedNftId = row ? row.nft_id : null;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ok: true,
            slot: {
              index: slotIndex,
              nftId: persistedNftId ?? null,
            },
          }),
        };
      } catch (e) {
        console.error('Failed to remove nft from slot:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to remove slot' }) };
      }
    } else {
      // Upsert slot using snake_case column names and return the persisted row
      try {
        console.log('Upserting slot', { landId, slotIndex, nftId });
        const { data: upserted, error: upsertErr } = await supabase
          .from("land_slots")
          .upsert([{ land_id: landId, slot_index: slotIndex, nft_id: nftId }], { onConflict: ["land_id", "slot_index"] })
          .select();
        console.log('Upserted result', upserted, 'err', upsertErr);
        if (upsertErr) {
          console.error('Failed to upsert slot:', upsertErr);
          return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to upsert slot' }) };
        }

        const persisted = (upserted && upserted[0]) ? upserted[0] : null;
        const persistedNftId = persisted ? persisted.nft_id : null;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ok: true,
            slot: {
              index: slotIndex,
              nftId: persistedNftId ?? null,
            },
          }),
        };
      } catch (e) {
        console.error('Failed to upsert slot:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to upsert slot' }) };
      }
    }
  } catch (err: any) {
    console.error("land-update-slots error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
