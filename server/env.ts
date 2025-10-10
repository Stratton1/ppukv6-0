/**
 * PPUK v6 Server Environment Configuration
 * Runtime validation for server-side secrets and configuration
 * Created: 2025-01-03
 * Purpose: Centralized environment variable validation and configuration
 */

import { z } from 'zod';
import { ServerConfig } from './types.ts';

// ============================================================================
// ENVIRONMENT SCHEMAS
// ============================================================================

// Supabase configuration schema
const SupabaseConfigSchema = z.object({
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
});

// Provider API configuration schemas
const ProviderConfigSchema = z.object({
  EPC_API_URL: z.string().url('Invalid EPC API URL').optional(),
  EPC_API_KEY: z.string().optional(),
  FLOOD_API_URL: z.string().url('Invalid Flood API URL').optional(),
  FLOOD_API_KEY: z.string().optional(),
  PLANNING_API_URL: z.string().url('Invalid Planning API URL').optional(),
  PLANNING_API_KEY: z.string().optional(),
  POSTCODES_API_URL: z.string().url('Invalid Postcodes API URL').optional(),
  OSPLACES_API_URL: z.string().url('Invalid OS Places API URL').optional(),
  OSPLACES_API_KEY: z.string().optional(),
  INSPIRE_API_URL: z.string().url('Invalid INSPIRE API URL').optional(),
  INSPIRE_API_KEY: z.string().optional(),
  COMPANIES_API_URL: z.string().url('Invalid Companies House API URL').optional(),
  COMPANIES_API_KEY: z.string().optional(),
});

// Cache configuration schema
const CacheConfigSchema = z.object({
  CACHE_DEFAULT_TTL: z.coerce.number().min(60, 'Cache TTL must be at least 60 seconds').default(3600),
  CACHE_MAX_SIZE: z.coerce.number().min(100, 'Cache max size must be at least 100').default(10000),
  CACHE_CLEANUP_INTERVAL: z.coerce.number().min(300, 'Cache cleanup interval must be at least 5 minutes').default(3600),
});

// Audit configuration schema
const AuditConfigSchema = z.object({
  AUDIT_ENABLED: z.coerce.boolean().default(true),
  AUDIT_RETENTION_DAYS: z.coerce.number().min(1, 'Audit retention must be at least 1 day').default(90),
});

// Rate limiting configuration schema
const RateLimitConfigSchema = z.object({
  RATE_LIMIT_DEFAULT: z.coerce.number().min(1, 'Rate limit must be at least 1').default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().min(60, 'Rate limit window must be at least 60 seconds').default(3600),
  RATE_LIMIT_BURST: z.coerce.number().min(1, 'Rate limit burst must be at least 1').default(10),
});

// Security configuration schema
const SecurityConfigSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  CORS_ORIGINS: z.string().default('*'),
  ALLOWED_IPS: z.string().optional(),
});

// Logging configuration schema
const LoggingConfigSchema = z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  LOG_FILE: z.string().optional(),
});

