const DEFAULT_GATEWAYS = [
  (process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs').replace(/\/$/, ''),
  'https://cloudflare-ipfs.com/ipfs',
  'https://gateway.pinata.cloud/ipfs',
];

const CACHE_KEY_PREFIX = 'ipfs_meta_';
const DEFAULT_TIMEOUT = 7000; // ms

function timeoutFetch(url: string, ms = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

function cacheKey(key: string) {
  return CACHE_KEY_PREFIX + key;
}

export async function resolveIpfsMetadata(uriOrCid: string, gateways: string[] = DEFAULT_GATEWAYS) {
  if (!uriOrCid) return null;
  const raw = String(uriOrCid).trim();
  const normalized = raw.replace(/^ipfs:\/\//i, '').replace(/^\/+/, '');

  // Try cache first (sessionStorage)
  try {
    const cached = sessionStorage.getItem(cacheKey(normalized));
    if (cached) return JSON.parse(cached);
  } catch (e) {
    // ignore cache errors
  }

  // Helper to try a single URL and parse JSON if applicable
  async function tryUrl(url: string) {
    try {
      const res = await timeoutFetch(url);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json') || ct.includes('text/json')) {
        const json = await res.json();
        return { type: 'json', data: json, url };
      }
      // fallback: if it's an image or other binary, return URL so caller can use as src
      return { type: 'asset', url };
    } catch (e) {
      return null;
    }
  }

  // If it's a full http(s) URL, try direct fetch first
  if (/^https?:\/\//i.test(raw)) {
    const r = await tryUrl(raw);
    if (r) {
      try { sessionStorage.setItem(cacheKey(normalized), JSON.stringify(r)); } catch {};
      return r;
    }
  }

  // Try gateways in order
  for (const g of gateways) {
    const url = `${g}/${normalized}`;
    const r = await tryUrl(url);
    if (r) {
      try { sessionStorage.setItem(cacheKey(normalized), JSON.stringify(r)); } catch {};
      return r;
    }
  }

  return null;
}
