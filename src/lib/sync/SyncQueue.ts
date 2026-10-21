import { z } from 'zod';
import type { Reflection, RoundRecord } from '@/lib/rounds/record';
import { reflectionSchema, roundRecordSchema } from '@/lib/rounds/schema';
import { readJSON, writeJSON } from '@/lib/storage';

export type SyncOp =
  | { kind: 'saveRound'; record: RoundRecord }
  | { kind: 'updateReflection'; id: string; reflection: Reflection };

const opSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('saveRound'), record: roundRecordSchema }),
  z.object({ kind: z.literal('updateReflection'), id: z.string(), reflection: reflectionSchema }),
]);

/**
 * Writes a signed-in player made while offline (or while the session was refreshing),
 * kept in localStorage per user until they reach Supabase. Rounds are never dropped.
 */
export class SyncQueue {
  private readonly key: string;
  private ops: SyncOp[];

  constructor(userId: string) {
    this.key = `syncQueue:${userId}`;
    const raw = readJSON<unknown>(this.key, []);
    this.ops = Array.isArray(raw)
      ? raw.flatMap((op) => {
          const parsed = opSchema.safeParse(op);
          return parsed.success ? [parsed.data] : [];
        })
      : [];
  }

  get size(): number {
    return this.ops.length;
  }

  /** Rounds waiting to upload (with any queued reflection already applied). */
  pendingRounds(): RoundRecord[] {
    return this.ops.flatMap((op) => (op.kind === 'saveRound' ? [op.record] : []));
  }

  enqueue(op: SyncOp) {
    if (op.kind === 'saveRound') {
      this.ops = [
        ...this.ops.filter((o) => !(o.kind === 'saveRound' && o.record.id === op.record.id)),
        op,
      ];
    } else {
      // A reflection for a round that hasn't uploaded yet travels with that round.
      const pending = this.ops.find((o) => o.kind === 'saveRound' && o.record.id === op.id);
      if (pending && pending.kind === 'saveRound') {
        pending.record = { ...pending.record, reflection: op.reflection };
      } else {
        this.ops = [
          ...this.ops.filter((o) => !(o.kind === 'updateReflection' && o.id === op.id)),
          op,
        ];
      }
    }
    this.persist();
  }

  /**
   * Send queued writes in order. Stops at the first failure and keeps the rest.
   * Returns how many were sent.
   */
  async flush(send: (op: SyncOp) => Promise<void>): Promise<number> {
    let sent = 0;
    while (this.ops.length > 0) {
      const [op] = this.ops;
      if (!op) break;
      try {
        await send(op);
      } catch {
        break;
      }
      this.ops = this.ops.slice(1);
      this.persist();
      sent += 1;
    }
    return sent;
  }

  private persist() {
    writeJSON(this.key, this.ops);
  }
}
