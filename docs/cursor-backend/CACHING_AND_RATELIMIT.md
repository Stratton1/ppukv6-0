# PPUK v6 Caching and Rate Limiting

## Overview

The PPUK v6 platform implements comprehensive caching and rate limiting strategies to optimize performance, reduce external API costs, and prevent abuse.

## Caching Architecture

### Database-Based Caching
The platform uses Supabase database as a cache store, providing:
- Persistent caching across deployments
- ACID compliance for cache operations
- Automatic cleanup of expired entries
- Query optimization for cache lookups

### Cache Schema
```sql
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider api_provider NOT NULL,
  cache_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  etag TEXT,
  request_hash TEXT,
  response_size_bytes INTEGER,
  is_stale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, cache_key)
);
```

## Caching Strategies

### 1. TTL-Based Caching

**Default TTL Values**:
- EPC data: 24 hours (86400 seconds)
- Flood risk: 7 days (604800 seconds)
- Postcodes: 24 hours (86400 seconds)
- OS Places: 24 hours (86400 seconds)
- Planning: 24 hours (86400 seconds)
- Companies: 24 hours (86400 seconds)

**Implementation**:
```typescript
async function getCachedData(provider: string, key: string): Promise<any> {
  const { data } = await supabase
    .from('api_cache')
    .select('*')
    .eq('provider', provider)
    .eq('cache_key', key)
    .eq('is_stale', false)
    .single();

  if (!data) return null;

  // Check if cache has expired
  const now = new Date();
  const fetchedAt = new Date(data.fetched_at);
  const expiresAt = new Date(fetchedAt.getTime() + (data.ttl_seconds * 1000));

  if (now > expiresAt) {
    await markStale(provider, key);
    return null;
  }

  return data.payload;
}
```

### 2. ETag-Based Caching

**ETag Support**:
```typescript
async function getWithETag(provider: string, key: string, etag?: string): Promise<any> {
  const cached = await getCachedData(provider, key);
  
  if (cached && cached.etag === etag) {
    return cached.data;
  }

  // Fetch fresh data with ETag
  const response = await fetchExternalAPI(etag);
  
  // Cache with ETag
  await cache.set(provider, key, response.data, 86400, response.etag);
  
  return response.data;
}
```

### 3. Request Deduplication

**Hash-Based Deduplication**:
```typescript
function generateRequestHash(provider: string, params: any): string {
  const data = JSON.stringify({ provider, ...params });
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function fetchWithDeduplication(provider: string, params: any): Promise<any> {
  const requestHash = generateRequestHash(provider, params);
  
  // Check if request is already in progress
  if (pendingRequests.has(requestHash)) {
    return pendingRequests.get(requestHash);
  }

  const promise = fetchExternalAPI(params);
  pendingRequests.set(requestHash, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(requestHash);
  }
}
```

## Cache Management

### 1. Automatic Cleanup

**Cleanup Function**:
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_cache 
  WHERE fetched_at + INTERVAL '1 second' * ttl_seconds < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Scheduled Cleanup**:
```typescript
// Run cleanup every hour
setInterval(async () => {
  const deleted = await supabase.rpc('cleanup_expired_cache');
  console.log(`Cleaned up ${deleted} expired cache entries`);
}, 3600000);
```

### 2. Cache Invalidation

**Manual Invalidation**:
```typescript
async function invalidateCache(provider: string, key?: string): Promise<void> {
  if (key) {
    await supabase
      .from('api_cache')
      .delete()
      .eq('provider', provider)
      .eq('cache_key', key);
  } else {
    await supabase
      .from('api_cache')
      .delete()
      .eq('provider', provider);
  }
}
```

**Stale Marking**:
```typescript
async function markStale(provider: string, key: string): Promise<void> {
  await supabase
    .from('api_cache')
    .update({ is_stale: true })
    .eq('provider', provider)
    .eq('cache_key', key);
}
```

### 3. Cache Statistics

