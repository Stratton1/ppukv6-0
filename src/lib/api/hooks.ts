/**
 * React Query hooks for PPUK v6 API
 * Provides typed, cached access to all backend endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { 
  Snapshot, 
  SearchResult, 
  MyPropertiesResponse, 
  WatchlistResponse,
  Snapshot as SnapshotSchema,
  SearchResult as SearchResultSchema,
  MyPropertiesResponse as MyPropertiesResponseSchema,
  WatchlistResponse as WatchlistResponseSchema
} from './schemas'
import { env } from '../env'

/**
 * Hook for fetching property snapshot data
 */
export function usePropertySnapshot(propertyId?: string) {
  return useQuery({
    queryKey: ['snapshot', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required')
      
      const data = await apiFetch<unknown>(`property_snapshot?property_id=${propertyId}`)
      return SnapshotSchema.parse(data)
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  })
}

/**
 * Hook for searching addresses
 */
export function useSearchAddress(query: string) {
  return useQuery({
    queryKey: ['search', query],
    enabled: query.length > 2,
    queryFn: async () => {
      const data = await apiFetch<unknown>(`search_address?q=${encodeURIComponent(query)}`)
      return SearchResultSchema.parse(data)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook for fetching user's properties with optional relationship filter
 */
export function useMyProperties(relationship?: 'owner' | 'occupier' | 'interested') {
  const queryKey = ['my-properties', relationship]
  const queryParams = relationship ? `?relationship=${relationship}` : ''
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const data = await apiFetch<unknown>(`my_properties${queryParams}`)
      return MyPropertiesResponseSchema.parse(data)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

/**
 * Hook for watchlist mutations (add/remove)
 */
export function useWatchlistMutations() {
  const queryClient = useQueryClient()
  
  const addToWatchlist = useMutation({
    mutationFn: async (payload: { property_id: string }) => {
      const data = await apiFetch<unknown>('watchlist_add', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      })
      return WatchlistResponseSchema.parse(data)
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['my-properties'] })
      queryClient.invalidateQueries({ queryKey: ['snapshot'] })
    },
    onError: (error) => {
      console.error('Failed to add to watchlist:', error)
    },
  })

  const removeFromWatchlist = useMutation({
    mutationFn: async (payload: { property_id: string }) => {
      const data = await apiFetch<unknown>('watchlist_remove', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      })
      return WatchlistResponseSchema.parse(data)
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['my-properties'] })
      queryClient.invalidateQueries({ queryKey: ['snapshot'] })
    },
    onError: (error) => {
      console.error('Failed to remove from watchlist:', error)
    },
  })

  return { 
    addToWatchlist, 
    removeFromWatchlist,
    isLoading: addToWatchlist.isPending || removeFromWatchlist.isPending,
  }
}

/**
 * Hook for checking if a property is in user's watchlist
 */
export function useIsInWatchlist(propertyId?: string) {
  const { data: myProperties } = useMyProperties('interested')
  
  return {
    isInWatchlist: propertyId ? 
      myProperties?.properties?.some(p => p.id === propertyId) : false,
    isLoading: !myProperties,
  }
}

/**
 * Hook for EPC data (if available)
 */
export function useEPCData(propertyId?: string) {
  return useQuery({
    queryKey: ['epc', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required')
      
      const data = await apiFetch<unknown>(`epc?property_id=${propertyId}`)
      return data
    },
    staleTime: 60 * 60 * 1000, // 1 hour (EPC data doesn't change often)
    retry: 1,
  })
}

/**
 * Hook for flood risk data (if available)
 */
export function useFloodData(propertyId?: string) {
  return useQuery({
    queryKey: ['flood', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required')
      
      const data = await apiFetch<unknown>(`flood?property_id=${propertyId}`)
      return data
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (flood data changes slowly)
    retry: 1,
  })
}

/**
 * Hook for planning data (if available)
 */
export function usePlanningData(propertyId?: string) {
  return useQuery({
    queryKey: ['planning', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required')
      
      const data = await apiFetch<unknown>(`planning?property_id=${propertyId}`)
      return data
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days (planning data changes slowly)
    retry: 1,
  })
}

/**
 * Utility hook for feature flag checks
 */
export function useFeatureFlags() {
  return {
    relationships: env.flags.relationships,
    docUploads: env.flags.docUploads,
    notes: env.flags.notes,
  }
}
