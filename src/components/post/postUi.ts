import type { CSSProperties } from 'react';
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
