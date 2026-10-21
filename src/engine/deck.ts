import type { GameConfig } from './config';
import { GAME_CONFIG } from './config';
import type { Rng } from './rng';
import { defaultRng, shuffle } from './rng';
import type { Post } from './types';

/**
 * Draws one round's posts from the pool: a balanced mix of traps and valuable posts
 * (per `trapShare`), shuffled. If one kind runs short, the other fills the gap.
 */
export function buildDeck(
  pool: readonly Post[],
  config: GameConfig = GAME_CONFIG,
  rng: Rng = defaultRng,
): Post[] {
  const size = Math.min(config.postsPerRound, pool.length);
  const traps = shuffle(
    pool.filter((p) => p.isTrap),
    rng,
  );
  const valuable = shuffle(
    pool.filter((p) => !p.isTrap),
    rng,
  );

  const wantTraps = Math.round(size * config.trapShare);
  const trapCount = Math.min(traps.length, Math.max(wantTraps, size - valuable.length));
  const valuableCount = size - trapCount;

  return shuffle([...traps.slice(0, trapCount), ...valuable.slice(0, valuableCount)], rng);
}
