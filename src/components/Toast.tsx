import { AnimatePresence, m } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { quick } from '@/lib/motion';
import type { ToastOptions, ToastTone } from './toastContext';
import { ToastContext } from './toastContext';

interface ToastItem extends Required<Omit<ToastOptions, 'detail'>> {
  id: number;
  message: string;
  detail: string | undefined;
}

const toneStyles: Record<ToastTone, { box: string; icon: ReactNode }> = {
  neutral: {
    box: 'ring-white/10',
    icon: <Info className="h-5 w-5 shrink-0 text-violet" aria-hidden="true" />,
  },
  good: {
    box: 'ring-mint/50',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-mint" aria-hidden="true" />,
  },
  warning: {
    box: 'ring-coral/70',
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-coral" aria-hidden="true" />,
  },
};

/** Provides `useToast()`. Toasts appear at the top of the app column and are announced politely. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const reduced = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, { tone = 'neutral', detail, duration = 2500 }: ToastOptions = {}) => {
      nextId.current += 1;
      const id = nextId.current;
      // Keep at most two on screen; newest last.
      setItems((list) => [...list.slice(-1), { id, message, detail, tone, duration }]);
      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-40 mx-auto flex w-full max-w-app flex-col gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <m.div
              key={t.id}
              layout={!reduced}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
              transition={quick}
              className={cn(
                'flex items-start gap-3 rounded-card bg-surface-2 px-4 py-3 text-fg shadow-lg ring-1',
                toneStyles[t.tone].box,
              )}
            >
              {toneStyles[t.tone].icon}
              <div>
                <p className="font-semibold leading-snug">{t.message}</p>
                {t.detail && <p className="mt-0.5 text-sm text-muted">{t.detail}</p>}
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
