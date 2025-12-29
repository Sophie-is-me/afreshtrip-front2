// src/hooks/queries/useTripQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripApiService } from '../../services/api/tripApiService';


// Query keys
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: string) => [...tripKeys.lists(), { filters }] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
};

/**
 * Hook to fetch all trips for the current user
 */
export const useTrips = (page: number = 1, size: number = 10, enabled: boolean = true) => {
  return useQuery({
    queryKey: tripKeys.list(`${page}-${size}`),
    queryFn: () => tripApiService.getTrips(page, size),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

/**
 * Hook to fetch a specific trip by ID
 */
export const useTrip = (tripId: string) => {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripApiService.getTrip(tripId),
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to refresh trips data
 * This is used when new trips are created on the home page
 */
export const useRefreshTrips = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all trip queries to refresh data
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      return true;
    },
    onError: (error) => {
      console.error('Failed to refresh trips:', error);
    },
  });
};