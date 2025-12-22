import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase.from('items').select('*');
        if (error) throw error;
        if (!mounted) return;
        setItems(data || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch items');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { items, loading, error };
}
