import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Location } from 'react-router';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { FormMessage, PasswordField, TextField } from '@/components/form/Fields';
import { useToast } from '@/components/toastContext';
import { useAuth } from '@/lib/auth/authContext';
import { AuthScreen, OrDivider } from './AuthScreen';
import type { LogInValues } from './schemas';
import { logInSchema } from './schemas';

/** Router state passed by protected routes. */
export interface LoginState {
  from?: Pick<Location, 'pathname' | 'search' | 'hash'>;
  reason?: 'protected' | 'expired';
}

export function LogInPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const state = (useLocation().state as LoginState | null) ?? {};
  const [formError, setFormError] = useState<string | null>(null);
  const returnTo = state.from
    ? `${state.from.pathname}${state.from.search ?? ''}${state.from.hash ?? ''}`
    : ROUTES.start;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LogInValues>({
    resolver: zodResolver(logInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  if (auth.status === 'signedIn') return <Navigate to={returnTo} replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const result = await auth.signIn(email, password);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    toast.show('Welcome back!', { tone: 'good' });
    navigate(returnTo, { replace: true });
  });

  const notice =
    state.reason === 'expired' || auth.sessionExpired
      ? 'Your session expired. Please log in again. Your round is safe.'
      : state.reason === 'protected'
        ? 'Log in to see that page.'
        : null;

  return (
    <AuthScreen title="Log in" subtitle="Pick up where you left off.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {notice && !formError && <FormMessage tone="info">{notice}</FormMessage>}
        {formError && <FormMessage>{formError}</FormMessage>}
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="-mt-2 text-right">
          <Link
            to={ROUTES.forgotPassword}
            className="inline-flex min-h-tap items-center text-sm font-semibold text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>
          Log in
        </Button>
      </form>

      {auth.googleEnabled && (
        <>
          <OrDivider />
          <Button fullWidth variant="secondary" onClick={() => void auth.signInWithGoogle()}>
            Continue with Google
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-muted">
        New here?{' '}
        <Link to={ROUTES.signup} className="font-semibold text-fg underline underline-offset-4">
          Create account
        </Link>
      </p>
      <Button fullWidth variant="ghost" className="mt-2" onClick={() => navigate(ROUTES.start)}>
        Play as guest
      </Button>
    </AuthScreen>
  );
}
