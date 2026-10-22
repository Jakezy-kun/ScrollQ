import { ChartLine, Play, Settings } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AvatarArt } from '@/components/avatar/AvatarArt';
import { Button } from '@/components/Button';
import { Wordmark } from '@/components/Wordmark';
import { GAME_CONFIG, selectProgress } from '@/engine';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useProfile } from '@/hooks/useProfile';
import { useRound } from '@/hooks/useRound';
import { bestSq, useRounds } from '@/hooks/useRounds';
import { useAuth } from '@/lib/auth/authContext';
import { usePrefs } from '@/lib/prefs';
import { SampleStack } from './SampleStack';

export function StartPage() {
  const navigate = useNavigate();
  const onboardingSeen = usePrefs((s) => s.onboardingSeen);
  const auth = useAuth();
  const { profile } = useProfile();
  const name = profile?.displayName ?? '';
  const round = useRound((s) => s.round);
  const { rounds } = useRounds();
  const best = bestSq(rounds);
  const desktop = useIsDesktop();

  if (!onboardingSeen) return <Navigate to={ROUTES.onboarding} replace />;

  const inProgress = round.status === 'playing';
  const progress = selectProgress(round);
  const minutes = Math.round((GAME_CONFIG.postsPerRound * 15) / 60);

  return (
    // Laptops and PCs: the hero on the left, the sample feed on the right. The sidebar
    // replaces the header icons.
    <main className="flex min-h-dvh flex-1 flex-col px-6 pb-8 lg:mx-auto lg:grid lg:w-full lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:content-center lg:items-center lg:gap-x-16 lg:px-12 lg:py-12">
      <header className="-mx-2 flex min-h-14 items-center justify-end gap-1 pt-[env(safe-area-inset-top)] lg:hidden">
        <Link
          to={ROUTES.history}
          aria-label="History"
          className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-full text-muted transition-colors duration-fast hover:text-fg"
        >
          <ChartLine className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link
          to={ROUTES.settings}
          aria-label="Settings"
          className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-full text-muted transition-colors duration-fast hover:text-fg"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Link>
        {auth.status === 'signedIn' ? (
          <Link
            to={ROUTES.profile}
            aria-label="Your profile"
            className="ml-1 inline-flex min-h-tap min-w-tap items-center justify-center rounded-full"
          >
            <AvatarArt id={profile?.avatar} fallbackName={name} size={36} />
          </Link>
        ) : (
          auth.accountsEnabled &&
          auth.status === 'guest' && (
            <Link
              to={ROUTES.login}
              className="inline-flex min-h-tap items-center rounded-full px-3 font-semibold text-fg transition-colors duration-fast hover:bg-white/5"
            >
              Log in
            </Link>
          )
        )}
      </header>

      <div className="flex flex-1 flex-col justify-center py-6 lg:col-start-1 lg:row-start-1 lg:flex-none lg:py-0">
        {!desktop && (
          <div className="mb-10">
            <SampleStack />
          </div>
        )}
        {name && <p className="mb-2 font-semibold text-muted">Hi, {name}!</p>}
        <Wordmark as="h1" className="text-[64px] lg:text-[88px]" />
        <p className="mt-3 font-display text-2xl font-semibold text-fg">
          What's your Scroll Budget?
        </p>
        <p className="mt-3 max-w-[30ch] text-base leading-relaxed text-muted">
          100 coins of attention. A feed that never ends. Spend them on what's worth it.
        </p>
        {best !== null && (
          <Link
            to={ROUTES.history}
            className="mt-5 inline-flex min-h-tap items-center gap-2 self-start rounded-full bg-surface px-4 font-semibold ring-1 ring-white/10 transition-colors duration-fast hover:bg-surface-2"
          >
            Best SQ <span className="font-display text-lg font-extrabold text-amber">{best}</span>
          </Link>
        )}
      </div>

      {desktop && (
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <SampleStack />
        </div>
      )}

      <div className="space-y-3 lg:col-start-1 lg:row-start-2 lg:mt-8 lg:max-w-sm">
        {inProgress && (
          <Button
            fullWidth
            variant="violet"
            icon={<Play className="h-5 w-5" aria-hidden="true" />}
            onClick={() => navigate(ROUTES.round)}
          >
            Resume round · Post {progress.current} of {progress.total}
          </Button>
        )}
        <Button fullWidth onClick={() => navigate(ROUTES.feedSelect)}>
          {inProgress ? 'New round' : 'Play'}
        </Button>
        <Button fullWidth variant="secondary" onClick={() => navigate(ROUTES.howTo)}>
          How to Play
        </Button>
        <p className="pt-1 text-center text-sm text-muted">
          {GAME_CONFIG.postsPerRound} posts · about {minutes} minutes
        </p>
      </div>
    </main>
  );
}
