import { Handler } from "@netlify/functions";
import { corsHeaders, securityHeaders } from "./_utils/auth";

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // Season 0 target date (same as frontend)
    const targetDate = new Date('2025-12-17T00:00:00Z').getTime();
    const now = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((targetDate - now) / (24 * 60 * 60 * 1000)));

    const seasonInfo = {
      seasonNumber: 0,
      startDate: targetDate - 10 * 24 * 60 * 60 * 1000,
      endDate: targetDate,
      daysRemaining,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(seasonInfo),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
