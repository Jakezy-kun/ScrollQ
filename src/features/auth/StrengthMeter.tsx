import { cn } from '@/lib/cn';
import { passwordStrength } from './schemas';

const BAR = ['bg-coral', 'bg-amber', 'bg-mint'] as const;

/** Strength hint shown under a new password. */
export function StrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  return (
    <span className="flex items-center gap-2">
      <span className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn('h-1.5 flex-1 rounded-full', n <= score ? BAR[score - 1] : 'bg-white/10')}
          />
        ))}
      </span>
      <span className="w-40 text-right">
        {label ? `Strength: ${label}` : 'At least 8 characters, letters and numbers'}
      </span>
    </span>
  );
}
