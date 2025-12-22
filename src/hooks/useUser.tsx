import { useState, useEffect } from 'react';
import { getUserProfile, getUserInventory } from '../lib/apiUser';

export function useUser() {
  const [profile, setProfile] = useState<any | null>(null);
  const [inventory, setInventory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const p = await getUserProfile();
        if (!mounted) return;
        setProfile(p);
        // Inventory is protected: call server endpoint that uses session cookie
        const inv = await getUserInventory();
        if (!mounted) return;
        setInventory(inv);
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch user data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { profile, inventory, loading, error, setProfile, setInventory };
}
