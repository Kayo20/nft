import { useState, useEffect } from 'react';
import { UserInventory } from '@/types';
import { purchaseItem as purchaseItemApi } from '@/lib/api';
import { getUserInventory } from '@/lib/apiUser';

export const useItems = (address: string | null) => {
  const [inventory, setInventory] = useState<UserInventory>({
    fertilizer: 0,
    water: 0,
    antiBug: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserInventory();
      setInventory({
        water: data.water || 0,
        fertilizer: data.fertilizer || 0,
        antiBug: data.antiBug || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
      console.error('fetchInventory error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseItem = async (itemId: string, quantity: number) => {
    try {
      await purchaseItemApi(itemId, quantity);
      // Refetch inventory after purchase
      await fetchInventory();
      return true;
    } catch (err) {
      console.error('Purchase failed:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [address]);

  return {
    inventory,
    isLoading,
    error,
    refetch: fetchInventory,
    purchaseItem,
  };
};