import { makeDeck, makePost, run, startedRound } from '@/tests/fixtures';
import { GAME_CONFIG } from './config';
import { createInitialRoundState } from './reducer';
import { selectCoinsSpent, selectCurrentPost } from './selectors';

const { startingCoins } = GAME_CONFIG;
const { trapRead, wrongFlag } = GAME_CONFIG.penalties;

describe('START_ROUND', () => {
  it('starts with full coins on the first post', () => {
    const state = startedRound();
    expect(state.status).toBe('playing');
    expect(state.coins).toBe(startingCoins);
    expect(state.index).toBe(0);
    expect(state.ledger).toEqual([]);
  });

  it('ignores gameplay actions before a round starts', () => {
    const state = run(createInitialRoundState(), { type: 'SKIP', at: 0 });
    expect(state.status).toBe('ready');
    expect(state.decisions).toEqual([]);
  });
});

describe('reading', () => {
  it('takes no coins when Read is requested, only on confirm', () => {
    const requested = run(startedRound(), { type: 'REQUEST_READ', at: 1 });
    expect(requested.pendingReadPostId).toBe(requested.posts[0]!.id);
    expect(requested.coins).toBe(startingCoins);
    expect(requested.ledger).toEqual([]);

    const confirmed = run(requested, { type: 'CONFIRM_READ', at: 2 });
    expect(confirmed.coins).toBe(startingCoins - 4);
    expect(confirmed.openPostId).toBe(confirmed.posts[0]!.id);
    expect(confirmed.ledger).toEqual([
      { seq: 1, reason: 'read', amount: 4, postId: confirmed.posts[0]!.id, at: 2 },
    ]);
  });

  it('cancel takes nothing and stays on the same post', () => {
    const state = run(
      startedRound(),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CANCEL_READ', at: 2 },
    );
    expect(state.coins).toBe(startingCoins);
    expect(state.pendingReadPostId).toBeNull();
    expect(state.index).toBe(0);
    expect(state.decisions).toEqual([]);
  });

  it('cannot confirm without requesting first', () => {
    const state = run(startedRound(), { type: 'CONFIRM_READ', at: 1 });
    expect(state.coins).toBe(startingCoins);
    expect(state.openPostId).toBeNull();
  });

  it('refuses to confirm a post the player cannot afford', () => {
    const posts = [makePost({ cost: 8 }), makePost()];
    let state = startedRound(posts);
    state = { ...state, coins: 5 };
    state = run(state, { type: 'REQUEST_READ', at: 1 }, { type: 'CONFIRM_READ', at: 2 });
    expect(state.coins).toBe(5);
    expect(state.openPostId).toBeNull();
    expect(state.pendingReadPostId).toBe(posts[0]!.id);
  });

  it('valuable read is a good call and advances on close', () => {
    let state = run(
      startedRound(),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CONFIRM_READ', at: 2 },
    );
    expect(state.decisions[0]).toMatchObject({ choice: 'read', verdict: 'good' });
    expect(state.index).toBe(0);
    state = run(state, { type: 'CLOSE_POST', at: 3 });
    expect(state.openPostId).toBeNull();
    expect(state.index).toBe(1);
  });

  it('trap read is a bad call plus the trap penalty', () => {
    const posts = [makePost({ isTrap: true, cost: 6 }), makePost()];
    const state = run(
      startedRound(posts),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CONFIRM_READ', at: 2 },
    );
    expect(state.coins).toBe(startingCoins - 6 - trapRead);
    expect(state.decisions[0]).toMatchObject({ choice: 'read', verdict: 'bad' });
    expect(state.ledger.map((e) => [e.reason, e.amount])).toEqual([
      ['read', 6],
      ['trap_penalty', trapRead],
    ]);
  });

  it('clamps the trap penalty so coins never go below 0', () => {
    const posts = [makePost({ isTrap: true, cost: 6 }), makePost()];
    let state = { ...startedRound(posts), coins: 8 };
    state = run(state, { type: 'REQUEST_READ', at: 1 }, { type: 'CONFIRM_READ', at: 2 });
    expect(state.coins).toBe(0);
    expect(state.ledger.map((e) => e.amount)).toEqual([6, 2]);
  });

  it('a read that empties the purse still opens the post, then ends the round on close', () => {
    const posts = [makePost({ cost: 4 }), makePost(), makePost()];
    let state = { ...startedRound(posts), coins: 4 };
    state = run(state, { type: 'REQUEST_READ', at: 1 }, { type: 'CONFIRM_READ', at: 2 });
    expect(state.coins).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.openPostId).toBe(posts[0]!.id);
    state = run(state, { type: 'CLOSE_POST', at: 3 });
    expect(state.status).toBe('ended');
    expect(state.endReason).toBe('out_of_coins');
  });
});

