import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'violet' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-coral text-fg hover:bg-[#ff3a5e]',
  secondary: 'bg-surface text-fg ring-1 ring-white/10 hover:bg-surface-2',
  violet: 'bg-violet text-fg hover:bg-[#6c50ff]',
  ghost: 'bg-transparent text-muted hover:bg-white/5 hover:text-fg',
  danger: 'bg-transparent text-coral ring-1 ring-coral/60 hover:bg-coral/10',
};

// Labels are always 19px bold, so white on coral/violet counts as large text and meets
// WCAG AA (coral and violet reach 3:1 with white, not 4.5:1).
const sizes: Record<ButtonSize, string> = {
  md: 'min-h-tap h-12 px-5 text-[19px]',
  lg: 'h-14 px-6 text-[19px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'lg',
    fullWidth = false,
    loading = false,
    icon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-card font-display font-bold',
        'transition-[transform,background-color,opacity] duration-fast ease-out active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});
