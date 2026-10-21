import type { KeyboardEvent, PointerEvent } from 'react';
import { useId, useMemo, useRef, useState } from 'react';
import { GAME_CONFIG, sqLabel } from '@/engine';
import type { RoundRecord } from '@/lib/rounds/record';
import { colors } from '@/styles/tokens';

const W = 340;
const H = 168;
const PAD = { top: 14, right: 16, bottom: 26, left: 30 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
/** Show the most recent rounds only; the list below has all of them. */
const MAX_POINTS = 20;

const THRESHOLDS = GAME_CONFIG.labels.filter((l) => l.min > 0).map((l) => l.min);
const Y_TICKS = [0, ...THRESHOLDS, 100].sort((a, b) => a - b);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** SQ over rounds (oldest → newest). Single series: no legend; the title names it. */
export function SqChart({ rounds }: { rounds: readonly RoundRecord[] }) {
  const titleId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const points = useMemo(() => {
    const chronological = [...rounds].reverse().slice(-MAX_POINTS);
    const offset = Math.max(0, rounds.length - MAX_POINTS);
    const n = chronological.length;
    return chronological.map((r, i) => ({
      record: r,
      number: offset + i + 1,
      x: PAD.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W),
      y: PAD.top + PLOT_H - (r.sq / 100) * PLOT_H,
    }));
  }, [rounds]);
  const [active, setActive] = useState<number | null>(null);

  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;

  const yFor = (v: number) => PAD.top + PLOT_H - (v / 100) * PLOT_H;
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const shown = active !== null ? (points[active] ?? null) : null;

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const x = ((e.clientX - box.left) / box.width) * W;
    let nearest = 0;
    points.forEach((p, i) => {
      if (Math.abs(p.x - x) < Math.abs((points[nearest]?.x ?? 0) - x)) nearest = i;
    });
    setActive(nearest);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const current = active ?? points.length - 1;
    const next =
      e.key === 'ArrowLeft' ? Math.max(0, current - 1) : Math.min(points.length - 1, current + 1);
    setActive(next);
  };

  const focused = shown ?? last;
  const trend =
    points.length > 1
      ? `From ${first.record.sq} in round ${first.number} to ${last.record.sq} in round ${last.number}.`
      : `One round so far: SQ ${last.record.sq}.`;

  return (
    <figure className="relative">
      <figcaption id={titleId} className="sr-only">
        SQ over your last {points.length} rounds. {trend}
      </figcaption>
      {/* Keyboard and screen readers scrub through rounds like a slider; the list below is the full data. */}
      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={titleId}
        aria-valuemin={first.number}
        aria-valuemax={last.number}
        aria-valuenow={focused.number}
        aria-valuetext={`Round ${focused.number}: SQ ${focused.record.sq}, ${sqLabel(focused.record.sq).label}`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="rounded-card"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-pan-y overflow-visible"
          aria-hidden="true"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          {/* Recessive grid: label thresholds plus 0 and 100. */}
          {Y_TICKS.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yFor(v)}
                y2={yFor(v)}
                stroke="rgb(255 255 255 / 0.1)"
                strokeDasharray={THRESHOLDS.includes(v) ? '3 4' : undefined}
                strokeWidth={1}
              />
              {/* 100 sits too close to 85 to label; its gridline is enough. */}
              {v < 100 && (
                <text
                  x={PAD.left - 8}
                  y={yFor(v)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize="10"
                  fill={colors.muted}
                >
                  {v}
                </text>
              )}
            </g>
          ))}

          <text
            x={first.x}
            y={H - 6}
            fontSize="10"
            fill={colors.muted}
            textAnchor={points.length > 1 ? 'start' : 'middle'}
          >
            Round {first.number}
          </text>
          {points.length > 1 && (
            <text x={last.x} y={H - 6} fontSize="10" fill={colors.muted} textAnchor="end">
              Round {last.number}
            </text>
          )}

          {shown && (
            <line
              x1={shown.x}
              x2={shown.x}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="rgb(255 255 255 / 0.25)"
              strokeWidth={1}
            />
          )}

          <path
            d={path}
            fill="none"
            stroke={colors.violet}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => (
            <circle
              key={p.record.id}
              cx={p.x}
              cy={p.y}
              r={i === active ? 5.5 : 4}
              fill={colors.violet}
              stroke={colors.base}
              strokeWidth={2}
            />
          ))}

          {/* Direct label on the latest point only. */}
          {!shown && (
            <text
              x={last.x}
              y={last.y - 10}
              textAnchor={points.length > 1 ? 'end' : 'middle'}
              fontSize="11"
              fontWeight="700"
              fill={colors.fg}
            >
              {last.record.sq}
            </text>
          )}
        </svg>
      </div>

      {shown && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 whitespace-nowrap rounded-card bg-surface-2 px-3 py-2 text-xs shadow-lg ring-1 ring-white/10"
          style={{
            left: `${(shown.x / W) * 100}%`,
            transform: `translateX(${shown.x > W / 2 ? 'calc(-100% - 8px)' : '8px'})`,
          }}
        >
          <p className="font-bold text-fg">
            Round {shown.number} · SQ {shown.record.sq}
          </p>
          <p className="text-muted">
            {sqLabel(shown.record.sq).label} · {formatDate(shown.record.createdAt)}
          </p>
        </div>
      )}
    </figure>
  );
}
