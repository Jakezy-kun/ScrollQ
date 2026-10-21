import { m, useIsPresent } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { quick } from '@/lib/motion';
import { durations } from '@/styles/tokens';

interface PostSlideProps {
  vertical: boolean;
  /** Called once the post has finished appearing; idle drain may start then. */
  onShown: () => void;
  children: ReactNode;
}

/**
 * Animates one post in and out. While leaving, it is taken out of the layout and stops
 * receiving taps, so the next post is usable immediately.
 */
export function PostSlide({ vertical, onShown, children }: PostSlideProps) {
  const reduced = useReducedMotion();
  const isPresent = useIsPresent();
  const ref = useRef<HTMLDivElement>(null);
  const onShownRef = useRef(onShown);
  onShownRef.current = onShown;

  useEffect(() => {
    // If focus was on the post that just left (e.g. its Skip button), move it to this one
    // so keyboard and screen reader users land on the new post.
    const active = document.activeElement;
    if (!active || active === document.body || active.closest('[aria-hidden="true"]')) {
      ref.current?.focus({ preventScroll: true });
    }
    // Fallback in case the enter animation never reports completion.
    const t = window.setTimeout(() => onShownRef.current(), durations.slow + 100);
    return () => window.clearTimeout(t);
  }, []);

  const enter = reduced ? { opacity: 0 } : vertical ? { opacity: 0, y: 40 } : { opacity: 0, x: 24 };
  const leave = reduced
    ? { opacity: 0 }
    : vertical
      ? { opacity: 0, y: -40 }
      : { opacity: 0, x: -24 };

  return (
    <m.div
      ref={ref}
      tabIndex={-1}
      initial={enter}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={leave}
      transition={quick}
      onAnimationComplete={() => {
        if (isPresent) onShownRef.current();
      }}
      aria-hidden={isPresent ? undefined : true}
      className={cn(
        'shrink-0 outline-none',
        vertical && isPresent && 'flex flex-1 flex-col',
        !isPresent && 'pointer-events-none absolute inset-x-3 top-0',
        !isPresent && vertical && 'bottom-3 flex flex-col',
      )}
    >
      {children}
    </m.div>
  );
}
