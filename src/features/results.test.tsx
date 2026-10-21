import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { historyDetailPath, ROUTES } from '@/app/routes';
import { useRound } from '@/hooks/useRound';
import { DEFAULT_PREFS, usePrefs } from '@/lib/prefs';
import { LocalRepository } from '@/lib/repository/LocalRepository';
import type { RoundRecord } from '@/lib/rounds/record';
import { recordFromRound } from '@/lib/rounds/record';
import { finishedRound } from '@/tests/fixtures';
import { renderRoute } from '@/tests/renderRoute';
import { HistoryPage } from './history/HistoryPage';
import { RoundDetailPage } from './history/RoundDetailPage';
import { ReflectPage } from './reflect/ReflectPage';
import { SettingsPage } from './settings/SettingsPage';
import { SummaryPage } from './summary/SummaryPage';

function finish(): RoundRecord {
  const record = recordFromRound(finishedRound(), 'round-1', '2026-10-22T08:00:00.000Z');
  useRound.setState({ finished: { record, saved: false } });
  return record;
}

beforeEach(() => {
  useRound.getState().reset();
  usePrefs.setState(DEFAULT_PREFS);
});

describe('Summary', () => {
  it('sends players with no finished round back to Start', async () => {
    renderRoute(ROUTES.summary, <SummaryPage />, { others: [ROUTES.start] });
    expect(await screen.findByText(`Page ${ROUTES.start}`)).toBeInTheDocument();
  });

  it('shows SQ, label, stats, the coin breakdown and the reveal', async () => {
    const record = finish();
    renderRoute(ROUTES.summary, <SummaryPage />);

    expect(screen.getByRole('img', { name: `SQ ${record.sq} out of 100` })).toBeInTheDocument();
    expect(screen.getByText(record.label)).toBeInTheDocument();
    expect(screen.getByText('Good calls').nextElementSibling).toHaveTextContent('2/4');
    expect(
      screen.getByRole('img', {
        name: 'Out of 100 coins. Reading: 4 coins, Traps & bad flags: 0 coins, Idling: 0 coins, Left: 96 coins.',
      }),
    ).toBeInTheDocument();

    const reveal = screen.getByRole('region', { name: 'The reveal' });
    const rows = within(reveal).getAllByRole('listitem');
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent('Valuable');
    expect(rows[0]).toHaveTextContent('You: Read');
    expect(rows[0]).toHaveTextContent('Good call');
    expect(rows[1]).toHaveTextContent('Trap · Clickbait');
    expect(rows[1]).toHaveTextContent('No source at all.');
    expect(rows[2]).toHaveTextContent('Missed');
    expect(rows[3]).toHaveTextContent('Not reached');

    expect(screen.getByRole('link', { name: 'Create a free account' })).toBeInTheDocument();
  });

  it('saves the round to the repository exactly once', async () => {
    finish();
    const repo = new LocalRepository();
    const save = vi.spyOn(repo, 'saveRound');
    const { rerender } = renderRoute(ROUTES.summary, <SummaryPage />, { repo });

    await waitFor(() => expect(useRound.getState().finished?.saved).toBe(true));
    rerender(<></>);
    expect(save).toHaveBeenCalledTimes(1);
    expect((await repo.listRounds()).map((r) => r.id)).toEqual(['round-1']);
  });
});

describe('Reflect', () => {
  it('saves answers with the round when leaving', async () => {
    const user = userEvent.setup();
    const record = finish();
    const repo = new LocalRepository();
    await repo.saveRound(record);
    renderRoute(ROUTES.reflect, <ReflectPage />, { repo, others: [ROUTES.start] });

    expect(
      screen.getByText('Just for you. No right answers, and nothing gets graded.'),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: 'Which trap almost got you?' }),
      'The celebrity post',
    );
    await user.type(
      screen.getByRole('textbox', { name: "One limit you'll try this week." }),
      '  No phone after 10  ',
    );
    await user.click(screen.getByRole('button', { name: 'Back to Start' }));

    expect(await screen.findByText(`Page ${ROUTES.start}`)).toBeInTheDocument();
    expect((await repo.getRound(record.id))?.reflection).toEqual({
      trap: 'The celebrity post',
      worth: '',
      limit: 'No phone after 10',
    });
    expect(useRound.getState().finished?.record.reflection?.trap).toBe('The celebrity post');
  });
});

