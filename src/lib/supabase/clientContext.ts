import { createContext, useContext } from 'react';
import type { ScrollQSupabase } from './client';

/** The loaded Supabase client, provided by AuthProvider (null for guests-only or while loading). */
export const SupabaseClientContext = createContext<ScrollQSupabase | null>(null);

export function useSupabaseClient(): ScrollQSupabase | null {
  return useContext(SupabaseClientContext);
}
