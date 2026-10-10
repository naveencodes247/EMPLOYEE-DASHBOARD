import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const env =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : (typeof process !== 'undefined' ? process.env : {});

const supabaseUrl =
  env?.VITE_SUPABASE_URL ||
  env?.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  env?.VITE_SUPABASE_ANON_KEY ||
  env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[WorkSphere Supabase Client] Missing Supabase environment configuration.');
}

/**
 * WorkSphere typed Supabase client singleton.
 * Configured with auto-refreshing sessions and local storage persistence.
 * Safe for client-side use with publishable/anon key.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
