import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import BanMemberDialog from './BanMemberDialog';

describe('BanMemberDialog', () => {
  test('does not render when closed', () => {
    render(
      <BanMemberDialog
        open={false}
        memberTag="Storm"
        banError=""
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByText(/confirmer le bannissement/i)).toBeNull();
  });

  test('renders when open', () => {
    render(
      <BanMemberDialog
        open={true}
        memberTag="Storm"
        banError=""
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText(/confirmer le bannissement/i)).toBeTruthy();
    expect(screen.getByText(/Storm/)).toBeTruthy();
  });

  test('shows error message', () => {
    render(
      <BanMemberDialog
        open={true}
        memberTag="Storm"
        banError="Erreur de bannissement"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText(/erreur de bannissement/i)).toBeTruthy();
  });

  test('calls onClose when annuler is clicked', () => {
    const onClose = vi.fn();
    render(
      <BanMemberDialog
        open={true}
        memberTag="Storm"
        banError=""
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('calls onConfirm when bannir is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <BanMemberDialog
        open={true}
        memberTag="Storm"
        banError=""
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /bannir/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
