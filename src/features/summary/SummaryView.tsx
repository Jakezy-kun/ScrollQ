import type { ReactNode } from 'react';
import { CoinIcon } from '@/components/CoinIcon';
import { ScoreRing } from '@/components/ScoreRing';
import type { Tone } from '@/engine';
import { GAME_CONFIG } from '@/engine';
import { cn } from '@/lib/cn';
import type { RoundRecord } from '@/lib/rounds/record';
import { summaryFromRecord } from '@/lib/rounds/record';
import { CoinBreakdownBar } from './CoinBreakdownBar';
import { RevealList } from './RevealList';

const TONE_CHIP: Record<Tone, string> = {
  mint: 'bg-mint/15 text-mint',
  amber: 'bg-amber/15 text-amber',
  coral: 'bg-coral/15 text-coral',
};

const pct = (n: number) => Math.round(n * 100);

interface SummaryViewProps {
  record: RoundRecord;
  /** Small line above the score, e.g. "Round complete". */
  eyebrow: string;
  /** Extra content after the stats (guest card, saved reflection…). */
  children?: ReactNode;
  /** True when the page already has its own h1. */
  nested?: boolean;
}

/** The round summary, rendered from a saved round so History can show it again. */
export function SummaryView({ record, eyebrow, children, nested = false }: SummaryViewProps) {
  const s = summaryFromRecord(record);
  const Heading = nested ? 'h2' : 'h1';
  const live = s.mode === 'live';
  const reads = s.reveal.filter((r) => r.choice === 'read').length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center text-center" aria-labelledby="score-title">
        <Heading id="score-title" className="text-sm font-semibold text-muted">
          {eyebrow}
        </Heading>
        <div className="mt-4">
          <ScoreRing value={s.sq} tone={s.label.tone} size={184} />
        </div>
        <p
          className={cn(
            'mt-4 rounded-full px-4 py-1.5 font-display text-lg font-bold',
            TONE_CHIP[s.label.tone],
          )}
        >
          {s.label.label}
        </p>
        <p className="mt-3 max-w-[30ch] text-base leading-relaxed text-muted">{s.label.message}</p>
      </section>

      <dl className="grid grid-cols-2 divide-x divide-white/10 rounded-card-lg bg-surface py-4">
        <div className="text-center">
          <dt className="text-sm text-muted">Coins left</dt>
          <dd className="mt-1 flex items-center justify-center gap-1.5 font-display text-2xl font-bold tabular-nums text-fg">
            <CoinIcon size={20} />
            {s.coinsLeft}
          </dd>
        </div>
        <div className="text-center">
          <dt className="text-sm text-muted">{live ? 'Worth-it reads' : 'Good calls'}</dt>
          <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-fg">
            {s.goodCalls}
            <span className="text-base text-muted">/{live ? reads : s.totalPosts}</span>
          </dd>
        </div>
      </dl>

      {children}

      <CoinBreakdownBar breakdown={s.breakdown} live={live} />

      <RevealList rows={s.reveal} live={live} />

      {live ? (
        <p className="text-xs leading-relaxed text-muted">
          Live SQ = {pct(GAME_CONFIG.liveSq.worthWeight)}% from the share of your reading coins
          spent on posts you rated worth it + {pct(GAME_CONFIG.liveSq.coinsWeight)}% from coins
          left. Live posts have no answer key, so there are no traps to catch.
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-muted">
          SQ = {pct(GAME_CONFIG.sq.goodCallWeight)}% from your share of good calls out of{' '}
          {s.totalPosts} posts + {pct(GAME_CONFIG.sq.coinsWeight)}% from coins left. Skipping a trap
          or flagging it is a good call. Skipping a valuable post is a miss, not a mistake.
        </p>
      )}
    </div>
  );
}
