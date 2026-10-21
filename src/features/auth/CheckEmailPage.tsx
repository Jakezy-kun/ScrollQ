import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/form/Fields';
import { useCooldown } from '@/hooks/useCooldown';
import { useAuth } from '@/lib/auth/authContext';
import { AuthScreen } from './AuthScreen';

const RESEND_COOLDOWN_S = 60;

export function CheckEmailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  // The address arrives in router state, never in the URL.
  const email = (useLocation().state as { email?: string } | null)?.email ?? '';
  const cooldown = useCooldown(RESEND_COOLDOWN_S);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!email) return;
    setSending(true);
    const result = await auth.resendConfirmation(email);
    setSending(false);
    cooldown.start();
    setMessage(
      result.ok
        ? { tone: 'success', text: 'Sent again. It can take a minute to arrive.' }
        : { tone: 'error', text: result.message },
    );
  };

  return (
    <AuthScreen title="Check your email" backTo={ROUTES.signup}>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-violet/20">
          <MailCheck className="h-10 w-10 text-violet" aria-hidden="true" />
        </span>
        <p className="mt-6 text-lg leading-relaxed">
          {email ? (
            <>
              We sent a confirmation link to <span className="break-all font-bold">{email}</span>.
            </>
          ) : (
            'We sent you a confirmation link.'
          )}
        </p>
        <p className="mt-2 text-muted">Open it on this device to finish creating your account.</p>
      </div>

      <div className="mt-8 space-y-3">
        {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
        {email && (
          <Button
            fullWidth
            variant="secondary"
            loading={sending}
            disabled={cooldown.active}
            onClick={() => void resend()}
          >
            {cooldown.active ? `Resend email in ${cooldown.remaining}s` : 'Resend email'}
          </Button>
        )}
        <Button fullWidth onClick={() => navigate(ROUTES.login)}>
          Back to log in
        </Button>
      </div>
    </AuthScreen>
  );
}
