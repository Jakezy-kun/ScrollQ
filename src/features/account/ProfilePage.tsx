import { ChevronRight, Pencil, UserCog } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AvatarArt } from '@/components/avatar/AvatarArt';
import { findAvatar } from '@/components/avatar/avatars';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SqChart } from '@/components/SqChart';
import { PAGE_WIDTH } from '@/components/pageWidth';
import { useToast } from '@/components/toastContext';
import type { FeedStyle } from '@/engine';
import { FEED_STYLE_NAME } from '@/features/history/format';
import { useProfile } from '@/hooks/useProfile';
import { bestSq, useRounds } from '@/hooks/useRounds';
import type { RoundRecord } from '@/lib/rounds/record';
import { EditProfileSheet } from './EditProfileSheet';

function favoriteFeed(rounds: readonly RoundRecord[]): FeedStyle | null {
  const counts = new Map<FeedStyle, number>();
  for (const r of rounds) counts.set(r.feedStyle, (counts.get(r.feedStyle) ?? 0) + 1);
  let best: FeedStyle | null = null;
  for (const [style, n] of counts) if (best === null || n > (counts.get(best) ?? 0)) best = style;
  return best;
}

export function ProfilePage() {
  const toast = useToast();
  const { profile, error, update } = useProfile();
  const { rounds, loading } = useRounds();
  const [editing, setEditing] = useState(false);

  const best = bestSq(rounds);
  const average =
    rounds.length > 0 ? Math.round(rounds.reduce((s, r) => s + r.sq, 0) / rounds.length) : null;
  const favorite = favoriteFeed(rounds);
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  const stats = [
    { label: 'Rounds played', value: loading ? '…' : String(rounds.length) },
    { label: 'Best SQ', value: best ?? '—' },
    { label: 'Average SQ', value: average ?? '—' },
    { label: 'Favorite feed', value: favorite ? FEED_STYLE_NAME[favorite] : '—' },
  ];

  return (
    <main className={`flex min-h-dvh flex-1 flex-col px-5 pb-10 ${PAGE_WIDTH.reading}`}>
      <ScreenHeader
        title="Profile"
        backTo={ROUTES.start}
        className="-mx-2"
        right={
          <Link
            to={ROUTES.account}
            aria-label="Account settings"
            className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-full text-muted transition-colors duration-fast hover:text-fg"
          >
            <UserCog className="h-5 w-5" aria-hidden="true" />
          </Link>
        }
      />

      {error && (
        <p className="mt-4 text-muted">Couldn't load your profile. Try again in a moment.</p>
      )}

      {profile && (
        <section className="mt-4 flex flex-col items-center text-center">
          <AvatarArt
            id={profile.avatar}
            fallbackName={profile.displayName}
            size={96}
            label={
              findAvatar(profile.avatar) ? `Avatar: ${findAvatar(profile.avatar)?.name}` : undefined
            }
          />
          <h1 className="mt-4 font-display text-3xl font-bold">{profile.displayName}</h1>
          {memberSince && <p className="mt-1 text-sm text-muted">Member since {memberSince}</p>}
          <Button
            variant="secondary"
            size="md"
            className="mt-4"
            icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setEditing(true)}
          >
            Edit profile
          </Button>
        </section>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card-lg bg-surface p-4">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      {rounds.length > 0 && (
        <section aria-labelledby="profile-trend" className="mt-4 rounded-card-lg bg-surface p-4">
          <h2 id="profile-trend" className="font-display text-lg font-bold">
            SQ over your rounds
          </h2>
          <div className="mt-4">
            <SqChart rounds={rounds} />
          </div>
        </section>
      )}

      <Link
        to={ROUTES.history}
        className="mt-4 flex min-h-tap items-center justify-between rounded-card-lg bg-surface px-4 py-3 font-semibold transition-colors duration-fast hover:bg-surface-2"
      >
        See all rounds
        <ChevronRight className="h-5 w-5 text-muted" aria-hidden="true" />
      </Link>

      {profile && (
        <EditProfileSheet
          open={editing}
          profile={profile}
          onClose={() => setEditing(false)}
          onSave={async (values) => {
            await update(values);
            toast.show('Profile saved', { tone: 'good' });
          }}
        />
      )}
    </main>
  );
}
