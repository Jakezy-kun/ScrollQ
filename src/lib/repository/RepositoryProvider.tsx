import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { useSupabaseClient } from '@/lib/supabase/clientContext';
import { useDataRevision } from './dataRevision';
import { localRepository, RepositoryContext } from './repositoryContext';
import { SupabaseRepository } from './SupabaseRepository';

/**
 * Guests get the device repository; signed-in players get Supabase. Queued offline writes
 * upload on sign-in, when the connection returns, and when the app comes back to the front.
 */
export function RepositoryProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const client = useSupabaseClient();
  const bump = useDataRevision((s) => s.bump);
  const userId = status === 'signedIn' ? user?.id : undefined;

  const repo = useMemo(
    () => (client && userId ? new SupabaseRepository(client, userId) : localRepository),
    [client, userId],
  );

  useEffect(() => {
    if (!(repo instanceof SupabaseRepository)) return;
    const flush = () => {
      void repo.flush().then((sent) => {
        if (sent > 0) bump();
      });
    };
    const onVisible = () => {
      if (!document.hidden) flush();
    };
    flush();
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', flush);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [repo, bump]);

  return <RepositoryContext.Provider value={repo}>{children}</RepositoryContext.Provider>;
}
