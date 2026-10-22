import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ROUTES } from '@/app/routes';
import type { Post } from '@/engine';
import { GAME_CONFIG } from '@/engine';
import { useRound } from '@/hooks/useRound';
import { usePrefs } from '@/lib/prefs';
import { makePost } from '@/tests/fixtures';
import { renderRoute } from '@/tests/renderRoute';
import { RoundPage } from './RoundPage';

const others = [ROUTES.summary, ROUTES.feedSelect];

function deck(): Post[] {
  return [
    makePost({ title: 'Valuable one', body: 'SECRET BODY ONE', cost: 4, isTrap: false }),
    makePost({ title: 'Trap two', body: 'SECRET BODY TWO', cost: 6, isTrap: true }),
    makePost({ title: 'Valuable three', body: 'SECRET BODY THREE', cost: 5, isTrap: false }),
  ];
}

function startRound(posts = deck(), coins?: number) {
  const store = useRound.getState();
  store.start(posts, 'gallery');
  if (coins !== undefined) useRound.setState({ round: { ...useRound.getState().round, coins } });
  useRound.getState().postShown(posts[0]!.id);
  return posts;
}

const coins = () => useRound.getState().round.coins;

beforeEach(() => {
  useRound.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RoundPage', () => {
  it('sends players without a round to Pick your feed', async () => {
    renderRoute(ROUTES.round, <RoundPage />, { others });
    expect(await screen.findByText(`Page ${ROUTES.feedSelect}`)).toBeInTheDocument();
  });

  it('takes no coins until Confirm and keeps the body out of the DOM until then', async () => {
    const user = userEvent.setup();
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others });

    expect(screen.getByText('Valuable one')).toBeInTheDocument();
    expect(screen.queryByText('SECRET BODY ONE')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Read 4 coins' }));
    const sheet = screen.getByRole('dialog', { name: /open this post for/i });
    expect(within(sheet).getByText(/You'll have/)).toHaveTextContent("You'll have 96 left");
    expect(coins()).toBe(100);
    expect(screen.queryByText('SECRET BODY ONE')).not.toBeInTheDocument();

    await user.click(within(sheet).getByRole('button', { name: 'Confirm' }));
    expect(coins()).toBe(96);
    const detail = await screen.findByRole('dialog', { name: 'Valuable one' });
    expect(within(detail).getByText('SECRET BODY ONE')).toBeInTheDocument();
    expect(within(detail).getByText('Idle drain is paused while you read.')).toBeInTheDocument();

    await user.click(within(detail).getAllByRole('button', { name: 'Back to feed' })[0]!);
    await waitFor(() => expect(useRound.getState().round.index).toBe(1));
    expect(await screen.findByText('Trap two')).toBeInTheDocument();
  });

  it('Cancel takes nothing and keeps the same post', async () => {
    const user = userEvent.setup();
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others });

    await user.click(screen.getByRole('button', { name: 'Read 4 coins' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(coins()).toBe(100);
    expect(useRound.getState().round.index).toBe(0);
  });

  it('disables Confirm and says why when the player cannot afford a post', async () => {
    const user = userEvent.setup();
    startRound(deck(), 3);
    renderRoute(ROUTES.round, <RoundPage />, { others });

    await user.click(screen.getByRole('button', { name: 'Need 4 coins to read' }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(
      within(sheet).getByText('You need 4 coins but only have 3. Skip it or flag it instead.'),
    ).toBeInTheDocument();
  });

  it('gives neutral feedback on Skip and Flag without revealing traps', async () => {
    const user = userEvent.setup();
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others });

    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText('Skipped')).toBeInTheDocument();
    expect(useRound.getState().round.index).toBe(1);

    act(() => useRound.getState().postShown(useRound.getState().round.posts[1]!.id));
    await user.click(await screen.findByRole('button', { name: 'Flag as trap' }));
    expect(await screen.findByText('Flagged')).toBeInTheDocument();
    // Nothing on screen says whether the call was right until the summary.
    expect(screen.queryByText(/good call|bad call|was a trap/i)).not.toBeInTheDocument();
  });

  it('supports R / S / F on a keyboard, but not while a sheet is open', async () => {
    const user = userEvent.setup();
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others });

    await user.keyboard('r');
    const sheet = screen.getByRole('dialog', { name: /open this post for/i });
    // Keys typed while the sheet is open don't act on the post behind it.
    await user.keyboard('s');
    expect(useRound.getState().round.index).toBe(0);
    await user.click(within(sheet).getByRole('button', { name: 'Cancel' }));

    await user.keyboard('s');
    expect(await screen.findByText('Skipped')).toBeInTheDocument();
    expect(useRound.getState().round.index).toBe(1);

    act(() => useRound.getState().postShown(useRound.getState().round.posts[1]!.id));
    await user.keyboard('F');
    expect(await screen.findByText('Flagged')).toBeInTheDocument();
    expect(useRound.getState().round.decisions.map((d) => d.choice)).toEqual(['skip', 'flag']);
  });

  it('ignores the shortcuts when they are turned off in Settings', async () => {
    const user = userEvent.setup();
    usePrefs.setState({ keyboardShortcuts: false });
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others });

    await user.keyboard('srf');
    expect(useRound.getState().round.index).toBe(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    usePrefs.setState({ keyboardShortcuts: true });
  });

  it('drains idle coins after the grace period and shows the warning', () => {
    vi.useFakeTimers();
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others });

    act(() => vi.advanceTimersByTime(4_500));
    expect(coins()).toBe(100);
    expect(screen.queryByText('Idle scrolling still costs attention.')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3_000));
    expect(coins()).toBe(98);
    expect(screen.getByText('Idle scrolling still costs attention.')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Idle drain' })).toHaveAttribute(
      'data-state',
      'draining',
    );

    // Any interaction resets the clock.
    fireEvent.pointerDown(window);
    act(() => vi.advanceTimersByTime(4_000));
    expect(coins()).toBe(98);
  });

  it('pauses idle drain while the confirmation sheet is open', () => {
    vi.useFakeTimers();
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others });

    fireEvent.click(screen.getByRole('button', { name: 'Read 4 coins' }));
    act(() => vi.advanceTimersByTime(30_000));
    expect(coins()).toBe(100);
  });

  it('asks before leaving, keeps the round, and pauses drain while asking', async () => {
    const user = userEvent.setup();
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others: [...others, ROUTES.start] });

    await user.click(screen.getByRole('button', { name: 'Leave round' }));
    const sheet = screen.getByRole('dialog', { name: 'Leave this round?' });
    expect(within(sheet).getByRole('button', { name: 'Keep playing' })).toHaveFocus();
    // Shortcuts don't act on the post behind the sheet.
    await user.keyboard('s');
    expect(useRound.getState().round.index).toBe(0);

    await user.click(within(sheet).getByRole('button', { name: 'Keep playing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Leave round' }));
    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(await screen.findByText(`Page ${ROUTES.start}`)).toBeInTheDocument();
    expect(useRound.getState().round.status).toBe('playing');
  });

  it('does not drain idle coins while the leave sheet is open', () => {
    vi.useFakeTimers();
    startRound();
    renderRoute(ROUTES.round, <RoundPage />, { others });

    fireEvent.click(screen.getByRole('button', { name: 'Leave round' }));
    act(() => vi.advanceTimersByTime(30_000));
    expect(coins()).toBe(100);
  });

  describe('swipe up to skip (vertical feed)', () => {
    const touch = { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 100 };
    const swipe = (from: number, to: number) => {
      const feed = screen.getByRole('main', { name: 'Feed' });
      fireEvent.pointerDown(feed, { ...touch, clientY: from });
      fireEvent.pointerMove(feed, { ...touch, clientY: to });
      fireEvent.pointerUp(feed, { ...touch, clientY: to });
    };

    function startVertical() {
      const posts = deck();
      useRound.getState().start(posts, 'vertical');
      useRound.getState().postShown(posts[0]!.id);
      renderRoute(ROUTES.round, <RoundPage />, { others });
    }

    it('skips the post on a long swipe up', async () => {
      startVertical();
      swipe(600, 450);
      expect(await screen.findByText('Skipped')).toBeInTheDocument();
      expect(useRound.getState().round.decisions.map((d) => d.choice)).toEqual(['skip']);
    });

    it('ignores small drags, downward drags, sideways drags and mouse drags', () => {
      startVertical();
      swipe(600, 580);
      swipe(400, 600);
      const feed = screen.getByRole('main', { name: 'Feed' });
      fireEvent.pointerDown(feed, { ...touch, clientY: 600 });
      fireEvent.pointerMove(feed, { ...touch, clientX: 200, clientY: 590 });
      fireEvent.pointerUp(feed, { ...touch, clientX: 200, clientY: 400 });
      const mouse = { ...touch, pointerType: 'mouse' };
      fireEvent.pointerDown(feed, { ...mouse, clientY: 600 });
      fireEvent.pointerUp(feed, { ...mouse, clientY: 300 });
      expect(useRound.getState().round.index).toBe(0);
    });

    it('is off in the other feed styles', () => {
      startRound();
      renderRoute(ROUTES.round, <RoundPage />, { others });
      swipe(600, 300);
      expect(useRound.getState().round.index).toBe(0);
    });
  });

  it('shows the out-of-attention moment, then goes to the summary', () => {
    vi.useFakeTimers();
    startRound(deck(), 1);
    renderRoute(ROUTES.round, <RoundPage />, { others });

    act(() => vi.advanceTimersByTime(5_300));
    expect(coins()).toBe(0);
    expect(
      screen.getByRole('alertdialog', { name: "You're out of attention" }),
    ).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(GAME_CONFIG.outOfCoinsMomentMs + 50));
    expect(screen.getByText(`Page ${ROUTES.summary}`)).toBeInTheDocument();
  });
});
