import { recordFromRound } from '@/lib/rounds/record';
import { fakeSupabase } from '@/tests/fakeSupabase';
import { finishedRound } from '@/tests/fixtures';
import { LocalRepository } from './LocalRepository';
import { migrateGuestRounds } from './migrateGuest';
import { fromRow, SupabaseRepository, toRow } from './SupabaseRepository';

const USER = 'user-1';
const record = (id: string, createdAt = '2026-10-22T08:00:00.000Z') =>
  recordFromRound(finishedRound(), id, createdAt);

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });
}

afterEach(() => setOnline(true));

describe('SupabaseRepository', () => {
  it('maps rounds to rows and back without losing anything', () => {
    const r = record('11111111-1111-4111-8111-111111111111');
    const row = { ...toRow(r, USER), user_id: USER, created_at: r.createdAt, reflection: null };
    expect(fromRow(row as Parameters<typeof fromRow>[0])).toEqual(r);
  });

  it('saves signed-in rounds to Supabase and lists them newest first', async () => {
    const { client, tables } = fakeSupabase();
    const repo = new SupabaseRepository(client, USER);

    await expect(repo.saveRound(record('a', '2026-10-20T08:00:00.000Z'))).resolves.toBe('saved');
    await repo.saveRound(record('b', '2026-10-21T08:00:00.000Z'));

    expect(tables.rounds!.get('a')).toMatchObject({ user_id: USER, sq: expect.any(Number) });
    expect((await repo.listRounds()).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('saves reflections and reads one round back', async () => {
    const { client } = fakeSupabase();
    const repo = new SupabaseRepository(client, USER);
    await repo.saveRound(record('a'));
    await repo.updateReflection('a', { trap: 'Quiz', worth: '', limit: '' });
    expect((await repo.getRound('a'))?.reflection?.trap).toBe('Quiz');
  });

  it('queues a round finished offline and uploads it when back online', async () => {
    const { client, tables, state } = fakeSupabase();
    setOnline(false);
    const repo = new SupabaseRepository(client, USER);

    await expect(repo.saveRound(record('offline'))).resolves.toBe('queued');
    await repo.updateReflection('offline', { trap: '', worth: 'Sources', limit: '' });
    expect(state.calls).toEqual([]);
    expect(repo.pendingCount).toBe(1);
    // Still visible in the list while waiting.
    state.failWith = { message: 'TypeError: Failed to fetch' };
    expect((await repo.listRounds()).map((r) => r.id)).toEqual(['offline']);

    // The queue survives a reload (new instance, same user).
    const reloaded = new SupabaseRepository(client, USER);
    expect(reloaded.pendingCount).toBe(1);

    state.failWith = null;
    setOnline(true);
    await expect(reloaded.flush()).resolves.toBe(1);
    expect(reloaded.pendingCount).toBe(0);
    expect(tables.rounds!.get('offline')).toMatchObject({ reflection: { worth: 'Sources' } });
  });

  it('queues instead of losing a round when the request fails', async () => {
    const { client, state } = fakeSupabase();
    state.failWith = { message: 'TypeError: Failed to fetch' };
    const repo = new SupabaseRepository(client, USER);
    await expect(repo.saveRound(record('net'))).resolves.toBe('queued');
    expect(repo.pendingCount).toBe(1);
  });

  it('reports bad data instead of retrying it forever', async () => {
    const { client, state } = fakeSupabase();
    state.failWith = { code: '23514', message: 'violates check constraint' };
    const repo = new SupabaseRepository(client, USER);
    await expect(repo.saveRound(record('bad'))).rejects.toMatchObject({ code: '23514' });
    expect(repo.pendingCount).toBe(0);
  });

  it('keeps each player’s queue separate', async () => {
    const { client } = fakeSupabase();
    setOnline(false);
    await new SupabaseRepository(client, 'alice').saveRound(record('x'));
    expect(new SupabaseRepository(client, 'bob').pendingCount).toBe(0);
  });
});

describe('guest-to-account migration', () => {
  it('uploads device rounds to the account, then clears the device copy', async () => {
    const { client, tables } = fakeSupabase();
    const local = new LocalRepository();
    await local.saveRound(record('g1', '2026-10-01T08:00:00.000Z'));
    await local.saveRound(record('g2', '2026-10-02T08:00:00.000Z'));
    const remote = new SupabaseRepository(client, USER);

    await expect(migrateGuestRounds(local, remote)).resolves.toBe(2);
    expect([...tables.rounds!.keys()].sort()).toEqual(['g1', 'g2']);
    expect(await local.listRounds()).toEqual([]);
  });

  it('keeps the device copy if an upload is rejected', async () => {
    const { client, state } = fakeSupabase();
    const local = new LocalRepository();
    await local.saveRound(record('g1'));
    state.failWith = { code: '22P02', message: 'invalid input' };
    await expect(
      migrateGuestRounds(local, new SupabaseRepository(client, USER)),
    ).rejects.toBeTruthy();
    expect(await local.listRounds()).toHaveLength(1);
  });

  it('never loses rounds when migrating offline: they wait in the queue', async () => {
    const { client } = fakeSupabase();
    setOnline(false);
    const local = new LocalRepository();
    await local.saveRound(record('g1'));
    const remote = new SupabaseRepository(client, USER);
    await migrateGuestRounds(local, remote);
    expect(remote.pendingCount).toBe(1);
    expect(remote.queue.pendingRounds().map((r) => r.id)).toEqual(['g1']);
  });
});
