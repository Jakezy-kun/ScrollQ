import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose();
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Read for 4 coins
      </button>
      <BottomSheet open={open} onClose={close} labelledBy="sheet-title">
        <h2 id="sheet-title">Open this post for 4 coins?</h2>
        <button type="button" onClick={close}>
          Cancel
        </button>
        <button type="button">Confirm</button>
      </BottomSheet>
    </>
  );
}

async function openSheet() {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole('button', { name: 'Read for 4 coins' }));
  return user;
}

describe('BottomSheet', () => {
  it('is a labelled modal dialog', async () => {
    await openSheet();
    const dialog = screen.getByRole('dialog', { name: 'Open this post for 4 coins?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus into the sheet and traps Tab inside it', async () => {
    const user = await openSheet();
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(cancel).toHaveFocus();

    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = await openSheet();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Read for 4 coins' })).toHaveFocus();
  });

  it('locks page scroll while open and restores it on close', async () => {
    const user = await openSheet();
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
  });

  it('closes when the backdrop is tapped', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Read for 4 coins' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
