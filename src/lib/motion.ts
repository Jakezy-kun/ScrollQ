import type { Transition } from 'framer-motion';
import { durations, easeOut, easeSheet } from '@/styles/tokens';

export const quick: Transition = { duration: durations.base / 1000, ease: easeOut };
export const fast: Transition = { duration: durations.fast / 1000, ease: easeOut };
export const sheet: Transition = { duration: durations.slow / 1000, ease: easeSheet };

/** Enter/exit props that slide by (x, y) px, or only fade when motion is reduced. */
export function slideFade(reduced: boolean, { x = 0, y = 0 }: { x?: number; y?: number } = {}) {
  return {
    initial: reduced ? { opacity: 0 } : { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, x: -x, y: -y },
    transition: quick,
  };
}
