import type {
  CoinBreakdown,
  FeedStyle,
  GameConfig,
  LedgerEntry,
  Rating,
  RevealChoice,
  RoundMode,
  RoundState,
  SqLabelRule,
  TrapType,
  Verdict,
} from '@/engine';
import { computeBreakdown, GAME_CONFIG, selectSummary, sqLabel } from '@/engine';

/** One post's outcome, saved with the round so the reveal can be shown again later. */
export interface RevealRecord {
  postId: string;
  author: string;
  title: string;
  isTrap: boolean;
  trapType: TrapType | null;
  cost: number;
  choice: RevealChoice;
  verdict: Verdict;
  coinImpact: number;
  why: string;
  /** Live mode: the player's own "worth it?" answer. Absent in curated rounds. */
  rating?: Rating | null;
}

export interface Reflection {
  trap: string;
  worth: string;
  limit: string;
}

/** A finished round as stored locally (guests) or in Supabase (signed in). */
export interface RoundRecord {
  id: string;
  createdAt: string;
  mode: RoundMode;
  feedStyle: FeedStyle;
  sq: number;
  label: string;
  coinsLeft: number;
  goodCalls: number;
  totalPosts: number;
  ledger: LedgerEntry[];
  /** Every post in round order, including ones never reached. */
  decisions: RevealRecord[];
  reflection: Reflection | null;
}

export const EMPTY_REFLECTION: Reflection = { trap: '', worth: '', limit: '' };

export function newRoundId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback for very old browsers: RFC 4122 v4 shape from Math.random.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Snapshot a finished round for saving. */
export function recordFromRound(
  state: RoundState,
  id: string,
  createdAt: string,
  config: GameConfig = GAME_CONFIG,
): RoundRecord {
  const summary = selectSummary(state, config);
  return {
    id,
    createdAt,
    mode: state.mode,
    feedStyle: state.feedStyle,
    sq: summary.sq,
    label: summary.label.label,
    coinsLeft: summary.coinsLeft,
    goodCalls: summary.goodCalls,
    totalPosts: summary.totalPosts,
    ledger: state.ledger,
    decisions: summary.reveal.map((r) => ({
      postId: r.post.id,
      author: r.post.author,
      title: r.post.title,
      isTrap: r.post.isTrap,
      trapType: r.trapType,
      cost: r.post.cost,
      choice: r.choice,
      verdict: r.verdict,
      coinImpact: r.coinImpact,
      why: r.why,
      ...(state.mode === 'live' ? { rating: r.rating } : {}),
    })),
    reflection: null,
  };
}

export interface RecordSummary {
  mode: RoundMode;
  sq: number;
  label: SqLabelRule;
  coinsLeft: number;
  goodCalls: number;
  totalPosts: number;
  breakdown: CoinBreakdown;
  reveal: RevealRecord[];
  outOfCoins: boolean;
}

/** Everything the summary screen shows, derived from a saved round. */
export function summaryFromRecord(
  record: RoundRecord,
  config: GameConfig = GAME_CONFIG,
): RecordSummary {
  // Wasted reading: traps in curated rounds, posts rated "not worth it" in Live rounds.
  const wasted = new Set(
    record.decisions
      .filter((d) => (record.mode === 'live' ? d.rating === 'not_worth' : d.isTrap))
      .map((d) => d.postId),
  );
  return {
    mode: record.mode,
    sq: record.sq,
    label: sqLabel(record.sq, config),
    coinsLeft: record.coinsLeft,
    goodCalls: record.goodCalls,
    totalPosts: record.totalPosts,
    breakdown: computeBreakdown(record.ledger, wasted, record.coinsLeft),
    reveal: record.decisions,
    outOfCoins: record.coinsLeft === 0 && record.decisions.some((d) => d.choice === 'not_reached'),
  };
}
