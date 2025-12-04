import { useState, useEffect } from 'react';
import { UserInventory } from '@/types';
import { purchaseItem } from '@/lib/api';

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
      const data = await mockApi.getUserItems(address);
      setInventory(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseItem = async (itemId: string, quantity: number) => {
    try {
      // using demo address is handled by caller (useItems receives address prop)
      await purchaseItem(itemId, quantity);
      // Update inventory
      setInventory(prev => ({
        ...prev,
        [itemId]: prev[itemId as keyof UserInventory] + quantity,
      }));
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