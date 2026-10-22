import { z } from 'zod';
import { GAME_CONFIG, TRAP_TYPES } from '@/engine';
import { VIDEO_QUERY_PATTERN } from './videoQuery';
import type { Post } from '@/engine';

const { min, max } = GAME_CONFIG.costRange;

export const postSchema = z
  .object({
    id: z.string().min(1),
    author: z.string().regex(/^@[\w.]+$/, 'author must be a made-up @handle'),
    title: z.string().min(1).max(120),
    body: z.string().min(1),
    cost: z.number().int().min(min).max(max),
    skinMedia: z.object({
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      glyph: z.string().min(1),
    }),
    community: z
      .string()
      .regex(/^[a-z0-9_]{2,30}$/, 'community must be a lowercase name like "studytips"')
      .optional(),
    videoQuery: z
      .string()
      .regex(VIDEO_QUERY_PATTERN, 'videoQuery must be 2-40 lowercase letters and spaces')
      .optional(),
    isTrap: z.boolean(),
    trapType: z.enum(TRAP_TYPES).nullable(),
    why: z.string().min(1).max(160),
  })
  .refine((p) => p.isTrap === (p.trapType !== null), {
    message: 'trapType must be set exactly when isTrap is true',
  });

export const postListSchema = z
  .array(postSchema)
  .refine((posts) => new Set(posts.map((p) => p.id)).size === posts.length, {
    message: 'post ids must be unique',
  });

/** Validates raw JSON as posts. Throws with a readable message if the content is malformed. */
export function parsePosts(raw: unknown): Post[] {
  return postListSchema.parse(raw);
}
