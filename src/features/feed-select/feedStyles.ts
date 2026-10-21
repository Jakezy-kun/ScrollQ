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
    description: 'Photo cards with captions, like picture-sharing apps.',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Text-first posts in a stream, like micro-blogging apps.',
  },
];
