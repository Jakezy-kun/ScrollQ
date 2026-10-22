import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Left half of the desktop split screens (welcome, log in, sign up): a dark panel with a
 * soft violet and amber glow that holds the illustrations.
 */
export function SplitPanel({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn(
        'flex min-h-dvh flex-col items-center justify-center overflow-hidden border-r border-white/5 bg-deep px-12 py-10',
        'bg-[radial-gradient(circle_at_30%_25%,rgba(123,97,255,0.22),transparent_60%),radial-gradient(circle_at_75%_80%,rgba(255,183,3,0.10),transparent_55%)]',
        className,
      )}
      {...rest}
    >
      {children}
    </aside>
  );
}
