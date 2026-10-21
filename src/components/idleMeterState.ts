import { mixHex } from '@/lib/color';
import { colors } from '@/styles/tokens';

export type IdleMeterState = 'calm' | 'filling' | 'draining';

export function idleMeterState(progress: number, draining: boolean): IdleMeterState {
  if (draining) return 'draining';
  return progress > 0 ? 'filling' : 'calm';
}

/** mint → amber → coral as the grace period runs out. */
export function idleMeterColor(progress: number): string {
  return progress < 0.5
    ? mixHex(colors.mint, colors.amber, progress * 2)
    : mixHex(colors.amber, colors.coral, (progress - 0.5) * 2);
}
