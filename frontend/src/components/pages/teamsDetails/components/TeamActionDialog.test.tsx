import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TeamActionDialog from './TeamActionDialog';

describe('TeamActionDialog', () => {
  const selectedMember = {
    membershipId: 10,
    member: {
      id: 2,
      email: 'member@test.com',
      tag: 'archer',
      speciality: 'Archer',
      profilePicture: '',
      date: '',
    },
    roleLabel: 'Membre',
  };

  const selectedManager = {
    membershipId: 10,
    member: {
      id: 1,
      email: 'manager@test.com',
      tag: 'mage',
      speciality: 'Mage',
      profilePicture: '',
      date: '',
    },
    roleLabel: 'Responsable',
  };

  test('does not show the dialog when confirmAction is null', () => {
    render(
      <TeamActionDialog
        confirmAction={null}
        selectedMember={null}
        totalTeamMembers={1}
        actionLoading={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('shows the designate title and the member tag in the message', () => {
    render(
      <TeamActionDialog
        confirmAction="designate"
        selectedMember={selectedMember}
        totalTeamMembers={3}
        actionLoading={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/confirmer la désignation/i)).toBeTruthy();
    expect(screen.getByText(/archer comme second responsable/i)).toBeTruthy();
  });

  test('shows the leave title and a simple message for a regular member', () => {
    render(
      <TeamActionDialog
        confirmAction="leave"
        selectedMember={selectedMember}
        totalTeamMembers={3}
        actionLoading={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/confirmer le départ/i)).toBeTruthy();
    expect(
      screen.getByText(/êtes vous sûr de vouloir quitter la team/i),
    ).toBeTruthy();
    expect(screen.queryByText(/team deviendra inactive/i)).toBeNull();
  });

  test('shows the exclude title and message with the member tag', () => {
    render(
      <TeamActionDialog
        confirmAction="exclude"
        selectedMember={selectedMember}
        totalTeamMembers={3}
        actionLoading={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/confirmer l'exclusion/i)).toBeTruthy();
    expect(screen.getByText(/exclure archer de la team/i)).toBeTruthy();
  });

  test('shows the inactive team warning when the manager is the last member', () => {
    render(
      <TeamActionDialog
        confirmAction="leave"
        selectedMember={selectedManager}
        totalTeamMembers={1}
        actionLoading={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/team deviendra inactive/i)).toBeTruthy();
  });

  test('disables the confirm button when an action is loading', () => {
    render(
      <TeamActionDialog
        confirmAction="designate"
        selectedMember={selectedMember}
        totalTeamMembers={3}
        actionLoading="designate-2"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const confirmButton = screen.getByRole('button', {
      name: /confirmer/i,
    }) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);
  });

  test('calls onClose when the cancel button is clicked', () => {
    const onClose = vi.fn();

    render(
      <TeamActionDialog
        confirmAction="leave"
        selectedMember={selectedMember}
        totalTeamMembers={3}
        actionLoading={null}
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();

    render(
      <TeamActionDialog
        confirmAction="designate"
        selectedMember={selectedMember}
        totalTeamMembers={3}
        actionLoading={null}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
