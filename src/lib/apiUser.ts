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
  const res = await fetch(`${baseUrl}/api/user/balances`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch balances');
  return res.json();
}

// User Profile
export async function getUserProfile() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/user/profile`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

// User Inventory
export async function getUserInventory() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/user/inventory`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
}

// Claimable Rewards
export async function getClaimableRewards() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/rewards/claimable`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch claimable rewards');
  return res.json();
}

// User Lands
export async function getUserLands() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/user/lands`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch lands');
  const data = await res.json();
  return data.lands || [];
}

// Land Details
export async function getLandDetails(landId: number | string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/land/${landId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch land details');
  return res.json();
}

// Update Land Slot
export async function updateLandSlot(landId: number | string, slotIndex: number, nftId: number | null) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/land/${landId}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ slotIndex, nftId }),
  });
  if (!res.ok) throw new Error('Failed to update slot');
  return res.json();
}
