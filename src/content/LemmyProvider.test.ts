import { GAME_CONFIG } from '@/engine';
import {
  costFor,
  LemmyProvider,
  LIVE_FEED,
  LiveFeedError,
  mapLemmyPost,
  toPlainText,
} from './LemmyProvider';
import { startNewRound } from '@/lib/startRound';
import { useRound } from '@/hooks/useRound';

let nextId = 1;
function view(overrides: { post?: object; creator?: object; community?: object } = {}) {
  nextId += 1;
  return {
    post: {
      id: nextId,
      name: `Interesting post number ${nextId}`,
      body: 'Some **bold** text with a [link](https://example.com).\n\nSecond paragraph.',
      nsfw: false,
      removed: false,
      deleted: false,
      ...overrides.post,
    },
    creator: { name: 'reader_42', bot_account: false, banned: false, ...overrides.creator },
    community: { name: 'technology', nsfw: false, ...overrides.community },
  };
}

function fakeFetch(body: unknown, init: { status?: number; delayMs?: number } = {}) {
  return vi.fn((_url: RequestInfo | URL, opts?: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      const t = setTimeout(
        () =>
          resolve(
            new Response(JSON.stringify(body), {
              status: init.status ?? 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
        init.delayMs ?? 0,
      );
      opts?.signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  });
}

const many = (n: number) => ({ posts: Array.from({ length: n }, () => view()) });

describe('toPlainText', () => {
  it('strips markdown, HTML, images and raw URLs, keeping paragraphs', () => {
    expect(
      toPlainText(
        '# Title\n\nSee ![img](a.png) **this** [site](https://x.y) <b>now</b> https://raw.link',
      ),
    ).toBe('Title\n\nSee this site now');
  });
});

describe('mapLemmyPost', () => {
  it('maps a post with a made-up style handle, a cost from its length and no trap label', () => {
    const post = mapLemmyPost(view() as Parameters<typeof mapLemmyPost>[0]);
    expect(post).toMatchObject({
      author: '@reader_42',
      isTrap: false,
      trapType: null,
      body: 'Some bold text with a link.\n\nSecond paragraph.',
    });
    expect(post!.id).toMatch(/^lemmy-\d+$/);
    expect(post!.cost).toBeGreaterThanOrEqual(GAME_CONFIG.costRange.min);
    expect(post!.cost).toBeLessThanOrEqual(GAME_CONFIG.costRange.max);
  });

  it.each([
    ['NSFW posts', { post: { nsfw: true } }],
    ['NSFW communities', { community: { nsfw: true } }],
    ['removed posts', { post: { removed: true } }],
    ['bot accounts', { creator: { bot_account: true } }],
    ['posts that fail the school-safe filter', { post: { name: 'This is some porn stuff' } }],
  ])('filters out %s', (_label, overrides) => {
    expect(mapLemmyPost(view(overrides) as Parameters<typeof mapLemmyPost>[0])).toBeNull();
  });

  it('describes image-only posts without loading the image', () => {
    const post = mapLemmyPost(
      view({ post: { body: null, url: 'https://img.example.com/cat.jpg' } }) as Parameters<
        typeof mapLemmyPost
      >[0],
    );
    expect(post?.body).toMatch(/doesn't load outside images/);
  });

  it('truncates long bodies', () => {
    const post = mapLemmyPost(
      view({ post: { body: 'word '.repeat(400) } }) as Parameters<typeof mapLemmyPost>[0],
    );
    expect(post!.body.length).toBeLessThanOrEqual(LIVE_FEED.bodyMaxChars + 1);
    expect(post!.body.endsWith('…')).toBe(true);
    expect(post!.cost).toBe(GAME_CONFIG.costRange.max);
  });

  it('prices short posts at the minimum', () => {
    expect(costFor(10)).toBe(GAME_CONFIG.costRange.min);
  });
});

describe('LemmyProvider', () => {
  it('fetches Hot posts from the v3 API and returns the requested count', async () => {
    const fetchImpl = fakeFetch(many(20));
    const posts = await new LemmyProvider(LIVE_FEED, fetchImpl).getPosts(12);
    expect(posts).toHaveLength(12);
    const url = String(fetchImpl.mock.calls[0]![0]);
    expect(url).toContain('/api/v3/post/list');
    expect(url).toContain('type_=All');
    expect(url).toContain('sort=Hot');
    expect(fetchImpl.mock.calls[0]![1]).toMatchObject({ credentials: 'omit' });
  });

  it('fails when the request is slower than the timeout', async () => {
    const provider = new LemmyProvider(
      { ...LIVE_FEED, timeoutMs: 20 },
      fakeFetch(many(20), { delayMs: 200 }),
    );
    await expect(provider.getPosts(12)).rejects.toMatchObject({ reason: 'timeout' });
  });

  it('fails on HTTP errors, blocked requests, and too few usable posts', async () => {
    await expect(
      new LemmyProvider(LIVE_FEED, fakeFetch({}, { status: 503 })).getPosts(12),
    ).rejects.toBeInstanceOf(LiveFeedError);
    const blocked = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(new LemmyProvider(LIVE_FEED, blocked).getPosts(12)).rejects.toMatchObject({
      reason: 'blocked',
    });
    await expect(
      new LemmyProvider(LIVE_FEED, fakeFetch(many(5))).getPosts(12),
    ).rejects.toMatchObject({ reason: 'not_enough' });
  });
});

describe('startNewRound fallback', () => {
  beforeEach(() => useRound.getState().reset());

  it('uses the curated pool when the live feed fails', async () => {
    vi.spyOn(LemmyProvider.prototype, 'getPosts').mockRejectedValue(
      new LiveFeedError('x', 'timeout'),
    );
    await expect(startNewRound('gallery', 'live')).resolves.toEqual({
      mode: 'curated',
      fellBack: true,
    });
    expect(useRound.getState().round.mode).toBe('curated');
    expect(useRound.getState().round.posts).toHaveLength(12);
  });

  it('starts a Live round when the feed works', async () => {
    const posts = many(12).posts.map((v) => mapLemmyPost(v as Parameters<typeof mapLemmyPost>[0])!);
    vi.spyOn(LemmyProvider.prototype, 'getPosts').mockResolvedValue(posts);
    await expect(startNewRound('timeline', 'live')).resolves.toEqual({
      mode: 'live',
      fellBack: false,
    });
    expect(useRound.getState().round.mode).toBe('live');
  });
});

describe('school-safe filter', () => {
  it.each(['Ketamine addict says things', 'What the fucking heck', 'A shooting downtown'])(
    'skips "%s"',
    (name) => {
      expect(
        mapLemmyPost(view({ post: { name } }) as Parameters<typeof mapLemmyPost>[0]),
      ).toBeNull();
    },
  );

  it('does not flag innocent words that contain blocked ones', () => {
    for (const name of ['A better method for studying', 'Dickens novels ranked']) {
      expect(
        mapLemmyPost(view({ post: { name } }) as Parameters<typeof mapLemmyPost>[0]),
      ).not.toBeNull();
    }
  });
});
