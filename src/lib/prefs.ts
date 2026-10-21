import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { FeedStyle, RoundMode } from '@/engine';
import { FEED_STYLES } from '@/engine';
import { safeStringStorage } from './storage';

/** Device preferences. Kept in localStorage for guests and signed-in players alike. */
export interface Prefs {
  onboardingSeen: boolean;
  /** Optional guest nickname (never a real name). */
  nickname: string;
  /** Built-in avatar id for guests (signed-in players keep theirs in their profile). */
  avatar: string | null;
  lastFeedStyle: FeedStyle;
  /** Curated (scored) or the optional Live feed. */
  lastMode: RoundMode;
  sound: boolean;
  vibration: boolean;
  /** App-level reduce motion, on top of the OS setting. */
  reduceMotion: boolean;
}

interface PrefsStore extends Prefs {
  setPrefs: (patch: Partial<Prefs>) => void;
  resetTutorial: () => void;
}

export const DEFAULT_PREFS: Prefs = {
  onboardingSeen: false,
  nickname: '',
  avatar: null,
  lastFeedStyle: 'vertical',
  lastMode: 'curated',
  // Off by default: many players will be in a classroom.
  sound: false,
  vibration: true,
  reduceMotion: false,
};

/** Drop anything malformed from storage and fall back to defaults. */
function sanitize(raw: unknown): Partial<Prefs> {
  if (typeof raw !== 'object' || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<Prefs> = {};
  if (typeof r.onboardingSeen === 'boolean') out.onboardingSeen = r.onboardingSeen;
  if (typeof r.nickname === 'string') out.nickname = r.nickname.slice(0, 24);
  if (typeof r.avatar === 'string' || r.avatar === null) out.avatar = r.avatar;
  if (
    typeof r.lastFeedStyle === 'string' &&
    (FEED_STYLES as readonly string[]).includes(r.lastFeedStyle)
  ) {
    out.lastFeedStyle = r.lastFeedStyle as FeedStyle;
  }
  if (r.lastMode === 'curated' || r.lastMode === 'live') out.lastMode = r.lastMode;
  if (typeof r.sound === 'boolean') out.sound = r.sound;
  if (typeof r.vibration === 'boolean') out.vibration = r.vibration;
  if (typeof r.reduceMotion === 'boolean') out.reduceMotion = r.reduceMotion;
  return out;
}

export const usePrefs = create<PrefsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFS,
      setPrefs: (patch) => set(patch),
      resetTutorial: () => set({ onboardingSeen: false }),
    }),
    {
      name: 'prefs',
      version: 1,
      storage: createJSONStorage(() => safeStringStorage('local')),
      partialize: ({ setPrefs: _s, resetTutorial: _r, ...prefs }) => prefs,
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
    },
  ),
);
