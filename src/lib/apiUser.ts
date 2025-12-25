const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  const envUrl = process.env.VITE_NETLIFY_FUNCTIONS_URL || undefined;
  if (envUrl) return envUrl;
  if (window.location.hostname === 'localhost') {
    return '';
  }
  return '';
};

// User Balances
export async function getUserBalances() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/user-balances`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch balances');
  return res.json();
}

// User Profile
export async function getUserProfile() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/user-profile`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

// User Inventory
export async function getUserInventory() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/user-inventory`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
}

// Claimable Rewards
export async function getClaimableRewards() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/rewards-claimable`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch claimable rewards');
  return res.json();
}

// User Lands
export async function getUserLands() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/user-lands`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch lands');
  const data = await res.json();
  return data.lands || [];
}

// Create a default land for the current user (server will use session to determine owner)
export async function createUserLand() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/land-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = { text }; }
  if (!res.ok) {
    const msg = body?.error || body?.message || body?.text || 'Failed to create land';
    throw new Error(msg);
  }
  return body.land || null;
}

// Land Details
export async function getLandDetails(landId: number | string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/land-details/land/${landId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch land details');
  return res.json();
}

// Update Land Slot
export async function updateLandSlot(landId: number | string, slotIndex: number, nftId: number | null) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/.netlify/functions/land-update-slots/land/${landId}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ slotIndex, nftId }),
  });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = { text }; }
  if (!res.ok) {
    const msg = body?.error || body?.message || body?.text || 'Failed to update slot';
    throw new Error(msg);
  }
  return body;
}
