/** Linear mix of two #RRGGBB colors; t = 0 gives a, t = 1 gives b. */
export function mixHex(a: string, b: string, t: number): string {
  const clamp = Math.max(0, Math.min(1, t));
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const pa = channels(a);
  const pb = channels(b);
  const out = pa.map((v, i) => Math.round(v + ((pb[i] ?? v) - v) * clamp));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
