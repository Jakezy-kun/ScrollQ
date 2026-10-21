import { useId } from 'react';
import { cn } from '@/lib/cn';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** On/off setting row: the whole row is the control. */
export function Switch({ label, description, checked, onChange, disabled = false }: SwitchProps) {
  const labelId = useId();
  const descId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={description ? descId : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-tap w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-fast hover:bg-white/5 disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span id={labelId} className="block font-semibold text-fg">
          {label}
        </span>
        {description && (
          <span id={descId} className="mt-0.5 block text-sm text-muted">
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-fast',
          checked ? 'bg-violet' : 'bg-white/20',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-fg shadow transition-transform duration-fast',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  );
}
