import { render, screen } from '@testing-library/react';
import { CoinCounter } from './CoinCounter';

describe('CoinCounter', () => {
  it('shows the coin count with an accessible label', () => {
    render(<CoinCounter coins={89} />);
    expect(screen.getByText('89 coins left')).toBeInTheDocument();
  });

  it('floats a delta when coins drop', () => {
    const { rerender } = render(<CoinCounter coins={100} />);
    rerender(<CoinCounter coins={96} />);
    expect(screen.getByTestId('coin-delta')).toHaveTextContent('−4');
  });

  it('announces only the announcement it is given, not every change', () => {
    const announcement = { key: 1, text: 'Spent 4 coins to open the post. 96 coins left.' };
    const { rerender } = render(<CoinCounter coins={96} announcement={announcement} />);
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent(announcement.text);

    // An idle tick changes coins but keeps the same announcement.
    rerender(<CoinCounter coins={95} announcement={announcement} draining />);
    expect(screen.getByRole('status')).toHaveTextContent(announcement.text);
  });

  it('marks itself as draining', () => {
    const { container } = render(<CoinCounter coins={50} draining />);
    expect(container.firstChild).toHaveAttribute('data-draining', 'true');
  });
});
