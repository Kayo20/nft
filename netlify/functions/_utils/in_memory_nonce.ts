type NonceEntry = { nonce: string; expiresAt: number };

const store = new Map<string, NonceEntry>();

export function getNonce(address: string): NonceEntry | undefined {
  return store.get(address.toLowerCase());
}

export function setNonce(address: string, nonce: string, expiresAt: number) {
  store.set(address.toLowerCase(), { nonce, expiresAt });
}

export function deleteNonce(address: string) {
  store.delete(address.toLowerCase());
}

export function clearExpired() {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt <= now) store.delete(k);
  }
}

export function debugDump() {
  return Array.from(store.entries()).map(([k, v]) => ({ address: k, nonce: v.nonce, expiresAt: v.expiresAt }));
}
