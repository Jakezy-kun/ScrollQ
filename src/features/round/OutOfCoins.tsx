import { m } from 'framer-motion';
import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/Button';
import { useModal } from '@/hooks/useModal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { fast, quick } from '@/lib/motion';

/** The short "You're out of attention" moment before the summary. */
export function OutOfCoins({
  postsSeen,
  onContinue,
}: {
  postsSeen: number;
  onContinue: () => void;
}) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useModal(true, panelRef, onContinue);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <m.div
        className="absolute inset-0 bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={fast}
      />
      <m.div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="relative w-full max-w-[380px] rounded-sheet bg-surface p-6 text-center outline-none"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={quick}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-amber/50">
          <span className="font-display text-2xl font-extrabold text-amber">0</span>
        </div>
        <h2 id={titleId} className="mt-5 font-display text-3xl font-bold text-fg">
          You're out of attention
        </h2>
        <p id={descId} className="mt-2 text-base text-muted">
          Your coins ran out after {postsSeen} {postsSeen === 1 ? 'post' : 'posts'}. The feed was
          still going.
        </p>
        <Button fullWidth className="mt-6" onClick={onContinue}>
          See my SQ
        </Button>
      </m.div>
    </div>,
    document.body,
  );
}
