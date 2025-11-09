/**
 * Supabase client re-export
 * 
 * This file maintains compatibility with auto-generated Supabase integrations.
 * It re-exports the canonical client from lib/supabase/client.ts which includes
 * proper environment validation and error handling.
 * 
 * For new code, prefer importing directly from "@/lib/supabase/client"
 */

import { getSupabaseOrNull, getSupabase, supabaseReady } from "@/lib/supabase/client";
import type { Database } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Re-export the canonical client functions
export { getSupabaseOrNull, getSupabase, supabaseReady };

// Export supabase singleton for backwards compatibility
// Note: This may be null if environment is not configured
export const supabase: SupabaseClient<Database> | null = getSupabaseOrNull();