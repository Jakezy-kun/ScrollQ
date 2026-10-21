import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import type { LoginState } from '@/features/auth/LogInPage';
import { useAuth } from '@/lib/auth/authContext';
import { ROUTES } from './routes';

/**
 * Guards signed-in pages. Guests go to Log in and come back afterwards; in guest-only
 * mode (no Supabase) these pages don't exist, so they go to Start.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, accountsEnabled, sessionExpired } = useAuth();
  const location = useLocation();

  if (!accountsEnabled) return <Navigate to={ROUTES.start} replace />;
  if (status === 'loading') {
    return (
      <p className="flex flex-1 items-center justify-center text-muted" role="status">
        Loading…
      </p>
    );
  }
  if (status !== 'signedIn') {
    const state: LoginState = {
      from: { pathname: location.pathname, search: location.search, hash: location.hash },
      reason: sessionExpired ? 'expired' : 'protected',
    };
    return <Navigate to={ROUTES.login} replace state={state} />;
  }
  return <>{children}</>;
}
