import { makePost, run, startedRound } from '@/tests/fixtures';
import type { GameConfig } from './config';
import { GAME_CONFIG } from './config';
import {
  calculateSq,
  selectBreakdown,
  selectCoinAnnouncement,
  selectProgress,
  selectReveal,
  selectSummary,
  sqLabel,
} from './selectors';

describe('calculateSq', () => {
  it('follows SQ = round(0.8 × good% + 0.2 × coins left)', () => {
    expect(calculateSq(12, 12, 100)).toBe(100);
    expect(calculateSq(0, 12, 0)).toBe(0);
    // 0.8 × 75 + 0.2 × 50 = 70
    expect(calculateSq(9, 12, 50)).toBe(70);
    // 0.8 × 58.33 + 0.2 × 41 = 46.67 + 8.2 = 54.87 → 55
    expect(calculateSq(7, 12, 41)).toBe(55);
  });

  it('is clamped to 0–100', () => {
    const generous: GameConfig = { ...GAME_CONFIG, sq: { goodCallWeight: 1, coinsWeight: 1 } };
    expect(calculateSq(12, 12, 100, generous)).toBe(100);
    expect(calculateSq(0, 0, 0)).toBe(0);
  });
});

describe('sqLabel', () => {
  it.each([
    [100, 'Mindful Scroller'],
    [85, 'Mindful Scroller'],
    [84, 'Getting There'],
    [60, 'Getting There'],
    [59, 'Autopilot'],
    [0, 'Autopilot'],
  ])('SQ %i is %s', (sq, label) => {
    expect(sqLabel(sq).label).toBe(label);
  });

  it('Autopilot carries its message', () => {
    expect(sqLabel(10).message).toBe('The feed was steering. Next round, you take the wheel.');
  });
});

describe('selectProgress', () => {
  it('is 1-based and capped at the total', () => {
    const state = startedRound();
    expect(selectProgress(state)).toEqual({ current: 1, total: 12 });
    expect(selectProgress({ ...state, index: 12 })).toEqual({ current: 12, total: 12 });
  });
});

describe('summary', () => {
  const posts = [
    makePost({ isTrap: false, cost: 5 }), // read → good
    makePost({ isTrap: true, cost: 6 }), // read → bad + penalty
    makePost({ isTrap: true, cost: 3 }), // flag → good
    makePost({ isTrap: false, cost: 4 }), // flag → bad + wrong flag
    makePost({ isTrap: false, cost: 4 }), // skip → missed
    makePost({ isTrap: true, cost: 4 }), // not reached
  ];

  const played = run(
    startedRound(posts),
    { type: 'REQUEST_READ', at: 1 },
    { type: 'CONFIRM_READ', at: 2 },
    { type: 'CLOSE_POST', at: 3 },
    { type: 'POST_SHOWN', at: 4 },
    { type: 'REQUEST_READ', at: 5 },
    { type: 'CONFIRM_READ', at: 6 },
    { type: 'CLOSE_POST', at: 7 },
    { type: 'POST_SHOWN', at: 8 },
    { type: 'FLAG', at: 9 },
    { type: 'POST_SHOWN', at: 10 },
    { type: 'FLAG', at: 11 },
    { type: 'POST_SHOWN', at: 12 },
    { type: 'IDLE_TICK', at: 12 + 7_000 }, // 2 idle coins
    { type: 'SKIP', at: 12 + 7_001 },
    { type: 'END_ROUND', at: 20_000 },
  );

  it('breaks coins down from the ledger and adds up to the starting coins', () => {
    const b = selectBreakdown(played);
    expect(b).toEqual({ reading: 5, trapsAndBadFlags: 6 + 5 + 3, idling: 2, left: 100 - 21 });
    expect(b.reading + b.trapsAndBadFlags + b.idling + b.left).toBe(GAME_CONFIG.startingCoins);
  });

  it('reveals every post with choice, verdict, coin impact and why', () => {
    const reveal = selectReveal(played);
    expect(reveal.map((r) => [r.kind, r.choice, r.verdict, r.coinImpact])).toEqual([
      ['valuable', 'read', 'good', 5],
      ['trap', 'read', 'bad', 11],
      ['trap', 'flag', 'good', 0],
      ['valuable', 'flag', 'bad', 3],
      ['valuable', 'skip', 'missed', 0],
      ['trap', 'not_reached', 'missed', 0],
    ]);
    expect(reveal.every((r) => r.why.length > 0)).toBe(true);
  });

  it('scores good calls out of every post in the round', () => {
    const summary = selectSummary(played);
    expect(summary.goodCalls).toBe(2);
    expect(summary.totalPosts).toBe(6);
    expect(summary.coinsLeft).toBe(79);
    expect(summary.coinsSpent).toBe(21);
    // 0.8 × 33.33 + 0.2 × 79 = 26.67 + 15.8 = 42.47 → 42
    expect(summary.sq).toBe(42);
    expect(summary.label.key).toBe('autopilot');
  });
});

describe('selectCoinAnnouncement', () => {
  it('announces meaningful changes and skips idle ticks', () => {
    const read = run(
      startedRound(),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CONFIRM_READ', at: 2 },
    );
    expect(selectCoinAnnouncement(read)?.text).toBe(
      'Spent 4 coins to open the post. 96 coins left.',
    );

    const idled = run(startedRound(), { type: 'IDLE_TICK', at: 9_000 });
    expect(selectCoinAnnouncement(idled)).toBeNull();
  });
});
