import { z } from 'zod';
import type { Post } from '@/engine';
import { GAME_CONFIG } from '@/engine';
import type { PostProvider } from './provider';

export interface LiveFeedOptions {
  instance: string;
  sort: string;
  fetchLimit: number;
  timeoutMs: number;
  bodyMaxChars: number;
  titleMaxChars: number;
}

/** Live feed source settings. Lemmy is open-source and federated; no account needed to read. */
export const LIVE_FEED: LiveFeedOptions = {
  instance: 'https://lemmy.world',
  sort: 'Hot',
  /** Ask for more than a round needs; filtering removes some. */
  fetchLimit: 50,
  timeoutMs: 4000,
  bodyMaxChars: 700,
  titleMaxChars: 140,
};

/**
 * Best-effort school-safety filter on top of Lemmy's NSFW flags. Posts whose title or body
 * match are skipped. Not a guarantee, which is why Live mode is opt-in.
 */
const BLOCKLIST = new RegExp(
  [
    // profanity and sexual content
    String.raw`f+u+c+k\w*`,
    String.raw`sh[i1]t\w*`,
    String.raw`bitch\w*`,
    String.raw`cunt\w*`,
    String.raw`porn\w*`,
    'nsfw',
    String.raw`nude\w*`,
    'naked',
    String.raw`sex\w*`,
    'horny',
    'onlyfans',
    'cock',
    'dick',
    'pussy',
    'wtf',
    'stfu',
    // violence and self-harm
    String.raw`rape\w*`,
    String.raw`suicid\w*`,
    'self[- ]harm',
    'kill (him|her|them|yourself)',
    'gore',
    String.raw`murder\w*`,
    'massacre',
    'shooting',
    // drugs
    'cocaine',
    'heroin',
    'ketamine',
    'meth',
    'fentanyl',
    'weed',
    'stoned',
    // hate
    String.raw`nazi\w*`,
    String.raw`slur\w*`,
  ]
    .map((w) => String.raw`\b(?:${w})\b`)
    .join('|'),
  'i',
);

const SWATCHES = ['#3B2F6B', '#1E4A47', '#5B2645', '#22385E', '#4D3A1C', '#33285F', '#1F3F55'];

const postViewSchema = z.object({
  post: z.object({
    id: z.number(),
    name: z.string(),
    body: z.string().nullish(),
    url: z.string().nullish(),
    embed_description: z.string().nullish(),
    nsfw: z.boolean().default(false),
    removed: z.boolean().default(false),
    deleted: z.boolean().default(false),
  }),
  creator: z.object({
    name: z.string(),
    bot_account: z.boolean().default(false),
    banned: z.boolean().default(false),
  }),
  community: z.object({
    name: z.string(),
    nsfw: z.boolean().default(false),
    removed: z.boolean().default(false),
    deleted: z.boolean().default(false),
  }),
});
type PostView = z.infer<typeof postViewSchema>;

const responseSchema = z.object({ posts: z.array(z.unknown()) });

export class LiveFeedError extends Error {
  constructor(
    message: string,
    readonly reason: 'offline' | 'timeout' | 'http' | 'blocked' | 'not_enough',
  ) {
    super(message);
    this.name = 'LiveFeedError';
  }
}

/** Markdown/HTML to plain paragraphs. Links keep their text; images and raw URLs are dropped. */
export function toPlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~`]{1,3}/g, '')
    .replace(
      /&(amp|lt|gt|quot|#39|nbsp);/g,
      (m) =>
        ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' })[
          m
        ] ?? m,
    )
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).trimEnd()}…`;
}

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function hashColor(key: string): string {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SWATCHES[h % SWATCHES.length] ?? '#3B2F6B';
}

/** Cost grows with how much there is to read, within the configured range. */
export function costFor(textLength: number): number {
  const { min, max } = GAME_CONFIG.costRange;
  return Math.max(min, Math.min(max, min + Math.floor(textLength / 120)));
}

const instanceHost = new URL(LIVE_FEED.instance).hostname;

/** Turn one Lemmy post into a ScrollQ post, or null if it shouldn't be shown. */
export function mapLemmyPost(view: PostView): Post | null {
  const { post, creator, community } = view;
  if (post.nsfw || community.nsfw) return null;
  if (post.removed || post.deleted || community.removed || community.deleted) return null;
  if (creator.bot_account || creator.banned) return null;

  const title = truncate(toPlainText(post.name).replace(/\n+/g, ' '), LIVE_FEED.titleMaxChars);
  if (title.length < 4) return null;

  const host = hostOf(post.url);
  let body = toPlainText(post.body ?? '') || toPlainText(post.embed_description ?? '');
  if (!body && host) {
    body =
      /\.(jpe?g|png|gif|webp)$/i.test(post.url ?? '') || host.includes('pictrs')
        ? "This post is an image. ScrollQ doesn't load outside images, so the title is all there is."
        : `This post shares a link to ${host}. ScrollQ doesn't open outside links.`;
  }
  if (!body) body = 'This post is just a title.';
  body = truncate(body, LIVE_FEED.bodyMaxChars);

  if (BLOCKLIST.test(title) || BLOCKLIST.test(body) || BLOCKLIST.test(community.name)) return null;

  const author = `@${creator.name.replace(/[^\w.]/g, '').slice(0, 30) || 'someone'}`;
  return {
    id: `lemmy-${post.id}`,
    author,
    title,
    body,
    cost: costFor(title.length + body.length),
    skinMedia: { color: hashColor(community.name), glyph: '🌐' },
    isTrap: false,
    trapType: null,
    why: `Live post from c/${community.name} on ${instanceHost}.`,
  };
}

/**
 * Live posts from a public Lemmy instance's v3 API. Live posts carry no trusted trap
 * labels, so Live rounds are scored on budget use and the player's own ratings.
 * Throws LiveFeedError on any problem; callers fall back to the curated pool.
 */
export class LemmyProvider implements PostProvider {
  constructor(
    private readonly options: LiveFeedOptions = LIVE_FEED,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
  ) {}

  async getPosts(count: number): Promise<Post[]> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new LiveFeedError('Offline', 'offline');
    }
    const url = new URL('/api/v3/post/list', this.options.instance);
    url.searchParams.set('type_', 'All');
    url.searchParams.set('sort', this.options.sort);
    url.searchParams.set('limit', String(this.options.fetchLimit));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    let json: unknown;
    try {
      const res = await this.fetchImpl(url, {
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new LiveFeedError(`HTTP ${res.status}`, 'http');
      json = await res.json();
    } catch (error) {
      if (error instanceof LiveFeedError) throw error;
      if (controller.signal.aborted) throw new LiveFeedError('Timed out', 'timeout');
      throw new LiveFeedError('Request failed or was blocked', 'blocked');
    } finally {
      clearTimeout(timer);
    }

    const parsed = responseSchema.safeParse(json);
    if (!parsed.success) throw new LiveFeedError('Unexpected response', 'http');

    const seen = new Set<string>();
    const posts: Post[] = [];
    for (const raw of parsed.data.posts) {
      const view = postViewSchema.safeParse(raw);
      if (!view.success) continue;
      const mapped = mapLemmyPost(view.data);
      if (!mapped || seen.has(mapped.title.toLowerCase())) continue;
      seen.add(mapped.title.toLowerCase());
      posts.push(mapped);
      if (posts.length === count) return posts;
    }
    throw new LiveFeedError(`Only ${posts.length} usable posts`, 'not_enough');
  }
}
