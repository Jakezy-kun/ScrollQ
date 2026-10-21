import type { CoinBreakdown } from '@/engine';
import { GAME_CONFIG } from '@/engine';
import { cn } from '@/lib/cn';

const SEGMENTS: { key: keyof CoinBreakdown; label: string; swatch: string }[] = [
  { key: 'reading', label: 'Reading', swatch: 'bg-violet' },
  { key: 'trapsAndBadFlags', label: 'Traps & bad flags', swatch: 'bg-coral' },
  { key: 'idling', label: 'Idling', swatch: 'bg-muted' },
  { key: 'left', label: 'Left', swatch: 'bg-amber' },
];

const LIVE_LABELS: Partial<Record<keyof CoinBreakdown, string>> = {
  reading: 'Worth-it reading',
  trapsAndBadFlags: 'Not worth it',
};

/** "Where your coins went": one stacked bar of the starting coins, with a legend and values. */
export function CoinBreakdownBar({
  breakdown,
  live = false,
}: {
  breakdown: CoinBreakdown;
  /** Live rounds split reading by the player's own rating instead of trap labels. */
  live?: boolean;
}) {
  const segments = SEGMENTS.map((s) => ({ ...s, label: (live && LIVE_LABELS[s.key]) || s.label }));
  const total = Math.max(
    GAME_CONFIG.startingCoins,
    segments.reduce((sum, s) => sum + breakdown[s.key], 0),
  );
  const description = segments.map((s) => `${s.label}: ${breakdown[s.key]} coins`).join(', ');

  return (
    <section aria-labelledby="breakdown-title">
      <h2 id="breakdown-title" className="font-display text-lg font-bold text-fg">
        Where your coins went
      </h2>
      <div
        role="img"
        aria-label={`Out of ${total} coins. ${description}.`}
        className="mt-3 flex h-4 gap-[2px] overflow-hidden rounded-full bg-white/10"
      >
        {segments.map((s) =>
          breakdown[s.key] > 0 ? (
            <div
              key={s.key}
              title={`${s.label}: ${breakdown[s.key]}`}
              className={cn('h-full first:rounded-l-full last:rounded-r-full', s.swatch)}
              style={{ width: `${(breakdown[s.key] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2" aria-hidden="true">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-sm">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', s.swatch)} />
            <dt className="text-muted">{s.label}</dt>
            <dd className="ml-auto font-bold tabular-nums text-fg">{breakdown[s.key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
