/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_FN_BASE: string
  readonly VITE_FEATURE_RELATIONSHIPS?: string
  readonly VITE_FEATURE_DOC_UPLOADS?: string
  readonly VITE_FEATURE_NOTES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
