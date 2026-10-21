import type { GameConfig, SqLabelRule } from './config';
import { GAME_CONFIG } from './config';
import { idleCoinsDue, isIdleBlocked } from './idle';
import type { Choice, LedgerEntry, Post, Rating, RoundState, TrapType, Verdict } from './types';

export function selectCurrentPost(state: RoundState): Post | null {
  return state.posts[state.index] ?? null;
}

export function selectPendingPost(state: RoundState): Post | null {
  return state.posts.find((p) => p.id === state.pendingReadPostId) ?? null;
}

export function selectOpenPost(state: RoundState): Post | null {
  return state.posts.find((p) => p.id === state.openPostId) ?? null;
}

export function selectCanAfford(
  state: RoundState,
  post: Post | null = selectCurrentPost(state),
): boolean {
  return post !== null && post.cost <= state.coins;
}

/** "Post 3 of 12": 1-based position, capped at the total. */
export function selectProgress(state: RoundState): { current: number; total: number } {
  const total = state.posts.length;
  return { current: Math.min(state.index + 1, total), total };
}

export interface IdleView {
  /** Fill of the idle meter during the grace period, 0–1. */
  progress: number;
  /** True once coins are draining. */
  draining: boolean;
  /** True when the idle clock is running at all. */
  running: boolean;
}

export function selectIdleState(
  state: RoundState,
  now: number,
  config: GameConfig = GAME_CONFIG,
): IdleView {
  const { startedAt } = state.idle;
  if (isIdleBlocked(state) || startedAt === null) {
    return { progress: 0, draining: false, running: false };
  }
  const elapsed = Math.max(0, now - startedAt);
  return {
    progress: Math.min(elapsed / config.idle.delayMs, 1),
    draining: idleCoinsDue(elapsed, config.idle) > 0,
    running: true,
  };
}

/** Text for the coin counter's live region: the last meaningful (non-idle) coin change. */
export function selectCoinAnnouncement(state: RoundState): { key: number; text: string } | null {
  const entry = [...state.ledger].reverse().find((e) => e.reason !== 'idle');
  if (!entry) return null;
  const left = `${state.coins} coins left.`;
  const texts: Record<LedgerEntry['reason'], string> = {
    read: `Spent ${entry.amount} coins to open the post. ${left}`,
    trap_penalty: `Lost ${entry.amount} more coins. ${left}`,
    wrong_flag: `Lost ${entry.amount} coins. ${left}`,
    idle: left,
  };
  return { key: entry.seq, text: texts[entry.reason] };
}

// ---------- Scoring ----------

