import { AnimatePresence, m } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  CoinBudgetArt,
  PostPriceArt,
  TrendLineArt,
} from '@/components/illustrations/Illustrations';
import { SplitPanel } from '@/components/illustrations/SplitPanel';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { quick } from '@/lib/motion';

/** How long each slide stays before the next one. */
export const SHOWCASE_INTERVAL_MS = 3000;

const SLIDES: { art: ReactNode; title: string; body: string }[] = [
  {
    art: <TrendLineArt />,
    title: 'Watch your SQ grow',
    body: 'Every round is saved to your account, so you can see yourself improve.',
  },
  {
    art: <PostPriceArt />,
    title: 'Spend attention on what matters',
    body: 'Open what is worth it, skip the rest, and flag the traps.',
  },
  {
    art: <CoinBudgetArt />,
    title: '100 coins, every round',
    body: 'Your rounds and reflections follow you to any device.',
  },
];

/**
 * Left half of the desktop log-in and sign-up screens: animated slides that advance every
 * 3 seconds. Rotation stops on hover, on keyboard focus, with the pause button, and with
 * reduced motion (WCAG 2.2.2), and is never announced while it runs.
 */
export function AuthShowcase() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rotating = !reduced && !paused && !hovered && !focused;

  useEffect(() => {
    if (!rotating) return;
    const t = window.setTimeout(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      SHOWCASE_INTERVAL_MS,
    );
    return () => window.clearTimeout(t);
  }, [rotating, index]);

  const slide = SLIDES[index];
  if (!slide) return null;

  return (
    <SplitPanel
      aria-roledescription="carousel"
      aria-label="Why make an account"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="flex w-full max-w-md flex-1 flex-col justify-center">
        <div aria-live={rotating ? 'off' : 'polite'}>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${SLIDES.length}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -24 }}
              transition={quick}
              className="flex flex-col items-center text-center"
            >
              <div aria-hidden="true" className="flex w-full justify-center">
                {slide.art}
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold leading-tight text-fg">
                {slide.title}
              </h2>
              <p className="mt-2 max-w-[34ch] text-lg leading-relaxed text-muted">{slide.body}</p>
            </m.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play slides' : 'Pause slides'}
            className="flex min-h-tap min-w-tap items-center justify-center rounded-full text-muted transition-colors duration-fast hover:bg-white/5 hover:text-fg"
          >
            {paused ? (
              <Play className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Pause className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              aria-current={i === index ? 'true' : undefined}
              className="flex min-h-tap min-w-6 items-center justify-center px-1"
            >
              <span
                className={cn(
                  'block h-2 rounded-full transition-[width,background-color] duration-base',
                  i === index ? 'w-6 bg-fg' : 'w-2 bg-white/25',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </SplitPanel>
  );
}
