import { AnimatePresence, m, useIsPresent } from 'framer-motion';
import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '@/hooks/useModal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { fast, sheet } from '@/lib/motion';

export interface BottomSheetProps {
  open: boolean;
  /** Called on Esc, backdrop tap, or any cancel action. */
  onClose: () => void;
  /** id of the element that names the dialog (usually its heading). */
  labelledBy: string;
  describedBy?: string;
  /** Element to focus when the sheet opens; defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
}

/** A modal bottom sheet: focus trap, Esc to cancel, scroll lock, focus returns to the trigger. */
export function BottomSheet({
  open,
  onClose,
  labelledBy,
  describedBy,
  initialFocusRef,
  children,
  className,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(open, panelRef, onClose, initialFocusRef);

  return createPortal(
    <AnimatePresence>
      {open && (
        <SheetLayer
          key="sheet"
          panelRef={panelRef}
          onClose={onClose}
          labelledBy={labelledBy}
          describedBy={describedBy}
          className={className}
        >
          {children}
        </SheetLayer>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface SheetLayerProps {
  panelRef: RefObject<HTMLDivElement>;
  onClose: () => void;
  labelledBy: string;
  describedBy: string | undefined;
  className: string | undefined;
  children: ReactNode;
}

function SheetLayer({
  panelRef,
  onClose,
  labelledBy,
  describedBy,
  className,
  children,
}: SheetLayerProps) {
  const reduced = useReducedMotion();
  // While exiting, let taps fall through to the page underneath.
  const isPresent = useIsPresent();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ pointerEvents: isPresent ? undefined : 'none' }}
    >
      <m.button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fast}
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-app rounded-t-sheet bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 outline-none',
          className,
        )}
        initial={reduced ? { opacity: 0 } : { y: '100%' }}
        animate={reduced ? { opacity: 1 } : { y: 0 }}
        exit={reduced ? { opacity: 0 } : { y: '100%' }}
        transition={reduced ? fast : sheet}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-white/20" aria-hidden="true" />
        {children}
      </m.div>
    </div>
  );
}
