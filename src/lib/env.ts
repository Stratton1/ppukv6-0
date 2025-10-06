/**
 * Environment variable validation and access
 * 
 * IMPORTANT: Vite uses `import.meta.env.VITE_*` NOT `process.env`
 */

import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url("Must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(20, "Must be a valid Supabase anon key"),
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;
let validationError: z.ZodError | null = null;

/**
 * Get validated environment variables
 * Returns null if validation fails
 */
export function getEnv(): Env | null {
  if (cachedEnv) return cachedEnv;

  try {
    const raw = {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
      APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    };

    cachedEnv = envSchema.parse(raw);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      validationError = error;
    }
    return null;
  }
}

/**
 * Check if environment is ready
 */
export function isEnvReady(): boolean {
  return getEnv() !== null;
}

/**
 * Get list of missing or invalid environment variables with instructions
 */
export function envMissingReason(): string[] {
  if (cachedEnv) return [];

  const reasons: string[] = [];
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    reasons.push("VITE_SUPABASE_URL is not set");
  } else if (!url.startsWith("http")) {
    reasons.push(`VITE_SUPABASE_URL is invalid: "${url}"`);
  }

  if (!key) {
    reasons.push("VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) is not set");
  } else if (key.length < 20) {
    reasons.push("VITE_SUPABASE_PUBLISHABLE_KEY appears to be invalid (too short)");
  }

  if (validationError) {
    validationError.errors.forEach((err) => {
      reasons.push(`${err.path.join(".")}: ${err.message}`);
    });
  }

  if (reasons.length === 0 && !cachedEnv) {
    reasons.push("Unknown validation error - check browser console");
  }

  return reasons;
}

/**
 * Get current environment name
 */
export function getAppEnv(): "development" | "preview" | "production" {
  const env = getEnv();
  return env?.APP_ENV || "development";
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getAppEnv() === "development";
}

/**
 * Get debug info (safe for display - no secrets)
 */
export function getEnvDebugInfo() {
  return {
    VITE_SUPABASE_URL: {
      present: !!import.meta.env.VITE_SUPABASE_URL,
      length: import.meta.env.VITE_SUPABASE_URL?.length || 0,
      preview: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + "...",
    },
    VITE_SUPABASE_PUBLISHABLE_KEY: {
      present: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      length: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.length || 0,
    },
    VITE_SUPABASE_ANON_KEY: {
      present: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      length: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    },
    VITE_APP_ENV: {
      present: !!import.meta.env.VITE_APP_ENV,
      value: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    },
    MODE: import.meta.env.MODE,
    isEnvReady: isEnvReady(),
    validationErrors: envMissingReason(),
  };
}
