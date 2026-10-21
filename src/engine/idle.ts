import type { GameConfig } from './config';
import type { RoundState } from './types';

/**
 * Total coins due for an idle stretch of `elapsedMs`.
 * Nothing during the grace period, then `drainAmount` at the end of the grace period
 * and every `drainEveryMs` after that. Timestamp-based, so throttled timers catch up.
 */
export function idleCoinsDue(elapsedMs: number, idle: GameConfig['idle']): number {
  if (elapsedMs < idle.delayMs) return 0;
  return (Math.floor((elapsedMs - idle.delayMs) / idle.drainEveryMs) + 1) * idle.drainAmount;
}

/** True when anything should stop the idle clock. */
export function isIdleBlocked(state: RoundState): boolean {
  return (
    state.status !== 'playing' ||
    state.pendingReadPostId !== null ||
    state.openPostId !== null ||
    state.idle.awaitingPost ||
    state.idle.pausedExternally
  );
}

/** Restart the idle stretch at `at`, or stop the clock if something blocks it. */
export function restartIdle(state: RoundState, at: number): RoundState {
  return {
    ...state,
    idle: { ...state.idle, startedAt: isIdleBlocked(state) ? null : at, drained: 0 },
  };
}

/** Stop the idle clock (used when a sheet, post or pause takes over). */
export function stopIdle(state: RoundState): RoundState {
  return { ...state, idle: { ...state.idle, startedAt: null, drained: 0 } };
}
