/**
 * Server only: finds a stock clip on Pixabay for a post's search words.
 * Used by the Vercel Function (api/videos.ts) and the Vite dev server (vite.config.ts).
 * App code may import the types, never the functions: they handle the secret API key.
 * Keep its imports relative (no `@/`, no JSON) so Vercel can run it as-is.
 */
import { VIDEO_QUERY_PATTERN } from '../content/videoQuery.js';

export interface PostVideo {
  url: string;
  /** Still frame for the clip, or '' if Pixabay gave none. */
  poster: string;
  width: number;
  height: number;
  /** Pixabay page for the clip, for credit. */
  pageUrl: string;
  user: string;
}

interface PixabaySize {
  url?: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface PixabayHit {
  pageURL?: string;
  user?: string;
  videos?: Partial<Record<'large' | 'medium' | 'small' | 'tiny', PixabaySize>>;
}

const CDN = 'https://cdn.pixabay.com/';
const DAY_SECONDS = 60 * 60 * 24;
/** Pixabay asks for results to be cached for 24 hours. Vercel's CDN keeps them that long. */
const CACHE_OK = `public, max-age=3600, s-maxage=${DAY_SECONDS}`;

/** Per-instance cache on top of the CDN one, so a warm server never asks twice a day. */
const memory = new Map<string, { at: number; video: PostVideo | null }>();

export function clearVideoCache(): void {
  memory.clear();
}

/** Shortest clip height that still looks sharp filling a phone-width post. */
const MIN_HEIGHT = 540;

/**
 * The smallest file (to save players' mobile data) that is at least MIN_HEIGHT tall,
 * else the tallest one there is. Only files on Pixabay's CDN count.
 */
function bestSize(hit: PixabayHit) {
  const sizes = (['tiny', 'small', 'medium'] as const).flatMap((name) => {
    const size = hit.videos?.[name];
    if (!size?.url?.startsWith(CDN) || !size.width || !size.height) return [];
    return [{ ...size, url: size.url, width: size.width, height: size.height }];
  });
  return (
    sizes.find((size) => size.height >= MIN_HEIGHT) ??
    sizes.reduce<(typeof sizes)[number] | undefined>(
      (tallest, size) => (!tallest || size.height > tallest.height ? size : tallest),
      undefined,
    )
  );
}

/** Pick a clip: the first portrait one (fits phone feeds best), otherwise the first one. */
export function pickVideo(hits: readonly PixabayHit[]): PostVideo | null {
  const usable = hits.flatMap((hit) => {
    const size = bestSize(hit);
    return size ? [{ hit, size }] : [];
  });
  const best = usable.find(({ size }) => size.height > size.width) ?? usable[0];
  if (!best) return null;
  const { hit, size } = best;
  return {
    url: size.url,
    poster: size.thumbnail?.startsWith(CDN) ? size.thumbnail : '',
    width: size.width,
    height: size.height,
    pageUrl: hit.pageURL?.startsWith('https://pixabay.com/') ? hit.pageURL : 'https://pixabay.com/',
    user: hit.user ?? '',
  };
}

function json(body: unknown, status: number, cacheControl: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cacheControl },
  });
}

/** GET /api/videos?q=<search words>  →  { video: PostVideo | null } */
export async function handleVideoRequest(
  params: URLSearchParams,
  apiKey: string | undefined,
  fetchImpl: typeof fetch = fetch,
  now: number = Date.now(),
): Promise<Response> {
  const q = params.get('q') ?? '';
  if (!VIDEO_QUERY_PATTERN.test(q)) return json({ error: 'Invalid search' }, 400, 'no-store');
  // 503 tells the app videos are switched off, so it stops asking for the session.
  if (!apiKey) return json({ error: 'Videos are not set up' }, 503, 'no-store');

  const cached = memory.get(q);
  if (cached && now - cached.at < DAY_SECONDS * 1000) {
    return json({ video: cached.video }, 200, CACHE_OK);
  }

  const url = new URL('https://pixabay.com/api/videos/');
  url.search = new URLSearchParams({
    key: apiKey,
    q,
    safesearch: 'true',
    video_type: 'film',
    per_page: '20',
  }).toString();

  try {
    const res = await fetchImpl(url);
    if (!res.ok) return json({ error: 'Video search failed' }, 502, 'no-store');
    const data = (await res.json()) as { hits?: PixabayHit[] };
    const video = pickVideo(Array.isArray(data.hits) ? data.hits : []);
    memory.set(q, { at: now, video });
    return json({ video }, 200, CACHE_OK);
  } catch {
    // Never echo the error: it could contain the request URL, and with it the key.
    return json({ error: 'Video search failed' }, 502, 'no-store');
  }
}
