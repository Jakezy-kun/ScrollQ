import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { CheckboxField, FormMessage, PasswordField, TextField } from '@/components/form/Fields';
import { useAuth } from '@/lib/auth/authContext';
import { usePrefs } from '@/lib/prefs';
import { AuthScreen, OrDivider } from './AuthScreen';
import type { SignUpValues } from './schemas';
import { signUpSchema } from './schemas';
import { StrengthMeter } from './StrengthMeter';

export function SignUpPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const nickname = usePrefs((s) => s.nickname);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: nickname,
      email: '',
      password: '',
      confirmPassword: '',
      privacy: false,
    },
    mode: 'onTouched',
  });

  if (auth.status === 'signedIn') return <Navigate to={ROUTES.start} replace />;

  const onSubmit = handleSubmit(async ({ displayName, email, password }) => {
    setFormError(null);
    const result = await auth.signUp({ email, password, displayName });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    if (result.needsConfirmation) {
      navigate(ROUTES.checkEmail, { state: { email } });
    } else {
      navigate(ROUTES.start, { replace: true });
    }
  });

  return (
    <AuthScreen title="Create account" subtitle="Save your rounds and track your SQ. It's free.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <FormMessage>{formError}</FormMessage>}
        <TextField
          label="Display name"
          autoComplete="nickname"
          maxLength={24}
          hint="A nickname, not your real name."
          error={errors.displayName?.message}
          {...register('displayName')}
        />
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
          autoComplete="new-password"
          hint={<StrengthMeter password={watch('password')} />}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <CheckboxField
          label={
            <>
              I've read the{' '}
              <Link to={ROUTES.privacy} className="font-semibold underline underline-offset-4">
                Privacy notice
              </Link>
            </>
          }
          error={errors.privacy?.message}
          {...register('privacy')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
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
        Already have an account?{' '}
        <Link to={ROUTES.login} className="font-semibold text-fg underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthScreen>
  );
}
