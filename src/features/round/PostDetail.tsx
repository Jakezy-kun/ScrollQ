import { AnimatePresence, m, useIsPresent } from 'framer-motion';
import { ChevronLeft, Pause } from 'lucide-react';
import type { RefObject } from 'react';
import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/Button';
import { CoinCounter } from '@/components/CoinCounter';
import { CoinIcon } from '@/components/CoinIcon';
import { Avatar, MediaGlyph, mediaGradient } from '@/components/post';
import type { Post, Rating } from '@/engine';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useModal } from '@/hooks/useModal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { fast, sheet } from '@/lib/motion';

interface PostDetailProps {
  /** The opened (paid-for) post, or null when closed. */
  post: Post | null;
  coins: number;
  announcement: { key: number; text: string } | null;
  onBack: () => void;
  /** Live mode: ask "Was it worth your coins?". */
  rating?: LiveRating;
}

export interface LiveRating {
  value: Rating | null;
  onRate: (worth: boolean) => void;
}

/** Full-screen view of an opened post. Its body only enters the DOM here, after paying. */
export function PostDetail({ post, coins, announcement, onBack, rating }: PostDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(post !== null, panelRef, onBack);

  return createPortal(
    <AnimatePresence>
      {post && (
        <DetailPanel
          key={post.id}
          panelRef={panelRef}
          post={post}
          coins={coins}
          announcement={announcement}
          onBack={onBack}
          rating={rating}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function DetailPanel({
  panelRef,
  post,
  coins,
  announcement,
  onBack,
  rating,
}: PostDetailProps & { post: Post; panelRef: RefObject<HTMLDivElement> }) {
  const reduced = useReducedMotion();
  // Phones: slides in full-screen. Laptops and PCs: a centered reading panel over the feed.
  const desktop = useIsDesktop();
  const isPresent = useIsPresent();
  const titleId = useId();
  const hidden = reduced
    ? { opacity: 0 }
    : desktop
      ? { opacity: 0, scale: 0.97, y: 12 }
      : { x: '100%' };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-hidden lg:items-center lg:p-6"
      style={{ pointerEvents: isPresent ? undefined : 'none' }}
    >
      <m.button
        type="button"
        tabIndex={-1}
        aria-label="Back to feed"
        onClick={onBack}
        className="absolute inset-0 hidden cursor-default bg-black/60 lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fast}
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-app flex-col bg-base outline-none lg:h-[min(100%,56rem)] lg:max-w-2xl lg:overflow-hidden lg:rounded-sheet lg:shadow-2xl lg:ring-1 lg:ring-white/10"
        initial={hidden}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={hidden}
        transition={reduced || desktop ? fast : sheet}
      >
        <header className="flex items-center justify-between border-b border-white/5 px-3 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-tap items-center gap-1 rounded-full pl-1 pr-4 font-semibold text-fg transition-colors duration-fast hover:bg-white/5"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            Back to feed
          </button>
          <CoinCounter coins={coins} announcement={announcement} />
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
          <div
            className="relative flex h-32 items-center justify-center overflow-hidden rounded-sheet"
            style={mediaGradient(post.skinMedia.color)}
          >
            <MediaGlyph glyph={post.skinMedia.glyph} className="text-[72px]" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Avatar post={post} size={40} />
            <div>
              <p className="font-bold text-fg">{post.author}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                Opened for <CoinIcon size={12} /> {post.cost}
              </p>
            </div>
          </div>
          <h1
            id={titleId}
            className="mt-4 font-display text-[28px] font-bold leading-tight text-fg"
          >
            {post.title}
          </h1>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-fg/90">
            {post.body.split('\n\n').map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
          {rating && <WorthIt rating={rating} />}
          <p className="mt-8 flex items-center gap-2 text-sm text-muted">
            <Pause className="h-4 w-4" aria-hidden="true" />
            Idle drain is paused while you read.
          </p>
        </div>

        <div className="border-t border-white/5 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button fullWidth variant="violet" onClick={onBack}>
            Back to feed
          </Button>
        </div>
      </m.div>
    </div>
  );
}

function WorthIt({ rating }: { rating: LiveRating }) {
  const options = [
    { worth: true, label: 'Yes, worth it', value: 'worth', active: 'bg-mint text-deep' },
    { worth: false, label: 'Not really', value: 'not_worth', active: 'bg-coral text-deep' },
  ] as const;
  return (
    <section aria-labelledby="worth-title" className="mt-8 rounded-card-lg bg-surface p-4">
      <h2 id="worth-title" className="font-display text-lg font-bold">
        Was it worth your coins?
      </h2>
      <p className="mt-1 text-sm text-muted">Live posts have no answer key. Your call counts.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((o) => {
          const selected = rating.value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => rating.onRate(o.worth)}
              className={cn(
                'min-h-tap rounded-card px-3 font-semibold transition-colors duration-fast',
                selected ? o.active : 'bg-white/10 text-fg hover:bg-white/15',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
