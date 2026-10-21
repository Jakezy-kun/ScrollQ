import { render, screen } from '@testing-library/react';
import { colors } from '@/styles/tokens';
import { IdleMeter } from './IdleMeter';
import { idleMeterColor } from './idleMeterState';

describe('IdleMeter', () => {
  it('is calm with no idle time', () => {
    render(<IdleMeter progress={0} draining={false} />);
    const meter = screen.getByRole('meter', { name: 'Idle drain' });
    expect(meter).toHaveAttribute('data-state', 'calm');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    expect(meter).toHaveAttribute('aria-valuetext', 'Not idle');
  });

  it('fills during the grace period', () => {
    render(<IdleMeter progress={0.6} draining={false} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('data-state', 'filling');
    expect(meter).toHaveAttribute('aria-valuenow', '60');
    expect(meter).toHaveAttribute('aria-valuetext', '60% to idle drain');
  });

  it('shows draining when coins are being taken', () => {
    render(<IdleMeter progress={1} draining />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('data-state', 'draining');
    expect(meter).toHaveAttribute('aria-valuetext', 'Draining coins');
  });

  it('goes from mint through amber to coral', () => {
    expect(idleMeterColor(0).toUpperCase()).toBe(colors.mint);
    expect(idleMeterColor(0.5).toUpperCase()).toBe(colors.amber);
    expect(idleMeterColor(1).toUpperCase()).toBe(colors.coral);
  });
});
