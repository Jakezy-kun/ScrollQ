import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { colors } from '@/styles/tokens';

/**
 * Animated vector illustrations for the desktop welcome and account screens. Each loops
 * every 3 seconds with CSS keyframes (styles/index.css, `ill-*`). With reduced motion the
 * animations stop and every element rests in its normal, readable position.
 * All are decorative: callers render them inside aria-hidden containers.
 */

const svgProps = {
  viewBox: '0 0 320 320',
  'aria-hidden': true,
  focusable: false,
} as const;

const art = 'h-auto w-full max-w-[27rem]';

/** The app's coin, drawn at any size inside an SVG. */
function Coin({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g transform={`translate(${cx - r} ${cy - r}) scale(${r / 12})`}>
      <circle cx="12" cy="12" r="11" fill={colors.amber} />
      <circle cx="12" cy="12" r="7.6" fill="none" stroke="#C98700" strokeWidth="1.6" />
      <path
        d="M10.2 8.6 h3.6 M12 8.6 v6.8 M10.2 15.4 h3.6"
        stroke="#C98700"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

/** 100 coins of attention, with small coins flying off as they get spent. */
export function CoinBudgetArt({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={cn(art, className)}>
      <defs>
        <radialGradient id="ill-coin-glow">
          <stop offset="0%" stopColor={colors.amber} stopOpacity="0.28" />
          <stop offset="100%" stopColor={colors.amber} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="135" r="120" fill="url(#ill-coin-glow)" />
      {[0, 1, 2].map((i) => (
        <g key={i} className="ill-spend" style={delay(i)}>
          <Coin cx={196} cy={112} r={14} />
        </g>
      ))}
      <g className="ill-float">
        <Coin cx={160} cy={135} r={64} />
      </g>
      <text
        x="160"
        y="262"
        textAnchor="middle"
        className="font-display"
        fontSize="54"
        fontWeight="800"
        fill={colors.amber}
      >
        100
      </text>
    </svg>
  );
}

/** A locked post: the lock lifts, the price is paid, and the idle meter keeps filling. */
export function PostPriceArt({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={cn(art, className)}>
      <rect
        x="56"
        y="36"
        width="208"
        height="248"
        rx="24"
        fill={colors.surface}
        stroke="#FFFFFF"
        strokeOpacity="0.06"
      />
      <circle cx="86" cy="68" r="13" fill={colors.violet} fillOpacity="0.75" />
      <rect x="108" y="62" width="70" height="9" rx="4.5" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="194" y="56" width="54" height="26" rx="13" fill={colors.deep} />
      <Coin cx={210} cy={69} r={7.5} />
      <text x="230" y="74.5" fontSize="14" fontWeight="800" fill={colors.amber}>
        5
      </text>
      <text
        x="222"
        y="50"
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fill={colors.coral}
        className="ill-rise"
      >
        −5
      </text>
      <rect x="74" y="94" width="172" height="100" rx="16" fill={colors['surface-2']} />
      <path
        className="ill-unlock"
        d="M152 140 v-9 a8 8 0 0 1 16 0 v9"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="145" y="139" width="30" height="24" rx="6" fill="#FFFFFF" />
      <rect
        className="ill-reveal"
        x="74"
        y="208"
        width="156"
        height="9"
        rx="4.5"
        fill="#FFFFFF"
        fillOpacity="0.5"
      />
      <rect x="74" y="225" width="112" height="9" rx="4.5" fill="#FFFFFF" fillOpacity="0.3" />
      <rect x="74" y="254" width="172" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.12" />
      <rect
        className="ill-meter"
        x="74"
        y="254"
        width="172"
        height="10"
        rx="5"
        fill={colors.coral}
      />
    </svg>
  );
}

const RING_R = 86;
const RING_LENGTH = 2 * Math.PI * RING_R;

/** The SQ ring drawing itself in to 86. */
export function ScoreRevealArt({ className }: { className?: string }) {
  const target = RING_LENGTH * (1 - 0.86);
  return (
    <svg {...svgProps} className={cn(art, className)}>
      <circle
        cx="160"
        cy="152"
        r={RING_R}
        fill="none"
        stroke={colors['surface-2']}
        strokeWidth="18"
      />
      <circle
        className="ill-ring"
        cx="160"
        cy="152"
        r={RING_R}
        fill="none"
        stroke={colors.mint}
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={target}
        transform="rotate(-90 160 152)"
        style={{ '--ill-full': `${RING_LENGTH}px`, '--ill-target': `${target}px` } as CSSProperties}
      />
      <text
        x="160"
        y="170"
        textAnchor="middle"
        className="font-display"
        fontSize="60"
        fontWeight="800"
        fill="#FFFFFF"
      >
        86
      </text>
      <text
        x="160"
        y="198"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        letterSpacing="3"
        fill={colors.muted}
      >
        SQ
      </text>
      {[
        [62, 70, 0],
        [262, 96, 0.8],
        [252, 258, 1.6],
        [70, 236, 2.2],
      ].map(([x, y, d]) => (
        <path
          key={`${x}-${y}`}
          className="ill-twinkle"
          style={delay(d as number)}
          d={`M${x} ${(y as number) - 10} L${(x as number) + 3} ${(y as number) - 3} L${(x as number) + 10} ${y} L${(x as number) + 3} ${(y as number) + 3} L${x} ${(y as number) + 10} L${(x as number) - 3} ${(y as number) + 3} L${(x as number) - 10} ${y} L${(x as number) - 3} ${(y as number) - 3} Z`}
          fill={colors.amber}
        />
      ))}
    </svg>
  );
}

const FEED_CARDS = [colors.mint, colors.coral, colors['surface-2'], colors.amber];
const CARD_STEP = 66;

/** A phone with an endless feed: good posts, flagged traps and locked ones scroll past. */
export function FeedLoopArt({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={cn(art, className)}>
      <defs>
        <clipPath id="ill-phone-screen">
          <rect x="103" y="30" width="114" height="260" rx="18" />
        </clipPath>
      </defs>
      <rect
        x="95"
        y="18"
        width="130"
        height="284"
        rx="26"
        fill={colors.deep}
        stroke={colors['surface-2']}
        strokeWidth="4"
      />
      <g clipPath="url(#ill-phone-screen)">
        <g className="ill-scroll">
          {[...FEED_CARDS, ...FEED_CARDS].map((tone, i) => {
            const y = 40 + i * CARD_STEP;
            return (
              <g key={i}>
                <rect x="111" y={y} width="98" height="56" rx="12" fill={colors.surface} />
                <circle cx="128" cy={y + 28} r="10" fill={tone} fillOpacity="0.85" />
                <rect
                  x="144"
                  y={y + 18}
                  width="54"
                  height="7"
                  rx="3.5"
                  fill="#FFFFFF"
                  fillOpacity="0.6"
                />
                <rect
                  x="144"
                  y={y + 31}
                  width="36"
                  height="7"
                  rx="3.5"
                  fill="#FFFFFF"
                  fillOpacity="0.3"
                />
              </g>
            );
          })}
        </g>
      </g>
      <rect x="140" y="26" width="40" height="6" rx="3" fill={colors['surface-2']} />
    </svg>
  );
}

/** SQ over several rounds: one left-to-right sweep reveals the line and its points together. */
export function TrendLineArt({ className }: { className?: string }) {
  const points: [number, number][] = [
    [58, 214],
    [98, 188],
    [138, 198],
    [178, 152],
    [218, 138],
    [258, 98],
  ];
  return (
    <svg {...svgProps} className={cn(art, className)}>
      <defs>
        <clipPath id="ill-trend-reveal">
          <rect className="ill-wipe" x="44" y="80" width="232" height="150" />
        </clipPath>
      </defs>
      <rect x="28" y="48" width="264" height="214" rx="24" fill={colors.surface} />
      {[110, 160, 210].map((y) => (
        <line key={y} x1="48" x2="272" y1={y} y2={y} stroke="#FFFFFF" strokeOpacity="0.07" />
      ))}
      <g clipPath="url(#ill-trend-reveal)">
        <path
          d={`M${points.map(([x, y]) => `${x} ${y}`).join(' L')}`}
          fill="none"
          stroke={colors.mint}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y]) => (
          <circle
            key={x}
            cx={x}
            cy={y}
            r="7"
            fill={colors.base}
            stroke={colors.mint}
            strokeWidth="4"
          />
        ))}
      </g>
      <rect x="196" y="62" width="76" height="30" rx="15" fill={colors.mint} fillOpacity="0.18" />
      <text x="234" y="82" textAnchor="middle" fontSize="15" fontWeight="800" fill={colors.mint}>
        SQ 86
      </text>
      <text x="48" y="246" fontSize="12" fontWeight="600" fill={colors.muted}>
        Your rounds
      </text>
    </svg>
  );
}
