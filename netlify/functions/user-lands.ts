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
    let session: any;
    try {
      session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    } catch (err) {
      console.warn('Session verification failed:', err);
      return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
    }
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
    }

    const address = (session.address || '').toLowerCase();

    // Fetch lands for this user
    // For now, we'll create a default land if none exists
    let landsList: any[] = [];

    if (supabase) {
      const { data: lands } = await supabase
        .from("lands")
        .select("*")
        .eq("owner", address)
        .order("createdAt", { ascending: true })
        .catch(() => ({ data: [] }));

      landsList = lands || [];

      // If no lands exist, create a default one (season 0, land 1)
      if (landsList.length === 0) {
        try {
          const newLand = {
            owner: address,
            season: 0,
            name: "Land 1",
            slots: 9,
            createdAt: new Date().toISOString(),
          };
          const { data: created } = await supabase
            .from("lands")
            .insert([newLand])
            .select()
            .catch(() => ({ data: [] }));

          if (created && created.length > 0) {
            landsList = created;
          } else {
            // If insert failed, fallback to in-memory default
            landsList = [ { id: `local-${Date.now()}`, ...newLand } ];
          }
        } catch (e) {
          console.warn('Failed to create default land:', e);
          landsList = [ { id: `local-${Date.now()}`, owner: address, season: 0, name: 'Land 1', slots: 9, createdAt: new Date().toISOString() } ];
        }
      }
    } else {
      // Supabase not configured (likely in a lightweight environment). Return an in-memory default land instead of erroring.
      landsList = [ { id: `local-${Date.now()}`, owner: address, season: 0, name: 'Land 1', slots: 9, createdAt: new Date().toISOString() } ];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        address,
        lands: landsList.map((land: any) => ({
          id: land.id,
          owner: land.owner,
          season: land.season || 0,
          name: land.name,
          slots: land.slots || 9,
          createdAt: land.createdAt,
        })),
      }),
    };
  } catch (err: any) {
    console.error("user-lands error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
