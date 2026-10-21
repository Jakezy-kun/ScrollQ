import type { Post, RoundAction, RoundState } from '@/engine';
import { createInitialRoundState, roundReducer } from '@/engine';

let counter = 0;

export function makePost(overrides: Partial<Post> = {}): Post {
  counter += 1;
  const isTrap = overrides.isTrap ?? false;
  return {
    id: `p${counter}`,
    author: '@tester',
    title: `Post ${counter}`,
    body: 'Body text',
    cost: 4,
    skinMedia: { color: '#3B2F6B', glyph: '📘' },
    isTrap,
    trapType: isTrap ? 'clickbait' : null,
    why: 'Because.',
    ...overrides,
  };
}

/** 12 posts alternating valuable / trap, all costing `cost`. */
export function makeDeck(count = 12, cost = 4): Post[] {
  return Array.from({ length: count }, (_, i) => makePost({ isTrap: i % 2 === 1, cost }));
}

/** Apply actions in order to a state. */
export function run(state: RoundState, ...actions: RoundAction[]): RoundState {
  return actions.reduce(roundReducer, state);
}

/** A playing round with the first post already shown at t = 0. */
export function startedRound(posts: Post[] = makeDeck()): RoundState {
  return run(
    createInitialRoundState(),
    { type: 'START_ROUND', posts, feedStyle: 'vertical', mode: 'curated', at: 0 },
    { type: 'POST_SHOWN', at: 0 },
  );
}

/**
 * A finished 4-post round: read a valuable post (−4), flag a trap, skip a valuable post,
 * then quit, leaving one post not reached.
 */
export function finishedRound(): RoundState {
  const posts = [
    makePost({ isTrap: false, cost: 4, title: 'Useful tips', why: 'Practical and sourced.' }),
    makePost({ isTrap: true, cost: 5, title: 'Shocking claim', why: 'No source at all.' }),
    makePost({ isTrap: false, cost: 3, title: 'Study guide', why: 'Helps with exams.' }),
    makePost({ isTrap: true, cost: 6, title: 'Endless series', why: 'Built to waste time.' }),
  ];
  return run(
    startedRound(posts),
    { type: 'REQUEST_READ', at: 1 },
    { type: 'CONFIRM_READ', at: 2 },
    { type: 'CLOSE_POST', at: 3 },
    { type: 'POST_SHOWN', at: 4 },
    { type: 'FLAG', at: 5 },
    { type: 'POST_SHOWN', at: 6 },
    { type: 'SKIP', at: 7 },
    { type: 'END_ROUND', at: 8 },
  );
}
