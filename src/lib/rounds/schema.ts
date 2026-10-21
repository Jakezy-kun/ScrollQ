import { z } from 'zod';
import { FEED_STYLES, TRAP_TYPES } from '@/engine';
import type { Reflection, RoundRecord } from './record';

const REFLECTION_MAX = 500;

export const reflectionSchema = z.object({
  trap: z.string().max(REFLECTION_MAX),
  worth: z.string().max(REFLECTION_MAX),
  limit: z.string().max(REFLECTION_MAX),
}) satisfies z.ZodType<Reflection>;

const ledgerEntrySchema = z.object({
  seq: z.number().int(),
  reason: z.enum(['read', 'trap_penalty', 'wrong_flag', 'idle']),
  amount: z.number().int().nonnegative(),
  postId: z.string().nullable(),
  at: z.number(),
});

const revealRecordSchema = z.object({
  postId: z.string(),
  author: z.string(),
  title: z.string(),
  isTrap: z.boolean(),
  trapType: z.enum(TRAP_TYPES).nullable(),
  cost: z.number().int(),
  choice: z.enum(['read', 'skip', 'flag', 'not_reached']),
  verdict: z.enum(['good', 'bad', 'missed']),
  coinImpact: z.number().int().nonnegative(),
  why: z.string(),
  rating: z.enum(['worth', 'not_worth']).nullish(),
});

export const roundRecordSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  mode: z.enum(['curated', 'live']),
  feedStyle: z.enum(FEED_STYLES),
  sq: z.number().int().min(0).max(100),
  label: z.string(),
  coinsLeft: z.number().int().min(0),
  goodCalls: z.number().int().min(0),
  totalPosts: z.number().int().min(0),
  ledger: z.array(ledgerEntrySchema),
  decisions: z.array(revealRecordSchema),
  reflection: reflectionSchema.nullable(),
}) satisfies z.ZodType<RoundRecord>;

export const REFLECTION_MAX_LENGTH = REFLECTION_MAX;

/** Keep only well-formed records; anything malformed in storage is dropped, not fatal. */
export function parseRoundRecords(raw: unknown): RoundRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = roundRecordSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}
