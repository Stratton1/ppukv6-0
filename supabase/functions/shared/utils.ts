/**
 * Shared utilities for PPUK API Edge Functions
 * Provides error handling, logging, rate limiting, and caching utilities
 */

import { RequestContext, ApiError, RateLimitInfo, CacheInfo } from './types.ts';

// Generate unique request ID
export function generateRequestId(): string {
  return crypto.randomUUID();
}

// Create request context
export function createRequestContext(req: Request, userId?: string, propertyId?: string): RequestContext {
  return {
    requestId: generateRequestId(),
    userId,
    propertyId,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent') || undefined,
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
  };
}

// Error handling utilities
export class ApiErrorHandler {
  static createError(
    code: string,
    message: string,
    details?: any,
    requestId?: string
  ): ApiError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    };
  }

  static createNotFoundError(resource: string, requestId?: string): ApiError {
    return this.createError(
      'NOT_FOUND',
      `${resource} not found`,
      undefined,
      requestId
    );
  }

  static createValidationError(message: string, details?: any, requestId?: string): ApiError {
    return this.createError(
      'VALIDATION_ERROR',
      message,
      details,
      requestId
    );
  }

  static createRateLimitError(retryAfter?: number, requestId?: string): ApiError {
    return this.createError(
      'RATE_LIMIT_EXCEEDED',
      'Rate limit exceeded',
      { retryAfter },
      requestId
    );
  }

  static createExternalApiError(service: string, message: string, requestId?: string): ApiError {
    return this.createError(
      'EXTERNAL_API_ERROR',
      `${service} API error: ${message}`,
      { service },
      requestId
    );
  }

  static createInternalError(message: string, requestId?: string): ApiError {
    return this.createError(
      'INTERNAL_ERROR',
      message,
      undefined,
      requestId
    );
  }
}

// Logging utilities
export class Logger {
  private context: RequestContext;

  constructor(context: RequestContext) {
    this.context = context;
  }

  private formatLog(level: string, message: string, data?: any): string {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.context.requestId,
      userId: this.context.userId,
      propertyId: this.context.propertyId,
      ...(data && { data }),
    };
    return JSON.stringify(logEntry);
  }

  info(message: string, data?: any): void {
    console.log(this.formatLog('INFO', message, data));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatLog('WARN', message, data));
  }

  error(message: string, error?: Error, data?: any): void {
    console.error(this.formatLog('ERROR', message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...data,
    }));
  }

  debug(message: string, data?: any): void {
    console.debug(this.formatLog('DEBUG', message, data));
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static readonly DEFAULT_LIMIT = 100; // requests per hour
  private static readonly DEFAULT_WINDOW = 3600; // 1 hour in seconds

  static async checkRateLimit(
    identifier: string,
    limit: number = this.DEFAULT_LIMIT,
    window: number = this.DEFAULT_WINDOW
  ): Promise<RateLimitInfo> {
    // In a real implementation, this would use Redis or similar
    // For now, we'll use a simple in-memory approach
    const key = `rate_limit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - window;

    // This is a simplified implementation
    // In production, use Redis with proper atomic operations
    const current = await this.getCurrentCount(key, windowStart);
    
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

    await this.incrementCount(key, now, window);

    return {
      limit,
      remaining: limit - current - 1,
      reset: now + window,
    };
  }

  private static async getCurrentCount(key: string, windowStart: number): Promise<number> {
    // Simplified implementation - in production use Redis
    return 0;
  }

  private static async incrementCount(key: string, timestamp: number, window: number): Promise<void> {
    // Simplified implementation - in production use Redis
    // This would increment a counter and set expiration
  }
}

// Caching utilities
export class CacheManager {
  private static readonly DEFAULT_TTL = 3600; // 1 hour

  static async get<T>(key: string): Promise<T | null> {
    // In a real implementation, this would use Redis
    // For now, return null (no cache)
    return null;
  }

  static async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    // In a real implementation, this would use Redis
    // For now, do nothing (no cache)
  }

  static async invalidate(key: string): Promise<void> {
    // In a real implementation, this would use Redis
    // For now, do nothing (no cache)
  }

  static generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  static getCacheInfo(key: string, ttl: number): CacheInfo {
    return {
      cached: false, // Simplified - would check if actually cached
      cacheKey: key,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      ttl,
    };
  }
}

// HTTP utilities
export class HttpUtils {
  static createResponse<T>(data: T, status: number = 200, headers?: Record<string, string>): Response {
    const responseHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    });

    return new Response(JSON.stringify(data), {
      status,
      headers: responseHeaders,
    });
  }

  static createErrorResponse(error: ApiError, status: number = 500): Response {
    return this.createResponse(error, status);
  }

  static createSuccessResponse<T>(data: T, requestId: string): Response {
    return this.createResponse({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  static async handleCors(req: Request): Promise<Response | null> {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    return null;
  }
}

// External API utilities
export class ExternalApiClient {
  private logger: Logger;
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string, logger: Logger) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.logger = logger;
  }

  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = 30000
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    
    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }
    
    headers.set('Content-Type', 'application/json');
    headers.set('User-Agent', 'PPUK-API-Client/1.0');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      this.logger.debug(`Making request to ${url}`, { options });
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API request failed`, undefined, {
          url,
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.logger.debug(`API request successful`, { url, status: response.status });
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        this.logger.error(`API request timeout`, error, { url, timeout });
        throw new Error(`API request timeout after ${timeout}ms`);
      }
      
      this.logger.error(`API request error`, error, { url });
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }
    
    return this.makeRequest<T>(url.pathname + url.search, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Validation utilities
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validatePostcode(postcode: string): boolean {
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(postcode);
}

export function validateUPRN(uprn: string): boolean {
  const uprnRegex = /^[0-9]{12}$/;
  return uprnRegex.test(uprn);
}

// Performance monitoring
export class PerformanceMonitor {
  private startTime: number;
  private logger: Logger;

  constructor(logger: Logger) {
    this.startTime = Date.now();
    this.logger = logger;
  }

  end(operation: string): number {
    const duration = Date.now() - this.startTime;
    this.logger.info(`Operation completed`, { operation, duration });
    return duration;
  }

  static measure<T>(operation: string, fn: () => Promise<T>, logger: Logger): Promise<T> {
    const monitor = new PerformanceMonitor(logger);
    return fn().finally(() => monitor.end(operation));
  }
}
