import { LazyMotion, MotionConfig } from 'framer-motion';
import { Suspense, useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { ToastProvider } from '@/components/Toast';
import { GuestMigrationPrompt } from '@/features/account/GuestMigrationPrompt';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { usePrefs } from '@/lib/prefs';
import { RepositoryProvider } from '@/lib/repository/RepositoryProvider';
import { UpdatePrompt } from './UpdatePrompt';

/** Animation features load in their own chunk so they don't delay first paint. */
const loadMotionFeatures = () => import('@/lib/motionFeatures').then((m) => m.default);

/** Centers the app in a 430px column on larger screens. Full-bleed on phones. */
export function AppShell() {
  const reduceMotion = usePrefs((s) => s.reduceMotion);

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
              <div className="min-h-dvh bg-deep">
                <div className="relative mx-auto flex min-h-dvh w-full max-w-app flex-col bg-base sm:shadow-2xl sm:ring-1 sm:ring-white/5">
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