export function calculateSq(
  goodCalls: number,
  totalPosts: number,
  coinsLeft: number,
  config: GameConfig = GAME_CONFIG,
): number {
  const goodPct = totalPosts === 0 ? 0 : (goodCalls / totalPosts) * 100;
  const coinsPct = config.startingCoins === 0 ? 0 : (coinsLeft / config.startingCoins) * 100;
  const raw = config.sq.goodCallWeight * goodPct + config.sq.coinsWeight * coinsPct;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Live mode SQ: share of reading coins spent on posts the player rated "worth it",
 * plus coins left. With no reading at all, only the coins part counts.
 */
export function calculateLiveSq(
  worthCoins: number,
  readCoins: number,
  coinsLeft: number,
  config: GameConfig = GAME_CONFIG,
): number {
  const worthPct = readCoins === 0 ? 0 : (worthCoins / readCoins) * 100;
  const coinsPct = config.startingCoins === 0 ? 0 : (coinsLeft / config.startingCoins) * 100;
  const raw = config.liveSq.worthWeight * worthPct + config.liveSq.coinsWeight * coinsPct;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Coins spent opening posts, split by the player's live rating. */
export function liveReadCoins(
  ledger: readonly LedgerEntry[],
  ratings: Readonly<Record<string, Rating>>,
): { worth: number; total: number } {
  let worth = 0;
  let total = 0;
  for (const e of ledger) {
    if (e.reason !== 'read') continue;
    total += e.amount;
    if (e.postId && ratings[e.postId] === 'worth') worth += e.amount;
  }
  return { worth, total };
}

export function sqLabel(sq: number, config: GameConfig = GAME_CONFIG): SqLabelRule {
  const rule = config.labels.find((l) => sq >= l.min) ?? config.labels[config.labels.length - 1];
  if (!rule) throw new Error('GAME_CONFIG.labels must not be empty');
  return rule;
}

export interface CoinBreakdown {
  /** Coins spent opening valuable posts. */
  reading: number;
  /** Coins spent opening traps, plus trap and wrong-flag penalties. */
  trapsAndBadFlags: number;
  idling: number;
  left: number;
}

export type RevealChoice = Choice | 'not_reached';

export interface RevealRow {
  post: Post;
  kind: 'valuable' | 'trap';
  trapType: TrapType | null;
  choice: RevealChoice;
  verdict: Verdict;
  /** Coins this post cost the player (reading + penalties). */
  coinImpact: number;
  why: string;
  /** Live mode only. */
  rating: Rating | null;
}

export interface RoundSummary {
  sq: number;
  label: SqLabelRule;
  coinsLeft: number;
  goodCalls: number;
  totalPosts: number;
  coinsSpent: number;
  breakdown: CoinBreakdown;
  reveal: RevealRow[];
}

export function selectCoinsSpent(state: RoundState): number {
  return state.ledger.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Where the coins went, from a ledger. Reading a trap counts as a trap cost, not reading.
 * Used for live rounds and for saved rounds alike.
 */
export function computeBreakdown(
  ledger: readonly LedgerEntry[],
  trapPostIds: ReadonlySet<string>,
  coinsLeft: number,
): CoinBreakdown {
  const breakdown: CoinBreakdown = { reading: 0, trapsAndBadFlags: 0, idling: 0, left: coinsLeft };
  for (const e of ledger) {
    if (e.reason === 'idle') breakdown.idling += e.amount;
    else if (e.reason === 'read' && !(e.postId && trapPostIds.has(e.postId)))
      breakdown.reading += e.amount;
    else breakdown.trapsAndBadFlags += e.amount;
  }
  return breakdown;
}

/** Posts whose reading cost counts as wasted: traps, or (Live) posts rated not worth it. */
function wastedReadIds(state: RoundState): Set<string> {
  if (state.mode === 'live') {
    return new Set(Object.keys(state.ratings).filter((id) => state.ratings[id] === 'not_worth'));
  }
  return new Set(state.posts.filter((p) => p.isTrap).map((p) => p.id));
}

export function selectBreakdown(state: RoundState): CoinBreakdown {
  const traps = wastedReadIds(state);
  return computeBreakdown(state.ledger, traps, state.coins);
}

export function selectReveal(state: RoundState): RevealRow[] {
  return state.posts.map((post) => {
    const decision = state.decisions.find((d) => d.postId === post.id);
    const coinImpact = state.ledger
      .filter((e) => e.postId === post.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      post,
      kind: post.isTrap ? 'trap' : 'valuable',
      trapType: post.trapType,
      choice: decision?.choice ?? 'not_reached',
      verdict: decision?.verdict ?? 'missed',
      coinImpact,
      why: post.why,
      rating: state.ratings[post.id] ?? null,
    };
  });
}

export function selectSummary(state: RoundState, config: GameConfig = GAME_CONFIG): RoundSummary {
  const goodCalls = state.decisions.filter((d) => d.verdict === 'good').length;
  const totalPosts = state.posts.length;
  let sq: number;
  if (state.mode === 'live') {
    const reads = liveReadCoins(state.ledger, state.ratings);
    sq = calculateLiveSq(reads.worth, reads.total, state.coins, config);
  } else {
    sq = calculateSq(goodCalls, totalPosts, state.coins, config);
  }
  return {
    sq,
    label: sqLabel(sq, config),
    coinsLeft: state.coins,
    goodCalls,
    totalPosts,
    coinsSpent: selectCoinsSpent(state),
    breakdown: selectBreakdown(state),
    reveal: selectReveal(state),
  };
}

// ---------- Display labels ----------

export const TRAP_TYPE_LABEL: Record<TrapType, string> = {
  clickbait: 'Clickbait',
  rage_bait: 'Rage bait',
  fake_news: 'Fake news',
  time_waster: 'Time-waster',
  engagement_bait: 'Engagement bait',
};

export const CHOICE_LABEL: Record<RevealChoice, string> = {
  read: 'Read',
  skip: 'Skipped',
  flag: 'Flagged',
  not_reached: 'Not reached',
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  good: 'Good call',
  bad: 'Bad call',
  missed: 'Missed',
};
