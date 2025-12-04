export async function requestNonce(address: string) {
  const res = await fetch('/api/auth/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) throw new Error('Failed to request nonce');
  return res.json();
}

export async function verifySiwe(message: string, signature: string) {
  const res = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, signature }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SIWE verify failed: ${txt}`);
  }
  return res.json();
}

export async function logout() {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      console.warn('logout request failed', res.status);
    }
    return res.ok;
  } catch (error) {
    console.error('logout error:', error);
    return false;
  }
}
