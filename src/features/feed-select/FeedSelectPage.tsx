import { Check, Globe, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PAGE_WIDTH } from '@/components/pageWidth';
import { useToast } from '@/components/toastContext';
import type { FeedStyle, RoundMode } from '@/engine';
import { useOnline } from '@/hooks/useOnline';
import { useRound } from '@/hooks/useRound';
import { cn } from '@/lib/cn';
import { usePrefs } from '@/lib/prefs';
import { startNewRound } from '@/lib/startRound';
import { FEED_STYLE_OPTIONS } from './feedStyles';
import { StylePreview } from './StylePreview';

const MODE_OPTIONS: { id: RoundMode; name: string; description: string; icon: JSX.Element }[] = [
  {
    id: 'curated',
    name: 'Curated',
    description: 'Hand-picked posts with hidden traps. Scored.',
    icon: <Sparkles className="h-4 w-4 text-amber" aria-hidden="true" />,
  },
  {
    id: 'live',
    name: 'Live feed',
    description: 'Real public posts from Lemmy. You rate what was worth it.',
    icon: <Globe className="h-4 w-4 text-violet" aria-hidden="true" />,
  },
];

export function FeedSelectPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const online = useOnline();
  const lastFeedStyle = usePrefs((s) => s.lastFeedStyle);
  const lastMode = usePrefs((s) => s.lastMode);
  const inProgress = useRound((s) => s.round.status === 'playing');
  const [selected, setSelected] = useState<FeedStyle>(lastFeedStyle);
  const [mode, setMode] = useState<RoundMode>(lastMode);
  const [starting, setStarting] = useState(false);
  const effectiveMode: RoundMode = online ? mode : 'curated';

  const startRound = async () => {
    setStarting(true);
    const result = await startNewRound(selected, effectiveMode);
    if (result.fellBack) {
      toast.show("Couldn't load the live feed", {
        tone: 'warning',
        detail: 'This round uses the curated posts instead.',
      });
    }
    navigate(ROUTES.round, { replace: true });
  };

  return (
    <main className={`flex min-h-dvh flex-1 flex-col px-5 lg:pb-8 ${PAGE_WIDTH.reading}`}>
      <ScreenHeader backTo={ROUTES.start} className="-mx-2" />
      <h1 className="mt-2 font-display text-3xl font-bold leading-tight">Pick your feed</h1>
      <p className="mt-2 text-base text-muted">Same posts, same rules. Just a different look.</p>

      <fieldset className="mt-6 flex-1 space-y-3 lg:grid lg:flex-none lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        <legend className="sr-only">Feed style</legend>
        {FEED_STYLE_OPTIONS.map((s) => {
          const active = s.id === selected;
          return (
            <label
              key={s.id}
              className={cn(
                'flex w-full cursor-pointer items-center gap-4 rounded-sheet p-4 transition-[background-color,box-shadow] duration-fast',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet',
                active
                  ? 'bg-surface-2 ring-2 ring-violet'
                  : 'bg-surface ring-1 ring-white/5 hover:bg-surface-2/70',
              )}
            >
              <input
                type="radio"
                name="feed-style"
                value={s.id}
                checked={active}
                onChange={() => setSelected(s.id)}
                className="sr-only"
              />
              <StylePreview style={s.id} />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl font-bold text-fg">{s.name}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">
                  {s.description}
                </span>
              </span>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-fast',
                  active ? 'bg-violet text-fg' : 'ring-2 ring-white/20',
                )}
                aria-hidden="true"
              >
                {active && <Check className="h-4 w-4" />}
              </span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-2 font-display text-lg font-bold">Posts</legend>
        <div className="grid grid-cols-2 gap-2">
          {MODE_OPTIONS.map((m) => {
            const active = m.id === effectiveMode;
            const disabled = m.id === 'live' && !online;
            return (
              <label
                key={m.id}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-card-lg p-3 transition-colors duration-fast',
                  'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet',
                  active ? 'bg-surface-2 ring-2 ring-violet' : 'bg-surface ring-1 ring-white/5',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <input
                  type="radio"
                  name="round-mode"
                  value={m.id}
                  checked={active}
                  disabled={disabled}
                  onChange={() => setMode(m.id)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 font-semibold text-fg">
                  {m.icon}
                  {m.name}
                </span>
                <span className="text-xs leading-snug text-muted">
                  {disabled ? 'Needs a connection.' : m.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Phones: pinned to the bottom so the button is always on screen, even when the
          options run past the fold. */}
      <div className="sticky bottom-0 -mx-5 mt-2 bg-gradient-to-t from-base from-70% to-base/0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 lg:static lg:mx-0 lg:mt-4 lg:bg-none lg:p-0">
        {inProgress && (
          <p className="mb-3 text-center text-sm text-muted">
            Starting a new round ends the one in progress.
          </p>
        )}
        <Button fullWidth className="lg:mt-4" loading={starting} onClick={() => void startRound()}>
          Start round
        </Button>
      </div>
    </main>
  );
}
