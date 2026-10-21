import { ChevronRight, History, Info, RotateCcw, Shield, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Switch } from '@/components/Switch';
import { useToast } from '@/components/toastContext';
import { useAuth } from '@/lib/auth/authContext';
import { canVibrate } from '@/lib/feedback';
import { usePrefs } from '@/lib/prefs';

export function SettingsPage() {
  const toast = useToast();
  const { sound, vibration, reduceMotion, setPrefs, resetTutorial } = usePrefs();
  const vibrationSupported = canVibrate();
  const { status } = useAuth();

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-5 pb-10">
      <ScreenHeader title="Settings" backTo={ROUTES.start} className="-mx-2" />

      <Group title="Game">
        <Switch
          label="Sound"
          description="Soft tones when coins are spent or drained."
          checked={sound}
          onChange={(v) => setPrefs({ sound: v })}
        />
        <Switch
          label="Vibration"
          description={
            vibrationSupported
              ? 'A short buzz when coins are spent or drained.'
              : "This device or browser doesn't support vibration."
          }
          checked={vibration && vibrationSupported}
          disabled={!vibrationSupported}
          onChange={(v) => setPrefs({ vibration: v })}
        />
        <Switch
          label="Reduce motion"
          description="Use simple fades instead of slides. ScrollQ also follows your device setting."
          checked={reduceMotion}
          onChange={(v) => setPrefs({ reduceMotion: v })}
        />
      </Group>

      <Group title="Help">
        <button
          type="button"
          onClick={() => {
            resetTutorial();
            toast.show('Tutorial reset', {
              detail: 'The welcome slides will show on the Start screen.',
            });
          }}
          className="flex min-h-tap w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-fast hover:bg-white/5"
        >
          <RotateCcw className="h-5 w-5 text-muted" aria-hidden="true" />
          <span className="flex-1 font-semibold">Reset tutorial</span>
        </button>
        <RowLink to={ROUTES.howTo} icon={<Info className="h-5 w-5" />}>
          How to Play
        </RowLink>
      </Group>

      <Group title="Your data">
        {status === 'signedIn' && (
          <RowLink to={ROUTES.account} icon={<UserRound className="h-5 w-5" />}>
            Account
          </RowLink>
        )}
        <RowLink to={ROUTES.history} icon={<History className="h-5 w-5" />}>
          History
        </RowLink>
        <RowLink to={ROUTES.privacy} icon={<Shield className="h-5 w-5" />}>
          Privacy notice
        </RowLink>
        <RowLink to={ROUTES.about} icon={<Info className="h-5 w-5" />}>
          About ScrollQ
        </RowLink>
      </Group>

      <p className="mt-8 text-center text-xs text-muted">
        ScrollQ v{__APP_VERSION__} · a student project
      </p>
    </main>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6" aria-label={title}>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">{title}</h2>
      <div className="divide-y divide-white/5 overflow-hidden rounded-card-lg bg-surface">
        {children}
      </div>
    </section>
  );
}

function RowLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex min-h-tap items-center gap-3 px-4 py-3 transition-colors duration-fast hover:bg-white/5"
    >
      <span className="text-muted" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 font-semibold">{children}</span>
      <ChevronRight className="h-5 w-5 text-muted" aria-hidden="true" />
    </Link>
  );
}
