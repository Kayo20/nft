const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  // Allow explicit override via env var for flexibility during dev
  // e.g. set VITE_NETLIFY_FUNCTIONS_URL=http://localhost:9999
  // Vite exposes import.meta.env for client-side envs prefixed with VITE_
  // @ts-ignore
  const envUrl = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_NETLIFY_FUNCTIONS_URL as string) : undefined;
  if (envUrl) return envUrl;

  // Common local Netlify functions ports: 9999 (netlify dev default), 8888 (older)
  if (window.location.hostname === 'localhost') {
    // Prefer 9999 then 8888
    return 'http://localhost:9999';
  }
  return '';
};

export async function getNFTs(owner: string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/get-nfts?owner=${encodeURIComponent(owner)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch NFTs');
  const data = await res.json();
  return data.nfts || [];
}

export async function fuseNFTs(nftIds: Array<number | string>) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/fuse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nftIds }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fuse failed: ${txt}`);
  }
  return res.json();
}

export async function openChest(type: string = 'standard') {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/open-chest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ type }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Open chest failed: ${txt}`);
  }
  return res.json();
}

export async function purchaseItem(itemId: string, qty: number) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/shop-purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId, qty }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Purchase failed: ${txt}`);
  }
  return res.json();
}

// TreeFi Spec: Farming and rewards
export async function startFarming(nftId: number, itemIds: ('water' | 'fertilizer' | 'antiBug')[]) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/start-farming`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nftId, itemIds }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Start farming failed: ${txt}`);
  }
  return res.json();
}

export async function claimRewards(nftId: number) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nftId }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Claim failed: ${txt}`);
  }
  return res.json();
}

