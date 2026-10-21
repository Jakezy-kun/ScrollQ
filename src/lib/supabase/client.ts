import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type ScrollQSupabase = SupabaseClient<Database>;

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when Supabase is configured. Without it ScrollQ runs in guest-only mode. */
export const accountsEnabled = Boolean(url && anonKey);

/** Optional extra: show "Continue with Google" only when it is set up in Supabase. */
export const googleEnabled = accountsEnabled && import.meta.env.VITE_ENABLE_GOOGLE === 'true';

let clientPromise: Promise<ScrollQSupabase | null> | null = null;

/**
 * The shared client (only ever the public anon key), or null in guest-only mode.
 * supabase-js is loaded on demand, so guests and first paint don't pay for it.
 */
export function loadSupabase(): Promise<ScrollQSupabase | null> {
  if (clientPromise) return clientPromise;
  if (!url || !anonKey) {
    if (import.meta.env.MODE !== 'test') {
      console.info(
        '[ScrollQ] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set, so accounts are off and ScrollQ runs in guest-only mode. See README → Supabase setup.',
      );
    }
    clientPromise = Promise.resolve(null);
    return clientPromise;
  }
  clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
    createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Picks up the session from email confirmation and password reset links.
        detectSessionInUrl: true,
        storageKey: 'scrollq-auth',
      },
    }),
  );
  return clientPromise;
}

/** Where auth emails send people back to (works locally and on Vercel). */
export function authRedirect(path: string): string {
  return `${window.location.origin}${path}`;
}
