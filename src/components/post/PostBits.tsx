import { Lock } from 'lucide-react';
import type { Post } from '@/engine';
import { cn } from '@/lib/cn';
import { CoinIcon } from '../CoinIcon';
import { mediaGradient } from './postUi';

export function Avatar({ post, size = 40 }: { post: Post; size?: number }) {
  const initial = post.author.replace('@', '').charAt(0).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-fg ring-2 ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        ...mediaGradient(post.skinMedia.color),
      }}
    >
      {initial}
    </span>
  );
}

export function CostBadge({ cost, className }: { cost: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-sm font-bold tabular-nums text-amber',
        className,
      )}
    >
      <CoinIcon size={14} />
      {cost}
      <span className="sr-only"> coins to open</span>
    </span>
  );
}

export function LockChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-deep/85 px-3 py-1.5 text-sm font-semibold text-fg ring-1 ring-white/10',
        className,
      )}
    >
      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      Open to read
    </span>
  );
}

const LINE_WIDTHS = ['92%', '78%', '86%', '64%', '88%', '72%', '81%', '55%'];

/**
 * Stand-in for an unopened post body: blurred placeholder bars, never the real text,
 * so screen readers, copy-paste and dev tools can't reveal it for free.
 */
export function LockedBody({
  lines = 4,
  className,
  barClassName = 'bg-white/45',
}: {
  lines?: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div aria-hidden="true" className={cn('select-none space-y-2.5 blur-[3px]', className)}>
      {LINE_WIDTHS.slice(0, lines).map((w, i) => (
        <span key={i} className={cn('block h-3 rounded-full', barClassName)} style={{ width: w }} />
      ))}
    </div>
  );
}

/** Big faint glyph used as illustration on media areas. */
export function MediaGlyph({ glyph, className }: { glyph: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none select-none leading-none', className)}
    >
      {glyph}
    </span>
  );
}
