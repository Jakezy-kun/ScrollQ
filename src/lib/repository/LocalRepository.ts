import { usePrefs } from '@/lib/prefs';
import type { Reflection, RoundRecord } from '@/lib/rounds/record';
import { parseRoundRecords } from '@/lib/rounds/schema';
import { readJSON, removeKey, writeJSON } from '@/lib/storage';
import type { DataRepository, Profile, ProfilePatch, SaveOutcome } from './types';

const ROUNDS_KEY = 'rounds';
/** Keep device storage small; the oldest rounds drop off first. */
export const LOCAL_ROUND_LIMIT = 200;

function newestFirst(a: RoundRecord, b: RoundRecord) {
  return b.createdAt.localeCompare(a.createdAt);
}

/**
 * Guest data on this device, in localStorage. If storage is unavailable or full, rounds
 * stay in memory for the session, so the app keeps working and nothing crashes.
 */
export class LocalRepository implements DataRepository {
  readonly kind = 'local' as const;
  private memory: RoundRecord[] | null = null;

  private read(): RoundRecord[] {
    if (this.memory) return this.memory;
    this.memory = parseRoundRecords(readJSON<unknown>(ROUNDS_KEY, [])).sort(newestFirst);
    return this.memory;
  }

  private write(rounds: RoundRecord[]) {
    this.memory = [...rounds].sort(newestFirst).slice(0, LOCAL_ROUND_LIMIT);
    writeJSON(ROUNDS_KEY, this.memory);
  }

  async saveRound(record: RoundRecord): Promise<SaveOutcome> {
    this.write([record, ...this.read().filter((r) => r.id !== record.id)]);
    return 'saved';
  }

  async listRounds(): Promise<RoundRecord[]> {
    return [...this.read()];
  }

  async getRound(id: string): Promise<RoundRecord | null> {
    return this.read().find((r) => r.id === id) ?? null;
  }

  async updateReflection(id: string, reflection: Reflection): Promise<void> {
    this.write(this.read().map((r) => (r.id === id ? { ...r, reflection } : r)));
  }

  async clearRounds(): Promise<void> {
    this.memory = [];
    removeKey(ROUNDS_KEY);
  }

  async getProfile(): Promise<Profile> {
    const { nickname, avatar } = usePrefs.getState();
    return { displayName: nickname, avatar, createdAt: null };
  }

  async updateProfile(patch: ProfilePatch): Promise<Profile> {
    const { setPrefs } = usePrefs.getState();
    if (patch.displayName !== undefined)
      setPrefs({ nickname: patch.displayName.trim().slice(0, 24) });
    if (patch.avatar !== undefined) setPrefs({ avatar: patch.avatar });
    return this.getProfile();
  }

  /** Re-read from storage (e.g. after another tab changed it). */
  invalidate() {
    this.memory = null;
  }
}
