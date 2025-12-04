import { Handler } from "@netlify/functions";
import { corsHeaders, securityHeaders } from "./_utils/auth";

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Clear the treefi_session cookie
  const cookie = `treefi_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}`;

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': cookie,
      ...headers,
    },
    body: JSON.stringify({ ok: true }),
  };
};
