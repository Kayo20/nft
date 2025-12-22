import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserProfile } from '../lib/apiUser';

interface WalletConnectResult {
  address: string | null;
  user?: any;
  error?: string | null;
}

export function useWalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Basic SIWE message builder used by server verify
  const buildMessage = (address: string, nonce: string) => {
    const domain = window.location.host;
    const issuedAt = new Date().toISOString();
    return `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nURI: ${window.location.origin}\nVersion: 1\nChain ID: 56\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
  };

  const handleWalletConnect = useCallback(async (): Promise<WalletConnectResult> => {
    setError(null);
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = (accounts && accounts[0]) ? accounts[0].toLowerCase() : null;
      if (!addr) throw new Error('No account returned');
      setAddress(addr);

      // 1) Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
        credentials: 'include',
      });
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
      const { nonce } = await nonceRes.json();

      // 2) Sign message
      const msg = buildMessage(addr, nonce);
      const provider = (window as any).ethereum;
      const signed = await provider.request({ method: 'personal_sign', params: [msg, addr] });

      // 3) Verify message on server (creates treefi_session cookie)
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: msg, signature: signed }),
      });
      if (!verifyRes.ok) {
        const body = await verifyRes.text();
        throw new Error('Signature verification failed: ' + body);
      }

      // 4) Fetch profile (server will use session cookie to identify user)
      const profile = await getUserProfile();
      // profile should include wallet_address and possibly id (uuid)
      setUser(profile);

      // 5) Optionally set Supabase auth session if server returns token in future
      // For now, we rely on server-side endpoints for RLS-protected requests (credentials: 'include')

      return { address: addr, user: profile, error: null };
    } catch (e: any) {
      setError(e?.message || 'Wallet connect failed');
      return { address: null, user: undefined, error: e?.message || 'Wallet connect failed' };
    }
  }, []);

  return { address, user, error, handleWalletConnect };
}
