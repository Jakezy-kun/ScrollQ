import type { PanInfo } from 'framer-motion';
import { AnimatePresence, m } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { quick } from '@/lib/motion';

const SWIPE_PX = 60;

interface SlideDeckProps {
  index: number;
  dir: number;
  count: number;
  go: (next: number) => void;
  /** Accessible name for the deck, e.g. "How to Play". */
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * Swipeable slide area. Dots and buttons give keyboard access, and ← / → move between
 * slides (not while typing or in a dialog). Renders only the current slide.
 */
export function SlideDeck({ index, dir, count, go, label, className, children }: SlideDeckProps) {
  const reduced = useReducedMotion();
  const offset = reduced ? 0 : 60;

  const latest = useRef({ index, count, go });
  latest.current = { index, count, go };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (
        e.target instanceof Element &&
        e.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
      ) {
        return;
      }
      const { index: i, count: n, go: move } = latest.current;
      if (e.key === 'ArrowRight' && i < n - 1) move(i + 1);
      else if (e.key === 'ArrowLeft' && i > 0) move(i - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_PX) go(index + 1);
    else if (info.offset.x > SWIPE_PX) go(index - 1);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={cn('relative flex flex-col', className)}
    >
      <AnimatePresence mode="popLayout" custom={dir} initial={false}>
        <m.div
          key={index}
          custom={dir}
          initial={{ x: dir >= 0 ? offset : -offset, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: dir >= 0 ? -offset : offset, opacity: 0, pointerEvents: 'none' }}
          transition={quick}
          drag={reduced ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={onDragEnd}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${count}`}
          className="flex flex-1 touch-pan-y flex-col"
        >
          {children}
        </m.div>
      </AnimatePresence>
    </section>
  );
}

export function SlideDots({
  index,
  count,
  go,
  label = 'card',
  className,
}: {
  index: number;
  count: number;
  go: (next: number) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to ${label} ${i + 1} of ${count}`}
          aria-current={i === index ? 'step' : undefined}
          onClick={() => go(i)}
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
  );
}
