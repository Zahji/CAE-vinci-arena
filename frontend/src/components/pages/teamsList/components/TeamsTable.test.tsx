import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TeamsTable from './TeamsTable';
import { Team, TeamMembership } from '../../../../types';

describe('TeamsTable', () => {
  const teams: Team[] = [
    { id: 1, name: 'Team Alpha', managersCount: 1, membersCount: 3 },
    { id: 2, name: 'Team Beta', managersCount: 1, membersCount: 2 },
  ];

  const membershipAccepted: TeamMembership = {
    id: 11,
    member: {
      id: 5,
      email: 'user@test.com',
      tag: 'user',
      speciality: 'Mage',
      profilePicture: '',
      date: '',
    },
    team: teams[0],
    status: 'ACCEPTED',
  };

  const membershipPending: TeamMembership = {
    id: 10,
    member: {
      id: 5,
      email: 'user@test.com',
      tag: 'user',
      speciality: 'Mage',
      profilePicture: '',
      date: '',
    },
    team: teams[0],
    status: 'PENDING',
  };

  const defaultProps = {
    teams,
    loading: false,
    currentMembership: null,
    currentTeamId: undefined,
    showJoinColumn: true,
    onNavigate: vi.fn(),
    onJoin: vi.fn(),
  };

  test('shows a loading spinner when loading is true', () => {
    render(<TeamsTable {...defaultProps} loading={true} />);

    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  test('renders team names and total member counts', () => {
    render(<TeamsTable {...defaultProps} />);

    expect(screen.getByText('Team Alpha')).toBeTruthy();
    expect(screen.getByText('Team Beta')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  test('hides the join column when showJoinColumn is false', () => {
    render(<TeamsTable {...defaultProps} showJoinColumn={false} />);

    expect(screen.queryByText(/demande d'adhésion/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /rejoindre/i })).toBeNull();
  });

  test('shows "Ma team" for the current user team', () => {
    render(<TeamsTable {...defaultProps} currentTeamId={1} />);

    expect(screen.getByText('Ma team')).toBeTruthy();
  });

  test('shows "Inactive" for a team with no members', () => {
    const inactiveTeams: Team[] = [
      { id: 3, name: 'Team Vide', managersCount: 0, membersCount: 0 },
    ];
    render(<TeamsTable {...defaultProps} teams={inactiveTeams} />);

    expect(screen.getByText('Team inactive')).toBeTruthy();
  });

  test('shows "Demande en attente" when the user has a pending membership for that team', () => {
    render(
      <TeamsTable {...defaultProps} currentMembership={membershipPending} />,
    );

    expect(screen.getByText('Demande en attente')).toBeTruthy();
  });

  test('shows an active "Rejoindre" button when the user has no membership', () => {
    render(<TeamsTable {...defaultProps} />);

    const buttons = screen.getAllByRole('button', { name: /rejoindre/i });
    expect(buttons.length).toBe(2);
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
  });

  test('shows "Indisponible" when the user is already in a team', () => {
    render(<TeamsTable {...defaultProps} currentTeamId={1} />);

    const button = screen.getByRole('button', {
      name: /indisponible/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test('calls onNavigate with the team id when clicking a row', () => {
    const onNavigate = vi.fn();
    render(<TeamsTable {...defaultProps} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText('Team Beta'));
    expect(onNavigate).toHaveBeenCalledWith(2);
  });

  test('does not call onNavigate when clicking an inactive team row', () => {
    const onNavigate = vi.fn();
    const inactiveTeams: Team[] = [
      { id: 3, name: 'Team Vide', managersCount: 0, membersCount: 0 },
    ];
    render(
      <TeamsTable
        {...defaultProps}
        teams={inactiveTeams}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText('Team Vide'));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  test('shows "Indisponible" when the user has an accepted membership', () => {
    render(
      <TeamsTable {...defaultProps} currentMembership={membershipAccepted} />,
    );

    const buttons = screen.getAllByRole('button', { name: /indisponible/i });
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  test('calls onJoin without triggering onNavigate when clicking the join button', () => {
    const onJoin = vi.fn();
    const onNavigate = vi.fn();

    render(
      <TeamsTable {...defaultProps} onJoin={onJoin} onNavigate={onNavigate} />,
    );

    const buttons = screen.getAllByRole('button', { name: /rejoindre/i });
    fireEvent.click(buttons[0]);

    expect(onJoin).toHaveBeenCalledWith(1);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
