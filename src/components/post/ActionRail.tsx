import { BookOpen, Flag, SkipForward } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { CoinIcon } from '../CoinIcon';
import { readLabel } from './postUi';

interface ActionProps {
  cost: number;
  canAfford: boolean;
  onRead: () => void;
  onSkip: () => void;
  onFlag: () => void;
}

const base =
  'flex h-12 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-[15px] font-bold transition-[transform,background-color] duration-fast ease-out active:scale-[0.97]';

/** Horizontal Read / Skip / Flag bar used by the Gallery, Timeline and Forum skins. */
export function ActionBar({ cost, canAfford, onRead, onSkip, onFlag }: ActionProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        onClick={onRead}
        aria-label={readLabel(cost, canAfford)}
        className={cn(
          base,
          // Dark ink on coral: the 15px label needs 4.5:1, which white on coral can't reach.
          canAfford ? 'bg-coral text-deep hover:bg-[#ff3a5e]' : 'bg-white/10 text-muted',
        )}
      >
        <BookOpen className="h-4 w-4" aria-hidden="true" />
        {canAfford ? 'Read' : 'Need'} <CoinIcon size={14} />{' '}
        <span className="tabular-nums">{cost}</span>
      </button>
      <button
        type="button"
        onClick={onSkip}
        className={cn(base, 'bg-white/10 text-fg hover:bg-white/15')}
      >
        <SkipForward className="h-4 w-4" aria-hidden="true" />
        Skip
      </button>
      <button
        type="button"
        onClick={onFlag}
        aria-label="Flag as trap"
        className={cn(base, 'text-coral ring-1 ring-inset ring-coral/60 hover:bg-coral/10')}
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        Flag
      </button>
    </div>
  );
}

/**
 * Right-side rail used by the Vertical skin, like the icon column on short-video apps:
 * bare icons with a shadow and a label underneath. Read stays a filled button so the one
 * action that costs coins is easy to spot.
 */
export function ActionRail({ cost, canAfford, onRead, onSkip, onFlag }: ActionProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <RailButton
        label={canAfford ? 'Read' : 'Need'}
        ariaLabel={readLabel(cost, canAfford)}
        onClick={onRead}
        circleClass={canAfford ? 'bg-coral text-deep' : 'bg-white/15 text-muted'}
        extra={
          <span className="flex items-center gap-0.5 text-xs font-bold text-amber">
            <CoinIcon size={12} />
            {cost}
          </span>
        }
      >
        <BookOpen className="h-6 w-6" aria-hidden="true" />
      </RailButton>
      <RailButton label="Skip" onClick={onSkip} circleClass="text-fg">
        <SkipForward className="h-8 w-8 fill-current" aria-hidden="true" />
      </RailButton>
      <RailButton label="Flag" ariaLabel="Flag as trap" onClick={onFlag} circleClass="text-coral">
        <Flag className="h-8 w-8 fill-current" aria-hidden="true" />
      </RailButton>
    </div>
  );
}

interface RailButtonProps {
  label: string;
  ariaLabel?: string;
  onClick: () => void;
  circleClass: string;
  extra?: ReactNode;
  children: ReactNode;
}

function RailButton({ label, ariaLabel, onClick, circleClass, extra, children }: RailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className="group flex w-16 flex-col items-center gap-0.5 rounded-card"
    >
      <span
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-transform duration-fast ease-out group-active:scale-90',
          circleClass,
        )}
      >
        {children}
      </span>
      <span className="flex items-center gap-1 text-xs font-semibold text-fg [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">
        {label}
        {extra && ' '}
        {extra}
      </span>
    </button>
  );
}
