import { Handler } from '@netlify/functions';
import { corsHeaders, securityHeaders } from './_utils/auth';
import { getCodeRecord } from './_utils/gift_codes';

const ADMIN_SECRET = process.env.GIFT_CODES_EXPORT_SECRET || '';

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    const admin = (event.headers['x-admin-secret'] || event.headers['x-gift-secret']) as string | undefined;
    if (!admin || admin !== ADMIN_SECRET) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const code = (body && body.code) || (event.queryStringParameters && event.queryStringParameters.code);
    if (!code || typeof code !== 'string') return { statusCode: 400, headers, body: JSON.stringify({ error: 'code required' }) };

    const rec = await getCodeRecord(code);
    if (!rec) return { statusCode: 200, headers, body: JSON.stringify({ found: false }) };

    return { statusCode: 200, headers, body: JSON.stringify({ found: true, record: rec }) };
  } catch (err) {
    console.error('debug-gift-code error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
