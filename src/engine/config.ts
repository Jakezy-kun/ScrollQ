/**
 * Every tunable game number lives here. Change values in this file only;
 * the engine, selectors and UI all read from it.
 */

export type SqLabelKey = 'mindful' | 'getting_there' | 'autopilot';
export type Tone = 'mint' | 'amber' | 'coral';

export interface SqLabelRule {
  /** Lowest SQ (inclusive) that earns this label. */
  min: number;
  key: SqLabelKey;
  label: string;
  tone: Tone;
  message: string;
}

export interface GameConfig {
  startingCoins: number;
  postsPerRound: number;
  /** Share of each round's posts that are traps (0–1). */
  trapShare: number;
  costRange: { min: number; max: number };
  idle: {
    /** Grace period with no interaction before draining starts. */
    delayMs: number;
    /** Time between drains once draining. */
    drainEveryMs: number;
    /** Coins taken per drain. */
    drainAmount: number;
    /** How often the UI checks the idle clock. Timing itself is timestamp-based. */
    checkEveryMs: number;
  };
  penalties: {
    /** Extra coins lost when a trap is read (on top of its cost). */
    trapRead: number;
    /** Coins lost when a valuable post is flagged as a trap. */
    wrongFlag: number;
  };
  sq: {
    /** Weight of the good-calls percentage. */
    goodCallWeight: number;
    /** Weight of the coins-left percentage. */
    coinsWeight: number;
  };
  /** Live mode SQ: no trap scoring, so it uses the player's own ratings and the budget. */
  liveSq: {
    /** Weight of the share of reading coins spent on posts rated "worth it". */
    worthWeight: number;
    /** Weight of the coins-left percentage. */
    coinsWeight: number;
  };
  /** Sorted from highest `min` to lowest; the first rule the SQ reaches wins. */
  labels: readonly SqLabelRule[];
  /** How long the "You're out of attention" moment shows before the summary. */
  outOfCoinsMomentMs: number;
}

export const GAME_CONFIG: GameConfig = {
  startingCoins: 100,
  postsPerRound: 12,
  trapShare: 0.5,
  costRange: { min: 3, max: 8 },
  idle: {
    delayMs: 5000,
    drainEveryMs: 2000,
    drainAmount: 1,
    checkEveryMs: 250,
  },
  penalties: {
    trapRead: 5,
    wrongFlag: 3,
  },
  sq: {
    goodCallWeight: 0.8,
    coinsWeight: 0.2,
  },
  liveSq: {
    worthWeight: 0.6,
    coinsWeight: 0.4,
  },
  labels: [
    {
      min: 85,
      key: 'mindful',
      label: 'Mindful Scroller',
      tone: 'mint',
      message: 'You spent your attention like it was worth something. Because it is.',
    },
    {
      min: 60,
      key: 'getting_there',
      label: 'Getting There',
      tone: 'amber',
      message: 'Good instincts. A few posts still slipped past your guard.',
    },
    {
      min: 0,
      key: 'autopilot',
      label: 'Autopilot',
      tone: 'coral',
      message: 'The feed was steering. Next round, you take the wheel.',
    },
  ],
  outOfCoinsMomentMs: 1600,
};
