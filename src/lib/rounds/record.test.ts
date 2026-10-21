import { selectBreakdown } from '@/engine';
import { finishedRound } from '@/tests/fixtures';
import { recordFromRound, summaryFromRecord } from './record';
import { parseRoundRecords, roundRecordSchema } from './schema';

const createdAt = '2026-10-22T08:00:00.000Z';

describe('round records', () => {
  it('snapshots every post, including ones never reached', () => {
    const record = recordFromRound(finishedRound(), 'r1', createdAt);
    expect(record).toMatchObject({
      id: 'r1',
      createdAt,
      mode: 'curated',
      feedStyle: 'vertical',
      coinsLeft: 96,
      goodCalls: 2,
      totalPosts: 4,
      reflection: null,
    });
    expect(record.decisions.map((d) => [d.title, d.choice, d.verdict, d.coinImpact])).toEqual([
      ['Useful tips', 'read', 'good', 4],
      ['Shocking claim', 'flag', 'good', 0],
      ['Study guide', 'skip', 'missed', 0],
      ['Endless series', 'not_reached', 'missed', 0],
    ]);
    expect(record.decisions[1]?.why).toBe('No source at all.');
  });

  it('rebuilds the same summary from a saved record', () => {
    const state = finishedRound();
    const record = recordFromRound(state, 'r1', createdAt);
    const summary = summaryFromRecord(record);
    expect(summary.breakdown).toEqual(selectBreakdown(state));
    expect(summary.sq).toBe(record.sq);
    expect(summary.label.label).toBe(record.label);
  });

  it('passes its own schema and survives a JSON round trip', () => {
    const record = recordFromRound(finishedRound(), 'r1', createdAt);
    expect(roundRecordSchema.safeParse(JSON.parse(JSON.stringify(record))).success).toBe(true);
  });

  it('drops malformed records instead of failing', () => {
    const good = recordFromRound(finishedRound(), 'r1', createdAt);
    expect(parseRoundRecords([good, { id: 'broken' }, 42, null])).toEqual([good]);
    expect(parseRoundRecords('not an array')).toEqual([]);
  });
});
