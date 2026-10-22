import { act, fireEvent, render, screen } from '@testing-library/react';
import { AuthShowcase, SHOWCASE_INTERVAL_MS } from './AuthShowcase';

const heading = () => screen.getByRole('heading', { level: 2 }).textContent;
const tick = () => act(() => vi.advanceTimersByTime(SHOWCASE_INTERVAL_MS + 50));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('AuthShowcase', () => {
  it('moves to the next slide every 3 seconds and wraps around', () => {
    render(<AuthShowcase />);
    expect(heading()).toBe('Watch your SQ grow');
    tick();
    expect(heading()).toBe('Spend attention on what matters');
    tick();
    expect(heading()).toBe('100 coins, every round');
    tick();
    expect(heading()).toBe('Watch your SQ grow');
  });

  it('stops while paused, and the dots jump to a slide', () => {
    render(<AuthShowcase />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause slides' }));
    tick();
    tick();
    expect(heading()).toBe('Watch your SQ grow');
    // Paused slides are announced; rotating ones are not.
    expect(screen.getByRole('heading', { level: 2 }).closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite',
    );

    fireEvent.click(screen.getByRole('button', { name: /Show slide 3/ }));
    expect(heading()).toBe('100 coins, every round');
    expect(screen.getByRole('button', { name: /Show slide 3/ })).toHaveAttribute(
      'aria-current',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play slides' }));
    tick();
    expect(heading()).toBe('Watch your SQ grow');
  });

  it('holds still while the pointer is over it', () => {
    render(<AuthShowcase />);
    const panel = screen.getByRole('complementary', { name: 'Why make an account' });
    fireEvent.mouseEnter(panel);
    tick();
    expect(heading()).toBe('Watch your SQ grow');
    fireEvent.mouseLeave(panel);
    tick();
    expect(heading()).toBe('Spend attention on what matters');
  });
});