// Complete environment schema
const EnvironmentSchema = z.object({
  // Supabase
  ...SupabaseConfigSchema.shape,
  // Providers
  ...ProviderConfigSchema.shape,
  // Cache
  ...CacheConfigSchema.shape,
  // Audit
  ...AuditConfigSchema.shape,
  // Rate limiting
  ...RateLimitConfigSchema.shape,
  // Security
  ...SecurityConfigSchema.shape,
  // Logging
  ...LoggingConfigSchema.shape,
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().min(1, 'Port must be at least 1').max(65535, 'Port must be at most 65535').default(3000),
  HOST: z.string().default('localhost'),
});

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: ServerConfig | null = null;
  private errors: string[] = [];

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Validate and parse environment variables
   */
  public validate(): ServerConfig {
    if (this.config) {
      return this.config;
    }

    try {
      // Get environment variables
      const env = this.getEnvironmentVariables();
      
      // Validate environment variables
      const validatedEnv = EnvironmentSchema.parse(env);
      
      // Build configuration object
      this.config = this.buildConfig(validatedEnv);
      
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Environment validation failed:\n${this.errors.join('\n')}`);
      }
      throw error;
    }
  }

  /**
   * Get environment variables from Deno.env (for Edge Functions) or process.env (for local development)
   */
  private getEnvironmentVariables(): Record<string, any> {
    // Check if we're in a Deno environment (Edge Functions)
    if (typeof Deno !== 'undefined' && Deno.env) {
      const env: Record<string, any> = {};
      for (const [key, value] of Deno.env.entries()) {
        env[key] = value;
      }
      return env;
    }
    
    // Fallback to process.env for local development
    if (typeof process !== 'undefined' && process.env) {
      return process.env;
    }
    
    throw new Error('No environment variables available');
  }

  /**
   * Build configuration object from validated environment variables
   */
  private buildConfig(env: z.infer<typeof EnvironmentSchema>): ServerConfig {
    return {
      supabase: {
        url: env.SUPABASE_URL,
        anonKey: env.SUPABASE_ANON_KEY,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
      providers: {
        epc: {
          baseUrl: env.EPC_API_URL || 'https://epc.opendatacommunities.org/api/v1',
          apiKey: env.EPC_API_KEY,
          rateLimit: env.RATE_LIMIT_DEFAULT,
          ttl: env.CACHE_DEFAULT_TTL,
        },
        flood: {
          baseUrl: env.FLOOD_API_URL || 'https://environment.data.gov.uk/flood-monitoring',
          apiKey: env.FLOOD_API_KEY,
          rateLimit: env.RATE_LIMIT_DEFAULT,
          ttl: env.CACHE_DEFAULT_TTL,
        },
        planning: {
          baseUrl: env.PLANNING_API_URL || 'https://www.planning.data.gov.uk',
          apiKey: env.PLANNING_API_KEY,
          rateLimit: env.RATE_LIMIT_DEFAULT,
          ttl: env.CACHE_DEFAULT_TTL,
        },
        postcodes: {
          baseUrl: env.POSTCODES_API_URL || 'https://api.postcodes.io',
          rateLimit: env.RATE_LIMIT_DEFAULT,
          ttl: env.CACHE_DEFAULT_TTL,
        },
        osplaces: {
          baseUrl: env.OSPLACES_API_URL || 'https://api.os.uk/places/v1',
          apiKey: env.OSPLACES_API_KEY,
          rateLimit: env.RATE_LIMIT_DEFAULT,
          ttl: env.CACHE_DEFAULT_TTL,
        },
        inspire: {
          baseUrl: env.INSPIRE_API_URL || 'https://inspire.landregistry.gov.uk',
          apiKey: env.INSPIRE_API_KEY,
          rateLimit: env.RATE_LIMIT_DEFAULT,
          ttl: env.CACHE_DEFAULT_TTL,
        },
        companies: {
          baseUrl: env.COMPANIES_API_URL || 'https://api.company-information.service.gov.uk',
          apiKey: env.COMPANIES_API_KEY,
          rateLimit: env.RATE_LIMIT_DEFAULT,
          ttl: env.CACHE_DEFAULT_TTL,
        },
      },
      cache: {
        defaultTtl: env.CACHE_DEFAULT_TTL,
        maxSize: env.CACHE_MAX_SIZE,
        cleanupInterval: env.CACHE_CLEANUP_INTERVAL,
      },
      audit: {
        enabled: env.AUDIT_ENABLED,
        retentionDays: env.AUDIT_RETENTION_DAYS,
      },
    };
  }

  /**
   * Get validation errors
   */
  public getErrors(): string[] {
    return this.errors;
  }

  /**
   * Check if configuration is valid
   */
  public isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Reset configuration (for testing)
   */
  public reset(): void {
    this.config = null;
    this.errors = [];
  }
}

// ============================================================================
// CONFIGURATION GETTERS
// ============================================================================

/**
 * Get validated server configuration
 */
export function getServerConfig(): ServerConfig {
  const validator = EnvironmentValidator.getInstance();
  return validator.validate();
}

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig() {
  const config = getServerConfig();
  return config.supabase;
}

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: keyof ServerConfig['providers']) {
  const config = getServerConfig();
  return config.providers[provider];
}

/**
 * Get cache configuration
 */
export function getCacheConfig() {
  const config = getServerConfig();
  return config.cache;
}

/**
 * Get audit configuration
 */
export function getAuditConfig() {
  const config = getServerConfig();
  return config.audit;
}

// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  const env = getEnvironmentVariable('NODE_ENV', 'development');
  return env === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  const env = getEnvironmentVariable('NODE_ENV', 'development');
  return env === 'production';
}

/**
 * Check if running in staging mode
 */
export function isStaging(): boolean {
  const env = getEnvironmentVariable('NODE_ENV', 'development');
  return env === 'staging';
}

/**
 * Get environment variable with fallback
 */
export function getEnvironmentVariable(key: string, fallback?: string): string {
  // Try Deno.env first (Edge Functions)
  if (typeof Deno !== 'undefined' && Deno.env) {
    return Deno.env.get(key) || fallback || '';
  }
  
  // Fallback to process.env (local development)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback || '';
  }
  
  return fallback || '';
}

/**
 * Get required environment variable
 */
export function getRequiredEnvironmentVariable(key: string): string {
  const value = getEnvironmentVariable(key);
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Get boolean environment variable
 */
export function getBooleanEnvironmentVariable(key: string, fallback: boolean = false): boolean {
  const value = getEnvironmentVariable(key);
  if (!value) {
    return fallback;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get number environment variable
 */
export function getNumberEnvironmentVariable(key: string, fallback: number = 0): number {
  const value = getEnvironmentVariable(key);
  if (!value) {
    return fallback;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

// ============================================================================
// SECRETS MANAGEMENT
// ============================================================================

/**
 * Get provider API key from environment
 */
export function getProviderApiKey(provider: string): string | undefined {
  const key = `${provider.toUpperCase()}_API_KEY`;
  return getEnvironmentVariable(key);
}

/**
 * Check if provider API key is available
 */
export function hasProviderApiKey(provider: string): boolean {
  return !!getProviderApiKey(provider);
}

/**
 * Get all available provider API keys
 */
export function getAvailableProviders(): string[] {
  const providers = [
    'EPC',
    'FLOOD',
    'PLANNING',
    'OSPLACES',
    'INSPIRE',
    'COMPANIES',
  ];
  
  return providers.filter(provider => hasProviderApiKey(provider));
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate API key format
 */
export function validateApiKey(key: string, provider: string): boolean {
  if (!key || key.length < 10) {
    return false;
  }
  
  // Provider-specific validation
  switch (provider.toLowerCase()) {
    case 'epc':
      return key.length >= 32; // EPC API keys are typically longer
    case 'osplaces':
      return key.length >= 16; // OS Places API keys
    case 'companies':
      return key.length >= 32; // Companies House API keys
    default:
      return key.length >= 10; // Generic validation
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate port number
 */
export function validatePort(port: number): boolean {
  return port >= 1 && port <= 65535;
}

// ============================================================================
// CONFIGURATION EXPORTS
// ============================================================================

// Export singleton instance
export const envValidator = EnvironmentValidator.getInstance();

// Export default configuration
export const defaultConfig: Partial<ServerConfig> = {
  cache: {
    defaultTtl: 3600,
    maxSize: 10000,
    cleanupInterval: 3600,
  },
  audit: {
    enabled: true,
    retentionDays: 90,
  },
};

// Export environment schemas for documentation
export {
  EnvironmentSchema,
  SupabaseConfigSchema,
  ProviderConfigSchema,
  CacheConfigSchema,
  AuditConfigSchema,
  RateLimitConfigSchema,
  SecurityConfigSchema,
  LoggingConfigSchema,
};
