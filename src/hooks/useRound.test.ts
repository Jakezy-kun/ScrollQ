import { makeDeck } from '@/tests/fixtures';
import { useRound } from './useRound';

beforeEach(() => useRound.getState().reset());

describe('useRound finished snapshot', () => {
  it('snapshots the round once when it ends, and clears it on a new round', () => {
    const store = useRound.getState();
    store.start(makeDeck(2), 'timeline');
    expect(useRound.getState().finished).toBeNull();

    const [first, second] = useRound.getState().round.posts;
    store.postShown(first!.id);
    store.skip(first!.id);
    store.postShown(second!.id);
    store.skip(second!.id);

    const finished = useRound.getState().finished;
    expect(finished?.saved).toBe(false);
    expect(finished?.record.feedStyle).toBe('timeline');
    expect(finished?.record.totalPosts).toBe(2);

    store.markSaved(finished!.record.id);
    expect(useRound.getState().finished?.saved).toBe(true);

    store.setReflection(finished!.record.id, { trap: 'x', worth: '', limit: '' });
    expect(useRound.getState().finished?.record.reflection?.trap).toBe('x');

    store.start(makeDeck(), 'gallery');
    expect(useRound.getState().finished).toBeNull();
  });

  it('ignores taps meant for a post that is no longer current', () => {
    const store = useRound.getState();
    store.start(makeDeck(3), 'vertical');
    const [first] = useRound.getState().round.posts;
    store.postShown(first!.id);
    store.skip(first!.id);
    store.skip(first!.id); // double tap on the post that is animating out
    expect(useRound.getState().round.decisions).toHaveLength(1);
  });
});
