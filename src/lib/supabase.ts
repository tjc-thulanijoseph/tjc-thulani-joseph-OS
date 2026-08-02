import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client. Credentials come from environment variables only
 * (.env at the project root) — nothing is hardcoded, so the project stays
 * fully portable across GitHub / Supabase / any deployment target.
 */
const url = (import.meta.env['VITE_SUPABASE_URL'] as string | undefined)?.trim() ?? "";
const anonKey = (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined)?.trim() ?? "";

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "tjc-os-auth",
      },
    })
  : null;

export const MISSING_ENV_MESSAGE =
  "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the .env file at the project root, then reload.";