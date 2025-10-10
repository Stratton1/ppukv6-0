/**
 * Environment configuration with validation and feature flags
 * Provides type-safe access to Vite environment variables
 */

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnon: import.meta.env.VITE_SUPABASE_ANON_KEY,
  fnBase: import.meta.env.VITE_FN_BASE,
  flags: {
    relationships: import.meta.env.VITE_FEATURE_RELATIONSHIPS === 'true',
    docUploads: import.meta.env.VITE_FEATURE_DOC_UPLOADS === 'true',
    notes: import.meta.env.VITE_FEATURE_NOTES === 'true',
  }
}

// Development environment validation
if (import.meta.env.DEV) {
  const requiredVars = [
    ['VITE_SUPABASE_URL', env.supabaseUrl],
    ['VITE_SUPABASE_ANON_KEY', env.supabaseAnon],
    ['VITE_FN_BASE', env.fnBase],
  ] as const

  requiredVars.forEach(([key, value]) => {
    if (!value) {
      console.warn(`Missing ${key} in .env.local`)
    }
  })

  // Log feature flags in development
  console.log('Feature flags:', env.flags)
}

// Type exports for external use
export type FeatureFlags = typeof env.flags
export type Environment = typeof env
