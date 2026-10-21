import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { GuestSaveCard } from '@/components/GuestSaveCard';
import { useToast } from '@/components/toastContext';
import { useRound } from '@/hooks/useRound';
import { useRepository } from '@/lib/repository/repositoryContext';
import { summaryFromRecord } from '@/lib/rounds/record';
import { SummaryView } from './SummaryView';

export function SummaryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const repo = useRepository();
  const finished = useRound((s) => s.finished);
  const markSaved = useRound((s) => s.markSaved);

  // Save the finished round once. saveRound is an upsert, so a retry is harmless.
  const recordId = finished?.record.id;
  const saved = finished?.saved ?? true;
  useEffect(() => {
    if (saved || !finished) return;
    repo
      .saveRound(finished.record)
      .then((outcome) => {
        markSaved(finished.record.id);
        if (outcome === 'queued') {
          toast.show('Saved offline', {
            detail: "It'll sync to your account when you're back online.",
          });
        }
      })
      .catch(() => toast.show("Couldn't save this round", { tone: 'warning' }));
    // Only re-run for a different round or when it becomes unsaved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, saved, repo]);

  if (!finished) return <Navigate to={ROUTES.start} replace />;

  const { outOfCoins, mode } = summaryFromRecord(finished.record);
  const roundWord = mode === 'live' ? 'Live round' : 'Round';

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <main className="flex-1 px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <SummaryView
          record={finished.record}
          eyebrow={
            outOfCoins ? `Out of coins · ${roundWord.toLowerCase()} over` : `${roundWord} complete`
          }
        >
          {repo.kind === 'local' && <GuestSaveCard />}
        </SummaryView>
      </main>

      <div className="sticky bottom-0 border-t border-white/5 bg-base/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Button fullWidth onClick={() => navigate(ROUTES.reflect)}>
          Reflect on this round
        </Button>
      </div>
    </div>
  );
}
