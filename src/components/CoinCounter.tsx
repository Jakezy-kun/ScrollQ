import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { quick } from '@/lib/motion';
import { CoinIcon } from './CoinIcon';

interface Delta {
  id: number;
  amount: number;
}

export interface CoinCounterProps {
  coins: number;
  /** Pulse in coral while idle drain is taking coins. */
  draining?: boolean;
  /**
   * Text for screen readers, announced politely. Pass only meaningful changes
   * (reads, penalties); idle ticks should not change it.
   */
  announcement?: { key: number; text: string } | null;
  className?: string;
}

let deltaId = 0;

export function CoinCounter({
  coins,
  draining = false,
  announcement,
  className,
}: CoinCounterProps) {
  const reduced = useReducedMotion();
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const prev = useRef(coins);

  useEffect(() => {
    const diff = coins - prev.current;
    prev.current = coins;
    if (diff === 0) return;
    deltaId += 1;
    const id = deltaId;
    setDeltas((d) => [...d.slice(-2), { id, amount: diff }]);
    const t = window.setTimeout(() => setDeltas((d) => d.filter((x) => x.id !== id)), 900);
    return () => window.clearTimeout(t);
  }, [coins]);

  return (
    <div className={cn('relative', className)} data-draining={draining || undefined}>
      <div
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-full pl-2 pr-3.5 transition-colors duration-base',
          draining
            ? 'bg-coral/20 ring-2 ring-coral motion-safe:animate-coin-pulse'
            : 'bg-surface ring-1 ring-white/10',
        )}
      >
        <CoinIcon size={22} />
        {/* Fixed width (3 tabular digits) so the counter never shifts layout. */}
        <span
          className="relative inline-flex h-6 w-[3.4ch] items-center justify-center overflow-hidden font-display text-lg font-bold tabular-nums"
          aria-hidden="true"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={coins}
              initial={reduced ? { opacity: 0 } : { y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { y: 14, opacity: 0 }}
              transition={quick}
              className={cn(
                'font-display text-lg font-bold tabular-nums',
                draining ? 'text-coral' : 'text-fg',
              )}
            >
              {coins}
            </m.span>
          </AnimatePresence>
        </span>
        <span className="sr-only">{coins} coins left</span>
      </div>

      <AnimatePresence>
        {deltas.map((d) => (
          <m.span
            key={d.id}
            data-testid="coin-delta"
            initial={{ opacity: 0, y: reduced ? 0 : 4 }}
            animate={{ opacity: 1, y: reduced ? 0 : -18 }}
            exit={{ opacity: 0 }}
            transition={quick}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute -right-2 top-0 font-display text-sm font-bold',
              d.amount < 0 ? 'text-coral' : 'text-mint',
            )}
          >
            {d.amount > 0 ? `+${d.amount}` : `−${Math.abs(d.amount)}`}
          </m.span>
        ))}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement?.text ?? ''}
      </span>
    </div>
  );
}
