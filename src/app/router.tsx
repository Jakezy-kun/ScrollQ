import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { createBrowserRouter, Outlet } from 'react-router';
import { ErrorScreen } from '@/features/error/ErrorScreen';
import { AppShell } from './AppShell';
import { RequireAuth } from './RequireAuth';
import { ROUTES } from './routes';

/** Lazy-load a page component by its named export, so each screen is its own chunk. */
function page<M extends Record<string, unknown>>(
  path: string,
  load: () => Promise<M>,
  name: keyof M,
): RouteObject {
  return {
    path,
    lazy: () => load().then((m) => ({ Component: m[name] as ComponentType })),
  };
}

const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      page(
        ROUTES.devComponents,
        () => import('@/features/dev/ComponentGallery'),
        'ComponentGallery',
      ),
    ]
  : [];

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    errorElement: <ErrorScreen />,
    children: [
      {
        errorElement: <ErrorScreen />,
        children: [
          // Play
          page(ROUTES.start, () => import('@/features/start/StartPage'), 'StartPage'),
          page(
            ROUTES.onboarding,
            () => import('@/features/onboarding/OnboardingPage'),
            'OnboardingPage',
          ),
          page(ROUTES.howTo, () => import('@/features/howto/HowToPage'), 'HowToPage'),
          page(
            ROUTES.feedSelect,
            () => import('@/features/feed-select/FeedSelectPage'),
            'FeedSelectPage',
          ),
          page(ROUTES.round, () => import('@/features/round/RoundPage'), 'RoundPage'),
          page(ROUTES.summary, () => import('@/features/summary/SummaryPage'), 'SummaryPage'),
          page(ROUTES.reflect, () => import('@/features/reflect/ReflectPage'), 'ReflectPage'),
          page(ROUTES.history, () => import('@/features/history/HistoryPage'), 'HistoryPage'),
          page(
            ROUTES.historyDetail,
            () => import('@/features/history/RoundDetailPage'),
            'RoundDetailPage',
          ),
          page(ROUTES.settings, () => import('@/features/settings/SettingsPage'), 'SettingsPage'),

          // Accounts
          page(ROUTES.login, () => import('@/features/auth/LogInPage'), 'LogInPage'),
          page(ROUTES.signup, () => import('@/features/auth/SignUpPage'), 'SignUpPage'),
          page(ROUTES.checkEmail, () => import('@/features/auth/CheckEmailPage'), 'CheckEmailPage'),
          page(
            ROUTES.forgotPassword,
            () => import('@/features/auth/ForgotPasswordPage'),
            'ForgotPasswordPage',
          ),
          page(
            ROUTES.resetPassword,
            () => import('@/features/auth/ResetPasswordPage'),
            'ResetPasswordPage',
          ),
          {
            element: (
              <RequireAuth>
                <Outlet />
              </RequireAuth>
            ),
            children: [
              page(ROUTES.profile, () => import('@/features/account/ProfilePage'), 'ProfilePage'),
              page(ROUTES.account, () => import('@/features/account/AccountPage'), 'AccountPage'),
            ],
          },

          // Info
          page(ROUTES.privacy, () => import('@/features/legal/PrivacyPage'), 'PrivacyPage'),
          page(ROUTES.about, () => import('@/features/legal/AboutPage'), 'AboutPage'),

          ...devRoutes,
          page('*', () => import('@/features/not-found/NotFound'), 'NotFound'),
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
