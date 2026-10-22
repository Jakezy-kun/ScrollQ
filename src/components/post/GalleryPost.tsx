import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { useId } from 'react';
import { ActionBar } from './ActionRail';
import { Avatar, CostBadge, LockChip, LockedBody, MediaGlyph } from './PostBits';
import { bareHandle, engagement, mediaGradient } from './postUi';
import type { PostSkinProps } from './types';

/**
 * Edge-to-edge photo post, like picture-sharing apps: ringed avatar, square photo with
 * carousel dots, the like / comment / share / save row, like count and caption.
 * The icon row is decoration; the game's own buttons sit below it.
 */
export function GalleryPost({ post, canAfford, onRead, onSkip, onFlag }: PostSkinProps) {
  const titleId = useId();
  const stats = engagement(post);
  const handle = bareHandle(post.author);
  return (
    <article aria-labelledby={titleId} className="-mx-3 pb-1">
      <header className="flex items-center gap-2.5 px-3 pb-2.5 pt-1">
        <span
          aria-hidden="true"
          className="rounded-full bg-gradient-to-tr from-violet via-mint to-violet p-[2px]"
        >
          <span className="block rounded-full bg-base p-[2px]">
            <Avatar post={post} size={32} />
          </span>
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-fg">
          {handle}
          <span aria-hidden="true" className="font-semibold">
            <span className="text-muted"> · </span>
            <span className="text-violet">Follow</span>
          </span>
        </p>
        <CostBadge cost={post.cost} />
        <MoreHorizontal aria-hidden="true" className="h-5 w-5 text-fg" />
      </header>

      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden"
        style={mediaGradient(post.skinMedia.color)}
      >
        <MediaGlyph glyph={post.skinMedia.glyph} className="text-[140px] opacity-60 blur-[10px]" />
        <LockedBody lines={3} className="absolute inset-x-5 bottom-5" barClassName="bg-white/30" />
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-fg"
        >
          1/3
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <LockChip />
        </div>
      </div>

      <div aria-hidden="true" className="relative flex items-center gap-4 px-3 pt-3 text-fg">
        <Heart className="h-6 w-6" />
        <MessageCircle className="h-6 w-6 -scale-x-100" />
        <Send className="h-6 w-6" />
        <span className="absolute left-1/2 top-[22px] flex -translate-x-1/2 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        </span>
        <Bookmark className="ml-auto h-6 w-6" />
      </div>

      <div className="px-3 pt-2.5 text-sm leading-snug">
        <p aria-hidden="true" className="font-bold text-fg">
          {stats.likes.toLocaleString('en')} likes
        </p>
        <div className="mt-1 text-fg">
          <span className="font-bold">{handle}</span>{' '}
          <h2 id={titleId} className="inline font-normal">
            {post.title}
          </h2>
        </div>
        <p aria-hidden="true" className="mt-1 text-muted">
          View all {stats.comments.toLocaleString('en')} comments
        </p>
        <p aria-hidden="true" className="mt-1 text-xs text-muted">
          {stats.hoursAgo} {stats.hoursAgo === 1 ? 'hour' : 'hours'} ago
        </p>
      </div>

      <div className="mt-3 px-3">
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
