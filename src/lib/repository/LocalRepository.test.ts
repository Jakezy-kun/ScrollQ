import { DEFAULT_PREFS, usePrefs } from '@/lib/prefs';
import type { RoundRecord } from '@/lib/rounds/record';
import { recordFromRound } from '@/lib/rounds/record';
import { finishedRound } from '@/tests/fixtures';
import { LOCAL_ROUND_LIMIT, LocalRepository } from './LocalRepository';

function record(id: string, createdAt: string, sq?: number): RoundRecord {
  const r = recordFromRound(finishedRound(), id, createdAt);
  return sq === undefined ? r : { ...r, sq };
}

beforeEach(() => usePrefs.setState(DEFAULT_PREFS));

describe('LocalRepository', () => {
  it('saves guest rounds to localStorage and lists them newest first', async () => {
    const repo = new LocalRepository();
    await repo.saveRound(record('a', '2026-10-20T10:00:00.000Z'));
    await repo.saveRound(record('b', '2026-10-21T10:00:00.000Z'));

    expect((await repo.listRounds()).map((r) => r.id)).toEqual(['b', 'a']);
    expect(window.localStorage.getItem('scrollq:rounds')).toContain('"id":"a"');

    // A fresh instance reads the same data back from storage.
    const again = new LocalRepository();
    expect((await again.listRounds()).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('replaces a round with the same id instead of duplicating it', async () => {
    const repo = new LocalRepository();
    await repo.saveRound(record('a', '2026-10-20T10:00:00.000Z', 40));
    await repo.saveRound(record('a', '2026-10-20T10:00:00.000Z', 55));
    const rounds = await repo.listRounds();
    expect(rounds).toHaveLength(1);
    expect(rounds[0]?.sq).toBe(55);
  });

  it('gets one round, updates its reflection, and clears all', async () => {
    const repo = new LocalRepository();
    await repo.saveRound(record('a', '2026-10-20T10:00:00.000Z'));
    await repo.updateReflection('a', {
      trap: 'The quiz',
      worth: 'Sources',
      limit: 'No phone at 10',
    });
    expect((await repo.getRound('a'))?.reflection?.limit).toBe('No phone at 10');
    expect(await repo.getRound('missing')).toBeNull();

    await repo.clearRounds();
    expect(await repo.listRounds()).toEqual([]);
    expect(window.localStorage.getItem('scrollq:rounds')).toBeNull();
  });

  it('ignores corrupted storage', async () => {
    window.localStorage.setItem('scrollq:rounds', '{oops');
    expect(await new LocalRepository().listRounds()).toEqual([]);
  });

  it('keeps rounds in memory when storage is full or blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const repo = new LocalRepository();
    await expect(repo.saveRound(record('a', '2026-10-20T10:00:00.000Z'))).resolves.toBe('saved');
    expect((await repo.listRounds()).map((r) => r.id)).toEqual(['a']);
  });

  it('keeps at most the local limit, dropping the oldest rounds', async () => {
    const repo = new LocalRepository();
    const base = Date.parse('2026-01-01T00:00:00.000Z');
    for (let i = 0; i < LOCAL_ROUND_LIMIT + 3; i++) {
      await repo.saveRound(record(`r${i}`, new Date(base + i * 60_000).toISOString()));
    }
    const rounds = await repo.listRounds();
    expect(rounds).toHaveLength(LOCAL_ROUND_LIMIT);
    expect(rounds.some((r) => r.id === 'r0')).toBe(false);
  });

  it('keeps the guest profile in device preferences', async () => {
    const repo = new LocalRepository();
    await repo.updateProfile({ displayName: '  Skyler  ', avatar: 'fox' });
    expect(await repo.getProfile()).toEqual({
      displayName: 'Skyler',
      avatar: 'fox',
      createdAt: null,
    });
  });
});
