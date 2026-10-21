import { recordFromRound, summaryFromRecord } from '@/lib/rounds/record';
import { makePost, run } from '@/tests/fixtures';
import { GAME_CONFIG } from './config';
import { createInitialRoundState } from './reducer';
import { calculateLiveSq, selectBreakdown, selectSummary } from './selectors';
import type { Post, RoundState } from './types';

function liveRound(posts: Post[]): RoundState {
  return run(
    createInitialRoundState(),
    { type: 'START_ROUND', posts, feedStyle: 'timeline', mode: 'live', at: 0 },
    { type: 'POST_SHOWN', at: 0 },
  );
}

const live = () => [
  makePost({ cost: 6 }),
  makePost({ cost: 4 }),
  makePost({ cost: 5 }),
  makePost({ cost: 3 }),
];

describe('Live mode', () => {
  it('has no trap scoring: flagging is free and neutral', () => {
    const state = run(liveRound(live()), { type: 'FLAG', at: 1 });
    expect(state.coins).toBe(GAME_CONFIG.startingCoins);
    expect(state.decisions[0]).toMatchObject({ choice: 'flag', verdict: 'missed' });
  });

  it('asks "worth it?" after reading and uses the answer as the verdict', () => {
    let state = run(
      liveRound(live()),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CONFIRM_READ', at: 2 },
    );
    expect(state.decisions[0]).toMatchObject({ choice: 'read', verdict: 'missed' });

    state = run(state, { type: 'RATE_POST', worth: true, at: 3 });
    expect(state.ratings[state.posts[0]!.id]).toBe('worth');
    expect(state.decisions[0]?.verdict).toBe('good');

    // Changing your mind before closing the post is fine.
    state = run(state, { type: 'RATE_POST', worth: false, at: 4 });
    expect(state.decisions[0]?.verdict).toBe('bad');
  });

  it('only accepts a rating for the open post in Live mode', () => {
    const curated = run(
      createInitialRoundState(),
      { type: 'START_ROUND', posts: live(), feedStyle: 'timeline', mode: 'curated', at: 0 },
      { type: 'POST_SHOWN', at: 0 },
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CONFIRM_READ', at: 2 },
      { type: 'RATE_POST', worth: true, at: 3 },
    );
    expect(curated.ratings).toEqual({});

    const notOpen = run(liveRound(live()), { type: 'RATE_POST', worth: true, at: 1 });
    expect(notOpen.ratings).toEqual({});
  });

  it('scores budget use and self-ratings', () => {
    // 0.6 × 60% worth + 0.4 × 90 coins left = 36 + 36 = 72
    expect(calculateLiveSq(6, 10, 90)).toBe(72);
    expect(calculateLiveSq(0, 0, 100)).toBe(40);

    const state = run(
      liveRound(live()),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CONFIRM_READ', at: 2 },
      { type: 'RATE_POST', worth: true, at: 3 },
      { type: 'CLOSE_POST', at: 4 },
      { type: 'POST_SHOWN', at: 5 },
      { type: 'REQUEST_READ', at: 6 },
      { type: 'CONFIRM_READ', at: 7 },
      { type: 'RATE_POST', worth: false, at: 8 },
      { type: 'CLOSE_POST', at: 9 },
      { type: 'END_ROUND', at: 10 },
    );
    // read 6 (worth) + 4 (not worth) → 60% worth; 90 coins left → 72
    const summary = selectSummary(state);
    expect(summary.sq).toBe(72);
    expect(summary.goodCalls).toBe(1);
    expect(selectBreakdown(state)).toEqual({
      reading: 6,
      trapsAndBadFlags: 4,
      idling: 0,
      left: 90,
    });

    const record = recordFromRound(state, 'live-1', '2026-10-22T08:00:00.000Z');
    expect(record.mode).toBe('live');
    expect(record.decisions.map((d) => d.rating)).toEqual(['worth', 'not_worth', null, null]);
    expect(summaryFromRecord(record).breakdown).toEqual(selectBreakdown(state));
  });
});
