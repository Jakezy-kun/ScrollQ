import { Hourglass } from 'lucide-react';
import { cn } from '@/lib/cn';
import { colors } from '@/styles/tokens';
import { idleMeterColor, idleMeterState } from './idleMeterState';

export function IdleMeter({ progress, draining }: { progress: number; draining: boolean }) {
  const state = idleMeterState(progress, draining);
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  const valueText =
    state === 'draining'
      ? 'Draining coins'
      : state === 'filling'
        ? `${pct}% to idle drain`
        : 'Not idle';

  return (
    <div
      className="flex items-center gap-1.5"
      role="meter"
      aria-label="Idle drain"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={valueText}
      data-state={state}
    >
      <Hourglass
        className={cn('h-4 w-4', state === 'draining' ? 'text-coral' : 'text-muted')}
        aria-hidden="true"
      />
      <div className="h-2.5 w-14 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-base ease-linear"
          style={{
            width: `${Math.max(pct, 6)}%`,
            backgroundColor: draining ? colors.coral : idleMeterColor(progress),
          }}
        />
      </div>
    </div>
  );
}
