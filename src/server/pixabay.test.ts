import type { PixabayHit } from './pixabay';
import { clearVideoCache, handleVideoRequest, pickVideo } from './pixabay';

const CDN = 'https://cdn.pixabay.com/video/2024/01/01/1-1_tiny';

function hit(width: number, height: number, n = 1): PixabayHit {
  return {
    pageURL: `https://pixabay.com/videos/clip-${n}/`,
    user: `maker${n}`,
    videos: {
      tiny: { url: `${CDN}${n}.mp4`, width, height, thumbnail: `${CDN}${n}.jpg` },
      small: { url: `${CDN}${n}-small.mp4`, width: width * 2, height: height * 2 },
    },
  };
}

function fakeFetch(body: unknown, ok = true) {
  return vi.fn(async () => ({ ok, json: async () => body }) as Response);
}

const params = (q: string) => new URLSearchParams({ q });

beforeEach(() => clearVideoCache());

describe('pickVideo', () => {
  it('prefers a portrait clip and uses the smallest file', () => {
    const video = pickVideo([hit(640, 360, 1), hit(360, 640, 2)]);
    expect(video).toEqual({
      url: `${CDN}2.mp4`,
      poster: `${CDN}2.jpg`,
      width: 360,
      height: 640,
      pageUrl: 'https://pixabay.com/videos/clip-2/',
      user: 'maker2',
    });
  });

  it('takes a bigger file when the smallest would look blurry', () => {
    const old: PixabayHit = {
      videos: {
        tiny: { url: `${CDN}-270.mp4`, width: 480, height: 270 },
        small: { url: `${CDN}-540.mp4`, width: 960, height: 540 },
        medium: { url: `${CDN}-1080.mp4`, width: 1920, height: 1080 },
      },
    };
    expect(pickVideo([old])?.url).toBe(`${CDN}-540.mp4`);
    const onlyTiny: PixabayHit = {
      videos: { tiny: { url: `${CDN}-t.mp4`, width: 480, height: 270 } },
    };
    expect(pickVideo([onlyTiny])?.url).toBe(`${CDN}-t.mp4`);
  });

  it('falls back to the first clip, and ignores anything not on Pixabay’s CDN', () => {
    const offsite: PixabayHit = {
      videos: { tiny: { url: 'https://evil.example/x.mp4', width: 1, height: 2 } },
    };
    expect(pickVideo([offsite, hit(640, 360, 3)])?.url).toBe(`${CDN}3-small.mp4`);
    expect(pickVideo([offsite])).toBeNull();
    expect(pickVideo([])).toBeNull();
  });
});

describe('handleVideoRequest', () => {
  it('rejects anything that is not plain search words, without calling Pixabay', async () => {
    const fetchImpl = fakeFetch({ hits: [] });
    for (const q of ['', 'a', 'Cats', 'cat&key=x', 'x'.repeat(41)]) {
      expect((await handleVideoRequest(params(q), 'KEY', fetchImpl)).status).toBe(400);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('answers 503 when no key is set up', async () => {
    const res = await handleVideoRequest(params('cat'), undefined, fakeFetch({}));
    expect(res.status).toBe(503);
  });

  it('searches with safe search on and caches the answer for 24 hours', async () => {
    const fetchImpl = fakeFetch({ hits: [hit(360, 640)] });
    const res = await handleVideoRequest(params('cat'), 'KEY', fetchImpl, 0);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=86400');
    expect(((await res.json()) as { video: { url: string } }).video.url).toBe(`${CDN}1.mp4`);

    const url = new URL(String((fetchImpl.mock.calls[0] as unknown[])[0]));
    expect(url.origin + url.pathname).toBe('https://pixabay.com/api/videos/');
    expect(url.searchParams.get('safesearch')).toBe('true');
    expect(url.searchParams.get('q')).toBe('cat');

    await handleVideoRequest(params('cat'), 'KEY', fetchImpl, 23 * 3600 * 1000);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await handleVideoRequest(params('cat'), 'KEY', fetchImpl, 25 * 3600 * 1000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns a null video when nothing matches, and 502 without the key when Pixabay fails', async () => {
    const empty = await handleVideoRequest(params('zzz'), 'KEY', fakeFetch({ hits: [] }));
    expect(await empty.json()).toEqual({ video: null });

    const failing = vi.fn(async () => {
      throw new Error('fetch failed for https://pixabay.com/api/videos/?key=SECRET');
    });
    const res = await handleVideoRequest(params('dog'), 'SECRET', failing);
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain('SECRET');
    expect((await handleVideoRequest(params('owl'), 'KEY', fakeFetch({}, false))).status).toBe(502);
  });
});
