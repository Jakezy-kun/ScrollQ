/** Every screen's path, in one place, so links never drift from the router. */
export const ROUTES = {
  start: '/',
  onboarding: '/welcome',
  howTo: '/how-to-play',
  feedSelect: '/feed',
  round: '/round',
  summary: '/summary',
  reflect: '/reflect',
  history: '/history',
  historyDetail: '/history/:id',
  settings: '/settings',
  login: '/login',
  signup: '/signup',
  checkEmail: '/check-email',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  profile: '/profile',
  account: '/account',
  privacy: '/privacy',
  about: '/about',
  devComponents: '/dev/components',
} as const;

export function historyDetailPath(id: string): string {
  return `/history/${encodeURIComponent(id)}`;
}
