import { useCallback, useEffect, useState } from 'react';
import { useDataRevision } from '@/lib/repository/dataRevision';
import { useRepository } from '@/lib/repository/repositoryContext';
import type { RoundRecord } from '@/lib/rounds/record';

interface RoundsState {
  rounds: RoundRecord[];
  loading: boolean;
  error: boolean;
}

/** Saved rounds from the active repository, newest first. */
export function useRounds() {
  const repo = useRepository();
  const revision = useDataRevision((s) => s.revision);
  const [state, setState] = useState<RoundsState>({ rounds: [], loading: true, error: false });

  const refresh = useCallback(async () => {
    try {
      const rounds = await repo.listRounds();
      setState({ rounds, loading: false, error: false });
    } catch {
      setState((s) => ({ ...s, loading: false, error: true }));
    }
  }, [repo]);

  useEffect(() => {
    let active = true;
    repo
      .listRounds()
      .then((rounds) => active && setState({ rounds, loading: false, error: false }))
      .catch(() => active && setState((s) => ({ ...s, loading: false, error: true })));
    return () => {
      active = false;
    };
  }, [repo, revision]);

  return { ...state, refresh };
}

/** Best SQ across saved rounds, or null with no history. */
export function bestSq(rounds: readonly RoundRecord[]): number | null {
  return rounds.length === 0 ? null : Math.max(...rounds.map((r) => r.sq));
}
