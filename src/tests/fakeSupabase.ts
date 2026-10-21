import type { ScrollQSupabase } from '@/lib/supabase/client';

type Row = Record<string, unknown>;
type PgError = { code?: string; message: string };

/**
 * A tiny in-memory stand-in for the Supabase query builder, covering only the calls
 * the repository makes. `failWith` makes every request fail (e.g. offline).
 */
export function fakeSupabase() {
  const tables: Record<string, Map<string, Row>> = { rounds: new Map(), profiles: new Map() };
  const state = { failWith: null as PgError | null, calls: [] as string[] };

  function query(table: string) {
    const filters: Array<[string, unknown]> = [];
    let op: 'select' | 'upsert' | 'update' | 'delete' = 'select';
    let payload: Row = {};
    let single = false;

    const run = () => {
      state.calls.push(`${op}:${table}`);
      if (state.failWith) return { data: null, error: state.failWith };
      const rows = tables[table]!;
      const matches = [...rows.values()].filter((r) => filters.every(([k, v]) => r[k] === v));
      switch (op) {
        case 'upsert':
          rows.set(String(payload.id), { ...rows.get(String(payload.id)), ...payload });
          return { data: null, error: null };
        case 'update':
          for (const r of matches) Object.assign(r, payload);
          return { data: null, error: null };
        case 'delete':
          for (const r of matches) rows.delete(String(r.id));
          return { data: null, error: null };
        default: {
          const sorted = matches.sort((a, b) =>
            String(b.created_at).localeCompare(String(a.created_at)),
          );
          return { data: single ? (sorted[0] ?? null) : sorted, error: null };
        }
      }
    };

    const builder = {
      select: () => builder,
      upsert: (row: Row) => ((op = 'upsert'), (payload = row), builder),
      update: (patch: Row) => ((op = 'update'), (payload = patch), builder),
      delete: () => ((op = 'delete'), builder),
      eq: (col: string, value: unknown) => (filters.push([col, value]), builder),
      order: () => builder,
      limit: () => builder,
      maybeSingle: () => ((single = true), builder),
      then: <T>(resolve: (v: ReturnType<typeof run>) => T) => Promise.resolve(run()).then(resolve),
    };
    return builder;
  }

  const client = { from: (table: string) => query(table) } as unknown as ScrollQSupabase;
  return { client, tables, state };
}
