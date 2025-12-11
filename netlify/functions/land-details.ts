import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, securityHeaders } from "./_utils/auth";
import { verifySession } from "./_utils/auth";

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

    const address = session.address;
    // Extract landId from path: /api/land/:id
    const pathSegments = event.path.split('/');
    const landId = pathSegments[pathSegments.length - 1];

    if (!landId || landId === 'land') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "missing landId" }) };
    }

    // Fetch land (verify ownership)
    const { data: land } = await supabase
      .from("lands")
      .select("*")
      .eq("id", landId)
      .eq("owner", address)
      .single()
      .catch(() => ({ data: null }));

    if (!land) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "land not found" }) };
    }

    // Fetch land slots for this land
    const { data: slots } = await supabase
      .from("land_slots")
      .select("*")
      .eq("landId", landId)
      .order("slotIndex", { ascending: true })
      .catch(() => ({ data: [] }));

    // Initialize slots array (fill missing slots with null)
    const slotsArray = [];
    for (let i = 0; i < (land.slots || 9); i++) {
      const slot = slots?.find((s: any) => s.slotIndex === i);
      slotsArray.push({
        index: i,
        nftId: slot?.nftId || null,
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: land.id,
        owner: land.owner,
        season: land.season || 0,
        name: land.name,
        slots: land.slots || 9,
        createdAt: land.createdAt,
        slotData: slotsArray,
        lastItemsApplied: land.lastItemsApplied || null,
      }),
    };
  } catch (err: any) {
    console.error("land-details error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
