// Client-facing helper that calls the serverless mint endpoint.
// Keeps secrets server-side and provides a small wrapper with error handling.

export async function mintNFT({ name, rarity, ownerWallet } = {}) {
  if (!name || !rarity) throw new Error('name and rarity are required');

  const res = await fetch('/.netlify/functions/mint-nft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, rarity, ownerWallet }),
  });

  const payload = await res.json().catch(() => ({ error: 'invalid-json-response' }));
  if (!res.ok) {
    const err = payload?.error || payload?.details || 'Mint failed';
    throw new Error(err);
  }

  return payload;
}
