import { AnimatePresence, m } from 'framer-motion';
import { Hourglass } from 'lucide-react';
import { GAME_CONFIG } from '@/engine';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { quick } from '@/lib/motion';

const { drainAmount, drainEveryMs } = GAME_CONFIG.idle;

/** Shown while idle drain is taking coins. Announced once each time it appears. */
export function IdleWarning({ show }: { show: boolean }) {
  const reduced = useReducedMotion();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-4 top-[104px] z-20"
    >
      <AnimatePresence>
        {show && (
          <m.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            transition={quick}
            className="flex items-center gap-3 rounded-card bg-surface-2 px-4 py-3 text-fg shadow-lg ring-2 ring-coral"
          >
            <Hourglass className="h-5 w-5 shrink-0 text-coral" aria-hidden="true" />
            <div>
              <p className="font-bold leading-tight">Idle scrolling still costs attention.</p>
              <p className="text-sm text-muted">
                −{drainAmount} coin every {drainEveryMs / 1000} seconds. Make a move!
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
