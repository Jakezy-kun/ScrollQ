import { useEffect, useId, useState } from 'react';
import { useLocation } from 'react-router';
import { ROUTES } from '@/app/routes';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/form/Fields';
import { useToast } from '@/components/toastContext';
import { useAuth } from '@/lib/auth/authContext';
import { useDataRevision } from '@/lib/repository/dataRevision';
import { migrateGuestRounds } from '@/lib/repository/migrateGuest';
import { localRepository, useRepository } from '@/lib/repository/repositoryContext';
import { safeStringStorage } from '@/lib/storage';

const session = safeStringStorage('session');

/**
 * After signing up or logging in, offer to move this device's guest rounds into the
 * account. "Not now" is remembered for the rest of the browser session.
 */
export function GuestMigrationPrompt() {
  const { status, user } = useAuth();
  const repo = useRepository();
  const toast = useToast();
  const bump = useDataRevision((s) => s.bump);
  const { pathname } = useLocation();
  const titleId = useId();
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismissKey = user ? `migrationDismissed:${user.id}` : '';

  useEffect(() => {
    if (status !== 'signedIn' || repo.kind !== 'supabase' || !dismissKey) {
      setCount(0);
      return;
    }
    if (session.getItem(dismissKey)) return;
    let active = true;
    void localRepository.listRounds().then((rounds) => active && setCount(rounds.length));
    return () => {
      active = false;
    };
  }, [status, repo, dismissKey]);

  // Never interrupt a round in progress.
  const open = count > 0 && pathname !== ROUTES.round;

  const notNow = () => {
    session.setItem(dismissKey, '1');
    setCount(0);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const moved = await migrateGuestRounds(localRepository, repo);
      setCount(0);
      bump();
      toast.show(`${moved} ${moved === 1 ? 'round' : 'rounds'} saved to your account`, {
        tone: 'good',
      });
    } catch {
      setError("Couldn't move your rounds. They're still on this device; try again later.");
    } finally {
      setBusy(false);
    }
  };

  const noun = count === 1 ? 'round' : 'rounds';

  return (
    <BottomSheet open={open} onClose={notNow} labelledBy={titleId}>
      <h2 id={titleId} className="font-display text-2xl font-bold leading-tight">
        Save your {count} {noun} to your account?
      </h2>
      <p className="mt-2 text-muted">
        You played {count === 1 ? 'it' : 'them'} as a guest on this device. Move{' '}
        {count === 1 ? 'it' : 'them'} into your account to keep your SQ history in one place.
      </p>
      {error && (
        <div className="mt-3">
          <FormMessage>{error}</FormMessage>
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={notNow}>
          Not now
        </Button>
        <Button loading={busy} onClick={() => void save()}>
          Save {count === 1 ? 'it' : 'them'}
        </Button>
      </div>
    </BottomSheet>
  );
}
