import { makePost } from '@/tests/fixtures';
import { GAME_CONFIG } from './config';
import { buildDeck } from './deck';
import { seededRng } from './rng';

const pool = [
  ...Array.from({ length: 15 }, () => makePost({ isTrap: false })),
  ...Array.from({ length: 15 }, () => makePost({ isTrap: true })),
];

describe('buildDeck', () => {
  it('draws 12 unique posts, half traps', () => {
    const deck = buildDeck(pool, GAME_CONFIG, seededRng(1));
    expect(deck).toHaveLength(12);
    expect(new Set(deck.map((p) => p.id)).size).toBe(12);
    expect(deck.filter((p) => p.isTrap)).toHaveLength(6);
  });

  it('is deterministic for a seed and varies across seeds', () => {
    const a = buildDeck(pool, GAME_CONFIG, seededRng(42)).map((p) => p.id);
    const b = buildDeck(pool, GAME_CONFIG, seededRng(42)).map((p) => p.id);
    const c = buildDeck(pool, GAME_CONFIG, seededRng(7)).map((p) => p.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('fills from the other kind when one runs short', () => {
    const fewTraps = [
      ...pool.filter((p) => !p.isTrap),
      ...pool.filter((p) => p.isTrap).slice(0, 2),
    ];
    const deck = buildDeck(fewTraps, GAME_CONFIG, seededRng(3));
    expect(deck).toHaveLength(12);
    expect(deck.filter((p) => p.isTrap)).toHaveLength(2);
  });

  it('never draws more posts than the pool has', () => {
    expect(buildDeck(pool.slice(0, 5), GAME_CONFIG, seededRng(3))).toHaveLength(5);
  });
});
