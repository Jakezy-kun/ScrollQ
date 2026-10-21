import type { Post } from '@/engine';

/** Props shared by every feed skin. Skins only render; they never touch game state. */
export interface PostSkinProps {
  post: Post;
  canAfford: boolean;
  onRead: () => void;
  onSkip: () => void;
  onFlag: () => void;
}
