// Allow an optional custom gateway from environment variables (Vite injects these into process.env too)
const CUSTOM_GATEWAY = (process.env.VITE_IPFS_GATEWAY || process.env.IPFS_GATEWAY || process.env.VITE_IPFS_GATEWAY || '').replace(/\/$/, '');
const DEFAULT_GATEWAYS = [
  (CUSTOM_GATEWAY || 'https://ipfs.io/ipfs'),
  'https://cloudflare-ipfs.com/ipfs',
  'https://gateway.pinata.cloud/ipfs',
];

const CACHE_KEY_PREFIX = 'ipfs_meta_';
const DEFAULT_TIMEOUT = 7000; // ms

// Debug toggle: set VITE_IPFS_DEBUG or IPFS_DEBUG = '1' to enable verbose resolver logging
const IPFS_DEBUG = (process.env.VITE_IPFS_DEBUG === '1') || process.env.IPFS_DEBUG === '1';
// Optional server proxy fallback (set VITE_USE_IPFS_PROXY=1 or IPFS_PROXY_ENABLED=1 to enable)
const USE_IPFS_PROXY = (process.env.VITE_USE_IPFS_PROXY === '1') || (process.env.IPFS_PROXY_ENABLED === '1');

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
      if (IPFS_DEBUG) console.debug('[IPFS] trying url', url);
      const res = await timeoutFetch(url);
      if (IPFS_DEBUG) console.debug('[IPFS] response', url, 'status', res.status, 'ctype', res.headers.get('content-type'));
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json') || ct.includes('text/json')) {
        const json = await res.json();
        return { type: 'json', data: json, url };
      }
      // fallback: if it's an image or other binary, return URL so caller can use as src
      return { type: 'asset', url };
    } catch (e) {
      if (IPFS_DEBUG) console.debug('[IPFS] tryUrl error', url, e?.message || e);
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

    // If enabled, try a server-side proxy as a last resort (avoids CORS/403 issues on custom gateways)
    if (USE_IPFS_PROXY && typeof window !== 'undefined') {
      try {
        const proxyUrl = `/.netlify/functions/ipfs-proxy?url=${encodeURIComponent(url)}`;
        const pr = await tryUrl(proxyUrl);
        if (pr) {
          try { sessionStorage.setItem(cacheKey(normalized), JSON.stringify(pr)); } catch {};
          return pr;
        }
      } catch (e) {
        if (IPFS_DEBUG) console.debug('[IPFS] proxy fallback failed', url, e?.message || e);
      }
    }
  }

  return null;
}

export async function listIpfsFolder(uriOrCid: string, gateways: string[] = DEFAULT_GATEWAYS) {
  if (!uriOrCid) return [];
  const raw = String(uriOrCid).trim();
  const normalized = raw.replace(/^ipfs:\/\//i, '').replace(/^\/+/, '').replace(/\/+$/, '');

  async function tryUrl(url: string) {
    try {
      if (IPFS_DEBUG) console.debug('[IPFS list] trying url', url);
      const res = await timeoutFetch(url);
      if (IPFS_DEBUG) console.debug('[IPFS list] response', url, 'status', res.status, 'ctype', res.headers.get('content-type'));
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = await res.json();
        const items: string[] = [];
        if (Array.isArray(json.images)) {
          json.images.forEach((i: any) => items.push(i.url || i));
        } else if (Array.isArray(json.files)) {
          json.files.forEach((f: any) => items.push(f.url || f.name || f));
        }
        return items.length ? items : null;
      }

      if (ct.includes('text/html')) {
        const text = await res.text();
        const hrefs: string[] = [];
        const re = /href=["']([^"']+)["']/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          hrefs.push(m[1]);
        }
        const imgs = hrefs.filter(h => /\.(png|jpe?g|webp|gif|svg)$/i.test(h));
        const urls = imgs.map(h => {
          if (/^https?:\/\//i.test(h)) return h;
          if (h.startsWith('/')) {
            const origin = new URL(url).origin;
            return origin + h;
          }
          return url.replace(/\/+$/, '') + '/' + h.replace(/^\/+/, '');
        });
        return urls.length ? urls : null;
      }

      if (ct.startsWith('image/')) return [url];
      return null;
    } catch (e) {
      if (IPFS_DEBUG) console.debug('[IPFS list] tryUrl error', url, e?.message || e);
      return null;
    }
  }

  // If it's a full http(s) URL, try direct
  if (/^https?:\/\//i.test(raw)) {
    for (const g of gateways) {
      const r = await tryUrl(raw);
      if (r && r.length) return r;
    }
  }

  // Try gateways with/without trailing slash
  for (const g of gateways) {
    const url = `${g}/${normalized}`;
    const r = await tryUrl(url);
    if (r && r.length) return r;
    const url2 = `${g}/${normalized}/`;
    const r2 = await tryUrl(url2);
    if (r2 && r2.length) return r2;
  }

  return [];
}
