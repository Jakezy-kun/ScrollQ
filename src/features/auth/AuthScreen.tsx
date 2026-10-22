import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Wordmark } from '@/components/Wordmark';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useAuth } from '@/lib/auth/authContext';
import { AUTH_ERROR_MESSAGE } from '@/lib/auth/errors';
import { AuthShowcase } from './AuthShowcase';

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
  const desktop = useIsDesktop();

  return (
    // Laptops and PCs: a split screen, with animated slides on the left and the form on
    // the right (no app sidebar here, like most sign-in pages).
    <main className="flex min-h-dvh flex-1 flex-col lg:grid lg:grid-cols-2">
      {desktop && <AuthShowcase />}
      <div className="flex flex-1 flex-col px-5 pb-10 lg:mx-auto lg:w-full lg:max-w-md lg:py-10">
        <ScreenHeader
          backTo={backTo}
          className="-mx-2"
          right={
            desktop && (
              <Link to={ROUTES.start} aria-label="ScrollQ home" className="rounded-card px-2 py-1">
                <Wordmark className="text-2xl" />
              </Link>
            )
          }
        />
        <div className="flex flex-1 flex-col lg:justify-center">
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight lg:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-base text-muted lg:text-lg">{subtitle}</p>}
          <div className="mt-6 flex-1 lg:flex-none">
            {accountsEnabled ? (
              children
            ) : (
              <div className="space-y-4">
                <p className="rounded-card bg-surface p-4 text-muted">
                  {AUTH_ERROR_MESSAGE.disabled}
                </p>
                <Button fullWidth onClick={() => navigate(ROUTES.start)}>
                  Play as guest
                </Button>
              </div>
            )}
          </div>
        </div>
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
