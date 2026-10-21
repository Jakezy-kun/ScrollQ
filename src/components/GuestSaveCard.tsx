import { CloudUpload } from 'lucide-react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/lib/auth/authContext';

/** Gentle nudge for guests. Never blocks play; hidden when accounts are off or signed in. */
export function GuestSaveCard() {
  const { accountsEnabled, status } = useAuth();
  if (!accountsEnabled || status !== 'guest') return null;
  return (
    <aside className="flex items-start gap-3 rounded-card-lg bg-violet/15 p-4 ring-1 ring-violet/40">
      <CloudUpload className="mt-0.5 h-5 w-5 shrink-0 text-violet" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-fg">
        Save your rounds and track your SQ:{' '}
        <Link to={ROUTES.signup} className="font-bold text-fg underline underline-offset-4">
          Create a free account
        </Link>
      </p>
    </aside>
  );
}