**Performance Metrics**:
```typescript
async function getCacheStats(): Promise<{
  totalEntries: number;
  staleEntries: number;
  totalSize: number;
  hitRate: number;
  providers: Record<string, number>;
}> {
  const { data: totalData } = await supabase
    .from('api_cache')
    .select('id', { count: 'exact' });

  const { data: staleData } = await supabase
    .from('api_cache')
    .select('id', { count: 'exact' })
    .eq('is_stale', true);

  const { data: sizeData } = await supabase
    .from('api_cache')
    .select('response_size_bytes');

  const { data: providerData } = await supabase
    .from('api_cache')
    .select('provider')
    .eq('is_stale', false);

  const totalSize = sizeData?.reduce((sum, entry) => sum + (entry.response_size_bytes || 0), 0) || 0;
  const providers: Record<string, number> = {};

  providerData?.forEach(entry => {
    providers[entry.provider] = (providers[entry.provider] || 0) + 1;
  });

  return {
    totalEntries: totalData?.length || 0,
    staleEntries: staleData?.length || 0,
    totalSize,
    hitRate: calculateHitRate(),
    providers,
  };
}
```

## Rate Limiting

### 1. User-Based Rate Limiting

**Per-User Limits**:
```typescript
interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

async function checkUserRateLimit(userId: string, limit: number = 100, window: number = 3600): Promise<RateLimit> {
  const key = `rate_limit:user:${userId}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - window;

  // Get current count
  const { data } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('key', key)
    .gte('timestamp', windowStart);

  const current = data?.reduce((sum, entry) => sum + entry.count, 0) || 0;

  if (current >= limit) {
    const reset = now + window;
    const retryAfter = window - (now % window);
    
    throw new Error(JSON.stringify({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      limit,
      remaining: 0,
      reset,
      retryAfter,
    }));
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .insert({
      key,
      count: 1,
      timestamp: now,
      expires_at: new Date((now + window) * 1000)
    });

  return {
    limit,
    remaining: limit - current - 1,
    reset: now + window,
  };
}
```

### 2. IP-Based Rate Limiting

**Per-IP Limits**:
```typescript
async function checkIPRateLimit(ipAddress: string, limit: number = 1000, window: number = 86400): Promise<RateLimit> {
  const key = `rate_limit:ip:${ipAddress}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - window;

  // Get current count
  const { data } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('key', key)
    .gte('timestamp', windowStart);

  const current = data?.reduce((sum, entry) => sum + entry.count, 0) || 0;

  if (current >= limit) {
    const reset = now + window;
    const retryAfter = window - (now % window);
    
    throw new Error(JSON.stringify({
      code: 'IP_RATE_LIMIT_EXCEEDED',
      message: 'IP rate limit exceeded',
      limit,
      remaining: 0,
      reset,
      retryAfter,
    }));
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .insert({
      key,
      count: 1,
      timestamp: now,
      expires_at: new Date((now + window) * 1000)
    });

  return {
    limit,
    remaining: limit - current - 1,
    reset: now + window,
  };
}
```

### 3. API-Specific Rate Limiting

**Provider Limits**:
```typescript
const API_LIMITS = {
  epc: { limit: 100, window: 3600 }, // 100/hour
  flood: { limit: 1000, window: 86400 }, // 1000/day
  postcodes: { limit: 1000, window: 86400 }, // 1000/day
  osplaces: { limit: 1000, window: 86400 }, // 1000/day
  planning: { limit: 100, window: 3600 }, // 100/hour
  companies: { limit: 600, window: 300 }, // 600/5min
};

async function checkAPIRateLimit(provider: string, userId: string): Promise<RateLimit> {
  const limits = API_LIMITS[provider];
  if (!limits) {
    return { limit: 100, remaining: 100, reset: Date.now() + 3600000 };
  }

  return await checkUserRateLimit(`${provider}:${userId}`, limits.limit, limits.window);
}
```

## Rate Limit Headers

### Response Headers
```typescript
function addRateLimitHeaders(response: Response, rateLimit: RateLimit): Response {
  response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
  
  if (rateLimit.retryAfter) {
    response.headers.set('Retry-After', rateLimit.retryAfter.toString());
  }
  
  return response;
}
```

### Client Handling
```typescript
function handleRateLimit(response: Response): void {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  const retryAfter = response.headers.get('Retry-After');

  if (remaining === '0') {
    const resetTime = new Date(parseInt(reset!) * 1000);
    console.log(`Rate limit exceeded. Reset at ${resetTime}`);
    
    if (retryAfter) {
      setTimeout(() => {
        // Retry request
      }, parseInt(retryAfter) * 1000);
    }
  }
}
```

## Circuit Breaker Pattern

### Implementation
```typescript
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### Usage
```typescript
const circuitBreaker = new CircuitBreaker(5, 60000, 30000);

async function fetchWithCircuitBreaker(url: string): Promise<any> {
  return await circuitBreaker.execute(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  });
}
```

## Monitoring and Alerting

### Metrics Collection
```typescript
interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  averageResponseTime: number;
  totalRequests: number;
}

