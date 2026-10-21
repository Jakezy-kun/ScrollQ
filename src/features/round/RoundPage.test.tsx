import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ROUTES } from '@/app/routes';
import type { Post } from '@/engine';
import { GAME_CONFIG } from '@/engine';
import { useRound } from '@/hooks/useRound';
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
