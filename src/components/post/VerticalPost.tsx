import { useId } from 'react';
import { ActionRail } from './ActionRail';
import { CostBadge, LockChip, LockedBody, MediaGlyph } from './PostBits';
import { mediaGradient } from './postUi';
import type { PostSkinProps } from './types';

/** Full-screen post, one at a time, like short-video apps. */
export function VerticalPost({ post, canAfford, onRead, onSkip, onFlag }: PostSkinProps) {
  const titleId = useId();
  return (
    <article
      aria-labelledby={titleId}
      className="relative min-h-[460px] w-full flex-1 overflow-hidden rounded-sheet"
      style={mediaGradient(post.skinMedia.color)}
    >
      <MediaGlyph
        glyph={post.skinMedia.glyph}
        className="absolute -right-6 top-10 text-[180px] opacity-20 blur-[2px]"
      />
      <LockedBody lines={6} className="absolute inset-x-6 top-20" barClassName="bg-white/35" />
      <div className="absolute left-4 top-4">
        <CostBadge cost={post.cost} />
      </div>
      <div className="absolute left-1/2 top-[34%] -translate-x-1/2">
        <LockChip />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-gradient-to-t from-deep/95 via-deep/80 to-deep/0 p-4 pb-5 pt-10">
        <div className="min-w-0 flex-1 pb-1">
          <p className="text-sm font-semibold text-muted">{post.author}</p>
          <h2
            id={titleId}
            className="mt-1 font-display text-[26px] font-bold leading-[1.15] text-fg"
          >
            {post.title}
          </h2>
        </div>
        <ActionRail
          cost={post.cost}
          canAfford={canAfford}
          onRead={onRead}
          onSkip={onSkip}
          onFlag={onFlag}
        />
      </div>
    </article>
  );
}
