import type { Post } from '@/engine';

/** A source of posts for a round. Curated is the default; a live source can plug in later. */
export interface PostProvider {
  getPosts(count: number): Promise<Post[]>;
}
