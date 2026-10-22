import { useEffect, useRef } from 'react';
import { usePrefs } from '@/lib/prefs';

export interface RoundShortcutActions {
  read: () => void;
  skip: () => void;
  flag: () => void;
}

/** Keys shown in the round's side panel and in Settings. */
export const ROUND_SHORTCUTS = [
  { key: 'R', label: 'Read' },
  { key: 'S', label: 'Skip' },
  { key: 'F', label: 'Flag' },
] as const;

/**
 * R reads, S skips, F flags the current post, for players on a computer. Pass null while
 * a sheet or the open post is showing. Single-key shortcuts can be switched off in
 * Settings (WCAG 2.1.4), and never fire while typing or with Ctrl / Alt / Cmd held.
 */
export function useRoundShortcuts(actions: RoundShortcutActions | null): void {
  const enabled = usePrefs((s) => s.keyboardShortcuts);
  const latest = useRef(actions);
  latest.current = actions;
  const active = enabled && actions !== null;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const a = latest.current;
      if (!a || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        e.target instanceof Element &&
        e.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
      ) {
        return;
      }
      const action = { r: a.read, s: a.skip, f: a.flag }[e.key.toLowerCase()];
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
