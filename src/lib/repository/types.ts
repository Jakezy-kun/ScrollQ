import type { Reflection, RoundRecord } from '@/lib/rounds/record';

export interface Profile {
  /** Nickname, never a real name. */
  displayName: string;
  /** Id of one of the built-in avatars, or null. */
  avatar: string | null;
  /** ISO date the account was created; null for guests. */
  createdAt: string | null;
}

/** 'queued' means it will upload when the connection is back. Nothing is ever dropped. */
export type SaveOutcome = 'saved' | 'queued';

export type ProfilePatch = Partial<Pick<Profile, 'displayName' | 'avatar'>>;

/**
 * The one place screens save and load player data. Guests use LocalRepository;
 * signed-in players use SupabaseRepository (Phase 4). Screens never know which.
 */
export interface DataRepository {
  readonly kind: 'local' | 'supabase';
  /** Insert or replace a round (by id). */
  saveRound(record: RoundRecord): Promise<SaveOutcome>;
  /** All rounds, newest first. */
  listRounds(): Promise<RoundRecord[]>;
  getRound(id: string): Promise<RoundRecord | null>;
  updateReflection(id: string, reflection: Reflection): Promise<void>;
  clearRounds(): Promise<void>;
  getProfile(): Promise<Profile>;
  updateProfile(patch: ProfilePatch): Promise<Profile>;
}
