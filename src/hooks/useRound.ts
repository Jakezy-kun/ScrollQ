import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { EndReason, FeedStyle, Post, RoundAction, RoundMode, RoundState } from '@/engine';
import { createInitialRoundState, roundReducer, selectCurrentPost } from '@/engine';
import type { Reflection, RoundRecord } from '@/lib/rounds/record';
import { newRoundId, recordFromRound } from '@/lib/rounds/record';
import { roundRecordSchema } from '@/lib/rounds/schema';
import { safeStringStorage } from '@/lib/storage';

type ActionType = RoundAction['type'];

/** The last finished round, snapshotted the moment it ended. */
export interface FinishedRound {
  record: RoundRecord;
  /** True once the repository has stored it. */
  saved: boolean;
}

interface RoundStore {
  round: RoundState;
  finished: FinishedRound | null;
  start: (posts: Post[], feedStyle: FeedStyle, mode?: RoundMode) => void;
  /** The post with this id has finished appearing; idle may start counting. */
  postShown: (postId: string) => void;
  activity: () => void;
  setIdlePaused: (paused: boolean) => void;
  requestRead: (postId: string) => void;
  confirmRead: () => void;
  cancelRead: () => void;
  closePost: () => void;
  skip: (postId: string) => void;
  flag: (postId: string) => void;
  idleTick: () => void;
  /** Live mode: answer "Was it worth your coins?" for the open post. */
  ratePost: (worth: boolean) => void;
  endRound: (reason?: EndReason) => void;
  markSaved: (id: string) => void;
  setReflection: (id: string, reflection: Reflection) => void;
  /** Forget the round (after it has been saved, or to start fresh). */
  reset: () => void;
}

/**
 * The live round. A thin wrapper around the pure engine reducer: it stamps every action
 * with the current time and ignores taps meant for a post that is no longer current
 * (for example a double tap while the previous post animates out).
 */
export const useRound = create<RoundStore>()(
  persist(
    (set, get) => {
      const send = (action: RoundAction) => {
        const prev = get().round;
        const next = roundReducer(prev, action);
        // Most idle checks change nothing; skip the re-render and the storage write.
        if (next === prev) return;
        if (action.type === 'START_ROUND') {
          set({ round: next, finished: null });
        } else if (prev.status === 'playing' && next.status === 'ended') {
          const record = recordFromRound(next, newRoundId(), new Date(action.at).toISOString());
          set({ round: next, finished: { record, saved: false } });
        } else {
          set({ round: next });
        }
      };
      const now = () => Date.now();
      const isCurrent = (postId: string) => selectCurrentPost(get().round)?.id === postId;
      const simple = (
        type: Exclude<ActionType, 'START_ROUND' | 'SET_IDLE_PAUSED' | 'END_ROUND' | 'RATE_POST'>,
      ) => send({ type, at: now() });

      return {
        round: createInitialRoundState(),
        finished: null,
        start: (posts, feedStyle, mode = 'curated') =>
          send({ type: 'START_ROUND', posts, feedStyle, mode, at: now() }),
        postShown: (postId) => {
          if (isCurrent(postId)) simple('POST_SHOWN');
        },
        activity: () => simple('ACTIVITY'),
        setIdlePaused: (paused) => send({ type: 'SET_IDLE_PAUSED', paused, at: now() }),
        requestRead: (postId) => {
          if (isCurrent(postId)) simple('REQUEST_READ');
        },
        confirmRead: () => simple('CONFIRM_READ'),
        cancelRead: () => simple('CANCEL_READ'),
        closePost: () => simple('CLOSE_POST'),
        skip: (postId) => {
          if (isCurrent(postId)) simple('SKIP');
        },
        flag: (postId) => {
          if (isCurrent(postId)) simple('FLAG');
        },
        idleTick: () => simple('IDLE_TICK'),
        ratePost: (worth) => send({ type: 'RATE_POST', worth, at: now() }),
        endRound: (reason) => send({ type: 'END_ROUND', reason, at: now() }),
        markSaved: (id) => {
          const f = get().finished;
          if (f && f.record.id === id) set({ finished: { ...f, saved: true } });
        },
        setReflection: (id, reflection) => {
          const f = get().finished;
          if (f && f.record.id === id)
            set({ finished: { ...f, record: { ...f.record, reflection } } });
        },
        reset: () => set({ round: createInitialRoundState(), finished: null }),
      };
    },
    {
      // sessionStorage: a reload or a sign-in redirect never loses an in-progress round.
      name: 'round',
      version: 1,
      storage: createJSONStorage(() => safeStringStorage('session')),
      partialize: (s) => ({ round: s.round, finished: s.finished }),
      merge: (persisted, current) => {
        const p = persisted as { round?: RoundState; finished?: FinishedRound | null } | undefined;
        const round = p?.round;
        if (!round || !Array.isArray(round.posts) || !round.idle) return current;
        const parsed = roundRecordSchema.safeParse(p.finished?.record);
        const finished = parsed.success
          ? { record: parsed.data, saved: p.finished?.saved === true }
          : null;
        // Time away from the page must not count as idling: restart the idle clock
        // once the post is shown again.
        return {
          ...current,
          finished,
          round: {
            ...round,
            ratings: round.ratings ?? {},
            idle: {
              ...round.idle,
              startedAt: null,
              drained: 0,
              awaitingPost: true,
              pausedExternally: false,
            },
          },
        };
      },
    },
  ),
);
