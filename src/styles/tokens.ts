/**
 * Design tokens: the single source for colors, radii and motion.
 * Tailwind reads these (tailwind.config.ts) and so can components that need raw values.
 */
export const colors = {
  /** bg-deep: page background behind the app column */
  deep: '#110D20',
  /** bg: app background */
  base: '#1B1530',
  surface: '#2A2148',
  'surface-2': '#352A5C',
  /** text */
  fg: '#FFFFFF',
  /** text-muted */
  muted: '#B8B1D1',
  /** primary buttons, warnings, idle */
  coral: '#FF4D6D',
  /** accent, progress, Back to feed */
  violet: '#7B61FF',
  /** good / valuable */
  mint: '#2EC4A0',
  /** coins, the Q */
  amber: '#FFB703',
} as const;

export const radii = {
  card: '16px',
  'card-lg': '20px',
  sheet: '28px',
} as const;

/** Motion durations in ms. Keep transitions quick and purposeful. */
export const durations = {
  fast: 150,
  base: 200,
  slow: 250,
} as const;

/** Shared easing curve (ease-out-quint-ish), taken from the prototype. */
export const easeOut = [0.23, 1, 0.32, 1] as const;
/** Sheet / drawer curve. */
export const easeSheet = [0.32, 0.72, 0, 1] as const;

/** Minimum touch target in px. */
export const minTap = 44;

/** Width of the centered app column on larger screens. */
export const appColumnWidth = 430;
