import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { POST_SKINS } from '@/components/post';
import { useToast } from '@/components/toastContext';
import type { Post } from '@/engine';
import {
  GAME_CONFIG,
  selectCanAfford,
  selectCoinAnnouncement,
  selectCurrentPost,
  selectOpenPost,
  selectPendingPost,
  selectProgress,
} from '@/engine';
import { useIdleDrain } from '@/hooks/useIdleDrain';
import { useRound } from '@/hooks/useRound';
import { cn } from '@/lib/cn';
import { IdleWarning } from './IdleWarning';
import { OutOfCoins } from './OutOfCoins';
import { PostDetail } from './PostDetail';
import { PostSlide } from './PostSlide';
import { ReadConfirmSheet } from './ReadConfirmSheet';
import { RoundTopBar } from './RoundTopBar';
import { UpNext } from './UpNext';
import { useRoundFeedback } from './useRoundFeedback';

/** Hash pushed while a post is open, so the browser/phone Back button closes it. */
const DETAIL_HASH = '#post';

export function RoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const round = useRound((s) => s.round);
  const { postShown, requestRead, confirmRead, cancelRead, closePost, skip, flag, ratePost } =
    useRound.getState();

  const playing = round.status === 'playing';
  const idle = useIdleDrain(playing);
  useRoundFeedback(round);
  const post = selectCurrentPost(round);
  const pending = selectPendingPost(round);
  const open = selectOpenPost(round);
  const progress = selectProgress(round);
  const announcement = selectCoinAnnouncement(round);
  const outOfCoins = round.status === 'ended' && round.endReason === 'out_of_coins';

  const mainRef = useRef<HTMLElement>(null);

  // ----- Back button closes the open post -----
  const hashRef = useRef(location.hash);
  hashRef.current = location.hash;
  const openRef = useRef(round.openPostId);
  openRef.current = round.openPostId;

  useEffect(() => {
    if (round.openPostId && hashRef.current !== DETAIL_HASH) {
      navigate({ hash: DETAIL_HASH });
    }
  }, [round.openPostId, navigate]);

  useEffect(() => {
    if (location.hash !== DETAIL_HASH && openRef.current) closePost();
  }, [location.hash, closePost]);

  const backToFeed = () => {
    if (hashRef.current === DETAIL_HASH) navigate(-1);
    else closePost();
  };

  // ----- Round end -----
  useEffect(() => {
    if (round.status !== 'ended') return;
    if (round.endReason !== 'out_of_coins') {
      navigate(ROUTES.summary, { replace: true });
      return;
    }
    const t = window.setTimeout(
      () => navigate(ROUTES.summary, { replace: true }),
      GAME_CONFIG.outOfCoinsMomentMs,
    );
    return () => window.clearTimeout(t);
  }, [round.status, round.endReason, navigate]);

  // New post: start at the top of the feed.
  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [post?.id]);

  if (round.status === 'ready' || round.posts.length === 0) {
    return <Navigate to={ROUTES.feedSelect} replace />;
  }

  const Skin = POST_SKINS[round.feedStyle];
  const vertical = round.feedStyle === 'vertical';
  const upcoming = round.posts.slice(round.index + 1, round.index + 3);

  const onSkip = (p: Post) => {
    skip(p.id);
    toast.show('Skipped', { duration: 1200 });
  };
  const onFlag = (p: Post) => {
    flag(p.id);
    toast.show('Flagged', { duration: 1200 });
  };

  return (
    <div className="relative flex h-dvh flex-1 flex-col overflow-hidden">
      <RoundTopBar
        coins={round.coins}
        current={progress.current}
        total={progress.total}
        idleProgress={idle.progress}
        draining={idle.draining}
        announcement={open ? null : announcement}
        live={round.mode === 'live'}
      />

      <main
        ref={mainRef}
        aria-label="Feed"
        className={cn(
          'relative flex min-h-0 flex-1 flex-col px-3 pb-3',
          vertical ? 'overflow-hidden' : 'overflow-y-auto',
        )}
      >
        {post && (
          <AnimatePresence initial>
            <PostSlide key={post.id} vertical={vertical} onShown={() => postShown(post.id)}>
              <Skin
                post={post}
                canAfford={selectCanAfford(round, post)}
                onRead={() => requestRead(post.id)}
                onSkip={() => onSkip(post)}
                onFlag={() => onFlag(post)}
              />
              {!vertical && <UpNext posts={upcoming} />}
            </PostSlide>
          </AnimatePresence>
        )}
      </main>

      <IdleWarning show={playing && idle.draining} />

      <ReadConfirmSheet
        post={playing ? pending : null}
        coins={round.coins}
        onConfirm={confirmRead}
        onCancel={cancelRead}
      />
      <PostDetail
        post={open}
        coins={round.coins}
        announcement={announcement}
        onBack={backToFeed}
        rating={
          round.mode === 'live' && open
            ? { value: round.ratings[open.id] ?? null, onRate: ratePost }
            : undefined
        }
      />

      {outOfCoins && (
        <OutOfCoins
          postsSeen={round.decisions.length}
          onContinue={() => navigate(ROUTES.summary, { replace: true })}
        />
      )}
    </div>
  );
}
