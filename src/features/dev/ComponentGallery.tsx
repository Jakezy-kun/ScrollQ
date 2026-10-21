import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { AvatarArt } from '@/components/avatar/AvatarArt';
import { AVATARS } from '@/components/avatar/avatars';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { CoinCounter } from '@/components/CoinCounter';
import { CoinIcon } from '@/components/CoinIcon';
import { IdleMeter } from '@/components/IdleMeter';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useToast } from '@/components/toastContext';
import { Wordmark } from '@/components/Wordmark';

/** Dev-only page for reviewing shared components (not included in production builds). */
export function ComponentGallery() {
  const toast = useToast();
  const [coins, setCoins] = useState(100);
  const [draining, setDraining] = useState(false);
  const [announcement, setAnnouncement] = useState<{ key: number; text: string } | null>(null);
  const [idle, setIdle] = useState(0.4);
  const [sheetOpen, setSheetOpen] = useState(false);
  const titleId = useId();
  const cost = 4;

  const spend = (n: number) => {
    const next = Math.max(0, coins - n);
    setCoins(next);
    setAnnouncement({ key: Date.now(), text: `Spent ${n} coins. ${next} coins left.` });
  };

  return (
    <main className="flex flex-1 flex-col pb-12">
      <ScreenHeader title="Component gallery" />
      <div className="space-y-6 px-5">
        <Section title="Wordmark">
          <Wordmark className="text-5xl" />
        </Section>

        <Section title="Avatars">
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-1 text-xs text-muted">
                <AvatarArt id={a.id} size={56} />
                {a.name}
              </div>
            ))}
          </div>
        </Section>

        <Section title="CoinCounter">
          <div className="flex items-center gap-4">
            <CoinCounter coins={coins} draining={draining} announcement={announcement} />
            <span className="text-sm text-muted">Fixed width: layout never shifts.</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="md"
              variant="secondary"
              onClick={() => setCoins((c) => Math.max(0, c - 1))}
            >
              Idle −1 (silent)
            </Button>
            <Button size="md" variant="secondary" onClick={() => spend(4)}>
              Read −4 (announced)
            </Button>
            <Button size="md" variant="secondary" onClick={() => setDraining((d) => !d)}>
              {draining ? 'Stop pulse' : 'Pulse'}
            </Button>
            <Button size="md" variant="ghost" onClick={() => setCoins(100)}>
              Reset
            </Button>
          </div>
        </Section>

        <Section title="IdleMeter">
          <div className="flex flex-col gap-3">
            <IdleMeter progress={0} draining={false} />
            <IdleMeter progress={idle} draining={false} />
            <IdleMeter progress={1} draining />
            <label className="flex items-center gap-3 text-sm text-muted">
              Progress
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={idle}
                onChange={(e) => setIdle(Number(e.target.value))}
                className="flex-1 accent-violet"
              />
            </label>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="space-y-3">
            <Button fullWidth>Primary</Button>
            <Button fullWidth variant="secondary">
              Secondary
            </Button>
            <Button fullWidth variant="violet">
              Back to feed
            </Button>
            <Button fullWidth variant="danger">
              Danger
            </Button>
            <Button fullWidth loading>
              Loading
            </Button>
            <Button fullWidth disabled>
              Disabled
            </Button>
          </div>
        </Section>

        <Section title="Toast">
          <div className="flex flex-wrap gap-2">
            <Button size="md" variant="secondary" onClick={() => toast.show('Skipped')}>
              Neutral
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={() => toast.show('Welcome back!', { tone: 'good' })}
            >
              Good
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={() =>
                toast.show('Idle scrolling still costs attention.', {
                  tone: 'warning',
                  detail: '−1 coin every 2 seconds. Make a move!',
                })
              }
            >
              Warning
            </Button>
          </div>
        </Section>

        <Section title="BottomSheet">
          <Button fullWidth variant="secondary" onClick={() => setSheetOpen(true)}>
            Open confirmation sheet
          </Button>
          <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} labelledBy={titleId}>
            <h2 id={titleId} className="font-display text-2xl font-bold leading-tight">
              Open this post for{' '}
              <span className="inline-flex items-baseline gap-1 text-amber">
                <CoinIcon size={20} className="self-center" />
                {cost} coins?
              </span>
            </h2>
            <p className="mt-2 text-muted">
              You'll have <span className="font-bold text-fg">{coins - cost}</span> left. No coins
              are taken until you confirm.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  spend(cost);
                  setSheetOpen(false);
                }}
              >
                Confirm
              </Button>
            </div>
          </BottomSheet>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card-lg bg-surface/60 p-4 ring-1 ring-white/10">
      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
