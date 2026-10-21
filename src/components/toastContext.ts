import { createContext, useContext } from 'react';

export type ToastTone = 'neutral' | 'good' | 'warning';

export interface ToastOptions {
  tone?: ToastTone;
  /** Optional second line. */
  detail?: string;
  /** ms before it disappears; default 2500. */
  duration?: number;
}

export interface ToastApi {
  show: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
