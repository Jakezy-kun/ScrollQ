import { useEffect, useRef, useState } from 'react';
import type { IdleView } from '@/engine';
import { GAME_CONFIG, selectIdleState } from '@/engine';
import { useRound } from './useRound';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchmove'] as const;
/** Scroll and wheel fire many times a second; reset the idle clock at most this often. */
const ACTIVITY_THROTTLE_MS = 200;

/**
 * Drives idle drain on the feed while `enabled`:
 * - checks the idle clock every `checkEveryMs` (the engine does timestamp math, so
 *   throttled timers still charge the right amount),
 * - any tap, key, wheel, swipe or scroll counts as activity,
 * - pauses while the tab is hidden.
 * Returns the meter view, refreshed on each check.
 */
export function useIdleDrain(enabled: boolean): IdleView {
  const idleTick = useRound((s) => s.idleTick);
  const activity = useRound((s) => s.activity);
  const setIdlePaused = useRound((s) => s.setIdlePaused);
  const round = useRound((s) => s.round);
  const [now, setNow] = useState(() => Date.now());
  const lastActivity = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => {
      const t = Date.now();
      if (t - lastActivity.current < ACTIVITY_THROTTLE_MS) return;
      lastActivity.current = t;
      activity();
    };
    const onVisibility = () => setIdlePaused(document.hidden);

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    // Capture so scrolling inside any scroll container counts.
    document.addEventListener('scroll', onActivity, { capture: true, passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    setIdlePaused(document.hidden);

    const id = window.setInterval(() => {
      idleTick();
      setNow(Date.now());
    }, GAME_CONFIG.idle.checkEveryMs);

    return () => {
      window.clearInterval(id);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('scroll', onActivity, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
      // Leaving the feed (or anything else disabling drain) pauses it.
      setIdlePaused(true);
    };
  }, [enabled, idleTick, activity, setIdlePaused]);

  return selectIdleState(round, now);
}
