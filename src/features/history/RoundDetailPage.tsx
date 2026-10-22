import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PAGE_WIDTH } from '@/components/pageWidth';
import { REFLECT_PROMPTS } from '@/features/reflect/reflectPrompts';
import { SummaryView } from '@/features/summary/SummaryView';
import { useRepository } from '@/lib/repository/repositoryContext';
import type { RoundRecord } from '@/lib/rounds/record';
import { FEED_STYLE_NAME, formatRoundDate } from './format';

type State =
  { status: 'loading' } | { status: 'missing' } | { status: 'ready'; record: RoundRecord };

/** A past round's summary and reveal, read back from the repository. */
export function RoundDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const repo = useRepository();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    repo
      .getRound(id)
      .then(
        (record) =>
          active && setState(record ? { status: 'ready', record } : { status: 'missing' }),
      )
      .catch(() => active && setState({ status: 'missing' }));
    return () => {
      active = false;
    };
  }, [repo, id]);

  return (
    <div className={`flex min-h-dvh flex-1 flex-col ${PAGE_WIDTH.reading}`}>
      <ScreenHeader title="Past round" backTo={ROUTES.history} />
      <main className="flex-1 px-5 pb-6">
        {state.status === 'loading' && (
          <p className="py-16 text-center text-muted" role="status">
            Loading…
          </p>
        )}
        {state.status === 'missing' && (
          <div className="py-16 text-center">
            <p className="text-muted">This round isn't saved anymore.</p>
            <Button
              variant="secondary"
              size="md"
              className="mt-4"
              onClick={() => navigate(ROUTES.history)}
            >
              Back to history
            </Button>
          </div>
        )}
        {state.status === 'ready' && (
          <SummaryView
            nested
            record={state.record}
            eyebrow={`${formatRoundDate(state.record.createdAt)} · ${FEED_STYLE_NAME[state.record.feedStyle]}`}
          >
            <SavedReflection record={state.record} />
          </SummaryView>
        )}
      </main>
    </div>
  );
}

function SavedReflection({ record }: { record: RoundRecord }) {
  const answers = REFLECT_PROMPTS.map((p) => ({
    ...p,
    answer: record.reflection?.[p.id] ?? '',
  })).filter((p) => p.answer.length > 0);
  if (answers.length === 0) return null;
  return (
    <section aria-labelledby="your-reflection" className="rounded-card-lg bg-surface p-4">
      <h2 id="your-reflection" className="font-display text-lg font-bold">
        Your reflection
      </h2>
      <dl className="mt-3 space-y-3">
        {answers.map((a) => (
          <div key={a.id}>
            <dt className="text-sm font-semibold text-muted">{a.question}</dt>
            <dd className="mt-1 whitespace-pre-line text-fg">{a.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
