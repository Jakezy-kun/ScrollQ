import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ROUTES } from '@/app/routes';
import { useRound } from '@/hooks/useRound';
import { DEFAULT_PREFS, usePrefs } from '@/lib/prefs';
import { renderRoute } from '@/tests/renderRoute';
import { FeedSelectPage } from './feed-select/FeedSelectPage';
import { HowToPage } from './howto/HowToPage';
import { OnboardingPage } from './onboarding/OnboardingPage';
import { StartPage } from './start/StartPage';

beforeEach(() => {
  usePrefs.setState(DEFAULT_PREFS);
  useRound.getState().reset();
});

describe('Start', () => {
  it('shows onboarding on first run', async () => {
    renderRoute(ROUTES.start, <StartPage />, { others: [ROUTES.onboarding] });
    expect(await screen.findByText(`Page ${ROUTES.onboarding}`)).toBeInTheDocument();
  });

  it('shows the tagline, Play and How to Play once onboarding is seen', () => {
    usePrefs.setState({ onboardingSeen: true });
    renderRoute(ROUTES.start, <StartPage />);
    expect(screen.getByText("What's your Scroll Quotient?")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How to Play' })).toBeInTheDocument();
    expect(screen.getByText('12 posts · about 3 minutes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });
});

describe('Onboarding', () => {
  it('walks through 3 slides, then saves an optional guest nickname', async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.onboarding, <OnboardingPage />, { others: [ROUTES.start] });

    expect(screen.getByRole('heading', { name: 'Your attention is a budget' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByRole('heading', {
        name: 'Every post has a price, and standing still costs too',
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByRole('heading', { name: 'Get your Scroll Quotient' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('button', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I already have an account' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play as guest' }));
    await user.type(screen.getByLabelText(/Nickname/), 'Skyler');
    await user.click(screen.getByRole('button', { name: 'Start playing' }));

    expect(await screen.findByText(`Page ${ROUTES.start}`)).toBeInTheDocument();
    expect(usePrefs.getState()).toMatchObject({ onboardingSeen: true, nickname: 'Skyler' });
  });

  it('Skip goes straight to Start and remembers onboarding was seen', async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.onboarding, <OnboardingPage />, { others: [ROUTES.start] });
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText(`Page ${ROUTES.start}`)).toBeInTheDocument();
    expect(usePrefs.getState().onboardingSeen).toBe(true);
  });
});

describe('How to Play', () => {
  it('steps through 4 cards and ends with "Let\'s play"', async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.howTo, <HowToPage />, { others: [ROUTES.feedSelect] });
    expect(screen.getByRole('heading', { name: 'You start with 100 coins' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go to card 4 of 4' }));
    expect(await screen.findByRole('heading', { name: 'Spot the traps' })).toBeInTheDocument();
    for (const chip of ['Clickbait', 'Rage bait', 'Fake news', 'Time-waster']) {
      expect(screen.getByText(chip)).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: "Let's play" }));
    expect(await screen.findByText(`Page ${ROUTES.feedSelect}`)).toBeInTheDocument();
  });
});

describe('Pick your feed', () => {
  it('remembers the last choice and starts a balanced 12-post round', async () => {
    const user = userEvent.setup();
    usePrefs.setState({ lastFeedStyle: 'timeline' });
    renderRoute(ROUTES.feedSelect, <FeedSelectPage />, { others: [ROUTES.round] });

    expect(screen.getByRole('radio', { name: /Timeline/ })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: /Gallery/ }));
    await user.click(screen.getByRole('button', { name: 'Start round' }));

    expect(await screen.findByText(`Page ${ROUTES.round}`)).toBeInTheDocument();
    const { round } = useRound.getState();
    expect(round.status).toBe('playing');
    expect(round.feedStyle).toBe('gallery');
    expect(round.posts).toHaveLength(12);
    expect(round.posts.filter((p) => p.isTrap)).toHaveLength(6);
    expect(usePrefs.getState().lastFeedStyle).toBe('gallery');
  });
});
