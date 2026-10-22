export const TRAP_TYPES = [
  'clickbait',
  'rage_bait',
  'fake_news',
  'time_waster',
  'engagement_bait',
] as const;
export type TrapType = (typeof TRAP_TYPES)[number];

/** Local illustrated header for a post: a base color and an emoji glyph. No external images. */
export interface SkinMedia {
  color: string;
  glyph: string;
}

export interface Post {
  id: string;
  author: string;
  title: string;
  body: string;
  cost: number;
  skinMedia: SkinMedia;
  /** Made-up community name (no prefix) shown by the Forum skin. Falls back to "general". */
  community?: string;
  /** Search words for a stock background clip (Vertical and Gallery skins). None = gradient. */
  videoQuery?: string;
  isTrap: boolean;
  trapType: TrapType | null;
  /** One line shown in the reveal explaining the value or the trap. */
  why: string;
}

export const FEED_STYLES = ['vertical', 'gallery', 'timeline', 'forum'] as const;
export type FeedStyle = (typeof FEED_STYLES)[number];

export type RoundMode = 'curated' | 'live';

export type Choice = 'read' | 'skip' | 'flag';
export type Verdict = 'good' | 'bad' | 'missed';

export interface Decision {
  postId: string;
  choice: Choice;
  verdict: Verdict;
  at: number;
}

/** Live mode only: the player's own answer to "Was it worth your coins?". */
export type Rating = 'worth' | 'not_worth';

export type LedgerReason = 'read' | 'trap_penalty' | 'wrong_flag' | 'idle';

/** One coin change. `amount` is the number of coins actually taken (always > 0). */
export interface LedgerEntry {
  seq: number;
  reason: LedgerReason;
  amount: number;
  postId: string | null;
  at: number;
}

export type RoundStatus = 'ready' | 'playing' | 'ended';
export type EndReason = 'complete' | 'out_of_coins' | 'quit';

export interface IdleClock {
  /** When the current idle stretch began (last activity), or null while the clock is stopped. */
  startedAt: number | null;
  /** Coins already taken during the current idle stretch. */
  drained: number;
  /** True until the current post has finished appearing (POST_SHOWN). */
  awaitingPost: boolean;
  /** Paused from outside the round: tab hidden, How to Play, any dialog. */
  pausedExternally: boolean;
}

export interface RoundState {
  status: RoundStatus;
  mode: RoundMode;
  feedStyle: FeedStyle;
  posts: Post[];
  index: number;
  coins: number;
  /** Post whose read confirmation sheet is open. */
  pendingReadPostId: string | null;
  /** Post open in the detail view (already paid for). */
  openPostId: string | null;
  decisions: Decision[];
  ledger: LedgerEntry[];
  /** Live mode self-ratings by post id. Empty in curated mode. */
  ratings: Record<string, Rating>;
  idle: IdleClock;
  endReason: EndReason | null;
  startedAt: number | null;
  endedAt: number | null;
}

export type RoundAction =
  | { type: 'START_ROUND'; posts: Post[]; feedStyle: FeedStyle; mode: RoundMode; at: number }
  | { type: 'POST_SHOWN'; at: number }
  | { type: 'ACTIVITY'; at: number }
  | { type: 'SET_IDLE_PAUSED'; paused: boolean; at: number }
  | { type: 'REQUEST_READ'; at: number }
  | { type: 'CONFIRM_READ'; at: number }
  | { type: 'CANCEL_READ'; at: number }
  | { type: 'CLOSE_POST'; at: number }
  | { type: 'SKIP'; at: number }
  | { type: 'FLAG'; at: number }
  | { type: 'IDLE_TICK'; at: number }
  | { type: 'RATE_POST'; worth: boolean; at: number }
  | { type: 'END_ROUND'; reason?: EndReason; at: number };
