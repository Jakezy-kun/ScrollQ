import { cn } from '@/lib/cn';

export function CoinIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <circle cx="12" cy="12" r="11" fill="#FFB703" />
      <circle cx="12" cy="12" r="7.6" fill="none" stroke="#C98700" strokeWidth="1.6" />
      <path
        d="M10.2 8.6 h3.6 M12 8.6 v6.8 M10.2 15.4 h3.6"
        stroke="#C98700"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
