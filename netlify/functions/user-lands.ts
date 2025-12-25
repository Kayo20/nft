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

  console.debug('user-lands handler invoked', { method: event.httpMethod, path: event.path });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // Verify session
    let session: any;
    try {
      session = verifySession(event.headers && (event.headers.cookie || event.headers.Cookie || ''));
    } catch (err) {
      console.warn('Session verification failed (exception):', err);
      // Return 401 so the frontend can prompt for login instead of failing
      return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
    }
    if (!session) {
      console.debug('Session not found or invalid');
      return { statusCode: 401, headers, body: JSON.stringify({ error: "unauthorized" }) };
    }

    const address = (session.address || '').toLowerCase();
    console.debug('user-lands for address', address);

    // Fetch lands for this user
    // For now, we'll create a default land if none exists
    let landsList: any[] = [];
    let persisted = false;
    let warning: string | null = null;

    try {
      if (supabase) {
        const { data: lands, error: landsErr } = await supabase
          .from("lands")
          .select("*")
          .eq("owner", address)
          .order("created_at", { ascending: true });
        if (landsErr) {
          console.warn('Supabase query for lands failed:', landsErr);
          warning = 'Failed to query lands from DB';
          landsList = [];
        } else {
          landsList = lands || [];
        }

        // If no lands exist, create a default one (season 0, land 1)
        if (landsList.length === 0) {
          try {
            const newLand = {
              owner: address,
              season: 0,
              name: "Land 1",
              slots: 9,
              created_at: new Date().toISOString(),
            };
            const { data: created, error: insertErr } = await supabase
              .from("lands")
              .insert([newLand])
              .select();

            if (insertErr) {
              console.warn('Supabase insert for default land failed:', insertErr);
              warning = 'Failed to insert default land';
            }

            if (created && created.length > 0) {
              landsList = created;
              persisted = true;
            } else {
              // If insert failed, fallback to in-memory default
              warning = warning || 'Falling back to local in-memory land';
              landsList = [ { id: `local-${Date.now()}`, ...newLand } ];
            }
          } catch (e) {
            console.warn('Failed to create default land (exception):', e);
            warning = `Exception creating default land: ${String(e)}`;
            landsList = [ { id: `local-${Date.now()}`, owner: address, season: 0, name: 'Land 1', slots: 9, createdAt: new Date().toISOString() } ];
          }
        } else {
          // We have an existing land; assume persisted
          persisted = true;
        }
      } else {
        // Supabase not configured (likely in a lightweight environment). Return an in-memory default land instead of erroring.
        console.warn('Supabase client not configured - using in-memory fallback for lands');
        warning = 'Supabase client not configured - using local fallback';
        landsList = [ { id: `local-${Date.now()}`, owner: address, season: 0, name: 'Land 1', slots: 9, createdAt: new Date().toISOString() } ];
      }
    } catch (e) {
      console.error('Unexpected error while fetching/creating lands:', e);
      warning = warning || `Unexpected error: ${String(e)}`;
      // Fall back to empty lands list to avoid returning 500 to clients
      landsList = [];
    }

    console.debug('Returning lands count', landsList.length, { persisted, warning });

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
          createdAt: land.created_at || land.createdAt,
        })),
        persisted,
        warning,
      }),
    };
  } catch (err: any) {
    // Log full error but return a safe fallback to avoid 500 errors surface to frontend
    console.error("user-lands fatal error", err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        address: null,
        lands: [],
        error: 'internal server error',
      }),
    };
  }
};
