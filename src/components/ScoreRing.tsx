import { m } from 'framer-motion';
import type { Tone } from '@/engine';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors } from '@/styles/tokens';

const TONE_COLOR: Record<Tone, string> = {
  mint: colors.mint,
  amber: colors.amber,
  coral: colors.coral,
};

/** SQ ring gauge, 0–100. */
export function ScoreRing({
  value,
  tone,
  size = 168,
  caption = 'SQ',
}: {
  value: number;
  tone: Tone;
  size?: number;
  caption?: string;
}) {
  const reduced = useReducedMotion();
  const stroke = Math.round(size * 0.09);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${caption} ${value} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(255 255 255 / 0.1)"
          strokeWidth={stroke}
        />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_COLOR[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduced ? circumference * (1 - pct) : circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: reduced ? 0 : 0.9, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        <span
          className="font-display font-extrabold tabular-nums leading-none"
          style={{ fontSize: size * 0.3 }}
        >
          {value}
        </span>
        <span className="mt-1 text-xs font-bold uppercase tracking-widest text-muted">
          {caption}
        </span>
      </div>
    </div>
  );
}
