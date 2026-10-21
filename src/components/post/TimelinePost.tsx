import { useId } from 'react';
import { ActionBar } from './ActionRail';
import { Avatar, CostBadge, LockChip, LockedBody } from './PostBits';
import type { PostSkinProps } from './types';

/** Text-first post in a stream, like micro-blogging apps. */
export function TimelinePost({ post, canAfford, onRead, onSkip, onFlag }: PostSkinProps) {
  const titleId = useId();
  return (
    <article aria-labelledby={titleId} className="rounded-sheet bg-surface p-5">
      <header className="flex items-center gap-3">
        <Avatar post={post} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-fg">{post.author}</p>
          <p className="text-xs text-muted">2h ago</p>
        </div>
        <CostBadge cost={post.cost} />
      </header>
      <h2 id={titleId} className="mt-4 text-xl font-bold leading-snug text-fg">
        {post.title}
      </h2>
      <div className="relative mt-4">
        <LockedBody lines={4} barClassName="bg-muted/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <LockChip />
        </div>
      </div>
      <div className="mt-5">
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
