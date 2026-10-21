import { useEffect, useRef } from 'react';
import type { RoundState } from '@/engine';
import { feedback } from '@/lib/feedback';

/**
 * Sound/vibration for coin changes, per the player's settings. A read and its trap
 * penalty land together and get one cue, so feedback never hints at a trap early.
 */
export function useRoundFeedback(round: RoundState) {
  const seen = useRef(round.ledger.length);
  const status = useRef(round.status);

  useEffect(() => {
    const fresh = round.ledger.slice(seen.current);
    seen.current = round.ledger.length;
    if (fresh.length === 0) return;
    feedback(fresh.every((e) => e.reason === 'idle') ? 'drain' : 'spend');
  }, [round.ledger]);

  useEffect(() => {
    if (status.current === 'playing' && round.status === 'ended') feedback('end');
    status.current = round.status;
  }, [round.status]);
}
