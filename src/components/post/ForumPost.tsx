import { ArrowBigDown, ArrowBigUp, MessageSquare, MoreHorizontal, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { ActionBar } from './ActionRail';
import { CostBadge, LockChip, LockedBody } from './PostBits';
import { communityOf, compactCount, engagement, mediaGradient } from './postUi';
import type { PostSkinProps } from './types';

/**
 * Post inside a topic community, like discussion-board apps: community and age on top,
 * a bold title, a text preview, and the vote / comments / share pills. The pills are
 * decoration; the game's own buttons sit below them.
 */
export function ForumPost({ post, canAfford, onRead, onSkip, onFlag }: PostSkinProps) {
  const titleId = useId();
  const stats = engagement(post);
  return (
    <article aria-labelledby={titleId} className="rounded-card-lg bg-surface p-4">
      <header className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
          style={mediaGradient(post.skinMedia.color)}
        >
          {post.skinMedia.glyph}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-bold text-fg">
            c/{communityOf(post)}
            <span aria-hidden="true" className="font-normal text-muted">
              {' '}
              · {stats.hoursAgo}h
            </span>
          </p>
          <p className="truncate text-xs text-muted">{post.author}</p>
        </div>
        <span
          aria-hidden="true"
          className="rounded-full bg-violet px-3 py-1 text-xs font-bold text-fg"
        >
          Join
        </span>
        <MoreHorizontal aria-hidden="true" className="h-5 w-5 shrink-0 text-muted" />
      </header>

      <h2 id={titleId} className="mt-3 text-lg font-bold leading-snug text-fg">
        {post.title}
      </h2>

      <div className="relative mt-2">
        <LockedBody lines={3} barClassName="bg-muted/35" />
        <div className="absolute inset-0 flex items-center justify-center">
          <LockChip />
        </div>
      </div>

      <div aria-hidden="true" className="mt-4 flex items-center gap-2 text-xs font-bold text-fg">
        <Pill>
          <ArrowBigUp className="h-5 w-5" />
          {compactCount(stats.likes)}
          <ArrowBigDown className="h-5 w-5" />
        </Pill>
        <Pill>
          <MessageSquare className="h-4 w-4" />
          {compactCount(stats.comments)}
        </Pill>
        <Pill>
          <Share2 className="h-4 w-4" />
          Share
        </Pill>
        <CostBadge cost={post.cost} className="ml-auto" />
      </div>

      <div className="mt-4">
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

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-2.5">
      {children}
    </span>
  );
}
