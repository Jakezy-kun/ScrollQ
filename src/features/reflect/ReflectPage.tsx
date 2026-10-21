import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { GuestSaveCard } from '@/components/GuestSaveCard';
import { useToast } from '@/components/toastContext';
import { useRound } from '@/hooks/useRound';
import { useRepository } from '@/lib/repository/repositoryContext';
import type { Reflection } from '@/lib/rounds/record';
import { EMPTY_REFLECTION } from '@/lib/rounds/record';
import { REFLECTION_MAX_LENGTH, reflectionSchema } from '@/lib/rounds/schema';
import { startNewRound } from '@/lib/startRound';
import { REFLECT_PROMPTS } from './reflectPrompts';

function trimmed(values: Reflection): Reflection {
  return { trap: values.trap.trim(), worth: values.worth.trim(), limit: values.limit.trim() };
}

function same(a: Reflection, b: Reflection) {
  return a.trap === b.trap && a.worth === b.worth && a.limit === b.limit;
}

export function ReflectPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const repo = useRepository();
  const finished = useRound((s) => s.finished);
  const setReflection = useRound((s) => s.setReflection);
  const [savedOnce, setSavedOnce] = useState(false);
  const [busy, setBusy] = useState(false);
  // Play Again replaces the finished round; don't bounce to Start while navigating away.
  const leaving = useRef(false);

  const {
    register,
    getValues,
    formState: { errors },
    trigger,
  } = useForm<Reflection>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: finished?.record.reflection ?? EMPTY_REFLECTION,
    mode: 'onBlur',
  });

  if (!finished) return leaving.current ? null : <Navigate to={ROUTES.start} replace />;
  const { record } = finished;

  /** Save if anything changed. Returns false only if the answers are invalid. */
  const save = async (): Promise<boolean> => {
    if (!(await trigger())) return false;
    const next = trimmed(getValues());
    const prev = record.reflection ?? EMPTY_REFLECTION;
    if (same(next, prev)) return true;
    setReflection(record.id, next);
    try {
      await repo.updateReflection(record.id, next);
      setSavedOnce(true);
    } catch {
      toast.show("Couldn't save your answers", { tone: 'warning' });
    }
    return true;
  };

  const leave = async (then: () => Promise<void> | void) => {
    setBusy(true);
    const ok = await save();
    if (ok) await then();
    setBusy(false);
  };

  const playAgain = () =>
    leave(async () => {
      leaving.current = true;
      const result = await startNewRound(record.feedStyle, record.mode);
      if (result.fellBack) {
        toast.show("Couldn't load the live feed", {
          tone: 'warning',
          detail: 'This round uses the curated posts instead.',
        });
      }
      navigate(ROUTES.round, { replace: true });
    });

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <main className="flex-1 px-5 pb-6 pt-[max(2rem,env(safe-area-inset-top))]">
        <h1 className="font-display text-3xl font-bold leading-tight text-fg">Take a moment</h1>
        <p className="mt-2 text-base text-muted">
          Just for you. No right answers, and nothing gets graded.
        </p>

        <form
          className="mt-7 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          noValidate
        >
          {REFLECT_PROMPTS.map((p, i) => {
            const error = errors[p.id]?.message;
            return (
              <div key={p.id}>
                <label
                  htmlFor={`reflect-${p.id}`}
                  className="flex gap-3 font-display text-lg font-bold leading-snug text-fg"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet text-sm"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  {p.question}
                </label>
                <textarea
                  id={`reflect-${p.id}`}
                  rows={3}
                  maxLength={REFLECTION_MAX_LENGTH}
                  placeholder={p.placeholder}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `reflect-${p.id}-error` : undefined}
                  className="mt-3 w-full resize-none rounded-card bg-surface px-4 py-3 text-base leading-relaxed text-fg ring-1 ring-white/10 transition-shadow duration-fast placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-violet"
                  {...register(p.id, { onBlur: () => void save() })}
                />
                {error && (
                  <p id={`reflect-${p.id}-error`} className="mt-1 text-sm text-coral">
                    Keep it under {REFLECTION_MAX_LENGTH} characters.
                  </p>
                )}
              </div>
            );
          })}
        </form>

        <p className="mt-6 flex min-h-5 items-center gap-1.5 text-sm text-muted" role="status">
          {savedOnce && (
            <>
              <Check className="h-4 w-4 text-mint" aria-hidden="true" />
              {repo.kind === 'local'
                ? 'Saved on this device. Only you can see it.'
                : 'Saved to your account. Only you can see it.'}
            </>
          )}
        </p>

        {repo.kind === 'local' && (
          <div className="mt-4">
            <GuestSaveCard />
          </div>
        )}
      </main>

      <div className="sticky bottom-0 space-y-3 border-t border-white/5 bg-base/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Button fullWidth loading={busy} onClick={() => void playAgain()}>
          Play Again
        </Button>
        <Button
          fullWidth
          variant="secondary"
          disabled={busy}
          onClick={() => void leave(() => navigate(ROUTES.start))}
        >
          Back to Start
        </Button>
      </div>
    </div>
  );
}
