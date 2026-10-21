import type { GameConfig } from './config';
import { GAME_CONFIG } from './config';
import { idleCoinsDue, isIdleBlocked, restartIdle, stopIdle } from './idle';
import type {
  Choice,
  EndReason,
  FeedStyle,
  LedgerReason,
  Post,
  RoundAction,
  RoundState,
  Verdict,
} from './types';

export function createInitialRoundState(
  config: GameConfig = GAME_CONFIG,
  feedStyle: FeedStyle = 'vertical',
): RoundState {
  return {
    status: 'ready',
    mode: 'curated',
    feedStyle,
    posts: [],
    index: 0,
    coins: config.startingCoins,
    pendingReadPostId: null,
    openPostId: null,
    decisions: [],
    ledger: [],
    ratings: {},
    idle: { startedAt: null, drained: 0, awaitingPost: true, pausedExternally: false },
    endReason: null,
    startedAt: null,
    endedAt: null,
  };
}

/** Take up to `amount` coins (never below 0) and record what was actually taken. */
function charge(
  state: RoundState,
  reason: LedgerReason,
  amount: number,
  postId: string | null,
  at: number,
): RoundState {
  const taken = Math.max(0, Math.min(amount, state.coins));
  if (taken === 0) return state;
  return {
    ...state,
    coins: state.coins - taken,
    ledger: [...state.ledger, { seq: state.ledger.length + 1, reason, amount: taken, postId, at }],
  };
}

function decide(
  state: RoundState,
  post: Post,
  choice: Choice,
  verdict: Verdict,
  at: number,
): RoundState {
  return { ...state, decisions: [...state.decisions, { postId: post.id, choice, verdict, at }] };
}

function end(state: RoundState, reason: EndReason, at: number): RoundState {
  return stopIdle({
    ...state,
    status: 'ended',
    endReason: reason,
    endedAt: at,
    pendingReadPostId: null,
    openPostId: null,
  });
}

/** After a post is decided: end the round or move to the next post (idle waits for POST_SHOWN). */
function advance(state: RoundState, at: number): RoundState {
  const nextIndex = state.index + 1;
  if (nextIndex >= state.posts.length) return end(state, 'complete', at);
  if (state.coins <= 0) return end(state, 'out_of_coins', at);
  return stopIdle({ ...state, index: nextIndex, idle: { ...state.idle, awaitingPost: true } });
}

function currentPost(state: RoundState): Post | undefined {
  return state.posts[state.index];
}

/** Creates the round reducer for a config. Pure: all time comes in on the actions. */
export function createRoundReducer(config: GameConfig = GAME_CONFIG) {
  return function roundReducer(state: RoundState, action: RoundAction): RoundState {
    if (action.type === 'START_ROUND') {
      return {
        ...createInitialRoundState(config, action.feedStyle),
        status: action.posts.length > 0 ? 'playing' : 'ended',
        endReason: action.posts.length > 0 ? null : 'complete',
        mode: action.mode,
        posts: action.posts,
        startedAt: action.at,
        endedAt: action.posts.length > 0 ? null : action.at,
      };
    }

    if (state.status !== 'playing') return state;
    const post = currentPost(state);
    if (!post) return state;

    switch (action.type) {
      case 'POST_SHOWN': {
        if (!state.idle.awaitingPost || state.openPostId) return state;
        const shown = { ...state, idle: { ...state.idle, awaitingPost: false } };
        return restartIdle(shown, action.at);
      }

      case 'ACTIVITY':
        return isIdleBlocked(state) ? state : restartIdle(state, action.at);

      case 'SET_IDLE_PAUSED': {
        if (state.idle.pausedExternally === action.paused) return state;
        const next = { ...state, idle: { ...state.idle, pausedExternally: action.paused } };
        return action.paused ? stopIdle(next) : restartIdle(next, action.at);
      }

      case 'REQUEST_READ':
        if (state.pendingReadPostId || state.openPostId) return state;
        return stopIdle({ ...state, pendingReadPostId: post.id });

      case 'CANCEL_READ':
        if (!state.pendingReadPostId) return state;
        return restartIdle({ ...state, pendingReadPostId: null }, action.at);

      case 'CONFIRM_READ': {
        if (state.pendingReadPostId !== post.id || post.cost > state.coins) return state;
        let next: RoundState = { ...state, pendingReadPostId: null, openPostId: post.id };
        next = charge(next, 'read', post.cost, post.id, action.at);
        if (state.mode === 'live') {
          // Live posts have no trusted labels: the verdict comes from the player's rating.
          next = decide(next, post, 'read', 'missed', action.at);
          return stopIdle(next);
        }
        if (post.isTrap)
          next = charge(next, 'trap_penalty', config.penalties.trapRead, post.id, action.at);
        next = decide(next, post, 'read', post.isTrap ? 'bad' : 'good', action.at);
        return stopIdle(next);
      }

      case 'RATE_POST': {
        if (state.mode !== 'live' || state.openPostId !== post.id) return state;
        const rating = action.worth ? 'worth' : 'not_worth';
        return {
          ...state,
          ratings: { ...state.ratings, [post.id]: rating },
          decisions: state.decisions.map((d) =>
            d.postId === post.id ? { ...d, verdict: action.worth ? 'good' : 'bad' } : d,
          ),
        };
      }

      case 'CLOSE_POST':
        if (state.openPostId !== post.id) return state;
        return advance({ ...state, openPostId: null }, action.at);

      case 'SKIP':
        if (state.pendingReadPostId || state.openPostId) return state;
        return advance(
          decide(state, post, 'skip', post.isTrap ? 'good' : 'missed', action.at),
          action.at,
        );

      case 'FLAG': {
        if (state.pendingReadPostId || state.openPostId) return state;
        if (state.mode === 'live') {
          // No trusted trap labels in Live mode: flagging is free and neutral.
          return advance(decide(state, post, 'flag', 'missed', action.at), action.at);
        }
        let next = decide(state, post, 'flag', post.isTrap ? 'good' : 'bad', action.at);
        if (!post.isTrap)
          next = charge(next, 'wrong_flag', config.penalties.wrongFlag, post.id, action.at);
        return advance(next, action.at);
      }

      case 'IDLE_TICK': {
        const { startedAt, drained } = state.idle;
        if (isIdleBlocked(state) || startedAt === null) return state;
        const due = idleCoinsDue(action.at - startedAt, config.idle);
        if (due <= drained) return state;
        const next = charge(state, 'idle', due - drained, null, action.at);
        const withClock = { ...next, idle: { ...next.idle, drained: due } };
        return withClock.coins <= 0 ? end(withClock, 'out_of_coins', action.at) : withClock;
      }

      case 'END_ROUND':
        return end(state, action.reason ?? 'quit', action.at);

      default:
        return state;
    }
  };
}

export const roundReducer = createRoundReducer();
