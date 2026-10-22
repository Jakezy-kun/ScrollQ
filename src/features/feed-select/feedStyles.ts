import type { FeedStyle } from '@/engine';

export const FEED_STYLE_OPTIONS: { id: FeedStyle; name: string; description: string }[] = [
  {
    id: 'vertical',
    name: 'Vertical',
    description: 'Full-screen posts, one at a time, like short-video apps.',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    description: 'Square photos with likes and captions, like picture-sharing apps.',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Short text posts with replies and reposts, like micro-blogging apps.',
  },
  {
    id: 'forum',
    name: 'Forum',
    description: 'Posts in topic communities with up-votes, like discussion-board apps.',
  },
];
