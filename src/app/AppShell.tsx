import { LazyMotion, MotionConfig } from 'framer-motion';
import { Suspense, useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { ToastProvider } from '@/components/Toast';
import { GuestMigrationPrompt } from '@/features/account/GuestMigrationPrompt';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { usePrefs } from '@/lib/prefs';
import { RepositoryProvider } from '@/lib/repository/RepositoryProvider';
import { DesktopNav } from './DesktopNav';
import { ROUTES } from './routes';
import { UpdatePrompt } from './UpdatePrompt';

const FULL_SCREEN_ROUTES = new Set<string>([
  ROUTES.onboarding,
  ROUTES.login,
  ROUTES.signup,
  ROUTES.checkEmail,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
]);

/** Animation features load in their own chunk so they don't delay first paint. */
const loadMotionFeatures = () => import('@/lib/motionFeatures').then((m) => m.default);

/**
 * Phones: full-bleed. Tablets: a centered 430px app column. Laptops and PCs (lg+): a
 * sidebar plus the page filling the rest of the window (each page sets its own width).
 */
export function AppShell() {
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  // The first-run welcome and the account screens are focused split screens: no sidebar.
  const showNav = !FULL_SCREEN_ROUTES.has(useLocation().pathname);

  // The app setting also turns off CSS animations (see styles/index.css).
  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', reduceMotion);
  }, [reduceMotion]);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
        <ToastProvider>
          <AuthProvider>
            <RepositoryProvider>
              <div className="min-h-dvh bg-deep lg:flex">
                {showNav && <DesktopNav />}
                <div className="relative mx-auto flex min-h-dvh w-full max-w-app flex-col bg-base sm:shadow-2xl sm:ring-1 sm:ring-white/5 lg:mx-0 lg:min-w-0 lg:max-w-none lg:flex-1 lg:shadow-none lg:ring-0">
                  <Suspense fallback={<RouteFallback />}>
                    <Outlet />
                  </Suspense>
                </div>
              </div>
              <GuestMigrationPrompt />
              <UpdatePrompt />
              <ScrollRestoration />
            </RepositoryProvider>
          </AuthProvider>
        </ToastProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center" role="status">
      <span className="sr-only">Loading</span>
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-amber"
        aria-hidden="true"
      />
    </div>
  );
}
