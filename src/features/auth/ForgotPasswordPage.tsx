import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { FormMessage, TextField } from '@/components/form/Fields';
import { useCooldown } from '@/hooks/useCooldown';
import { useAuth } from '@/lib/auth/authContext';
import { AuthScreen } from './AuthScreen';
import type { EmailOnlyValues } from './schemas';
import { emailOnlySchema } from './schemas';

const COOLDOWN_S = 60;
/** Same message whether or not the email has an account, so it can't be used to probe. */
const SENT = 'If that email has an account, we sent a reset link. Check your inbox.';

export function ForgotPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const cooldown = useCooldown(COOLDOWN_S);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailOnlyValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    const result = await auth.resetPassword(email);
    cooldown.start();
    // Only problems that aren't about the account itself are shown.
    if (!result.ok && (result.kind === 'network' || result.kind === 'rate_limited')) {
      setMessage({ tone: 'error', text: result.message });
    } else {
      setMessage({ tone: 'success', text: SENT });
    }
  });

  return (
    <AuthScreen
      title="Forgot password"
      subtitle="Enter your email and we'll send you a link to set a new password."
      backTo={ROUTES.login}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" fullWidth loading={isSubmitting} disabled={cooldown.active}>
          {cooldown.active ? `Send again in ${cooldown.remaining}s` : 'Send reset link'}
        </Button>
      </form>
      <Button fullWidth variant="ghost" className="mt-3" onClick={() => navigate(ROUTES.login)}>
        Back to log in
      </Button>
    </AuthScreen>
  );
}
