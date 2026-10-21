import type { FeedStyle } from '@/engine';

export const FEED_STYLE_NAME: Record<FeedStyle, string> = {
  vertical: 'Vertical',
  gallery: 'Gallery',
  timeline: 'Timeline',
};

export function formatRoundDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
