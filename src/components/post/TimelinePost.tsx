import { BarChart2, Bookmark, Heart, MessageCircle, MoreHorizontal, Repeat2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { ActionBar } from './ActionRail';
import { Avatar, CostBadge, LockChip, LockedBody } from './PostBits';
import { compactCount, displayName, engagement } from './postUi';
import type { PostSkinProps } from './types';

/**
 * Text-first post in a stream, like micro-blogging apps: avatar column, display name,
 * @handle and age on one line, the post text, a bordered preview card, and the
 * reply / repost / like / views row. The metrics row is decoration.
 */
export function TimelinePost({ post, canAfford, onRead, onSkip, onFlag }: PostSkinProps) {
  const titleId = useId();
  const stats = engagement(post);
  const metrics: [LucideIcon, number][] = [
    [MessageCircle, stats.comments],
    [Repeat2, stats.shares],
    [Heart, stats.likes],
    [BarChart2, stats.views],
  ];
  return (
    <article aria-labelledby={titleId} className="-mx-3 border-y border-white/10 px-4 py-3">
      <div className="flex gap-3">
        <Avatar post={post} size={40} />
        <div className="min-w-0 flex-1">
          <header className="flex items-center gap-1 text-[15px]">
            <span className="truncate font-bold text-fg">{displayName(post.author)}</span>
            <span className="min-w-0 truncate text-muted">
              {post.author}
              <span aria-hidden="true"> · {stats.hoursAgo}h</span>
            </span>
            <MoreHorizontal aria-hidden="true" className="ml-auto h-5 w-5 shrink-0 text-muted" />
          </header>
          <h2 id={titleId} className="mt-0.5 text-[15px] font-normal leading-snug text-fg">
            {post.title}
          </h2>

          <div className="relative mt-3 overflow-hidden rounded-card border border-white/15 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Full post</span>
              <CostBadge cost={post.cost} />
            </div>
            <LockedBody lines={4} barClassName="bg-muted/40" />
            <div className="absolute inset-x-0 bottom-0 top-10 flex items-center justify-center">
              <LockChip />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="mt-3 flex items-center justify-between pr-1 text-[13px] text-muted"
          >
            {metrics.map(([Icon, n], i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Icon className="h-[18px] w-[18px]" />
                {compactCount(n)}
              </span>
            ))}
            <Bookmark className="h-[18px] w-[18px]" />
          </div>
        </div>
      </div>
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
