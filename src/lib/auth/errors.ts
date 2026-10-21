/** What went wrong, in terms the UI cares about. Never reveals which part of a login was wrong. */
export type AuthErrorKind =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'rate_limited'
  | 'weak_password'
  | 'same_password'
  | 'network'
  | 'disabled'
  | 'unknown';

export const AUTH_ERROR_MESSAGE: Record<AuthErrorKind, string> = {
  invalid_credentials: 'Wrong email or password.',
  email_not_confirmed: 'Please confirm your email first. Check your inbox for the link.',
  rate_limited: 'Too many tries. Please wait a minute and try again.',
  weak_password: 'Choose a stronger password: at least 8 characters, mixing letters and numbers.',
  same_password: 'Your new password must be different from your current one.',
  network: "Can't reach ScrollQ right now. Check your connection and try again.",
  disabled: 'Accounts are turned off on this copy of ScrollQ. You can still play as a guest.',
  unknown: 'Something went wrong. Please try again.',
};

export type AuthResult = { ok: true } | { ok: false; kind: AuthErrorKind; message: string };

export const OK: AuthResult = { ok: true };

export function fail(kind: AuthErrorKind): AuthResult {
  return { ok: false, kind, message: AUTH_ERROR_MESSAGE[kind] };
}

/** Map a Supabase auth error (or a thrown fetch error) to a generic, safe message. */
export function toAuthError(error: unknown): AuthResult {
  const e = (error ?? {}) as { code?: string; status?: number; message?: string; name?: string };
  const code = e.code ?? '';
  const message = (e.message ?? '').toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return fail('invalid_credentials');
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return fail('email_not_confirmed');
  }
  if (e.status === 429 || code.startsWith('over_') || message.includes('rate limit')) {
    return fail('rate_limited');
  }
  if (code === 'weak_password' || message.includes('password should')) return fail('weak_password');
  if (code === 'same_password') return fail('same_password');
  if (
    e.name === 'AuthRetryableFetchError' ||
    e.name === 'TypeError' ||
    message.includes('failed to fetch') ||
    message.includes('network')
  ) {
    return fail('network');
  }
  return fail('unknown');
}
