import { Handler } from '@netlify/functions';
import { corsHeaders, securityHeaders, verifySession } from './_utils/auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const EXPORT_SECRET = process.env.GIFT_CODES_EXPORT_SECRET || '';

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    // Require either a valid session cookie or the admin secret header
    const session = verifySession(event.headers.cookie);
    const adminSecret = (event.headers['x-admin-secret'] || event.headers['x-gift-secret']) as string | undefined;
    if (!session && (!adminSecret || adminSecret !== EXPORT_SECRET)) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase not configured' }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase.from('gift_codes').select('id,code,claimed,claimed_by,claimed_at').order('id', { ascending: true }).limit(10000);
    if (error) {
      console.error('Supabase error:', error);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch gift codes' }) };
    }

    const rows = data || [];

    // Build CSV
    const header = ['id', 'code', 'claimed', 'claimed_by', 'claimed_at'];
    const csvLines = [header.join(',')];
    for (const r of rows) {
      // Escape commas and double-quotes
      const esc = (v: any) => {
        if (v === null || typeof v === 'undefined') return '';
        const s = String(v);
        if (s.includes(',') || s.includes('\"') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };
      csvLines.push([esc(r.id), esc(r.code), esc(r.claimed), esc(r.claimed_by), esc(r.claimed_at)].join(','));
    }

    const csv = csvLines.join('\n');

    const resHeaders = {
      ...headers,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gift-codes.csv"',
    };

    return { statusCode: 200, headers: resHeaders, body: csv };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