interface RateLimitMetrics {
  totalRequests: number;
  rateLimitedRequests: number;
  averageRequestsPerMinute: number;
  peakRequestsPerMinute: number;
}

async function collectMetrics(): Promise<{
  cache: CacheMetrics;
  rateLimit: RateLimitMetrics;
}> {
  // Collect cache metrics
  const cacheMetrics = await getCacheMetrics();
  
  // Collect rate limit metrics
  const rateLimitMetrics = await getRateLimitMetrics();
  
  return { cache: cacheMetrics, rateLimit: rateLimitMetrics };
}
```

### Alerting
```typescript
async function checkAlerts(metrics: any): Promise<void> {
  // Cache hit rate alert
  if (metrics.cache.hitRate < 0.8) {
    await sendAlert('Low cache hit rate', { hitRate: metrics.cache.hitRate });
  }

  // Rate limit alert
  if (metrics.rateLimit.rateLimitedRequests > 100) {
    await sendAlert('High rate limiting', { 
      rateLimitedRequests: metrics.rateLimit.rateLimitedRequests 
    });
  }

  // Response time alert
  if (metrics.cache.averageResponseTime > 5000) {
    await sendAlert('Slow cache response', { 
      averageResponseTime: metrics.cache.averageResponseTime 
    });
  }
}
```

## Performance Optimization

### 1. Cache Warming
```typescript
async function warmCache(): Promise<void> {
  const popularQueries = await getPopularQueries();
  
  for (const query of popularQueries) {
    try {
      await fetchAndCache(query);
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }
}
```

### 2. Batch Operations
```typescript
async function batchCacheOperations(operations: CacheOperation[]): Promise<void> {
  const batch = operations.map(op => ({
    provider: op.provider,
    cache_key: op.key,
    payload: op.data,
    fetched_at: new Date().toISOString(),
    ttl_seconds: op.ttl,
    is_stale: false,
  }));

  await supabase
    .from('api_cache')
    .upsert(batch);
}
```

### 3. Connection Pooling
```typescript
class ConnectionPool {
  private connections: Connection[] = [];
  private maxConnections: number = 10;

  async getConnection(): Promise<Connection> {
    if (this.connections.length > 0) {
      return this.connections.pop()!;
    }
    
    return await createConnection();
  }

  async releaseConnection(connection: Connection): Promise<void> {
    if (this.connections.length < this.maxConnections) {
      this.connections.push(connection);
    } else {
      await connection.close();
    }
  }
}
```

## Testing

### Cache Testing
```typescript
describe('Cache System', () => {
  it('should cache data with TTL', async () => {
    const data = { test: 'data' };
    await cache.set('test', 'key', data, 3600);
    
    const cached = await cache.get('test', 'key');
    expect(cached).toEqual(data);
  });

  it('should expire cache after TTL', async () => {
    const data = { test: 'data' };
    await cache.set('test', 'key', data, 1);
    
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const cached = await cache.get('test', 'key');
    expect(cached).toBeNull();
  });
});
```

### Rate Limit Testing
```typescript
describe('Rate Limiting', () => {
  it('should enforce user rate limits', async () => {
    const userId = 'user-123';
    
    // Make requests up to limit
    for (let i = 0; i < 100; i++) {
      await checkUserRateLimit(userId, 100, 3600);
    }
    
    // Next request should be rate limited
    await expect(checkUserRateLimit(userId, 100, 3600))
      .rejects.toThrow('Rate limit exceeded');
  });
});
```

## Troubleshooting

### Common Issues

1. **Cache Misses**:
   - Check TTL configuration
   - Verify cache key generation
   - Monitor cache cleanup

2. **Rate Limit Issues**:
   - Verify rate limit configuration
   - Check for IP blocking
   - Monitor rate limit headers

3. **Performance Issues**:
   - Optimize cache queries
   - Implement connection pooling
   - Monitor response times

### Debug Tools
```typescript
// Enable debug logging
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Cache operation:', { provider, key, ttl });
  console.log('Rate limit check:', { userId, limit, remaining });
}
```
