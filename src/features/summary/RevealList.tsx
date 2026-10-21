import { Check, Globe, Minus, X } from 'lucide-react';
import type { Verdict } from '@/engine';
import { CHOICE_LABEL, TRAP_TYPE_LABEL, VERDICT_LABEL } from '@/engine';
import { cn } from '@/lib/cn';
import type { RevealRecord } from '@/lib/rounds/record';

const VERDICT_STYLE = {
  good: { icon: <Check className="h-4 w-4" />, badge: 'bg-mint/20 text-mint', text: 'text-mint' },
  bad: { icon: <X className="h-4 w-4" />, badge: 'bg-coral/20 text-coral', text: 'text-coral' },
  missed: {
    icon: <Minus className="h-4 w-4" />,
    badge: 'bg-white/10 text-muted',
    text: 'text-muted',
  },
} as const;

/** Live rounds have no answer key: the verdict is the player's own rating. */
function liveVerdictLabel(row: RevealRecord): string {
  if (row.rating === 'worth') return 'Worth it';
  if (row.rating === 'not_worth') return 'Not worth it';
  return row.choice === 'read' ? 'Not rated' : '—';
}

/** The reveal: every post, what it really was, what you did, and why it mattered. */
export function RevealList({ rows, live = false }: { rows: RevealRecord[]; live?: boolean }) {
  return (
    <section aria-labelledby="reveal-title">
      <h2 id="reveal-title" className="font-display text-lg font-bold text-fg">
        {live ? 'Your feed' : 'The reveal'}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {live
          ? 'What you opened, and whether you felt it was worth the coins.'
          : 'Which posts were worth it, and which were traps.'}
      </p>
      <ul className="mt-2 divide-y divide-white/10">
        {rows.map((row) => (
          <RevealRow key={row.postId} row={row} live={live} />
        ))}
      </ul>
    </section>
  );
}

function RevealRow({ row, live }: { row: RevealRecord; live: boolean }) {
  const style = VERDICT_STYLE[row.verdict as Verdict];
  const verdictText = live ? liveVerdictLabel(row) : VERDICT_LABEL[row.verdict];
  const youText = row.choice === 'not_reached' ? 'Not reached' : `You: ${CHOICE_LABEL[row.choice]}`;

  return (
    <li className="flex gap-3 py-4">
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          style.badge,
        )}
        aria-hidden="true"
      >
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-fg">{row.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {live ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet/20 px-2 py-0.5 text-xs font-bold text-fg">
              <Globe className="h-3 w-3" aria-hidden="true" />
              Live post
            </span>
          ) : row.isTrap && row.trapType ? (
            <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-bold text-coral">
              Trap · {TRAP_TYPE_LABEL[row.trapType]}
            </span>
          ) : (
            <span className="rounded-full bg-mint/15 px-2 py-0.5 text-xs font-bold text-mint">
              Valuable
            </span>
          )}
          <span className="text-muted">{youText}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{row.why}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('text-sm font-bold', style.text)}>{verdictText}</p>
        {row.coinImpact > 0 && (
          <p className="text-xs tabular-nums text-muted">
            <span aria-hidden="true">−{row.coinImpact}</span>
            <span className="sr-only">cost {row.coinImpact} coins</span>
          </p>
        )}
      </div>
    </li>
  );
}
