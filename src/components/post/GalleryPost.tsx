import { useId } from 'react';
import { ActionBar } from './ActionRail';
import { Avatar, CostBadge, LockChip, LockedBody, MediaGlyph } from './PostBits';
import { mediaGradient } from './postUi';
import type { PostSkinProps } from './types';

/** Photo card with a caption, like picture-sharing apps. */
export function GalleryPost({ post, canAfford, onRead, onSkip, onFlag }: PostSkinProps) {
  const titleId = useId();
  return (
    <article aria-labelledby={titleId} className="rounded-sheet bg-surface p-3">
      <header className="flex items-center gap-3 px-1 pb-3">
        <Avatar post={post} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-fg">{post.author}</p>
          <p className="text-xs text-muted">Photo post</p>
        </div>
        <CostBadge cost={post.cost} />
      </header>
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-card-lg"
        style={mediaGradient(post.skinMedia.color)}
      >
        <MediaGlyph glyph={post.skinMedia.glyph} className="text-[120px] opacity-60 blur-[10px]" />
        <LockedBody lines={3} className="absolute inset-x-5 bottom-5" barClassName="bg-white/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <LockChip />
        </div>
      </div>
      <h2 id={titleId} className="px-1 pt-3 font-display text-xl font-bold leading-snug text-fg">
        {post.title}
      </h2>
      <div className="mt-3">
        <ActionBar
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
