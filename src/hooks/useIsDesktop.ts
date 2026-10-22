import { useSyncExternalStore } from 'react';

/** Laptops and PCs: Tailwind's `lg` breakpoint, where the sidebar layout starts. */
const QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  const list = window.matchMedia(QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

/**
 * True on wide screens (1024px and up). For behavior that CSS alone can't switch, like
 * a sheet that slides up on phones but appears as a centered dialog on a laptop.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
