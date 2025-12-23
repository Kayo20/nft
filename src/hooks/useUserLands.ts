import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserLands, getLandDetails, updateLandSlot } from '@/lib/apiUser';

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

  // Return both `land` and `landData` (alias) for compatibility with components
  return {
    land: data as LandDetails | null,
    landData: data as LandDetails | null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch land details') : null,
    refetch,
  };
};

export const useUpdateLandSlot = (landId: number | string | null) => {
  const queryClient = useQueryClient();

  // Use a lightweight custom mutateAsync to avoid react-query mutation internals
  // which may trigger cross-version issues in some dev setups. This provides
  // the same observable behavior for our code: perform the update and then
  // invalidate the relevant queries.
  const mutateAsync = async ({ slotIndex, nftId }: { slotIndex: number; nftId: number | null }) => {
    if (!landId) throw new Error('landId required');
    const res = await updateLandSlot(landId, slotIndex, nftId);
    // Refresh the land details and user lands lists
    try {
      queryClient.invalidateQueries(['landDetails', landId]);
      queryClient.invalidateQueries(['userLands']);
    } catch (e) {
      // ignore invalidation failures in dev
    }
    return res;
  };

  return { mutateAsync };
};
