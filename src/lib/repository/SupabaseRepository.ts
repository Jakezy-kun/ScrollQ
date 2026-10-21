import type { ScrollQSupabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import type { Json } from '@/lib/supabase/json';
import type { Reflection, RoundRecord } from '@/lib/rounds/record';
import { roundRecordSchema } from '@/lib/rounds/schema';
import type { SyncOp } from '@/lib/sync/SyncQueue';
import { SyncQueue } from '@/lib/sync/SyncQueue';
import type { DataRepository, Profile, ProfilePatch, SaveOutcome } from './types';

type RoundRow = Database['public']['Tables']['rounds']['Row'];
type RoundInsert = Database['public']['Tables']['rounds']['Insert'];

const LIST_LIMIT = 500;

export function toRow(record: RoundRecord, userId: string): RoundInsert {
  return {
    id: record.id,
    user_id: userId,
    created_at: record.createdAt,
    mode: record.mode,
    feed_style: record.feedStyle,
    sq: record.sq,
    label: record.label,
    coins_left: record.coinsLeft,
    good_calls: record.goodCalls,
    total_posts: record.totalPosts,
    ledger: record.ledger as unknown as Json,
    decisions: record.decisions as unknown as Json,
    reflection: (record.reflection ?? null) as unknown as Json,
  };
}

/** Map a row back to a record, or null if it doesn't look like one (never trust storage). */
export function fromRow(row: RoundRow): RoundRecord | null {
  const parsed = roundRecordSchema.safeParse({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    mode: row.mode,
    feedStyle: row.feed_style,
    sq: row.sq,
    label: row.label,
    coinsLeft: row.coins_left,
    goodCalls: row.good_calls,
    totalPosts: row.total_posts,
    ledger: row.ledger,
    decisions: row.decisions,
    reflection: row.reflection,
  });
  return parsed.success ? parsed.data : null;
}

/**
 * Errors worth retrying later (offline, timeouts, an expiring session) versus errors that
 * would fail again (bad data). Postgres class 22/23 codes are data or constraint errors.
 */
function isRetryable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  return !(code.startsWith('22') || code.startsWith('23'));
}

function online(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

/** Signed-in player data in Supabase, protected by Row Level Security. */
export class SupabaseRepository implements DataRepository {
  readonly kind = 'supabase' as const;
  readonly queue: SyncQueue;

  constructor(
    private readonly client: ScrollQSupabase,
    readonly userId: string,
  ) {
    this.queue = new SyncQueue(userId);
  }

  private async send(op: SyncOp): Promise<void> {
    if (op.kind === 'saveRound') {
      const { error } = await this.client.from('rounds').upsert(toRow(op.record, this.userId));
      if (error) throw error;
    } else {
      const { error } = await this.client
        .from('rounds')
        .update({ reflection: op.reflection as unknown as Json })
        .eq('id', op.id);
      if (error) throw error;
    }
  }

  /** Try now; if that isn't possible, queue it so it uploads later. */
  private async sendOrQueue(op: SyncOp): Promise<SaveOutcome> {
    if (online() && this.queue.size === 0) {
      try {
        await this.send(op);
        return 'saved';
      } catch (error) {
        if (!isRetryable(error as { code?: string })) throw error;
      }
    }
    this.queue.enqueue(op);
    void this.flush();
    return 'queued';
  }

  /** Upload anything queued. Safe to call often. */
  async flush(): Promise<number> {
    if (!online() || this.queue.size === 0) return 0;
    return this.queue.flush((op) => this.send(op));
  }

  get pendingCount(): number {
    return this.queue.size;
  }

  saveRound(record: RoundRecord): Promise<SaveOutcome> {
    return this.sendOrQueue({ kind: 'saveRound', record });
  }

  async updateReflection(id: string, reflection: Reflection): Promise<void> {
    await this.sendOrQueue({ kind: 'updateReflection', id, reflection });
  }

  async listRounds(): Promise<RoundRecord[]> {
    const pending = this.queue.pendingRounds();
    const { data, error } = await this.client
      .from('rounds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(LIST_LIMIT);
    if (error) {
      // Offline: show what we have locally instead of failing.
      if (pending.length > 0 && isRetryable(error)) return pending;
      throw error;
    }
    const remote = (data ?? []).flatMap((row) => {
      const r = fromRow(row);
      return r ? [r] : [];
    });
    const pendingIds = new Set(pending.map((r) => r.id));
    return [...pending, ...remote.filter((r) => !pendingIds.has(r.id))].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async getRound(id: string): Promise<RoundRecord | null> {
    const pending = this.queue.pendingRounds().find((r) => r.id === id);
    if (pending) return pending;
    const { data, error } = await this.client.from('rounds').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? fromRow(data) : null;
  }

  async clearRounds(): Promise<void> {
    const { error } = await this.client.from('rounds').delete().eq('user_id', this.userId);
    if (error) throw error;
  }

  async getProfile(): Promise<Profile> {
    const { data, error } = await this.client
      .from('profiles')
      .select('display_name, avatar, created_at')
      .eq('id', this.userId)
      .maybeSingle();
    if (error) throw error;
    return {
      displayName: data?.display_name ?? 'Player',
      avatar: data?.avatar ?? null,
      createdAt: data?.created_at ?? null,
    };
  }

  async updateProfile(patch: ProfilePatch): Promise<Profile> {
    const update: Database['public']['Tables']['profiles']['Update'] = {};
    if (patch.displayName !== undefined)
      update.display_name = patch.displayName.trim().slice(0, 24);
    if (patch.avatar !== undefined) update.avatar = patch.avatar;
    const { error } = await this.client.from('profiles').update(update).eq('id', this.userId);
    if (error) throw error;
    return this.getProfile();
  }
}
