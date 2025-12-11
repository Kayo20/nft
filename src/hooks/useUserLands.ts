import { useQuery } from '@tanstack/react-query';
import { getUserLands, getLandDetails } from '@/lib/apiUser';

export interface Land {
  id: number | string;
  owner: string;
  season: number;
  name: string;
  slots: number;
  createdAt: string;
}

export interface LandSlot {
  index: number;
  nftId: number | null;
}

export interface LandDetails extends Land {
  slotData: LandSlot[];
  lastItemsApplied: string | null;
}

export const useUserLands = (address: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userLands', address],
    queryFn: async () => {
      if (!address) return [];
      try {
        return await getUserLands();
      } catch (err) {
        console.error('Failed to fetch lands:', err);
        return [];
      }
    },
    enabled: !!address,
  });

  return {
    lands: data || [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch lands') : null,
    refetch,
  };
};

export const useLandDetails = (landId: number | string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['landDetails', landId],
    queryFn: async () => {
      if (!landId) return null;
      try {
        return await getLandDetails(landId);
      } catch (err) {
        console.error('Failed to fetch land details:', err);
        return null;
      }
    },
    enabled: !!landId,
  });

  return {
    land: data as LandDetails | null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch land details') : null,
    refetch,
  };
};
