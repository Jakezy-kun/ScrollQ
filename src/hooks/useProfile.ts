import { useCallback, useEffect, useState } from 'react';
import { useDataRevision } from '@/lib/repository/dataRevision';
import { useRepository } from '@/lib/repository/repositoryContext';
import type { Profile, ProfilePatch } from '@/lib/repository/types';

/** The active player's profile (account profile when signed in, device nickname for guests). */
export function useProfile() {
  const repo = useRepository();
  const { revision, bump } = useDataRevision();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    repo
      .getProfile()
      .then((p) => active && (setProfile(p), setError(false)))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [repo, revision]);

  const update = useCallback(
    async (patch: ProfilePatch) => {
      const next = await repo.updateProfile(patch);
      setProfile(next);
      bump();
      return next;
    },
    [repo, bump],
  );

  return { profile, error, update };
}
