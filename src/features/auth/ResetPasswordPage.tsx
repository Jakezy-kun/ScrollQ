import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { FormMessage, PasswordField } from '@/components/form/Fields';
import { useToast } from '@/components/toastContext';
import { useAuth } from '@/lib/auth/authContext';
import { AuthScreen } from './AuthScreen';
import type { NewPasswordValues } from './schemas';
import { newPasswordFormSchema } from './schemas';
import { StrengthMeter } from './StrengthMeter';

/** Reached from the reset email link; Supabase signs the player in for this step. */
export function ResetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    const result = await auth.updatePassword(password);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    toast.show("Password updated. You're logged in.", { tone: 'good' });
    navigate(ROUTES.start, { replace: true });
  });

  if (auth.status === 'loading') {
    return (
      <AuthScreen title="Set a new password">
        <p className="text-muted" role="status">
          Checking your link…
        </p>
      </AuthScreen>
    );
  }

  if (auth.status !== 'signedIn') {
    return (
      <AuthScreen title="Link expired" backTo={ROUTES.login}>
        <p className="text-muted">
          This reset link has expired or was already used. Ask for a new one.
        </p>
        <Button fullWidth className="mt-6" onClick={() => navigate(ROUTES.forgotPassword)}>
          Send a new link
        </Button>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Set a new password" subtitle="Choose something you don't use anywhere else.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <FormMessage>{formError}</FormMessage>}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          hint={<StrengthMeter password={watch('password')} />}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Save new password
        </Button>
      </form>
    </AuthScreen>
  );
}
