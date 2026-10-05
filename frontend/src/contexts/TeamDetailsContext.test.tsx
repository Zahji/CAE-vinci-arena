import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate, useParams } from 'react-router-dom';
import {
  TeamDetailsContext,
  TeamDetailsContextProvider,
} from './TeamDetailsContext';
import { UserContext } from './UserContext';
import { TeamDetailsContextType, UserContextType } from '../types';
import {
  fetchTeamById,
  designateSecondManager,
  leaveTeam,
  excludeMember,
} from '../services/teamService';
import { fetchTeamMembers } from '../services/teamMembershipService';
import { fetchTeamActivity } from '../services/tournamentRegistrationService';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn(), useParams: vi.fn() };
});

vi.mock('../services/teamService', () => ({
  fetchTeamById: vi.fn(),
  designateSecondManager: vi.fn(),
  leaveTeam: vi.fn(),
  excludeMember: vi.fn(),
}));

vi.mock('../services/teamMembershipService', () => ({
  fetchTeamMembers: vi.fn(),
}));

vi.mock('../services/tournamentRegistrationService', () => ({
  fetchTeamActivity: vi.fn(),
}));

describe('TeamDetailsContext', () => {
  const authenticatedUser = {
    id: 1,
    email: 'user@test.com',
    tag: 'user',
    token: 'test-token',
    teamId: 1 as number | undefined,
  };

  const mockTeam = {
    id: 1,
    name: 'Team Alpha',
    manager: {
      id: 1,
      email: 'user@test.com',
      tag: 'user',
      speciality: 'Mage',
      profilePicture: '',
      date: '',
    },
    secondManager: null,
    managersCount: 1,
    membersCount: 3,
  };

  const mockTeamActivity = [
    {
      tournamentId: 1,
      tournamentName: 'Spring Cup',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
    },
  ];

  const mockMemberships = [
    {
      id: 10,
      member: {
        id: 2,
        email: 'member@test.com',
        tag: 'member',
        speciality: 'Archer',
        profilePicture: '',
        date: '',
      },
      team: mockTeam,
      status: 'ACCEPTED' as const,
    },
  ];

  let contextValue: TeamDetailsContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(TeamDetailsContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(TeamDetailsContext);
    return null;
  };

  const createUserContextValue = (
    user: typeof authenticatedUser | null = authenticatedUser,
    isAdmin = false,
  ): UserContextType => {
    const resolvedUser = user ?? undefined;
    return {
      authenticatedUser: resolvedUser,
      setAuthenticatedUser: vi.fn(),
      registerUser: vi.fn(),
      loginUser: vi.fn(),
      clearUser: vi.fn(),
      refreshUser: vi.fn(),
      jwtData: vi
        .fn()
        .mockReturnValue(
          resolvedUser
            ? { id: resolvedUser.id, email: resolvedUser.email, isAdmin }
            : null,
        ),
    };
  };

  const renderTeamDetailsContext = (
    userContextValue = createUserContextValue(),
  ) =>
    render(
      <UserContext.Provider value={userContextValue}>
        <TeamDetailsContextProvider>
          <ContextConsumer />
        </TeamDetailsContextProvider>
      </UserContext.Provider>,
    );

  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(useParams).mockReturnValue({ teamId: '1' });
    vi.mocked(fetchTeamById).mockResolvedValue(mockTeam);
    vi.mocked(fetchTeamMembers).mockResolvedValue(mockMemberships);
    vi.mocked(fetchTeamActivity).mockResolvedValue(mockTeamActivity);
    vi.mocked(designateSecondManager).mockResolvedValue(mockTeam);
    vi.mocked(leaveTeam).mockResolvedValue(undefined);
    vi.mocked(excludeMember).mockResolvedValue(undefined);
  });

  test('exposes harmless default values and methods without a provider', async () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.team).toBeNull();
    expect(contextValue?.memberships).toEqual([]);
    expect(contextValue?.memberList).toEqual([]);
    expect(contextValue?.totalTeamMembers).toBe(0);
    expect(contextValue?.isPrimaryManager).toBe(false);
    expect(contextValue?.isSecondManager).toBe(false);
    expect(contextValue?.canViewMemberEmail).toBe(false);
    expect(contextValue?.currentUserId).toBeUndefined();
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.success).toBeNull();
    expect(contextValue?.actionLoading).toBeNull();
    expect(contextValue?.teamActivity).toEqual([]);
    expect(contextValue?.pastActivity).toEqual([]);
    expect(contextValue?.ongoingActivity).toEqual([]);
    expect(contextValue?.futureActivity).toEqual([]);

    expect(() => contextValue?.clearError()).not.toThrow();
    expect(() => contextValue?.clearSuccess()).not.toThrow();
    expect(() => contextValue?.handleRefresh()).not.toThrow();
    await expect(
      contextValue?.handleDesignateSecondManager(2) ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handleLeaveTeam() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handleExcludeMember(10) ?? Promise.resolve(),
    ).resolves.toBeUndefined();
  });

  test('loads team and memberships on mount', async () => {
    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.team).toEqual(mockTeam);
      expect(contextValue?.memberships).toEqual(mockMemberships);
    });

    expect(fetchTeamById).toHaveBeenCalledWith(1, 'test-token');
    expect(fetchTeamMembers).toHaveBeenCalledWith(1, 'test-token');
  });

  test('loads team activity on mount', async () => {
    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.teamActivity).toEqual(mockTeamActivity);
    });

    expect(fetchTeamActivity).toHaveBeenCalledWith(1);
  });

  test('categorises past activity correctly', async () => {
    const past = {
      tournamentId: 2,
      tournamentName: 'Old Cup',
      startDate: '2020-01-01',
      endDate: '2020-01-03',
    };
    vi.mocked(fetchTeamActivity).mockResolvedValueOnce([past]);

    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.pastActivity).toEqual([past]);
      expect(contextValue?.ongoingActivity).toEqual([]);
      expect(contextValue?.futureActivity).toEqual([]);
    });
  });

  test('categorises ongoing activity correctly', async () => {
    const ongoing = {
      tournamentId: 3,
      tournamentName: 'Live Cup',
      startDate: '2020-01-01',
      endDate: '2099-12-31',
    };
    vi.mocked(fetchTeamActivity).mockResolvedValueOnce([ongoing]);

    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.pastActivity).toEqual([]);
      expect(contextValue?.ongoingActivity).toEqual([ongoing]);
      expect(contextValue?.futureActivity).toEqual([]);
    });
  });

  test('categorises future activity correctly', async () => {
    const future = {
      tournamentId: 4,
      tournamentName: 'Future Cup',
      startDate: '2099-01-01',
      endDate: '2099-01-03',
    };
    vi.mocked(fetchTeamActivity).mockResolvedValueOnce([future]);

    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.pastActivity).toEqual([]);
      expect(contextValue?.ongoingActivity).toEqual([]);
      expect(contextValue?.futureActivity).toEqual([future]);
    });
  });

  test('sets an error when teamId is invalid', async () => {
    vi.mocked(useParams).mockReturnValue({ teamId: 'abc' });

    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Identifiant de team invalide.');
    });

    expect(fetchTeamById).not.toHaveBeenCalled();
  });

  test('loads team with an empty token when there is no authenticated user', async () => {
    renderTeamDetailsContext(createUserContextValue(null));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.team).toEqual(mockTeam);
    });

    expect(fetchTeamById).toHaveBeenCalledWith(1, '');
  });

  test('team actions do nothing without a token', async () => {
    renderTeamDetailsContext(createUserContextValue(null));

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleDesignateSecondManager(2);
      await contextValue?.handleLeaveTeam();
      await contextValue?.handleExcludeMember(10);
    });

    expect(designateSecondManager).not.toHaveBeenCalled();
    expect(leaveTeam).not.toHaveBeenCalled();
    expect(excludeMember).not.toHaveBeenCalled();
  });

  test('stores a loading error when fetching fails', async () => {
    vi.mocked(fetchTeamById).mockRejectedValueOnce(
      new Error('Chargement impossible'),
    );

    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Chargement impossible');
    });
  });

  test('stores a generic error message when the thrown value is not an Error', async () => {
    vi.mocked(fetchTeamById).mockRejectedValueOnce('erreur inconnue');

    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  test('isPrimaryManager is true when the user is the main manager', async () => {
    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.isPrimaryManager).toBe(true);
    });
  });

  test('isSecondManager is true when the user is the co-manager', async () => {
    const teamWithSecondManager = {
      ...mockTeam,
      manager: { ...mockTeam.manager!, id: 99 },
      secondManager: {
        id: 1,
        email: 'user@test.com',
        tag: 'user',
        speciality: 'Mage',
        profilePicture: '',
        date: '',
      },
    };
    vi.mocked(fetchTeamById).mockResolvedValueOnce(teamWithSecondManager);

    renderTeamDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.isSecondManager).toBe(true);
    });
  });

  test('canViewMemberEmail is true when the user is admin', async () => {
    renderTeamDetailsContext(createUserContextValue(authenticatedUser, true));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canViewMemberEmail).toBe(true);
    });
  });

  test('handleDesignateSecondManager designates a member and refreshes', async () => {
    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleDesignateSecondManager(2);
    });

    await waitFor(() => {
      expect(designateSecondManager).toHaveBeenCalledWith('test-token', 1, 2);
      expect(contextValue?.success).toBe(
        'Le membre est maintenant second responsable de la team.',
      );
      expect(contextValue?.actionLoading).toBeNull();
    });
  });

  test('handleDesignateSecondManager stores errors', async () => {
    vi.mocked(designateSecondManager).mockRejectedValueOnce(
      new Error('Désignation impossible'),
    );

    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleDesignateSecondManager(2);
    });

    await waitFor(() => {
      expect(contextValue?.error).toBe('Désignation impossible');
      expect(contextValue?.actionLoading).toBeNull();
    });
  });

  test('handleLeaveTeam leaves the team and navigates away', async () => {
    const userContextValue = createUserContextValue();

    renderTeamDetailsContext(userContextValue);

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleLeaveTeam();
    });

    await waitFor(() => {
      expect(leaveTeam).toHaveBeenCalledWith('test-token', 1);
      expect(userContextValue.setAuthenticatedUser).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: undefined }),
      );
      expect(navigateMock).toHaveBeenCalledWith('/teams');
    });
  });

  test('memberList contains the manager with roleLabel Responsable', async () => {
    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    const managerRow = contextValue?.memberList.find(
      (r) => r.roleLabel === 'Responsable',
    );
    expect(managerRow?.member.id).toBe(mockTeam.manager!.id);
  });

  test('memberList contains ACCEPTED members with correct membershipId', async () => {
    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    const memberRow = contextValue?.memberList.find(
      (r) => r.roleLabel === 'Membre',
    );
    expect(memberRow?.member.id).toBe(mockMemberships[0].member.id);
    expect(memberRow?.membershipId).toBe(mockMemberships[0].id);
  });

  test('memberList excludes PENDING and REFUSED memberships', async () => {
    const pending = {
      ...mockMemberships[0],
      id: 20,
      status: 'PENDING' as const,
    };
    const refused = {
      ...mockMemberships[0],
      id: 30,
      status: 'REFUSED' as const,
      member: { ...mockMemberships[0].member, id: 3 },
    };
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce([
      ...mockMemberships,
      pending,
      refused,
    ]);

    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    const membershipIds = contextValue?.memberList.map((r) => r.membershipId);
    expect(membershipIds).not.toContain(20);
    expect(membershipIds).not.toContain(30);
  });

  test('memberList is empty when team cannot be loaded', async () => {
    vi.mocked(fetchTeamById).mockRejectedValueOnce(new Error('not found'));

    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.memberList).toEqual([]);
  });

  test('totalTeamMembers equals managersCount + membersCount', async () => {
    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.totalTeamMembers).toBe(
      mockTeam.managersCount + mockTeam.membersCount,
    );
  });

  test('handleLeaveTeam stores errors', async () => {
    vi.mocked(leaveTeam).mockRejectedValueOnce(
      new Error('Impossible de quitter'),
    );

    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleLeaveTeam();
    });

    await waitFor(() => {
      expect(contextValue?.error).toBe('Impossible de quitter');
      expect(contextValue?.actionLoading).toBeNull();
    });
  });

  test('handleExcludeMember excludes a member and refreshes', async () => {
    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleExcludeMember(10);
    });

    await waitFor(() => {
      expect(excludeMember).toHaveBeenCalledWith('test-token', 10);
      expect(contextValue?.success).toBe('Le membre a été exclu de la team.');
      expect(contextValue?.actionLoading).toBeNull();
    });
  });

  test('handleExcludeMember stores errors', async () => {
    vi.mocked(excludeMember).mockRejectedValueOnce(
      new Error('Exclusion impossible'),
    );

    renderTeamDetailsContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleExcludeMember(10);
    });

    await waitFor(() => {
      expect(contextValue?.error).toBe('Exclusion impossible');
      expect(contextValue?.actionLoading).toBeNull();
    });
  });
});
