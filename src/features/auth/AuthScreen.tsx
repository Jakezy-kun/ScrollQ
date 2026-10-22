import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PAGE_WIDTH } from '@/components/pageWidth';
import { useAuth } from '@/lib/auth/authContext';
import { AUTH_ERROR_MESSAGE } from '@/lib/auth/errors';

interface AuthScreenProps {
  title: string;
  subtitle?: ReactNode;
  backTo?: string;
  children: ReactNode;
}

/** Shared frame for the account screens. In guest-only mode it explains accounts are off. */
export function AuthScreen({ title, subtitle, backTo = ROUTES.start, children }: AuthScreenProps) {
  const { accountsEnabled } = useAuth();
  const navigate = useNavigate();

  return (
    <main className={`flex min-h-dvh flex-1 flex-col px-5 pb-10 ${PAGE_WIDTH.narrow}`}>
      <ScreenHeader backTo={backTo} className="-mx-2" />
      <h1 className="mt-2 font-display text-3xl font-bold leading-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-base text-muted">{subtitle}</p>}
      <div className="mt-6 flex-1">
        {accountsEnabled ? (
          children
        ) : (
          <div className="space-y-4">
            <p className="rounded-card bg-surface p-4 text-muted">{AUTH_ERROR_MESSAGE.disabled}</p>
            <Button fullWidth onClick={() => navigate(ROUTES.start)}>
              Play as guest
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-sm text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-white/10" />
      or
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