describe('skip and flag', () => {
  it('skip is free: trap is a good call, valuable is missed', () => {
    const posts = [makePost({ isTrap: true }), makePost({ isTrap: false }), makePost()];
    const state = run(
      startedRound(posts),
      { type: 'SKIP', at: 1 },
      { type: 'POST_SHOWN', at: 2 },
      { type: 'SKIP', at: 3 },
    );
    expect(state.coins).toBe(startingCoins);
    expect(state.decisions.map((d) => d.verdict)).toEqual(['good', 'missed']);
    expect(state.index).toBe(2);
  });

  it('flagging a trap is a good call and free', () => {
    const posts = [makePost({ isTrap: true }), makePost()];
    const state = run(startedRound(posts), { type: 'FLAG', at: 1 });
    expect(state.coins).toBe(startingCoins);
    expect(state.decisions[0]).toMatchObject({ choice: 'flag', verdict: 'good' });
  });

  it('flagging a valuable post is a bad call with the wrong-flag penalty', () => {
    const posts = [makePost({ isTrap: false }), makePost()];
    const state = run(startedRound(posts), { type: 'FLAG', at: 1 });
    expect(state.coins).toBe(startingCoins - wrongFlag);
    expect(state.decisions[0]).toMatchObject({ choice: 'flag', verdict: 'bad' });
    expect(state.ledger[0]).toMatchObject({ reason: 'wrong_flag', amount: wrongFlag });
  });

  it('a wrong flag that empties the purse ends the round', () => {
    const posts = [makePost({ isTrap: false }), makePost(), makePost()];
    const state = run({ ...startedRound(posts), coins: 2 }, { type: 'FLAG', at: 1 });
    expect(state.coins).toBe(0);
    expect(state.ledger[0]!.amount).toBe(2);
    expect(state.status).toBe('ended');
    expect(state.endReason).toBe('out_of_coins');
  });

  it('skip and flag are ignored while the confirmation sheet is open', () => {
    const state = run(
      startedRound(),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'SKIP', at: 2 },
      { type: 'FLAG', at: 3 },
    );
    expect(state.decisions).toEqual([]);
    expect(state.index).toBe(0);
  });
});

describe('round end', () => {
  it('ends after the 12th post', () => {
    let state = startedRound(makeDeck(12));
    for (let i = 0; i < 11; i++) {
      state = run(state, { type: 'SKIP', at: i * 10 }, { type: 'POST_SHOWN', at: i * 10 + 1 });
    }
    expect(state.status).toBe('playing');
    expect(selectCurrentPost(state)?.id).toBe(state.posts[11]!.id);
    state = run(state, { type: 'SKIP', at: 200 });
    expect(state.status).toBe('ended');
    expect(state.endReason).toBe('complete');
    expect(state.decisions).toHaveLength(12);
  });

  it('ends after reading the 12th post when it is closed', () => {
    let state = startedRound(makeDeck(12));
    for (let i = 0; i < 11; i++)
      state = run(state, { type: 'SKIP', at: i }, { type: 'POST_SHOWN', at: i });
    state = run(state, { type: 'REQUEST_READ', at: 50 }, { type: 'CONFIRM_READ', at: 51 });
    expect(state.status).toBe('playing');
    state = run(state, { type: 'CLOSE_POST', at: 52 });
    expect(state.endReason).toBe('complete');
  });

  it('END_ROUND ends early and ignores further actions', () => {
    let state = run(startedRound(), { type: 'END_ROUND', at: 5 });
    expect(state.status).toBe('ended');
    expect(state.endReason).toBe('quit');
    state = run(state, { type: 'SKIP', at: 6 });
    expect(state.decisions).toEqual([]);
  });
});

describe('ledger', () => {
  it('ledger total always equals coins spent', () => {
    const posts = [
      makePost({ isTrap: false, cost: 5 }),
      makePost({ isTrap: true, cost: 7 }),
      makePost({ isTrap: false, cost: 3 }),
      makePost({ isTrap: true, cost: 4 }),
    ];
    const state = run(
      startedRound(posts),
      { type: 'REQUEST_READ', at: 1 },
      { type: 'CONFIRM_READ', at: 2 },
      { type: 'CLOSE_POST', at: 3 },
      { type: 'POST_SHOWN', at: 4 },
      { type: 'REQUEST_READ', at: 5 },
      { type: 'CONFIRM_READ', at: 6 },
      { type: 'CLOSE_POST', at: 7 },
      { type: 'POST_SHOWN', at: 8 },
      { type: 'IDLE_TICK', at: 8 + 9_000 },
      { type: 'FLAG', at: 8 + 9_001 },
    );
    expect(selectCoinsSpent(state)).toBe(startingCoins - state.coins);
    expect(state.ledger.map((e) => e.reason)).toEqual([
      'read',
      'read',
      'trap_penalty',
      'idle',
      'wrong_flag',
    ]);
  });
});
