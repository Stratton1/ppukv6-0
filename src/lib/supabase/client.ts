/**
 * Supabase client initialization
 * 
 * Exports null-safe client that only initializes when environment is ready
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getEnv } from "@/lib/env";

let supabaseInstance: SupabaseClient<Database> | null = null;
let initializationAttempted = false;

/**
 * Check if Supabase client is ready to use
 */
export const supabaseReady = (() => {
  const env = getEnv();
  return env !== null;
})();

/**
 * Initialize Supabase client (called once)
 */
function initializeSupabase(): SupabaseClient<Database> | null {
  if (initializationAttempted) {
    return supabaseInstance;
  }

  initializationAttempted = true;

  const env = getEnv();
  if (!env) {
    console.warn(
      "[Supabase] Environment not configured. Client will not be initialized.",
      "\nSee /debug/env for details or check docs/ENV_AND_AUTH.md"
    );
    return null;
  }

  try {
    supabaseInstance = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "X-PPUK-Client": "ppuk-v6",
        },
      },
    });

    console.log("[Supabase] Client initialized successfully");
    return supabaseInstance;
  } catch (error) {
    console.error("[Supabase] Failed to initialize client:", error);
    return null;
  }
}

/**
 * Get Supabase client or null if not initialized
 */
export function getSupabaseOrNull(): SupabaseClient<Database> | null {
  if (!supabaseInstance && !initializationAttempted) {
    initializeSupabase();
  }
  return supabaseInstance;
}

/**
 * Get Supabase client (throws if not ready)
 * Use this in components wrapped by AuthProvider
 */
export function getSupabase(): SupabaseClient<Database> {
  const client = getSupabaseOrNull();
  if (!client) {
    throw new Error(
      "Supabase client not initialized. Ensure environment variables are set. See /debug/env"
    );
  }
  return client;
}

// Export singleton for backwards compatibility
// Components should check supabaseReady first or use AuthProvider
export const supabase = getSupabaseOrNull();
