import { zodResolver } from '@hookform/resolvers/zod';
import { Download, LogOut, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { FormMessage, PasswordField, TextField } from '@/components/form/Fields';
import { PAGE_WIDTH } from '@/components/pageWidth';
import { useToast } from '@/components/toastContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { NewPasswordValues } from '@/features/auth/schemas';
import { newPasswordFormSchema } from '@/features/auth/schemas';
import { StrengthMeter } from '@/features/auth/StrengthMeter';
import { useAuth } from '@/lib/auth/authContext';
import { useRepository } from '@/lib/repository/repositoryContext';
import { SupabaseRepository } from '@/lib/repository/SupabaseRepository';
import { removeKey } from '@/lib/storage';
import { buildExport, downloadJson } from './exportData';

const DELETE_WORD = 'DELETE';

export function AccountPage() {
  const auth = useAuth();
  const repo = useRepository();
  const navigate = useNavigate();
  const toast = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const email = auth.user?.email ?? '';
  const pending = repo instanceof SupabaseRepository ? repo.pendingCount : 0;

  const download = async () => {
    setExporting(true);
    try {
      const data = await buildExport(repo, email);
      downloadJson(data, `scrollq-data-${new Date().toISOString().slice(0, 10)}.json`);
    } catch {
      toast.show("Couldn't prepare your data. Check your connection.", { tone: 'warning' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className={`flex min-h-dvh flex-1 flex-col px-5 pb-10 ${PAGE_WIDTH.reading}`}>
      <ScreenHeader title="Account" backTo={ROUTES.profile} className="-mx-2" />

      <Section title="Sign-in">
        <TextField label="Email" type="email" value={email} readOnly />
      </Section>

      <Section title="Change password">
        <ChangePasswordForm />
      </Section>

      <Section title="Your data">
        <p className="text-sm text-muted">A JSON file with your profile, rounds and reflections.</p>
        <Button
          variant="secondary"
          fullWidth
          className="mt-3"
          loading={exporting}
          icon={<Download className="h-5 w-5" aria-hidden="true" />}
          onClick={() => void download()}
        >
          Download my data
        </Button>
      </Section>

      <div className="mt-8 space-y-3">
        <Button
          variant="secondary"
          fullWidth
          icon={<LogOut className="h-5 w-5" aria-hidden="true" />}
          onClick={() => setLogoutOpen(true)}
        >
          Log out
        </Button>
        <Button
          variant="danger"
          fullWidth
          icon={<Trash2 className="h-5 w-5" aria-hidden="true" />}
          onClick={() => setDeleteOpen(true)}
        >
          Delete account
        </Button>
      </div>

      <LogoutSheet
        open={logoutOpen}
        pending={pending}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          // Leave the protected page first (and wait for it), or it would bounce to Log in.
          await navigate(ROUTES.start, { replace: true });
          await auth.signOut();
          toast.show('Logged out', { detail: "You're playing as a guest on this device." });
        }}
      />
      <DeleteAccountSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          const userId = auth.user?.id;
          const result = await auth.deleteAccount();
          if (!result.ok) return result.message;
          if (userId) removeKey(`syncQueue:${userId}`);
          await navigate(ROUTES.start, { replace: true });
          await auth.signOut();
          toast.show('Account deleted', { detail: 'Your profile and rounds are gone for good.' });
          return null;
        }}
      />
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-card-lg bg-surface p-4" aria-label={title}>
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ChangePasswordForm() {
  const auth = useAuth();
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit(async ({ password }) => {
    setMessage(null);
    const result = await auth.updatePassword(password);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    reset();
    setMessage({ tone: 'success', text: 'Password changed.' });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <PasswordField
        label="New password"
        autoComplete="new-password"
        hint={<StrengthMeter password={watch('password')} />}
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" fullWidth size="md" loading={isSubmitting}>
        Change password
      </Button>
    </form>
  );
}

function LogoutSheet({
  open,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pending: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="font-display text-2xl font-bold">
        Log out of ScrollQ?
      </h2>
      <p className="mt-2 text-muted">
        Your settings stay on this device. Your rounds stay in your account.
      </p>
      {pending > 0 && (
        <p className="mt-3 rounded-card bg-amber/10 p-3 text-sm text-fg ring-1 ring-amber/40">
          {pending} {pending === 1 ? 'change hasn’t' : 'changes haven’t'} synced yet. They’ll upload
          the next time you log in on this device.
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
          }}
        >
          Log out
        </Button>
      </div>
    </BottomSheet>
  );
}

function DeleteAccountSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  /** Returns an error message, or null on success. */
  onConfirm: () => Promise<string | null>;
}) {
  const titleId = useId();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => {
    setTyped('');
    setError(null);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={close} labelledBy={titleId}>
      <h2 id={titleId} className="font-display text-2xl font-bold">
        Delete your account?
      </h2>
      <p className="mt-2 text-muted">
        This permanently deletes your profile, every round and every reflection. It can’t be undone.
        Download your data first if you want a copy.
      </p>
      <div className="mt-4 space-y-3">
        {error && <FormMessage>{error}</FormMessage>}
        <TextField
          label={`Type ${DELETE_WORD} to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          disabled={typed.trim() !== DELETE_WORD}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            const message = await onConfirm();
            setBusy(false);
            if (message) setError(message);
            else close();
          }}
        >
          Delete
        </Button>
      </div>
    </BottomSheet>
  );
}
