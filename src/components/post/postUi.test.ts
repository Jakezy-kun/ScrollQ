import { makePost } from '@/tests/fixtures';
import { compactCount, displayName, engagement } from './postUi';

describe('engagement', () => {
  it('is stable per post and never depends on whether the post is a trap', () => {
    const valuable = makePost({ id: 'same', isTrap: false });
    const trap = makePost({ id: 'same', isTrap: true });
    expect(engagement(valuable)).toEqual(engagement(trap));
    expect(engagement(valuable)).toEqual(engagement(makePost({ id: 'same' })));
  });

  it('gives believable numbers', () => {
    for (let i = 0; i < 50; i++) {
      const e = engagement(makePost({ id: `p-${i}` }));
      expect(e.likes).toBeGreaterThanOrEqual(39);
      expect(e.likes).toBeLessThanOrEqual(100_000);
      expect(e.comments).toBeLessThan(e.likes);
      expect(e.views).toBeGreaterThan(e.likes);
      expect(e.hoursAgo).toBeGreaterThanOrEqual(1);
      expect(e.hoursAgo).toBeLessThanOrEqual(23);
    }
  });
});

it('formats counts and display names', () => {
  expect(compactCount(1234)).toBe('1.2K');
  expect(displayName('@factcheck.ph')).toBe('Factcheck PH');
  expect(displayName('@breaking.balita247')).toBe('Breaking Balita247');
});
