import type { GameConfig, Post, Rng } from '@/engine';
import { buildDeck, defaultRng, GAME_CONFIG } from '@/engine';
import rawPosts from './posts.json';
import type { PostProvider } from './provider';
import { parsePosts } from './schema';

/** The bundled, offline curated pool, validated once at load. */
export const curatedPosts: readonly Post[] = parsePosts(rawPosts);

/** Draws a balanced, shuffled round from the curated pool. Works offline. */
export class CuratedProvider implements PostProvider {
  constructor(
    private readonly pool: readonly Post[] = curatedPosts,
    private readonly config: GameConfig = GAME_CONFIG,
    private readonly rng: Rng = defaultRng,
  ) {}

  getPosts(count: number): Promise<Post[]> {
    const config = { ...this.config, postsPerRound: count };
    return Promise.resolve(buildDeck(this.pool, config, this.rng));
  }
}
