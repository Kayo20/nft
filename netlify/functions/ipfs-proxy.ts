import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' };
  try {
    const q = event.queryStringParameters || {};
    const url = (q.url || '').trim();
    if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Provide url' }) };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const ok = res.ok;
      const status = res.status;
      const ct = res.headers.get('content-type') || 'application/octet-stream';

      if (!ok) {
        const txt = await res.text().catch(() => '');
        return { statusCode: status, headers, body: JSON.stringify({ ok, status, contentType: ct, sample: (txt || '').slice(0, 200) }) };
      }

      const buf = await res.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');

      return {
        statusCode: 200,
        headers: Object.assign({}, headers, { 'Content-Type': ct }),
        isBase64Encoded: true,
        body: base64,
      };
    } catch (e: any) {
      return { statusCode: 520, headers, body: JSON.stringify({ error: e?.message || String(e) }) };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};