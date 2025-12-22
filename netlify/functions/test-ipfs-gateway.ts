import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const q = event.queryStringParameters || {};
    const url = (q.url || '').trim();
    const gateway = (q.gateway || '').trim().replace(/\/$/, '');
    const cid = (q.cid || '').trim();
    const file = (q.file || '').trim();

    let fetchUrl = '';
    if (url) fetchUrl = url;
    else if (gateway && cid) fetchUrl = `${gateway}/${cid}${file ? '/' + file.replace(/^\/+/, '') : ''}`;
    else return { statusCode: 400, headers, body: JSON.stringify({ error: 'Provide url or gateway+cid (optional file)' }) };

    // Try to fetch the resource (short timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(fetchUrl, { signal: controller.signal });
      const ct = res.headers.get('content-type') || '';
      const cors = res.headers.get('access-control-allow-origin') || null;
      const size = Number(res.headers.get('content-length') || 0);

      // Small body sample for debugging (text or JSON up to 2KB)
      let sample: any = null;
      try {
        if (ct.includes('application/json')) sample = await res.clone().json();
        else if (ct.startsWith('text/') || ct.includes('html')) sample = await res.clone().text().then(t => t.slice(0, 2000));
        else sample = { type: 'binary', preview: `content-type ${ct}` };
      } catch (e) {
        sample = { error: 'failed to read body', message: (e as Error).message };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ fetchUrl, ok: res.ok, status: res.status, contentType: ct, cors, size, sample }),
      };
    } catch (e: any) {
      return { statusCode: 520, headers, body: JSON.stringify({ fetchUrl, error: e?.message || String(e) }) };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};