import { Keyboard } from 'lucide-react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import type { Post } from '@/engine';
import { usePrefs } from '@/lib/prefs';
import { UpNext } from './UpNext';
import { ROUND_SHORTCUTS } from './useRoundShortcuts';

/**
 * Right-hand panel beside the feed on laptops and PCs: what's coming next and the
 * keyboard shortcuts. Hidden on phones and tablets, where Up next sits under the post.
 */
export function RoundSidePanel({ upcoming }: { upcoming: Post[] }) {
  const shortcuts = usePrefs((s) => s.keyboardShortcuts);

  return (
    <aside
      aria-label="Round info"
      className="hidden w-72 shrink-0 flex-col overflow-y-auto pb-6 pt-[4.5rem] lg:flex xl:w-80"
    >
      <UpNext posts={upcoming} />

      <section
        aria-labelledby="shortcuts-title"
        className="mt-auto rounded-card-lg bg-surface/60 p-4 ring-1 ring-white/5"
      >
        <h3 id="shortcuts-title" className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Keyboard className="h-4 w-4 text-muted" aria-hidden="true" />
          Keyboard shortcuts
        </h3>
        {shortcuts ? (
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {ROUND_SHORTCUTS.map((s) => (
              <li key={s.key} className="flex items-center gap-3">
                <kbd className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 font-sans text-xs font-bold text-fg ring-1 ring-white/15">
                  {s.key}
                </kbd>
                {s.label}
              </li>
            ))}
            <li className="flex items-center gap-3">
              <kbd className="flex h-7 items-center justify-center rounded-md bg-surface-2 px-2 font-sans text-xs font-bold text-fg ring-1 ring-white/15">
                Esc
              </kbd>
              Close a sheet or post
            </li>
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Turned off.</p>
        )}
        <Link
          to={ROUTES.settings}
          className="mt-3 inline-block text-xs font-semibold text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {shortcuts ? 'Turn off in Settings' : 'Turn on in Settings'}
        </Link>
      </section>
    </aside>
  );
}
