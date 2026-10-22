import { Hourglass, LogIn, UserPlus, UserRound } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { CoinIcon } from '@/components/CoinIcon';
import { IdleMeter } from '@/components/IdleMeter';
import { PAGE_WIDTH } from '@/components/pageWidth';
import { CostBadge } from '@/components/post';
import { ScoreRing } from '@/components/ScoreRing';
import { SlideDeck, SlideDots } from '@/components/Slides';
import { Wordmark } from '@/components/Wordmark';
import { useSlides } from '@/hooks/useSlides';
import { useAuth } from '@/lib/auth/authContext';
import { usePrefs } from '@/lib/prefs';

const SLIDES: { title: string; body: string; visual: ReactNode }[] = [
  {
    title: 'Your attention is a budget',
    body: 'Every round you get 100 coins of attention. The feed never ends. Your coins do.',
    visual: (
      <div className="flex flex-col items-center">
        <CoinIcon size={96} />
        <p className="mt-3 font-display text-5xl font-extrabold tabular-nums text-amber">100</p>
      </div>
    ),
  },
  {
    title: 'Every post has a price, and standing still costs too',
    body: 'Opening a post costs a few coins. Zone out on the feed and your coins start to drain.',
    visual: (
      <div className="flex w-full max-w-[240px] flex-col gap-4">
        <div className="flex items-center justify-between rounded-card bg-surface p-4">
          <span className="font-semibold">Open this post</span>
          <CostBadge cost={5} />
        </div>
        <div className="flex items-center justify-between rounded-card bg-surface p-4">
          <span className="flex items-center gap-2 font-semibold">
            <Hourglass className="h-4 w-4 text-coral" aria-hidden="true" />
            Standing still
          </span>
          <IdleMeter progress={0.8} draining={false} />
        </div>
      </div>
    ),
  },
  {
    title: 'Get your Scroll Quotient',
    body: "At the end you'll see your SQ, which posts were worth it, and which ones were traps.",
    visual: <ScoreRing value={86} tone="mint" />,
  },
];

const CHOICE_STEP = SLIDES.length;

export function OnboardingPage() {
  const navigate = useNavigate();
  const setPrefs = usePrefs((s) => s.setPrefs);
  const { index, dir, go } = useSlides(SLIDES.length + 1);

  const finish = (to: string) => {
    setPrefs({ onboardingSeen: true });
    navigate(to, { replace: true });
  };

  const slide = SLIDES[index];

  return (
    <main
      className={`flex min-h-dvh flex-1 flex-col px-6 pb-8 pt-[max(1rem,env(safe-area-inset-top))] ${PAGE_WIDTH.narrow}`}
    >
      <header className="flex min-h-14 items-center justify-between">
        <Wordmark className="text-2xl" />
        <button
          type="button"
          onClick={() => finish(ROUTES.start)}
          className="min-h-tap rounded-full px-3 text-sm font-semibold text-muted transition-colors duration-fast hover:text-fg"
        >
          Skip
        </button>
      </header>

      <SlideDeck
        index={index}
        dir={dir}
        count={SLIDES.length + 1}
        go={go}
        label="Welcome to ScrollQ"
        className="flex-1"
      >
        {slide ? (
          <div className="flex min-h-[440px] flex-1 flex-col">
            <div className="flex flex-1 items-center justify-center py-8" aria-hidden="true">
              {slide.visual}
            </div>
            <h1 className="font-display text-[32px] font-bold leading-tight">{slide.title}</h1>
            <p className="mt-3 text-lg leading-relaxed text-muted">{slide.body}</p>
          </div>
        ) : (
          <ChooseHowToPlay onGuest={() => finish(ROUTES.start)} onNavigate={finish} />
        )}
      </SlideDeck>

      {index < CHOICE_STEP && (
        <>
          <SlideDots
            index={index}
            count={SLIDES.length + 1}
            go={go}
            label="step"
            className="mt-4"
          />
          <Button fullWidth className="mt-3" onClick={() => go(index + 1)}>
            Next
          </Button>
        </>
      )}
    </main>
  );
}

function ChooseHowToPlay({
  onGuest,
  onNavigate,
}: {
  onGuest: () => void;
  onNavigate: (to: string) => void;
}) {
  const { accountsEnabled } = useAuth();
  const [askName, setAskName] = useState(false);
  const nickname = usePrefs((s) => s.nickname);
  const setPrefs = usePrefs((s) => s.setPrefs);
  const [name, setName] = useState(nickname);
  const inputId = useId();
  const hintId = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPrefs({ nickname: name.trim().slice(0, 24) });
    onGuest();
  };

  return (
    <div className="flex min-h-[440px] flex-1 flex-col justify-end pb-2">
      <h1 className="font-display text-[32px] font-bold leading-tight">Ready to scroll smarter?</h1>
      <p className="mt-3 text-lg text-muted">
        {accountsEnabled
          ? 'Play right away, or save your rounds with a free account.'
          : 'Play right away. Your rounds are saved on this device.'}
      </p>

      {askName ? (
        <form onSubmit={submit} className="mt-8 space-y-3">
          <label htmlFor={inputId} className="block font-semibold">
            Nickname <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={inputId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            autoComplete="nickname"
            aria-describedby={hintId}
            placeholder="e.g. Skyler"
            className="h-14 w-full rounded-card bg-surface px-4 text-lg text-fg ring-1 ring-white/10 placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-violet"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- the user just asked for this field
            autoFocus
          />
          <p id={hintId} className="text-sm text-muted">
            Not your real name. It stays on this device.
          </p>
          <Button type="submit" fullWidth>
            Start playing
          </Button>
        </form>
      ) : (
        <div className="mt-8 space-y-3">
          <Button
            fullWidth
            icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
            onClick={() => setAskName(true)}
          >
            Play as guest
          </Button>
          {accountsEnabled && (
            <>
              <Button
                fullWidth
                variant="secondary"
                icon={<UserPlus className="h-5 w-5" aria-hidden="true" />}
                onClick={() => onNavigate(ROUTES.signup)}
              >
                Create account
              </Button>
              <Button
                fullWidth
                variant="ghost"
                icon={<LogIn className="h-5 w-5" aria-hidden="true" />}
                onClick={() => onNavigate(ROUTES.login)}
              >
                I already have an account
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
