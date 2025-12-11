import { Handler } from "@netlify/functions";
import { corsHeaders, securityHeaders } from "./_utils/auth";
import { getCodeRecord } from "./_utils/gift_codes";

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'request body required' }) };
    const { code } = JSON.parse(event.body);
    if (!code || typeof code !== 'string') return { statusCode: 400, headers, body: JSON.stringify({ error: 'code required' }) };

    const rec = getCodeRecord(code);
    if (!rec) {
      return { statusCode: 200, headers, body: JSON.stringify({ valid: false, message: 'Invalid code' }) };
    }
    if (rec.claimed) {
      return { statusCode: 200, headers, body: JSON.stringify({ valid: false, message: 'Already claimed' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ valid: true, message: 'Valid and unclaimed' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
