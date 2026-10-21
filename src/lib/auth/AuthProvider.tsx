import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useToast } from '@/components/toastContext';
import type { ScrollQSupabase } from '@/lib/supabase/client';
import {
  accountsEnabled,
  authRedirect,
  googleEnabled as googleConfigured,
  loadSupabase,
} from '@/lib/supabase/client';
import { SupabaseClientContext } from '@/lib/supabase/clientContext';
import type { AuthApi, AuthStatus, AuthUser, SignUpInput } from './authContext';
import { AuthContext, GUEST_AUTH } from './authContext';
import type { AuthResult } from './errors';
import { OK, toAuthError } from './errors';

function toUser(session: Session | null): AuthUser | null {
  const u = session?.user;
  return u ? { id: u.id, email: u.email ?? '' } : null;
}

interface AuthProviderProps {
  children: ReactNode;
  /** Injected in tests; by default the app's client is loaded on demand. */
  client?: ScrollQSupabase | null;
}

/** Shown while supabase-js loads: accounts exist, but we don't know who's signed in yet. */
const LOADING_AUTH = {
  ...GUEST_AUTH,
  accountsEnabled: true,
  googleEnabled: googleConfigured,
  status: 'loading' as const,
};

/**
 * Exposes the signed-in player and auth actions. Supabase keeps the session across visits
 * and refreshes tokens; if a session ends on its own, `sessionExpired` lets screens send
 * the player to Log in with a message, while any in-progress round stays in sessionStorage.
 */
export function AuthProvider({ children, client: injected }: AuthProviderProps) {
  const [loaded, setLoaded] = useState<ScrollQSupabase | null | undefined>(injected);

  useEffect(() => {
    if (injected !== undefined) return;
    let active = true;
    void loadSupabase().then((c) => active && setLoaded(c));
    return () => {
      active = false;
    };
  }, [injected]);

  const client = injected !== undefined ? injected : loaded;
  if (client === undefined && accountsEnabled) {
    return <AuthContext.Provider value={LOADING_AUTH}>{children}</AuthContext.Provider>;
  }
  if (!client) return <AuthContext.Provider value={GUEST_AUTH}>{children}</AuthContext.Provider>;
  return (
    <SupabaseClientContext.Provider value={client}>
      <SupabaseAuth client={client}>{children}</SupabaseAuth>
    </SupabaseClientContext.Provider>
  );
}

function SupabaseAuth({ client, children }: { client: ScrollQSupabase; children: ReactNode }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const signingOut = useRef(false);
  const statusRef = useRef<AuthStatus>('loading');
  statusRef.current = status;

  useEffect(() => {
    let active = true;
    client.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const u = toUser(data.session);
        setUser(u);
        setStatus(u ? 'signedIn' : 'guest');
      })
      .catch(() => active && setStatus('guest'));

    const { data } = client.auth.onAuthStateChange((event, session) => {
      const u = toUser(session);
      if (event === 'SIGNED_OUT') {
        // Signed out without the player asking: the session expired or was revoked.
        if (!signingOut.current && statusRef.current === 'signedIn') {
          setSessionExpired(true);
          toast.show('Your session ended', {
            tone: 'warning',
            detail: 'Log in again to keep saving to your account.',
          });
        }
        signingOut.current = false;
        setRecovering(false);
        setUser(null);
        setStatus('guest');
        return;
      }
      if (event === 'PASSWORD_RECOVERY') {
        setRecovering(true);
        navigate(ROUTES.resetPassword, { replace: true });
      }
      if (u) {
        setSessionExpired(false);
        setUser((prev) => (prev?.id === u.id && prev.email === u.email ? prev : u));
        setStatus('signedIn');
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client, navigate, toast]);

  const run = useCallback(
    async (fn: () => PromiseLike<{ error: unknown }>): Promise<AuthResult> => {
      try {
        const { error } = await fn();
        return error ? toAuthError(error) : OK;
      } catch (error) {
        return toAuthError(error);
      }
    },
    [],
  );

  const signUp = useCallback(
    async ({ email, password, displayName }: SignUpInput) => {
      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: authRedirect(ROUTES.start),
          },
        });
        if (error) return toAuthError(error);
        // No session means email confirmation is on: show "Check your email".
        return { ok: true as const, needsConfirmation: !data.session };
      } catch (error) {
        return toAuthError(error);
      }
    },
    [client],
  );

  const api = useMemo<AuthApi>(
    () => ({
      accountsEnabled: true,
      googleEnabled: googleConfigured,
      user,
      status,
      sessionExpired,
      recovering,
      signUp,
      signIn: (email, password) => run(() => client.auth.signInWithPassword({ email, password })),
      signInWithGoogle: () =>
        run(() =>
          client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: authRedirect(ROUTES.start) },
          }),
        ),
      signOut: async () => {
        signingOut.current = true;
        setSessionExpired(false);
        try {
          await client.auth.signOut({ scope: 'local' });
        } catch {
          // The local session is cleared even if the network call fails.
        }
        setUser(null);
        setStatus('guest');
      },
      resetPassword: (email) =>
        run(() =>
          client.auth.resetPasswordForEmail(email, {
            redirectTo: authRedirect(ROUTES.resetPassword),
          }),
        ),
      updatePassword: async (password) => {
        const result = await run(() => client.auth.updateUser({ password }));
        if (result.ok) setRecovering(false);
        return result;
      },
      resendConfirmation: (email) =>
        run(() =>
          client.auth.resend({
            type: 'signup',
            email,
            options: { emailRedirectTo: authRedirect(ROUTES.start) },
          }),
        ),
      deleteAccount: async () => {
        // The caller signs out afterwards (after leaving the protected page).
        return run(() => client.rpc('delete_my_account'));
      },
    }),
    [client, user, status, sessionExpired, recovering, signUp, run],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}
