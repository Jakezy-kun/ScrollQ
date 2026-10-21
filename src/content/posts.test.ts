import { GAME_CONFIG, seededRng, TRAP_TYPES } from '@/engine';
import { CuratedProvider, curatedPosts } from './CuratedProvider';
import rawPosts from './posts.json';
import { parsePosts } from './schema';

describe('curated posts.json', () => {
  it('passes schema validation', () => {
    expect(() => parsePosts(rawPosts)).not.toThrow();
  });

  it('has 30 posts: 15 valuable and 15 traps', () => {
    expect(curatedPosts).toHaveLength(30);
    expect(curatedPosts.filter((p) => p.isTrap)).toHaveLength(15);
    expect(curatedPosts.filter((p) => !p.isTrap)).toHaveLength(15);
  });

  it('keeps every cost within the configured range', () => {
    const { min, max } = GAME_CONFIG.costRange;
    for (const p of curatedPosts) {
      expect(p.cost).toBeGreaterThanOrEqual(min);
      expect(p.cost).toBeLessThanOrEqual(max);
    }
  });

  it('uses every trap type', () => {
    const used = new Set(curatedPosts.map((p) => p.trapType).filter(Boolean));
    expect([...used].sort()).toEqual([...TRAP_TYPES].sort());
  });

  it('gives every post a why line', () => {
    expect(curatedPosts.every((p) => p.why.trim().length > 0)).toBe(true);
  });

  it('includes the prototype posts', () => {
    const titles = curatedPosts.map((p) => p.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        'PAGASA typhoon update: what to prepare',
        'Part 47 of a 90-part story time',
        '5 study habits backed by research',
        'Free Python course for beginners',
        'This group is RUINING the country',
        'Drink this to cure any illness in 3 days',
        'Only 1% can solve this — comment your answer',
        'How to check if a news photo is real',
        'Budgeting tips for students on allowance',
        'Why sleep matters before exams',
        "You WON'T believe what this teacher did!!!",
        'Celebrity says shocking thing (unverified)',
      ]),
    );
  });

  it('rejects malformed posts', () => {
    const bad = [{ ...rawPosts[0], cost: 20 }];
    expect(() => parsePosts(bad)).toThrow();
    const mismatched = [{ ...rawPosts[0], isTrap: true, trapType: null }];
    expect(() => parsePosts(mismatched)).toThrow();
  });
});

describe('CuratedProvider', () => {
  it('returns a balanced round of the requested size', async () => {
    const posts = await new CuratedProvider(curatedPosts, GAME_CONFIG, seededRng(9)).getPosts(12);
    expect(posts).toHaveLength(12);
    expect(posts.filter((p) => p.isTrap)).toHaveLength(6);
  });
});
