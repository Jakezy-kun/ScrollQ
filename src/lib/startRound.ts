import { CuratedProvider } from '@/content/CuratedProvider';
import { LemmyProvider } from '@/content/LemmyProvider';
import type { PostProvider } from '@/content/provider';
import type { FeedStyle, RoundMode } from '@/engine';
import { GAME_CONFIG } from '@/engine';
import { useRound } from '@/hooks/useRound';
import { usePrefs } from './prefs';

const providers: Record<RoundMode, PostProvider> = {
  curated: new CuratedProvider(),
  live: new LemmyProvider(),
};

export interface StartResult {
  mode: RoundMode;
  /** True when Live was asked for but the curated pool was used instead. */
  fellBack: boolean;
}

/**
 * Draw a fresh round and make it the live round. If the live feed fails, is slow or is
 * blocked, the curated pool is used instead so the player can always play.
 */
export async function startNewRound(
  feedStyle: FeedStyle,
  mode: RoundMode = 'curated',
): Promise<StartResult> {
  usePrefs.getState().setPrefs({ lastFeedStyle: feedStyle, lastMode: mode });
  const count = GAME_CONFIG.postsPerRound;

  if (mode === 'live') {
    try {
      const posts = await providers.live.getPosts(count);
      useRound.getState().start(posts, feedStyle, 'live');
      return { mode: 'live', fellBack: false };
    } catch {
      // Fall through to curated.
    }
  }

  const posts = await providers.curated.getPosts(count);
  useRound.getState().start(posts, feedStyle, 'curated');
  return { mode: 'curated', fellBack: mode === 'live' };
}
