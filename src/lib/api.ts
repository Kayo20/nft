const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  // Allow explicit override via env var for flexibility during dev
  // e.g. set VITE_NETLIFY_FUNCTIONS_URL=http://localhost:9999
  // Allow explicit override via env var for flexibility during dev
  // e.g. set VITE_NETLIFY_FUNCTIONS_URL=http://localhost:9999
  const envUrl = process.env.VITE_NETLIFY_FUNCTIONS_URL || undefined;
  if (envUrl) return envUrl;

  // Common local Netlify functions ports: 8888 (current), 9999 (older)
  if (window.location.hostname === 'localhost') {
    // Use port 8888 for local dev
    return 'http://localhost:8888';
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

export async function fuseNFTs(nftIds: Array<number | string>, txHash?: string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/fuse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nftIds, txHash }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fuse failed: ${txt}`);
  }
  return res.json();
}

export async function openChest(type: string = 'standard', txHash?: string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/open-chest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ type, txHash }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Open chest failed: ${txt}`);
  }
  return res.json();
}

export async function purchaseItem(itemId: string, qty: number, txHash?: string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/shop-purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId, qty, txHash }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Purchase failed: ${txt}`);
  }
  return res.json();
}

// TreeFi Spec: Farming and rewards
export async function startFarming(nftId: number, itemIds: ('water' | 'fertilizer' | 'antiBug')[], txHash?: string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/start-farming`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nftId, itemIds, txHash }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Start farming failed: ${txt}`);
  }
  return res.json();
}

export async function claimRewards(nftId: number, txHash?: string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nftId, txHash }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Claim failed: ${txt}`);
  }
  return res.json();
}

export async function redeemGiftCode(code: string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/redeem-gift-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });

  const txt = await res.text();
  let parsed: any = null;
  try { parsed = txt ? JSON.parse(txt) : null; } catch (e) { /* noop */ }

  if (!res.ok) {
    const message = parsed?.error || txt || 'Gift code redemption failed';
    // Return structured result so the UI can show the server message
    return { success: false, message };
  }

  return parsed || { success: false, message: 'Invalid response from server' };
}

export async function getSeasonInfo() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/get-season-info`, { credentials: 'include' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Get season info failed: ${txt}`);
  }
  return res.json();
}

export async function listNftImages() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/list-nft-images`, { credentials: 'include' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`List NFT images failed: ${txt}`);
  }
  return res.json();
}

