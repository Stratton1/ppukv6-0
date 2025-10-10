/**
 * API Client for PPUK v6 Edge Functions
 * Provides authenticated requests to Supabase Edge Functions
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

// Initialize Supabase client
export const supabase = createClient(env.supabaseUrl, env.supabaseAnon)

/**
 * Get authentication headers for API requests
 */
async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Generic API fetch function with authentication and error handling
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!env.fnBase) {
    throw new Error('VITE_FN_BASE missing - check your environment configuration')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...(init.headers as any),
  }

  const url = `${env.fnBase}/${path}`
  
  try {
    const res = await fetch(url, { 
      ...init, 
      headers,
      // Add timeout for better UX
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const errorMessage = text || res.statusText
      throw new Error(`API ${path} ${res.status}: ${errorMessage}`)
    }

    return (await res.json()) as T
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw API errors with context
      throw new Error(`Failed to fetch ${path}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id || null
}
