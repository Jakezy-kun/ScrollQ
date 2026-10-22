import type { CSSProperties } from 'react';
import type { Post } from '@/engine';
import { mixHex } from '@/lib/color';
import { colors } from '@/styles/tokens';

/** Gradient built from a post's skin color, used for media areas and avatars. */
export function mediaGradient(color: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(150deg, ${mixHex(color, '#FFFFFF', 0.12)} 0%, ${color} 45%, ${mixHex(color, colors.deep, 0.55)} 100%)`,
  };
}

/**
 * Accessible name for a Read button. It starts with the visible label ("Read 4" /
 * "Need 8") so speech and voice-control users hear and say what they see (WCAG 2.5.3).
 */
export function readLabel(cost: number, canAfford: boolean): string {
  return canAfford ? `Read ${cost} coins` : `Need ${cost} coins to read`;
}

/** FNV-1a, so the same post always gets the same made-up numbers. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable value in [0, 1) for a post and a salt. */
function unit(post: Post, salt: string): number {
  return (hash(`${post.id}:${salt}`) % 10007) / 10007;
}

export interface Engagement {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  hoursAgo: number;
}

/**
 * Decorative engagement numbers for the skins. They depend only on the post id, never on
 * whether it's a trap, so they can't be used as a hint. (Like real feeds: popular ≠ worth it.)
 */
export function engagement(post: Post): Engagement {
  const likes = Math.round(10 ** (1.6 + unit(post, 'likes') * 3.4));
  return {
    likes,
    comments: Math.max(1, Math.round(likes * (0.02 + unit(post, 'comments') * 0.1))),
    shares: Math.max(1, Math.round(likes * (0.01 + unit(post, 'shares') * 0.07))),
    views: Math.round(likes * (8 + unit(post, 'views') * 22)),
    hoursAgo: 1 + Math.floor(unit(post, 'age') * 23),
  };
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** 1234 → "1.2K". */
export function compactCount(n: number): string {
  return compact.format(n);
}

/** "@factcheck.ph" → "factcheck.ph" */
export function bareHandle(author: string): string {
  return author.replace(/^@/, '');
}

/** "@factcheck.ph" → "Factcheck PH", a made-up display name for the Timeline skin. */
export function displayName(author: string): string {
  return bareHandle(author)
    .split(/[._]+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** Community shown by the Forum skin, without the "c/" prefix. */
export function communityOf(post: Post): string {
  return post.community ?? 'general';
}
