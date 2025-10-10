/**
 * PPUK v6 Server Cache Management
 * Redis-like caching using Supabase database for external API responses
 * Created: 2025-01-03
 * Purpose: Centralized caching system for API responses and computed data
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getServerConfig, getSupabaseConfig } from './env.ts';
import { ApiProvider, CacheEntry, CacheInfo } from './types.ts';

// ============================================================================
// CACHE MANAGER CLASS
// ============================================================================

export class CacheManager {
  private supabase: any;
  private config: any;
  private cleanupInterval: number | null = null;

  constructor() {
    const supabaseConfig = getSupabaseConfig();
    this.supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    this.config = getServerConfig().cache;
  }

  /**
   * Get cached data by key
   */
  async get<T = any>(provider: ApiProvider, key: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from('api_cache')
        .select('*')
        .eq('provider', provider)
        .eq('cache_key', key)
        .eq('is_stale', false)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache entry has expired
      const now = new Date();
      const fetchedAt = new Date(data.fetched_at);
      const ttlSeconds = data.ttl_seconds;
      const expiresAt = new Date(fetchedAt.getTime() + (ttlSeconds * 1000));

      if (now > expiresAt) {
        // Mark as stale and return null
        await this.markStale(provider, key);
        return null;
      }

      return data.payload as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set<T = any>(
    provider: ApiProvider,
    key: string,
    value: T,
    ttlSeconds?: number,
    etag?: string
  ): Promise<boolean> {
    try {
      const ttl = ttlSeconds || this.config.defaultTtl;
      const payload = JSON.stringify(value);
      const requestHash = await this.generateRequestHash(provider, key, value);

      const { error } = await this.supabase
        .from('api_cache')
        .upsert({
          provider,
          cache_key: key,
          payload: JSON.parse(payload),
          fetched_at: new Date().toISOString(),
          ttl_seconds: ttl,
          etag,
          request_hash: requestHash,
          response_size_bytes: payload.length,
          is_stale: false,
        });

      if (error) {
        console.error('Cache set error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  async exists(provider: ApiProvider, key: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('api_cache')
        .select('id, fetched_at, ttl_seconds, is_stale')
        .eq('provider', provider)
        .eq('cache_key', key)
        .single();

      if (error || !data) {
        return false;
      }

      // Check if cache entry has expired
      const now = new Date();
      const fetchedAt = new Date(data.fetched_at);
      const ttlSeconds = data.ttl_seconds;
      const expiresAt = new Date(fetchedAt.getTime() + (ttlSeconds * 1000));

      if (now > expiresAt || data.is_stale) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get cache information
   */
  async getInfo(provider: ApiProvider, key: string): Promise<CacheInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('api_cache')
        .select('fetched_at, ttl_seconds, is_stale')
        .eq('provider', provider)
        .eq('cache_key', key)
        .single();

      if (error || !data) {
        return null;
      }

      const fetchedAt = new Date(data.fetched_at);
      const ttlSeconds = data.ttl_seconds;
      const expiresAt = new Date(fetchedAt.getTime() + (ttlSeconds * 1000));

      return {
        cached: !data.is_stale && new Date() <= expiresAt,
        cacheKey: key,
        expiresAt: expiresAt.toISOString(),
        ttl: ttlSeconds,
      };
    } catch (error) {
      console.error('Cache info error:', error);
      return null;
    }
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(provider: ApiProvider, key: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .eq('provider', provider)
        .eq('cache_key', key);

      if (error) {
        console.error('Cache invalidate error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return false;
    }
  }

  /**
   * Mark cache entry as stale
   */
  async markStale(provider: ApiProvider, key: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('api_cache')
        .update({ is_stale: true })
        .eq('provider', provider)
        .eq('cache_key', key);

      if (error) {
        console.error('Cache mark stale error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache mark stale error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries for a provider
   */
  async clearProvider(provider: ApiProvider): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .eq('provider', provider);

      if (error) {
        console.error('Cache clear provider error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache clear provider error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        console.error('Cache clear all error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache clear all error:', error);
      return false;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('cleanup_expired_cache');

      if (error) {
        console.error('Cache cleanup error:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    staleEntries: number;
    totalSize: number;
    providers: Record<string, number>;
  }> {
    try {
      const { data: totalData, error: totalError } = await this.supabase
        .from('api_cache')
        .select('id', { count: 'exact' });

      if (totalError) {
        throw totalError;
      }

      const { data: staleData, error: staleError } = await this.supabase
        .from('api_cache')
        .select('id', { count: 'exact' })
        .eq('is_stale', true);

      if (staleError) {
        throw staleError;
      }

      const { data: sizeData, error: sizeError } = await this.supabase
        .from('api_cache')
        .select('response_size_bytes');

      if (sizeError) {
        throw sizeError;
      }

      const { data: providerData, error: providerError } = await this.supabase
        .from('api_cache')
        .select('provider')
        .eq('is_stale', false);

      if (providerError) {
        throw providerError;
      }

      const totalSize = sizeData?.reduce((sum, entry) => sum + (entry.response_size_bytes || 0), 0) || 0;
      const providers: Record<string, number> = {};

      providerData?.forEach(entry => {
        providers[entry.provider] = (providers[entry.provider] || 0) + 1;
      });

      return {
        totalEntries: totalData?.length || 0,
        staleEntries: staleData?.length || 0,
        totalSize,
        providers,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalEntries: 0,
        staleEntries: 0,
        totalSize: 0,
        providers: {},
      };
    }
  }

  /**
   * Start automatic cleanup process
   */
  startCleanup(): void {
    if (this.cleanupInterval) {
      return; // Already running
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        const cleaned = await this.cleanup();
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} expired cache entries`);
        }
      } catch (error) {
        console.error('Automatic cache cleanup error:', error);
      }
    }, this.config.cleanupInterval * 1000);
  }

  /**
   * Stop automatic cleanup process
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Generate request hash for deduplication
   */
  private async generateRequestHash(provider: ApiProvider, key: string, value: any): Promise<string> {
    const data = JSON.stringify({ provider, key, value });
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Get or set cached data with automatic fallback
 */
export async function getOrSet<T>(
  provider: ApiProvider,
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  const cache = new CacheManager();
  
  // Try to get from cache first
  const cached = await cache.get<T>(provider, key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  await cache.set(provider, key, data, ttlSeconds);
  
  return data;
}

/**
 * Cache with ETag support
 */
export async function getOrSetWithETag<T>(
  provider: ApiProvider,
  key: string,
  fetcher: (etag?: string) => Promise<{ data: T; etag?: string }>,
  ttlSeconds?: number
): Promise<T> {
  const cache = new CacheManager();
  
  // Get cache info to check for ETag
  const info = await cache.getInfo(provider, key);
  const etag = info?.cached ? undefined : undefined; // We'll implement ETag checking later
  
  // Try to get from cache first
  const cached = await cache.get<T>(provider, key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data with ETag
  const result = await fetcher(etag);
  
  // Cache the result with ETag
  await cache.set(provider, key, result.data, ttlSeconds, result.etag);
  
  return result.data;
}

/**
 * Batch cache operations
 */
export async function batchGet<T>(
  provider: ApiProvider,
  keys: string[]
): Promise<Record<string, T | null>> {
  const cache = new CacheManager();
  const results: Record<string, T | null> = {};
  
  // Get all cache entries in one query
  try {
    const { data, error } = await cache.supabase
      .from('api_cache')
      .select('cache_key, payload, fetched_at, ttl_seconds, is_stale')
      .eq('provider', provider)
      .in('cache_key', keys);

    if (error) {
      throw error;
    }

    const now = new Date();
    
    for (const entry of data || []) {
      const fetchedAt = new Date(entry.fetched_at);
      const ttlSeconds = entry.ttl_seconds;
      const expiresAt = new Date(fetchedAt.getTime() + (ttlSeconds * 1000));
      
      if (now <= expiresAt && !entry.is_stale) {
        results[entry.cache_key] = entry.payload as T;
      } else {
        results[entry.cache_key] = null;
      }
    }
    
    // Fill in nulls for missing keys
    for (const key of keys) {
      if (!(key in results)) {
        results[key] = null;
      }
    }
  } catch (error) {
    console.error('Batch cache get error:', error);
    // Return nulls for all keys on error
    for (const key of keys) {
      results[key] = null;
    }
  }
  
  return results;
}

/**
 * Batch set cache operations
 */
export async function batchSet<T>(
  provider: ApiProvider,
  entries: Array<{ key: string; value: T; ttl?: number }>
): Promise<boolean> {
  const cache = new CacheManager();
  
  try {
    const cacheEntries = entries.map(entry => ({
      provider,
      cache_key: entry.key,
      payload: entry.value,
      fetched_at: new Date().toISOString(),
      ttl_seconds: entry.ttl || cache.config.defaultTtl,
      is_stale: false,
    }));

    const { error } = await cache.supabase
      .from('api_cache')
      .upsert(cacheEntries);

    if (error) {
      console.error('Batch cache set error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Batch cache set error:', error);
    return false;
  }
}

// ============================================================================
// CACHE DECORATORS
// ============================================================================

/**
 * Decorator for caching function results
 */
export function cached(
  provider: ApiProvider,
  keyGenerator: (...args: any[]) => string,
  ttlSeconds?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = new CacheManager();
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await cache.get(provider, key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await cache.set(provider, key, result, ttlSeconds);
      
      return result;
    };
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton cache manager
export const cacheManager = new CacheManager();

// Export cache manager class
export { CacheManager };

// Export helper functions
export {
  getOrSet,
  getOrSetWithETag,
  batchGet,
  batchSet,
  cached,
};
