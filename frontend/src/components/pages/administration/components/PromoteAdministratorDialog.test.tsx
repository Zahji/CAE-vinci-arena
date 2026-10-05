import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { UserProfile } from '../../../../types';
import PromoteAdministratorDialog from './PromoteAdministratorDialog';

describe('PromoteAdministratorDialog', () => {
  const nonAdmins: UserProfile[] = [
    {
      id: 2,
      email: 'user@user.com',
      tag: 'user',
      speciality: 'Archer',
      profilePicture: 'avatar-2',
      date: '2024-01-02',
    },
  ];

  test('renders the empty state and keeps confirmation disabled when there is no user to promote', () => {
    render(
      <PromoteAdministratorDialog
        open={true}
        nonAdmins={[]}
        selectedUserId=""
        promoteError="Chargement impossible"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onUserChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/chargement impossible/i)).toBeTruthy();
    expect(
      screen.getByText(/aucun utilisateur non-administrateur disponible/i),
    ).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: /confirmer/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  test('renders available users and forwards dialog callbacks', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const onUserChange = vi.fn();

    render(
      <PromoteAdministratorDialog
        open={true}
        nonAdmins={nonAdmins}
        selectedUserId=""
        promoteError=""
        onClose={onClose}
        onConfirm={onConfirm}
        onUserChange={onUserChange}
      />,
    );

    fireEvent.mouseDown(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByText(/user@user.com \(user\)/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/user@user.com \(user\)/i));

    expect(onUserChange).toHaveBeenCalled();
  });

  test('forwards close and confirm callbacks when actions are enabled', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <PromoteAdministratorDialog
        open={true}
        nonAdmins={nonAdmins}
        selectedUserId={2}
        promoteError=""
        onClose={onClose}
        onConfirm={onConfirm}
        onUserChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
