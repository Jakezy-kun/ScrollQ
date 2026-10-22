import { ChevronRight, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { historyDetailPath, ROUTES } from '@/app/routes';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SqChart } from '@/components/SqChart';
import { PAGE_WIDTH } from '@/components/pageWidth';
import { useToast } from '@/components/toastContext';
import { sqLabel } from '@/engine';
import { bestSq, useRounds } from '@/hooks/useRounds';
import { cn } from '@/lib/cn';
import { useRepository } from '@/lib/repository/repositoryContext';
import { FEED_STYLE_NAME, formatRoundDate } from './format';

const TONE_TEXT = { mint: 'text-mint', amber: 'text-amber', coral: 'text-coral' } as const;

export function HistoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const repo = useRepository();
  const { rounds, loading, error, refresh } = useRounds();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const titleId = useId();

  const clear = async () => {
    setClearing(true);
    try {
      await repo.clearRounds();
      await refresh();
      setConfirmOpen(false);
      toast.show('History cleared');
    } catch {
      toast.show("Couldn't clear your history", { tone: 'warning' });
    } finally {
      setClearing(false);
    }
  };

  const best = bestSq(rounds);
  const average =
    rounds.length > 0 ? Math.round(rounds.reduce((s, r) => s + r.sq, 0) / rounds.length) : null;
  const latest = rounds[0];

  return (
    <main className={`flex min-h-dvh flex-1 flex-col px-5 pb-8 ${PAGE_WIDTH.wide}`}>
      <ScreenHeader title="History" backTo={ROUTES.start} className="-mx-2" />

      {loading ? (
        <p className="py-16 text-center text-muted" role="status">
          Loading your rounds…
        </p>
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-muted">Couldn't load your rounds.</p>
          <Button variant="secondary" size="md" className="mt-4" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      ) : rounds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-2xl font-bold">No rounds yet</p>
          <p className="mt-2 max-w-[28ch] text-muted">
            Play a round and your SQ shows up here, so you can see yourself improve.
          </p>
          <Button className="mt-6" onClick={() => navigate(ROUTES.feedSelect)}>
            Play
          </Button>
        </div>
      ) : (
        <>
          <section aria-labelledby="trend-title" className="mt-2 rounded-card-lg bg-surface p-4">
            <h2 id="trend-title" className="font-display text-lg font-bold">
              SQ over your rounds
            </h2>
            <dl className="mt-1 flex gap-4 text-sm text-muted">
              {latest && (
                <div className="flex gap-1">
                  <dt>Latest</dt>
                  <dd className="font-bold text-fg">{latest.sq}</dd>
                </div>
              )}
              <div className="flex gap-1">
                <dt>Best</dt>
                <dd className="font-bold text-fg">{best}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Average</dt>
                <dd className="font-bold text-fg">{average}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <SqChart rounds={rounds} />
            </div>
            {rounds.length === 1 && (
              <p className="mt-2 text-sm text-muted">Play more rounds to see your trend.</p>
            )}
          </section>

          <section aria-labelledby="rounds-title" className="mt-6">
            <h2 id="rounds-title" className="font-display text-lg font-bold">
              {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'}
            </h2>
            <ul className="mt-2 space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
              {rounds.map((r) => {
                const label = sqLabel(r.sq);
                return (
                  <li key={r.id}>
                    <Link
                      to={historyDetailPath(r.id)}
                      className="flex min-h-tap items-center gap-4 rounded-card bg-surface p-4 transition-colors duration-fast hover:bg-surface-2"
                    >
                      <span
                        className={cn(
                          'w-12 shrink-0 text-center font-display text-3xl font-extrabold tabular-nums',
                          TONE_TEXT[label.tone],
                        )}
                      >
                        <span className="sr-only">SQ </span>
                        {r.sq}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-fg">{label.label}</span>
                        <span className="block text-sm text-muted">
                          {formatRoundDate(r.createdAt)} · {FEED_STYLE_NAME[r.feedStyle]}
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <Button
            variant="danger"
            fullWidth
            className="mt-8 lg:w-auto lg:self-start"
            icon={<Trash2 className="h-5 w-5" aria-hidden="true" />}
            onClick={() => setConfirmOpen(true)}
          >
            Clear history
          </Button>
        </>
      )}

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} labelledBy={titleId}>
        <h2 id={titleId} className="font-display text-2xl font-bold leading-tight">
          Clear all {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'}?
        </h2>
        <p className="mt-2 text-muted">
          Your scores and reflections will be deleted
          {repo.kind === 'local' ? ' from this device' : ''}. This can't be undone.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button loading={clearing} onClick={() => void clear()}>
            Clear history
          </Button>
        </div>
      </BottomSheet>
    </main>
  );
}
