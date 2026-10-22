import type { ComponentType } from 'react';
import type { FeedStyle } from '@/engine';
import { ForumPost } from './ForumPost';
import { GalleryPost } from './GalleryPost';
import { TimelinePost } from './TimelinePost';
import type { PostSkinProps } from './types';
import { VerticalPost } from './VerticalPost';

export const POST_SKINS: Record<FeedStyle, ComponentType<PostSkinProps>> = {
  vertical: VerticalPost,
  gallery: GalleryPost,
  timeline: TimelinePost,
  forum: ForumPost,
};

export type { PostSkinProps } from './types';
export { Avatar, CostBadge, LockChip, LockedBody, MediaGlyph } from './PostBits';
export { mediaGradient, readLabel } from './postUi';
