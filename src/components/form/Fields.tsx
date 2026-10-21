import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId, useState } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

const inputClass =
  'h-14 w-full rounded-card bg-surface px-4 text-base text-fg ring-1 ring-white/10 transition-shadow duration-fast placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-violet aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-coral read-only:opacity-70';

function describedBy(...ids: Array<string | false | undefined>) {
  const list = ids.filter(Boolean).join(' ');
  return list || undefined;
}

/** Labeled text input with inline error and hint, ready for react-hook-form's register(). */
export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block font-semibold text-fg">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(error && errorId, hint !== undefined && hintId)}
        className={inputClass}
        {...rest}
      />
      {hint !== undefined && (
        <div id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </div>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
});

/** Password input with a show/hide toggle. */
export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, 'type'>>(
  function PasswordField({ label, error, hint, className, id, ...rest }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const [visible, setVisible] = useState(false);
    return (
      <div className={className}>
        <label htmlFor={inputId} className="mb-1.5 block font-semibold text-fg">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(error && errorId, hint !== undefined && hintId)}
            className={cn(inputClass, 'pr-14')}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-1 my-auto flex h-12 w-12 items-center justify-center rounded-full text-muted transition-colors duration-fast hover:text-fg"
          >
            {visible ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {hint !== undefined && (
          <div id={hintId} className="mt-1.5 text-sm text-muted">
            {hint}
          </div>
        )}
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxProps>(function CheckboxField(
  { label, error, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded accent-violet"
          {...rest}
        />
        <label htmlFor={inputId} className="cursor-pointer text-sm leading-relaxed text-fg">
          {label}
        </label>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
});

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-coral">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Form-level error or notice, announced when it appears. */
export function FormMessage({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'info' | 'success';
  children: ReactNode;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-card p-3 text-sm leading-relaxed ring-1',
        tone === 'error' && 'bg-coral/10 text-fg ring-coral/50',
        tone === 'info' && 'bg-violet/15 text-fg ring-violet/40',
        tone === 'success' && 'bg-mint/10 text-fg ring-mint/50',
      )}
    >
      {children}
    </div>
  );
}
