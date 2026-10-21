import { m } from 'framer-motion';
import { Flame, Hourglass, MousePointerClick, ShieldAlert } from 'lucide-react';
import { CoinIcon } from '@/components/CoinIcon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors } from '@/styles/tokens';
import type { HowToVisualKind } from './howToCards';

const TRAPS = [
  { label: 'Clickbait', Icon: MousePointerClick },
  { label: 'Rage bait', Icon: Flame },
  { label: 'Fake news', Icon: ShieldAlert },
  { label: 'Time-waster', Icon: Hourglass },
];

/** Illustration for a How to Play card. Decorative: the card text carries the meaning. */
export function HowToVisual({ visual }: { visual: HowToVisualKind }) {
  const reduced = useReducedMotion();

  if (visual === 'coins') {
    return (
      <div className="flex flex-col items-center" aria-hidden="true">
        <CoinIcon size={88} />
        <p className="mt-3 font-display text-5xl font-extrabold tabular-nums text-amber">100</p>
        <p className="text-sm font-semibold text-muted">attention coins</p>
      </div>
    );
  }

  if (visual === 'confirm') {
    return (
      <div className="w-full rounded-card bg-base p-4" aria-hidden="true">
        <p className="font-display text-lg font-bold leading-tight text-fg">
          Open this post for <span className="text-amber">6 coins?</span>
        </p>
        <p className="mt-1 text-sm text-muted">You'll have 54 left.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="flex h-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
            Cancel
          </span>
          <span className="flex h-10 items-center justify-center rounded-xl bg-coral text-sm font-bold text-deep">
            Confirm
          </span>
        </div>
      </div>
    );
  }

  if (visual === 'idle') {
    return (
      <div className="w-full" aria-hidden="true">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-coral/20 px-3 py-1.5 font-display font-bold text-coral ring-2 ring-coral">
            <CoinIcon size={18} /> 47
          </span>
          <span className="font-display text-lg font-bold text-coral">−1</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          {reduced ? (
            <div className="h-full w-full rounded-full bg-coral" />
          ) : (
            <m.div
              className="h-full rounded-full"
              animate={{ width: ['8%', '100%'], backgroundColor: [colors.mint, colors.coral] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
        <p className="mt-2 text-sm text-muted">5 seconds still → coins start draining</p>
      </div>
    );
  }

  return (
    <ul className="grid w-full grid-cols-2 gap-2" aria-label="Trap types">
      {TRAPS.map(({ label, Icon }) => (
        <li
          key={label}
          className="flex items-center gap-2 rounded-xl bg-coral/15 px-3 py-3 text-sm font-bold text-fg"
        >
          <Icon className="h-4 w-4 text-coral" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}
