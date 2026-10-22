import { Music2, Plus } from 'lucide-react';
import { useId } from 'react';
import { ActionRail } from './ActionRail';
import { Avatar, CostBadge, LockChip, LockedBody, MediaGlyph } from './PostBits';
import { bareHandle, engagement, mediaGradient } from './postUi';
import type { PostSkinProps } from './types';

const shadow = '[text-shadow:0_1px_3px_rgba(0,0,0,0.6)]';

/**
 * Full-screen post, one at a time, like short-video apps: feed tabs on top, an icon rail
 * on the right, the handle, caption and sound line bottom-left, and a playback bar.
 */
export function VerticalPost({ post, canAfford, onRead, onSkip, onFlag }: PostSkinProps) {
  const titleId = useId();
  const { hoursAgo } = engagement(post);
  return (
    <article
      aria-labelledby={titleId}
      className="relative min-h-[460px] w-full flex-1 overflow-hidden rounded-card"
      style={mediaGradient(post.skinMedia.color)}
    >
      <MediaGlyph
        glyph={post.skinMedia.glyph}
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 text-[200px] opacity-25 blur-[3px]"
      />
      <LockedBody lines={6} className="absolute inset-x-6 top-24" barClassName="bg-white/30" />

      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 flex items-center justify-center gap-5 bg-gradient-to-b from-black/45 to-black/0 pb-8 pt-3 text-[15px] ${shadow}`}
      >
        <span className="font-semibold text-white/70">Following</span>
        <span className="relative font-bold text-fg">
          For you
          <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-fg" />
        </span>
      </div>
      <div className="absolute left-3 top-3">
        <CostBadge cost={post.cost} />
      </div>
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
        <LockChip />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/45 to-black/0 pt-24">
        <div className="flex items-end gap-2 pb-4 pl-4 pr-1">
          <div className={`min-w-0 flex-1 pb-1 ${shadow}`}>
            <p className="text-[15px] font-bold text-fg">
              {post.author}
              <span className="font-normal text-white/75" aria-hidden="true">
                {' '}
                · {hoursAgo}h ago
              </span>
            </p>
            <h2 id={titleId} className="mt-1.5 text-[17px] font-semibold leading-snug text-fg">
              {post.title}
            </h2>
            <p
              aria-hidden="true"
              className="mt-2.5 flex items-center gap-1.5 truncate text-[13px] text-white/85"
            >
              <Music2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">original sound · {bareHandle(post.author)}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span aria-hidden="true" className="relative mb-2">
              <span className="block rounded-full ring-2 ring-fg">
                <Avatar post={post} size={44} />
              </span>
              <span className="absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-coral text-deep">
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            </span>
            <ActionRail
              cost={post.cost}
              canAfford={canAfford}
              onRead={onRead}
              onSkip={onSkip}
              onFlag={onFlag}
            />
            <span
              aria-hidden="true"
              className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[conic-gradient(#222_0deg,#555_90deg,#222_180deg,#555_270deg,#222_360deg)] ring-[6px] ring-black/60 motion-safe:animate-[spin_6s_linear_infinite]"
            >
              <span
                className="block h-5 w-5 rounded-full"
                style={mediaGradient(post.skinMedia.color)}
              />
            </span>
          </div>
        </div>
        <div aria-hidden="true" className="h-0.5 bg-white/20">
          <div className="h-full w-[28%] bg-white/80" />
        </div>
      </div>
    </article>
  );
}
