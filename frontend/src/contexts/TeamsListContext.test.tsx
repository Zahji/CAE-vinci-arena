import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TeamsListContext, TeamsListContextProvider } from './TeamsListContext';
import { UserContext } from './UserContext';
import { TeamsListContextType, UserContextType } from '../types';
import { fetchAllTeams, createTeam } from '../services/teamService';
import {
  fetchCurrentMembership,
  joinTeam,
} from '../services/teamMembershipService';

vi.mock('../services/teamService', () => ({
  fetchAllTeams: vi.fn(),
  createTeam: vi.fn(),
}));

vi.mock('../services/teamMembershipService', () => ({
  fetchCurrentMembership: vi.fn(),
  joinTeam: vi.fn(),
}));

describe('TeamsListContext', () => {
  const authenticatedUser = {
    id: 1,
    email: 'user@test.com',
    tag: 'user',
    token: 'test-token',
    teamId: undefined as number | undefined,
  };

  const mockTeams = [
    { id: 1, name: 'Team Alpha', managersCount: 1, membersCount: 3 },
    { id: 2, name: 'Team Beta', managersCount: 1, membersCount: 2 },
  ];

  const mockMembership = {
    id: 10,
    member: {
      id: 1,
      email: 'user@test.com',
      tag: 'user',
      speciality: 'Mage',
      profilePicture: '',
      date: '',
    },
    team: { id: 1, name: 'Team Alpha', managersCount: 1, membersCount: 3 },
    status: 'ACCEPTED' as const,
  };

  let contextValue: TeamsListContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(TeamsListContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(TeamsListContext);
    return null;
  };

  const createUserContextValue = (
    user: typeof authenticatedUser | null = authenticatedUser,
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
            ? { id: resolvedUser.id, email: resolvedUser.email, isAdmin: false }
            : null,
        ),
    };
  };

  const renderTeamsListContext = (
    userContextValue = createUserContextValue(),
  ) =>
    render(
      <UserContext.Provider value={userContextValue}>
        <TeamsListContextProvider>
          <ContextConsumer />
        </TeamsListContextProvider>
      </UserContext.Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(fetchAllTeams).mockResolvedValue(mockTeams);
    vi.mocked(fetchCurrentMembership).mockResolvedValue(mockMembership);
    vi.mocked(createTeam).mockResolvedValue({
      id: 3,
      name: 'Nouvelle Team',
      managersCount: 1,
      membersCount: 1,
    });
    vi.mocked(joinTeam).mockResolvedValue(undefined);
  });

  test('exposes harmless default values and methods without a provider', async () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.teams).toEqual([]);
    expect(contextValue?.sortedTeams).toEqual([]);
    expect(contextValue?.currentTeamId).toBeUndefined();
    expect(contextValue?.currentMembership).toBeNull();
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.createError).toBeNull();
    expect(contextValue?.joinError).toBeNull();
    expect(contextValue?.newTeamName).toBe('');
    expect(contextValue?.acceptManagerRole).toBe(false);
    expect(contextValue?.creating).toBe(false);
    expect(contextValue?.showJoinColumn).toBe(false);
    expect(contextValue?.helpText).toBe(
      'Cliquez sur une team pour consulter ses membres.',
    );

    expect(() => contextValue?.setNewTeamName('test')).not.toThrow();
    expect(() => contextValue?.setAcceptManagerRole(true)).not.toThrow();
    expect(() => contextValue?.clearError()).not.toThrow();
    expect(() => contextValue?.clearCreateError()).not.toThrow();
    expect(() => contextValue?.clearJoinError()).not.toThrow();
    await expect(
      contextValue?.handleCreateTeam() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handleJoinTeam(1) ?? Promise.resolve(),
    ).resolves.toBeUndefined();
  });

  test('loads teams and current membership on mount', async () => {
    renderTeamsListContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.teams).toEqual(mockTeams);
      expect(contextValue?.currentMembership).toEqual(mockMembership);
    });
  });

  test('does not fetch membership when user is not authenticated', async () => {
    renderTeamsListContext(createUserContextValue(null));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchCurrentMembership).not.toHaveBeenCalled();
    expect(contextValue?.currentMembership).toBeNull();
  });

  test('stores a loading error when fetching teams fails', async () => {
    vi.mocked(fetchAllTeams).mockRejectedValueOnce(
      new Error('Chargement impossible'),
    );

    renderTeamsListContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Chargement impossible');
    });
  });

  test('stores a generic error message when the thrown value is not an Error', async () => {
    vi.mocked(fetchAllTeams).mockRejectedValueOnce('erreur inconnue');

    renderTeamsListContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  test('handleCreateTeam does nothing without an authenticated user', async () => {
    renderTeamsListContext(createUserContextValue(null));

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleCreateTeam();
    });

    expect(createTeam).not.toHaveBeenCalled();
  });

  test('handleCreateTeam does nothing without a team name', async () => {
    renderTeamsListContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setAcceptManagerRole(true);
    });

    await act(async () => {
      await contextValue?.handleCreateTeam();
    });

    expect(createTeam).not.toHaveBeenCalled();
  });

  test('handleCreateTeam does nothing without accepting the manager role', async () => {
    renderTeamsListContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewTeamName('Ma Team');
    });

    await act(async () => {
      await contextValue?.handleCreateTeam();
    });

    expect(createTeam).not.toHaveBeenCalled();
  });

  test('handleCreateTeam adds the new team and updates the authenticated user', async () => {
    const userContextValue = createUserContextValue();
    renderTeamsListContext(userContextValue);

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewTeamName('Nouvelle Team');
      contextValue?.setAcceptManagerRole(true);
    });

    await act(async () => {
      await contextValue?.handleCreateTeam();
    });

    await waitFor(() => {
      expect(createTeam).toHaveBeenCalledWith('test-token', 'Nouvelle Team');
      expect(contextValue?.teams).toContainEqual({
        id: 3,
        name: 'Nouvelle Team',
        managersCount: 1,
        membersCount: 1,
      });
      expect(contextValue?.newTeamName).toBe('');
      expect(contextValue?.acceptManagerRole).toBe(false);
      expect(userContextValue.setAuthenticatedUser).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: 3 }),
      );
    });
  });

  test('handleCreateTeam stores creation errors', async () => {
    vi.mocked(createTeam).mockRejectedValueOnce(new Error('Nom déjà existant'));

    renderTeamsListContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewTeamName('Team X');
      contextValue?.setAcceptManagerRole(true);
    });

    await act(async () => {
      await contextValue?.handleCreateTeam();
    });

    await waitFor(() => {
      expect(contextValue?.createError).toBe('Nom déjà existant');
    });
  });

  test('handleJoinTeam does nothing without an authenticated user', async () => {
    renderTeamsListContext(createUserContextValue(null));

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleJoinTeam(1);
    });

    expect(joinTeam).not.toHaveBeenCalled();
  });

  test('handleJoinTeam updates the current membership after success', async () => {
    const updatedMembership = { ...mockMembership, status: 'PENDING' as const };
    vi.mocked(fetchCurrentMembership)
      .mockResolvedValueOnce(mockMembership)
      .mockResolvedValueOnce(updatedMembership);

    renderTeamsListContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleJoinTeam(2);
    });

    await waitFor(() => {
      expect(joinTeam).toHaveBeenCalledWith('test-token', 2);
      expect(contextValue?.currentMembership).toEqual(updatedMembership);
    });
  });

  test('handleJoinTeam stores join errors', async () => {
    vi.mocked(joinTeam).mockRejectedValueOnce(
      new Error('Tag déjà pris dans cette team'),
    );

    renderTeamsListContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleJoinTeam(2);
    });

    await waitFor(() => {
      expect(contextValue?.joinError).toBe('Tag déjà pris dans cette team');
    });
  });

  test('helpText shows the basic message when user has no team', async () => {
    renderTeamsListContext(createUserContextValue(null));

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.helpText).toBe(
      'Cliquez sur une team pour consulter ses membres.',
    );
  });

  test('helpText shows the extended message when user has a team', async () => {
    const userWithTeam = { ...authenticatedUser, teamId: 1 };
    renderTeamsListContext(createUserContextValue(userWithTeam));

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.helpText).toBe(
      'Cliquez sur une team pour consulter ses membres.\nSur votre team, vous pouvez également effectuer les actions liées à votre rôle.',
    );
  });

  test('sortedTeams puts the user team first', async () => {
    const userWithTeam = { ...authenticatedUser, teamId: 2 };
    renderTeamsListContext(createUserContextValue(userWithTeam));

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.sortedTeams[0].id).toBe(2);
  });

  test('sortedTeams puts inactive teams last, sorted alphabetically', async () => {
    const teamsWithInactive = [
      { id: 10, name: 'Team Zeta', managersCount: 1, membersCount: 2 },
      { id: 11, name: 'Team Alpha', managersCount: 0, membersCount: 0 },
      { id: 12, name: 'Team Beta', managersCount: 0, membersCount: 0 },
      { id: 13, name: 'Team Mage', managersCount: 1, membersCount: 1 },
    ];
    vi.mocked(fetchAllTeams).mockResolvedValueOnce(teamsWithInactive);
    renderTeamsListContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    const sorted = contextValue?.sortedTeams ?? [];
    expect(sorted[0].id).toBe(13);
    expect(sorted[1].id).toBe(10);
    expect(sorted[2].id).toBe(11);
    expect(sorted[3].id).toBe(12);
  });
});
