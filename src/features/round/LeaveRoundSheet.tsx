import { useId, useRef } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';

interface LeaveRoundSheetProps {
  open: boolean;
  /** Post the player is on, for the reassurance line. */
  current: number;
  total: number;
  onLeave: () => void;
  onStay: () => void;
}

/** Asks before leaving a round. The round is kept, so it can be resumed from Home. */
export function LeaveRoundSheet({ open, current, total, onLeave, onStay }: LeaveRoundSheetProps) {
  const titleId = useId();
  const descId = useId();
  const stayRef = useRef<HTMLButtonElement>(null);

  return (
    <BottomSheet
      open={open}
      onClose={onStay}
      labelledBy={titleId}
      describedBy={descId}
      initialFocusRef={stayRef}
    >
      <h2 id={titleId} className="font-display text-2xl font-bold leading-tight text-fg">
        Leave this round?
      </h2>
      <p id={descId} className="mt-2 text-base text-muted">
        Your round is saved at post <span className="font-bold text-fg">{current}</span> of {total}.
        Coins don't drain while you're away. Resume it from Home.
      </p>

      {/* "Keep playing" gets the wider share so it fits on one line on small phones. */}
      <div className="mt-6 grid grid-cols-[2fr_3fr] gap-3">
        <Button variant="secondary" onClick={onLeave}>
          Leave
        </Button>
        <Button ref={stayRef} onClick={onStay}>
          Keep playing
        </Button>
      </div>
    </BottomSheet>
  );
}
