import { m } from 'framer-motion';
import { Check, Flag, Lock } from 'lucide-react';
import { CostBadge } from '@/components/post';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { easeOut } from '@/styles/tokens';

const CARDS = [
  {
    title: '5 study habits backed by research',
    cost: 5,
    icon: <Check className="h-4 w-4" />,
    iconClass: 'bg-mint/20 text-mint',
    offset: 'ml-0',
    locked: false,
  },
  {
    title: "You WON'T believe what this…",
    cost: 6,
    icon: <Flag className="h-4 w-4" />,
    iconClass: 'bg-coral/20 text-coral',
    offset: 'ml-6',
    locked: false,
  },
  {
    title: "Something you haven't opened yet",
    cost: 4,
    icon: <Lock className="h-4 w-4" />,
    iconClass: 'bg-white/10 text-muted',
    offset: 'ml-12',
    locked: true,
  },
];

/** Decorative stack of sample posts: one good, one flagged, one locked. */
export function SampleStack() {
  const reduced = useReducedMotion();
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {CARDS.map((c, i) => (
        <m.div
          key={c.title}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: [0, -3, 0] }}
          transition={
            reduced
              ? { duration: 0.2, delay: i * 0.06 }
              : {
                  opacity: { duration: 0.25, delay: i * 0.08, ease: easeOut },
                  y: { duration: 3.2, delay: 0.4 + i * 0.35, repeat: Infinity, ease: 'easeInOut' },
                }
          }
          className={cn(
            'flex items-center gap-3 rounded-card p-3.5',
            c.locked ? 'bg-surface/60' : 'bg-surface',
            c.offset,
          )}
        >
          <span
            className={cn('flex h-8 w-8 items-center justify-center rounded-full', c.iconClass)}
          >
            {c.icon}
          </span>
          {c.locked ? (
            // Locked: placeholder bars, not text (nothing to read until it's opened).
            <span className="flex flex-1 flex-col gap-1.5 blur-[2px]">
              <span className="h-2.5 w-11/12 rounded-full bg-white/30" />
              <span className="h-2.5 w-2/3 rounded-full bg-white/20" />
            </span>
          ) : (
            <p className="flex-1 truncate text-sm font-semibold text-fg">{c.title}</p>
          )}
          <CostBadge cost={c.cost} />
        </m.div>
      ))}
    </div>
  );
}