describe('History', () => {
  async function seeded() {
    const repo = new LocalRepository();
    const base = recordFromRound(finishedRound(), 'x', '2026-10-01T08:00:00.000Z');
    await repo.saveRound({ ...base, id: 'old', sq: 48, createdAt: '2026-10-20T08:00:00.000Z' });
    await repo.saveRound({ ...base, id: 'new', sq: 86, createdAt: '2026-10-21T08:00:00.000Z' });
    return repo;
  }

  it('shows an empty state with no rounds', async () => {
    renderRoute(ROUTES.history, <HistoryPage />);
    expect(await screen.findByText('No rounds yet')).toBeInTheDocument();
  });

  it('lists rounds newest first with SQ, label and feed style, plus the SQ chart', async () => {
    const repo = await seeded();
    renderRoute(ROUTES.history, <HistoryPage />, { repo });

    const links = await screen.findAllByRole('link', { name: /SQ \d+/ });
    expect(links[0]).toHaveTextContent('SQ 86');
    expect(links[0]).toHaveTextContent('Mindful Scroller');
    expect(links[0]).toHaveTextContent('Vertical');
    expect(links[1]).toHaveTextContent('Autopilot');
    expect(links[0]).toHaveAttribute('href', historyDetailPath('new'));

    const chart = screen.getByRole('slider', { name: /SQ over your last 2 rounds/ });
    expect(chart).toHaveAttribute('aria-valuetext', 'Round 2: SQ 86, Mindful Scroller');
    chart.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(chart).toHaveAttribute('aria-valuetext', 'Round 1: SQ 48, Autopilot');
  });

  it('clears history only after confirming', async () => {
    const user = userEvent.setup();
    const repo = await seeded();
    renderRoute(ROUTES.history, <HistoryPage />, { repo });

    await user.click(await screen.findByRole('button', { name: 'Clear history' }));
    const sheet = screen.getByRole('dialog', { name: 'Clear all 2 rounds?' });
    await user.click(within(sheet).getByRole('button', { name: 'Cancel' }));
    expect(await repo.listRounds()).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Clear history' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Clear history' }),
    );
    expect(await screen.findByText('No rounds yet')).toBeInTheDocument();
    expect(await repo.listRounds()).toEqual([]);
  });

  it('shows a past round with its reveal and saved reflection', async () => {
    const repo = await seeded();
    await repo.updateReflection('new', { trap: 'The quiz', worth: '', limit: '' });
    renderRoute(ROUTES.historyDetail, <RoundDetailPage />, { repo, at: historyDetailPath('new') });

    expect(await screen.findByRole('img', { name: 'SQ 86 out of 100' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Your reflection' })).toHaveTextContent('The quiz');
    expect(screen.getByRole('region', { name: 'The reveal' })).toBeInTheDocument();
  });
});

describe('Settings', () => {
  it('toggles sound and reduce motion and remembers them', async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.settings, <SettingsPage />);

    const sound = screen.getByRole('switch', { name: 'Sound' });
    expect(sound).toHaveAttribute('aria-checked', 'false');
    await user.click(sound);
    expect(sound).toHaveAttribute('aria-checked', 'true');
    expect(usePrefs.getState().sound).toBe(true);

    await user.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    expect(usePrefs.getState().reduceMotion).toBe(true);
    expect(window.localStorage.getItem('scrollq:prefs')).toContain('"reduceMotion":true');
  });

  it('resets the tutorial and links to Privacy and About', async () => {
    const user = userEvent.setup();
    usePrefs.setState({ onboardingSeen: true });
    renderRoute(ROUTES.settings, <SettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Reset tutorial' }));
    expect(usePrefs.getState().onboardingSeen).toBe(false);
    expect(await screen.findByText('Tutorial reset')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy notice' })).toHaveAttribute(
      'href',
      ROUTES.privacy,
    );
    expect(screen.getByRole('link', { name: 'About ScrollQ' })).toHaveAttribute(
      'href',
      ROUTES.about,
    );
  });
});
