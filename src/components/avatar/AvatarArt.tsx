import { colors } from '@/styles/tokens';
import type { AvatarDef } from './avatars';
import { findAvatar } from './avatars';

const INK = colors.deep;

function Face({ a }: { a: AvatarDef }) {
  switch (a.shape) {
    case 'squircle':
      return <rect x="13" y="15" width="38" height="38" rx="13" fill={a.face} />;
    case 'blob':
      return (
        <path
          d="M32 14c11 0 19 7 19 18 0 12-9 20-19 20S13 45 13 33c0-10 8-19 19-19z"
          fill={a.face}
        />
      );
    case 'drop':
      return <path d="M32 12c9 9 19 16 19 26a19 19 0 0 1-38 0c0-10 10-17 19-26z" fill={a.face} />;
    default:
      return <circle cx="32" cy="34" r="19" fill={a.face} />;
  }
}

function EyesArt({ eyes }: { eyes: AvatarDef['eyes'] }) {
  const common = { stroke: INK, strokeWidth: 2.5, strokeLinecap: 'round' as const, fill: 'none' };
  switch (eyes) {
    case 'happy':
      return (
        <>
          <path d="M22 32q3-4 6 0" {...common} />
          <path d="M36 32q3-4 6 0" {...common} />
        </>
      );
    case 'wide':
      return (
        <>
          <circle cx="25" cy="31" r="4.5" fill="#fff" />
          <circle cx="39" cy="31" r="4.5" fill="#fff" />
          <circle cx="26" cy="32" r="2" fill={INK} />
          <circle cx="40" cy="32" r="2" fill={INK} />
        </>
      );
    case 'wink':
      return (
        <>
          <circle cx="25" cy="31" r="2.5" fill={INK} />
          <path d="M36 31h6" {...common} />
        </>
      );
    case 'glasses':
      return (
        <>
          <circle cx="25" cy="31" r="5" {...common} />
          <circle cx="39" cy="31" r="5" {...common} />
          <path d="M30 31h4" {...common} />
          <circle cx="25" cy="31" r="1.6" fill={INK} />
          <circle cx="39" cy="31" r="1.6" fill={INK} />
        </>
      );
    default:
      return (
        <>
          <circle cx="25" cy="31" r="2.5" fill={INK} />
          <circle cx="39" cy="31" r="2.5" fill={INK} />
        </>
      );
  }
}

function MouthArt({ mouth }: { mouth: AvatarDef['mouth'] }) {
  const common = { stroke: INK, strokeWidth: 2.5, strokeLinecap: 'round' as const, fill: 'none' };
  switch (mouth) {
    case 'open':
      return <ellipse cx="32" cy="42" rx="3" ry="3.5" fill={INK} />;
    case 'flat':
      return <path d="M28 42h8" {...common} />;
    case 'grin':
      return <path d="M26 39q6 8 12 0z" fill={INK} />;
    default:
      return <path d="M27 40q5 5 10 0" {...common} />;
  }
}

function ExtraArt({ a }: { a: AvatarDef }) {
  switch (a.extra) {
    case 'antenna':
      return (
        <>
          <path d="M32 15V8" stroke={a.face} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="7" r="3" fill={colors.amber} />
        </>
      );
    case 'ears':
      return (
        <>
          <path d="M16 24l2-12 9 7z" fill={a.face} />
          <path d="M48 24l-2-12-9 7z" fill={a.face} />
        </>
      );
    case 'leaf':
      return (
        <path d="M32 15c0-5 4-8 9-8 0 5-4 8-9 8z" fill={colors.mint} stroke={INK} strokeWidth="1" />
      );
    case 'spark':
      return (
        <path
          d="M50 12l1.5 3.5L55 17l-3.5 1.5L50 22l-1.5-3.5L45 17l3.5-1.5z"
          fill="#fff"
          opacity="0.9"
        />
      );
    default:
      return null;
  }
}

/**
 * One of the built-in avatars, drawn as SVG. Falls back to the player's initial when no
 * avatar is chosen. Decorative unless `label` is given.
 */
export function AvatarArt({
  id,
  fallbackName = '',
  size = 48,
  label,
}: {
  id: string | null | undefined;
  fallbackName?: string;
  size?: number;
  label?: string;
}) {
  const a = findAvatar(id);
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  if (!a) {
    return (
      <span
        {...a11y}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-violet font-display font-bold text-fg"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {(fallbackName.trim().charAt(0) || '?').toUpperCase()}
      </span>
    );
  }

  return (
    <svg {...a11y} width={size} height={size} viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r="32" fill={a.bg} />
      <ExtraArt a={a} />
      <Face a={a} />
      <EyesArt eyes={a.eyes} />
      <MouthArt mouth={a.mouth} />
    </svg>
  );
}
