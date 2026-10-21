import { useReducedMotionConfig } from 'framer-motion';

/**
 * True when motion should be reduced: the OS setting, or the app's own setting once
 * it is applied through <MotionConfig reducedMotion> in the app shell.
 */
export function useReducedMotion(): boolean {
  return useReducedMotionConfig() ?? false;
}
