import { CoinCounter } from '@/components/CoinCounter';
import { IdleMeter } from '@/components/IdleMeter';
import { cn } from '@/lib/cn';

interface RoundTopBarProps {
  coins: number;
  current: number;
  total: number;
  idleProgress: number;
  draining: boolean;
  announcement: { key: number; text: string } | null;
  live?: boolean;
}

export function RoundTopBar({
  coins,
  current,
  total,
  idleProgress,
  draining,
  announcement,
  live = false,
}: RoundTopBarProps) {
  return (
    <header className="relative z-10 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-3">
        <CoinCounter coins={coins} draining={draining} announcement={announcement} />
        <p className="whitespace-nowrap text-sm font-semibold text-muted">
          {live && (
            <span className="mr-1.5 rounded-full bg-violet/30 px-1.5 py-0.5 text-[11px] font-bold text-fg ring-1 ring-violet">
              LIVE
            </span>
          )}
          Post <span className="text-fg">{current}</span> of {total}
        </p>
        <IdleMeter progress={idleProgress} draining={draining} />
      </div>
      <div
        className="mt-3 flex gap-1"
        role="progressbar"
        aria-label="Round progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Post ${current} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-base',
              i < current - 1 ? 'bg-violet' : i === current - 1 ? 'bg-fg' : 'bg-white/15',
            )}
          />
        ))}
      </div>
    </header>
  );
}
