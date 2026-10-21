import { makeDeck, makePost, run, startedRound } from '@/tests/fixtures';
import { GAME_CONFIG } from './config';
import { idleCoinsDue } from './idle';
import { createInitialRoundState } from './reducer';
import { selectIdleState } from './selectors';

const { startingCoins } = GAME_CONFIG;
const idle = GAME_CONFIG.idle;

describe('idleCoinsDue', () => {
  it('is 0 during the 5 s grace period', () => {
    expect(idleCoinsDue(0, idle)).toBe(0);
    expect(idleCoinsDue(4_999, idle)).toBe(0);
  });

  it('takes 1 coin at 5 s, then 1 every 2 s', () => {
    expect(idleCoinsDue(5_000, idle)).toBe(1);
    expect(idleCoinsDue(6_999, idle)).toBe(1);
    expect(idleCoinsDue(7_000, idle)).toBe(2);
    expect(idleCoinsDue(9_000, idle)).toBe(3);
  });
});

describe('IDLE_TICK', () => {
  it('takes nothing before the grace period ends', () => {
    const state = run(startedRound(), { type: 'IDLE_TICK', at: 4_900 });
    expect(state.coins).toBe(startingCoins);
  });

  it('drains 1 coin every 2 s after 5 s', () => {
    let state = startedRound();
    for (let t = 0; t <= 11_000; t += 250) state = run(state, { type: 'IDLE_TICK', at: t });
    // 5 s, 7 s, 9 s, 11 s
    expect(state.coins).toBe(startingCoins - 4);
    expect(state.ledger.every((e) => e.reason === 'idle')).toBe(true);
  });

  it('never double-charges for repeated ticks at the same time', () => {
    const state = run(
      startedRound(),
      { type: 'IDLE_TICK', at: 5_000 },
      { type: 'IDLE_TICK', at: 5_000 },
      { type: 'IDLE_TICK', at: 5_100 },
    );
    expect(state.coins).toBe(startingCoins - 1);
  });

  it('catches up after a throttled gap using timestamps', () => {
    const state = run(startedRound(), { type: 'IDLE_TICK', at: 15_000 });
    // due at 5, 7, 9, 11, 13, 15 s
    expect(state.coins).toBe(startingCoins - 6);
    expect(state.ledger).toHaveLength(1);
    expect(state.ledger[0]!.amount).toBe(6);
  });

  it('any activity resets the clock and the grace period', () => {
    const state = run(
      startedRound(),
      { type: 'IDLE_TICK', at: 6_000 },
      { type: 'ACTIVITY', at: 6_500 },
      { type: 'IDLE_TICK', at: 11_000 },
    );
    expect(state.coins).toBe(startingCoins - 1);
    const later = run(state, { type: 'IDLE_TICK', at: 11_500 });
    expect(later.coins).toBe(startingCoins - 2);
  });

  it('does not start until the post has finished appearing', () => {
    const notShown = run(
      createInitialRoundState(),
      { type: 'START_ROUND', posts: makeDeck(), feedStyle: 'gallery', mode: 'curated', at: 0 },
      { type: 'IDLE_TICK', at: 30_000 },
    );
    expect(notShown.coins).toBe(startingCoins);

    const shown = run(
      notShown,
      { type: 'POST_SHOWN', at: 30_000 },
      { type: 'IDLE_TICK', at: 34_000 },
    );
    expect(shown.coins).toBe(startingCoins);
    expect(run(shown, { type: 'IDLE_TICK', at: 35_000 }).coins).toBe(startingCoins - 1);
  });

  it('waits again for POST_SHOWN after moving to the next post', () => {
    const state = run(
      startedRound(),
      { type: 'SKIP', at: 1_000 },
      { type: 'IDLE_TICK', at: 20_000 },
    );
    expect(state.coins).toBe(startingCoins);
  });

  it('is paused while the confirmation sheet is open', () => {
    const state = run(
      startedRound(),
      { type: 'REQUEST_READ', at: 1_000 },
      { type: 'IDLE_TICK', at: 60_000 },
    );
    expect(state.coins).toBe(startingCoins);
    const cancelled = run(
      state,
      { type: 'CANCEL_READ', at: 60_000 },
      { type: 'IDLE_TICK', at: 64_000 },
    );
    expect(cancelled.coins).toBe(startingCoins);
    expect(run(cancelled, { type: 'IDLE_TICK', at: 65_000 }).coins).toBe(startingCoins - 1);
  });

  it('is paused while a post is open', () => {
    const state = run(
      startedRound([makePost({ cost: 4 }), makePost()]),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CONFIRM_READ', at: 2 },
      { type: 'IDLE_TICK', at: 60_000 },
    );
    expect(state.coins).toBe(startingCoins - 4);
  });

  it('is paused externally (tab hidden, dialogs) and restarts its grace period on resume', () => {
    let state = run(
      startedRound(),
      { type: 'IDLE_TICK', at: 4_000 },
      { type: 'SET_IDLE_PAUSED', paused: true, at: 4_000 },
      { type: 'IDLE_TICK', at: 120_000 },
    );
    expect(state.coins).toBe(startingCoins);
    state = run(
      state,
      { type: 'SET_IDLE_PAUSED', paused: false, at: 120_000 },
      { type: 'IDLE_TICK', at: 124_999 },
    );
    expect(state.coins).toBe(startingCoins);
    expect(run(state, { type: 'IDLE_TICK', at: 125_000 }).coins).toBe(startingCoins - 1);
  });

  it('ignores activity while paused', () => {
    const state = run(
      startedRound(),
      { type: 'SET_IDLE_PAUSED', paused: true, at: 1_000 },
      { type: 'ACTIVITY', at: 2_000 },
      { type: 'IDLE_TICK', at: 30_000 },
    );
    expect(state.coins).toBe(startingCoins);
  });

  it('never goes below 0 and ends the round at 0 coins', () => {
    const state = run({ ...startedRound(), coins: 2 }, { type: 'IDLE_TICK', at: 60_000 });
    expect(state.coins).toBe(0);
    expect(state.ledger[0]!.amount).toBe(2);
    expect(state.status).toBe('ended');
    expect(state.endReason).toBe('out_of_coins');
    expect(run(state, { type: 'IDLE_TICK', at: 90_000 }).ledger).toHaveLength(1);
  });
});

describe('selectIdleState', () => {
  it('fills during the grace period, then reports draining', () => {
    const state = startedRound();
    expect(selectIdleState(state, 0)).toEqual({ progress: 0, draining: false, running: true });
    expect(selectIdleState(state, 2_500).progress).toBeCloseTo(0.5);
    expect(selectIdleState(state, 5_000)).toEqual({ progress: 1, draining: true, running: true });
  });

  it('is stopped while blocked', () => {
    const state = run(startedRound(), { type: 'REQUEST_READ', at: 1 });
    expect(selectIdleState(state, 10_000)).toEqual({
      progress: 0,
      draining: false,
      running: false,
    });
  });
});
