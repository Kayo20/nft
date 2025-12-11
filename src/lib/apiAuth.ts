const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  
  // Allow explicit override via env var
  const envUrl = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_NETLIFY_FUNCTIONS_URL as string) : undefined;
  if (envUrl) {
    console.log('Using VITE_NETLIFY_FUNCTIONS_URL:', envUrl);
    return envUrl;
  }

  // For production/deployed sites, use relative paths
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.log('Production mode - using relative paths');
    return '';
  }

  // For local development, try common ports
  // netlify dev defaults to 8888 for combined server, 9999 for functions-only
  console.log('Local development - attempting to connect to backend');
  return '';
};

export async function requestNonce(address: string) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/auth/nonce`;
  console.log('requestNonce URL:', url, 'baseUrl:', baseUrl);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ address }),
    });
    console.log('requestNonce response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('requestNonce error response:', errorText);
      throw new Error(`Failed to request nonce: ${res.status} ${errorText}`);
    }
    return res.json();
  } catch (error) {
    console.error('requestNonce error:', error);
    throw error;
  }
}

export async function verifySiwe(message: string, signature: string) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/auth/verify`;
  console.log('verifySiwe URL:', url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, signature }),
    });
    console.log('verifySiwe response status:', res.status);
    
    if (!res.ok) {
      const txt = await res.text();
      console.error('verifySiwe error response:', txt);
      throw new Error(`SIWE verify failed: ${res.status} ${txt}`);
    }
    return res.json();
  } catch (error) {
    console.error('verifySiwe error:', error);
    throw error;
  }
}

export async function logout() {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
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
