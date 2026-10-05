import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import TeamMembersTable from './TeamMembersTable';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});
import { Team } from '../../../../types';

describe('TeamMembersTable', () => {
  const manager = {
    id: 1,
    email: 'manager@test.com',
    tag: 'mage',
    speciality: 'Mage',
    profilePicture: '',
    date: '',
  };

  const member = {
    id: 2,
    email: 'member@test.com',
    tag: 'archer',
    speciality: 'Archer',
    profilePicture: '',
    date: '',
  };

  const team: Team = {
    id: 1,
    name: 'Team Alpha',
    manager,
    secondManager: null,
    managersCount: 1,
    membersCount: 2,
  };

  const memberList = [
    { member: manager, roleLabel: 'Responsable' },
    { membershipId: 10, member, roleLabel: 'Membre' },
  ];

  vi.mocked(useNavigate).mockReturnValue(vi.fn());

  const defaultProps = {
    memberList,
    team,
    totalTeamMembers: 3,
    currentUserId: 1,
    isPrimaryManager: true,
    isSecondManager: false,
    canViewMemberEmail: false,
    actionLoading: null,
    onDesignate: vi.fn(),
    onLeave: vi.fn(),
    onExclude: vi.fn(),
  };

  test('renders the tag and speciality of each member', () => {
    render(<TeamMembersTable {...defaultProps} />);

    expect(screen.getByText('mage')).toBeTruthy();
    expect(screen.getByText('Mage')).toBeTruthy();
    expect(screen.getByText('archer')).toBeTruthy();
    expect(screen.getByText('Archer')).toBeTruthy();
  });

  test('shows emails when canViewMemberEmail is true', () => {
    render(<TeamMembersTable {...defaultProps} canViewMemberEmail={true} />);

    expect(screen.getByText('manager@test.com')).toBeTruthy();
    expect(screen.getByText('member@test.com')).toBeTruthy();
  });

  test('hides emails when canViewMemberEmail is false', () => {
    render(<TeamMembersTable {...defaultProps} canViewMemberEmail={false} />);

    expect(screen.queryByText('manager@test.com')).toBeNull();
    expect(screen.queryByText('member@test.com')).toBeNull();
  });

  test('shows the designate button for the primary manager when there is no co-manager', () => {
    render(<TeamMembersTable {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: /désigner second responsable/i }),
    ).toBeTruthy();
  });

  test('shows the exclude button for the primary manager on member rows', () => {
    render(<TeamMembersTable {...defaultProps} />);

    expect(screen.getByRole('button', { name: /exclure/i })).toBeTruthy();
  });

  test('shows the exclude button for the second manager on member rows', () => {
    render(
      <TeamMembersTable
        {...defaultProps}
        isPrimaryManager={false}
        isSecondManager={true}
      />,
    );

    expect(screen.getByRole('button', { name: /exclure/i })).toBeTruthy();
  });

  test('shows the exclude button for the primary manager on second manager row', () => {
    // tiago exclure remake
    const secondManager = {
      id: 3,
      email: 'second@test.com',
      tag: 'healer',
      speciality: 'Healer',
      profilePicture: '',
      date: '',
    };
    const teamWithSecond: Team = {
      ...team,
      secondManager,
      managersCount: 2,
      membersCount: 1,
    };
    const memberListWithSecond = [
      { membershipId: 11, member: manager, roleLabel: 'Responsable' as const },
      {
        membershipId: 12,
        member: secondManager,
        roleLabel: 'Second responsable' as const,
      },
      { membershipId: 10, member, roleLabel: 'Membre' as const },
    ];

    render(
      <TeamMembersTable
        {...defaultProps}
        team={teamWithSecond}
        memberList={memberListWithSecond}
      />,
    );

    const excludeButtons = screen.getAllByRole('button', { name: /exclure/i });
    expect(excludeButtons.length).toBe(2);
    // tiago exclure remake
  });

  test('shows the exclude button for the second manager on primary manager row', () => {
    // tiago exclure remake
    const secondManager = {
      id: 3,
      email: 'second@test.com',
      tag: 'healer',
      speciality: 'Healer',
      profilePicture: '',
      date: '',
    };
    const teamWithSecond: Team = {
      ...team,
      secondManager,
      managersCount: 2,
      membersCount: 1,
    };
    const memberListWithSecond = [
      { membershipId: 11, member: manager, roleLabel: 'Responsable' as const },
      {
        membershipId: 12,
        member: secondManager,
        roleLabel: 'Second responsable' as const,
      },
      { membershipId: 10, member, roleLabel: 'Membre' as const },
    ];

    render(
      <TeamMembersTable
        {...defaultProps}
        team={teamWithSecond}
        memberList={memberListWithSecond}
        currentUserId={3}
        isPrimaryManager={false}
        isSecondManager={true}
      />,
    );

    const excludeButtons = screen.getAllByRole('button', { name: /exclure/i });
    expect(excludeButtons.length).toBe(2);
    // tiago exclure remake
  });

  test('hides the exclude button for users who are not manager or co-manager', () => {
    render(
      <TeamMembersTable
        {...defaultProps}
        isPrimaryManager={false}
        isSecondManager={false}
      />,
    );

    expect(screen.queryByRole('button', { name: /exclure/i })).toBeNull();
  });

  test('hides the designate button when the team already has a co-manager', () => {
    const teamWithSecondManager = {
      ...team,
      secondManager: member,
      managersCount: 2,
    };

    render(<TeamMembersTable {...defaultProps} team={teamWithSecondManager} />);

    expect(
      screen.queryByRole('button', { name: /désigner second responsable/i }),
    ).toBeNull();
  });

  test('shows the leave button only on the current user row', () => {
    render(
      <TeamMembersTable
        {...defaultProps}
        currentUserId={2}
        isPrimaryManager={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: /quitter la team/i }),
    ).toBeTruthy();
    expect(screen.getByText('Aucune action disponible')).toBeTruthy();
  });

  test('disables the leave button when the user is the main manager and there are other members', () => {
    render(
      <TeamMembersTable
        {...defaultProps}
        currentUserId={1}
        totalTeamMembers={3}
      />,
    );

    const leaveButton = screen.getByRole('button', {
      name: /quitter la team/i,
    }) as HTMLButtonElement;
    expect(leaveButton.disabled).toBe(true);
  });

  test('calls onDesignate with the member id after clicking confirm in the dialog', async () => {
    const onDesignate = vi.fn().mockResolvedValue(undefined);

    render(<TeamMembersTable {...defaultProps} onDesignate={onDesignate} />);

    fireEvent.click(
      screen.getByRole('button', { name: /désigner second responsable/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(onDesignate).toHaveBeenCalledWith(member.id);
    });
  });

  test('calls onLeave after clicking confirm in the leave dialog', async () => {
    const onLeave = vi.fn().mockResolvedValue(undefined);
    const teamAlone: Team = {
      ...team,
      managersCount: 1,
      membersCount: 0,
    };
    const memberListAlone = [{ member: manager, roleLabel: 'Responsable' }];

    render(
      <TeamMembersTable
        {...defaultProps}
        team={teamAlone}
        memberList={memberListAlone}
        totalTeamMembers={1}
        currentUserId={1}
        onLeave={onLeave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /quitter la team/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(onLeave).toHaveBeenCalledOnce();
    });
  });

  test('calls onExclude with the membership id after clicking confirm in the dialog', async () => {
    const onExclude = vi.fn().mockResolvedValue(undefined);

    render(<TeamMembersTable {...defaultProps} onExclude={onExclude} />);

    fireEvent.click(screen.getByRole('button', { name: /exclure/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(onExclude).toHaveBeenCalledWith(10);
    });
  });

  test('closes the dialog without calling any action when cancel is clicked', async () => {
    const onDesignate = vi.fn();

    render(<TeamMembersTable {...defaultProps} onDesignate={onDesignate} />);

    fireEvent.click(
      screen.getByRole('button', { name: /désigner second responsable/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /annuler/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(onDesignate).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /confirmer/i })).toBeNull();
    });
  });

  test('enables the leave button when the manager has a second manager', () => {
    const teamWithSecondManager = {
      ...team,
      secondManager: member,
      managersCount: 2,
    };

    render(
      <TeamMembersTable
        {...defaultProps}
        team={teamWithSecondManager}
        currentUserId={1}
        totalTeamMembers={3}
      />,
    );

    const leaveButton = screen.getByRole('button', {
      name: /quitter la team/i,
    }) as HTMLButtonElement;
    expect(leaveButton.disabled).toBe(false);
  });

  test('shows "Aucune action disponible" for members with no available actions', () => {
    render(
      <TeamMembersTable
        {...defaultProps}
        isPrimaryManager={false}
        currentUserId={99}
      />,
    );

    const noActionTexts = screen.getAllByText('Aucune action disponible');
    expect(noActionTexts.length).toBeGreaterThan(0);
  });

  test('navigates to the member details page when a tag is clicked', () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    render(<TeamMembersTable {...defaultProps} />);

    fireEvent.click(screen.getByText('archer'));

    expect(navigate).toHaveBeenCalledWith('/members/2');
  });
});
