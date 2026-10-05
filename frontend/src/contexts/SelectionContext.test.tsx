import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SelectionContext, SelectionContextProvider } from './SelectionContext';
import { UserContext } from './UserContext';
import { SelectionContextType, UserContextType } from '../types';
import { fetchMatch, fetchParticipation } from '../services/matchService';
import { fetchTeamById } from '../services/teamService';
import { fetchTeamMembers } from '../services/teamMembershipService';
import { fetchMemberUnavailabilities } from '../services/membersService';
import {
  fetchSelections,
  addSelection,
  removeSelection,
} from '../services/selectionService';

vi.mock('../services/matchService', () => ({
  fetchMatch: vi.fn(),
  fetchParticipation: vi.fn(),
}));

vi.mock('../services/teamService', () => ({
  fetchTeamById: vi.fn(),
}));

vi.mock('../services/teamMembershipService', () => ({
  fetchTeamMembers: vi.fn(),
}));

vi.mock('../services/membersService', () => ({
  fetchMemberUnavailabilities: vi.fn(),
}));

vi.mock('../services/selectionService', () => ({
  fetchSelections: vi.fn(),
  addSelection: vi.fn(),
  removeSelection: vi.fn(),
}));

describe('SelectionContext', () => {
  const mockMatch = {
    matchId: 1,
    round: 1,
    startTime: '2099-06-01T15:00:00',
    state: 'PLANIFIED',
    tournamentId: 1,
    team1Id: 10,
    team2Id: 20,
    team1Name: 'Team A',
    team2Name: 'Team B',
    team1Score: undefined,
    team2Score: undefined,
    scoreUpdatedAt: undefined,
    team1MotifRefuse: undefined,
    team2MotifRefuse: undefined,
  };

  const manager = {
    id: 1,
    email: 'mgr@test.com',
    tag: 'mgr',
    speciality: 'Mage',
    profilePicture: '',
    date: '',
  };

  const mockTeam = {
    id: 10,
    name: 'Team A',
    manager,
    secondManager: null,
    managersCount: 1,
    membersCount: 2,
  };

  const mockMember = {
    id: 2,
    email: 'member@test.com',
    tag: 'member',
    speciality: 'Archer',
    profilePicture: '',
    date: '',
  };

  const mockMemberships = [
    {
      id: 100,
      member: mockMember,
      team: mockTeam,
      status: 'ACCEPTED' as const,
    },
  ];

  const mockParticipation = {
    matchId: 1,
    teamId: 10,
    statusSelection: 1,
    score: undefined,
    declaredForfeit: false,
  };

  const mockSelection = {
    matchId: 1,
    teamId: 10,
    memberId: 2,
    memberTag: 'member',
    memberSpeciality: 'Archer',
  };

  let contextValue: SelectionContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(SelectionContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(SelectionContext);
    return null;
  };

  const createUserContext = (
    userId = 1,
    teamId: number | undefined = 10,
    isAdmin = false,
  ): UserContextType => ({
    authenticatedUser: {
      id: userId,
      email: 'user@test.com',
      tag: 'user',
      token: 'test-token',
      teamId,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue({ id: userId, isAdmin }),
  });

  const renderContext = (userCtx = createUserContext()) =>
    render(
      <UserContext.Provider value={userCtx}>
        <SelectionContextProvider tournamentId={1} matchId={1} teamId={10}>
          <ContextConsumer />
        </SelectionContextProvider>
      </UserContext.Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(fetchMatch).mockResolvedValue(mockMatch);
    vi.mocked(fetchTeamById).mockResolvedValue(mockTeam);
    vi.mocked(fetchTeamMembers).mockResolvedValue(mockMemberships);
    vi.mocked(fetchSelections).mockResolvedValue([mockSelection]);
    vi.mocked(fetchParticipation).mockResolvedValue(mockParticipation);
    vi.mocked(fetchMemberUnavailabilities).mockResolvedValue([]);
    vi.mocked(addSelection).mockResolvedValue(mockSelection);
    vi.mocked(removeSelection).mockResolvedValue(undefined);
  });

  test('exposes harmless default values without a provider', () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.match).toBeNull();
    expect(contextValue?.memberships).toEqual([]);
    expect(contextValue?.selections).toEqual([]);
    expect(contextValue?.statusSelection).toBe(0);
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.actionError).toBeNull();
    expect(contextValue?.canModify).toBe(false);
    expect(contextValue?.isSelected(1)).toBe(false);
    expect(() => contextValue?.clearActionError()).not.toThrow();
  });

  test('loads match, team, members and selections on mount', async () => {
    renderContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.match).toEqual(mockMatch);
      // manager (id=1) is added synthetically + mockMember (id=2) from API
      expect(contextValue?.memberships).toHaveLength(2);
      expect(contextValue?.selections).toEqual([mockSelection]);
      expect(contextValue?.statusSelection).toBe(1);
    });

    expect(fetchMatch).toHaveBeenCalledWith(1, 1, 'test-token');
    expect(fetchTeamById).toHaveBeenCalledWith(10, 'test-token');
    expect(fetchTeamMembers).toHaveBeenCalledWith(10, 'test-token');
    expect(fetchSelections).toHaveBeenCalledWith(1, 1, 10, 'test-token');
    expect(fetchParticipation).toHaveBeenCalledWith(1, 1, 10, 'test-token');
  });

  test('only exposes ACCEPTED memberships (PENDING are excluded)', async () => {
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce([
      ...mockMemberships,
      {
        id: 200,
        member: { ...mockMember, id: 99 },
        team: mockTeam,
        status: 'PENDING' as const,
      },
    ]);

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    // manager (id=1) synthetic + mockMember (id=2) from API; id=99 PENDING excluded
    expect(contextValue?.memberships).toHaveLength(2);
    expect(contextValue?.memberships.some((m) => m.member.id === 99)).toBe(
      false,
    );
  });

  test('includes manager in memberships even without a TeamMembership row', async () => {
    // Manager (id=1) is not in the memberships returned by the API
    vi.mocked(fetchTeamMembers).mockResolvedValueOnce([]);

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.memberships).toHaveLength(1);
    expect(contextValue?.memberships[0].member.id).toBe(1);
    expect(contextValue?.memberships[0].status).toBe('ACCEPTED');
  });

  test('stores an error when loading fails', async () => {
    vi.mocked(fetchMatch).mockRejectedValueOnce(new Error('Erreur réseau'));

    renderContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Erreur réseau');
    });
  });

  test('stores a generic error message when a non-Error is thrown', async () => {
    vi.mocked(fetchMatch).mockRejectedValueOnce('unknown');

    renderContext();

    await waitFor(() => {
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  test('isSelected returns true for a selected member', async () => {
    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.isSelected(2)).toBe(true);
    expect(contextValue?.isSelected(99)).toBe(false);
  });

  test('canModify is true when user is manager and match is PLANIFIED in future', async () => {
    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.canModify).toBe(true);
  });

  test('canModify is false when match state is not PLANIFIED', async () => {
    vi.mocked(fetchMatch).mockResolvedValueOnce({
      ...mockMatch,
      state: 'ENDED',
    });

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.canModify).toBe(false);
  });

  test('canModify is false when match start time is in the past', async () => {
    vi.mocked(fetchMatch).mockResolvedValueOnce({
      ...mockMatch,
      startTime: '2020-01-01T10:00:00',
    });

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.canModify).toBe(false);
  });

  test('canModify is false when user is not manager', async () => {
    renderContext(createUserContext(99, 99));

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.canModify).toBe(false);
  });

  test('handleToggle removes a selection when member is already selected', async () => {
    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleToggle(2);
    });

    expect(removeSelection).toHaveBeenCalledWith(1, 1, 10, 2, 'test-token');
    expect(contextValue?.isSelected(2)).toBe(false);
  });

  test('handleToggle adds a selection when member is not selected', async () => {
    vi.mocked(fetchSelections).mockResolvedValueOnce([]);

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleToggle(2);
    });

    expect(addSelection).toHaveBeenCalledWith(1, 1, 10, 2, 'test-token');
    expect(contextValue?.isSelected(2)).toBe(true);
  });

  test('handleToggle does not add when statusSelection is 4 or more', async () => {
    vi.mocked(fetchSelections).mockResolvedValueOnce([]);
    vi.mocked(fetchParticipation).mockResolvedValue({
      ...mockParticipation,
      statusSelection: 4,
    });

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleToggle(2);
    });

    expect(addSelection).not.toHaveBeenCalled();
  });

  test('clearActionError clears the actionError', async () => {
    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.clearActionError();
    });

    expect(contextValue?.actionError).toBeNull();
  });

  test('fetches unavailabilities for manager when match has a startTime', async () => {
    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(fetchMemberUnavailabilities).toHaveBeenCalledWith(2, 'test-token');
  });

  test('marks member as unavailable when their unavailability covers the match date', async () => {
    vi.mocked(fetchMemberUnavailabilities).mockResolvedValueOnce([
      { id: 1, startDate: '2099-05-01', endDate: '2099-12-31' },
    ]);

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.unavailableMemberIds.has(2)).toBe(true);
  });

  test('does not fetch unavailabilities when user is not manager', async () => {
    renderContext(createUserContext(99, 99));

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(fetchMemberUnavailabilities).not.toHaveBeenCalled();
  });

  test('ignores error when fetchMemberUnavailabilities rejects for a member', async () => {
    vi.mocked(fetchMemberUnavailabilities).mockRejectedValueOnce(
      new Error('réseau'),
    );

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.unavailableMemberIds.has(2)).toBe(false);
  });

  test('handleToggle still completes when reloadStatusSelection fails', async () => {
    vi.mocked(fetchSelections).mockResolvedValueOnce([]);
    vi.mocked(fetchParticipation)
      .mockResolvedValueOnce(mockParticipation)
      .mockRejectedValueOnce(new Error('réseau'));

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleToggle(2);
    });

    expect(addSelection).toHaveBeenCalled();
    expect(contextValue?.isSelected(2)).toBe(true);
  });

  test('uses empty token when no authenticated user', async () => {
    render(
      <UserContext.Provider
        value={{
          authenticatedUser: undefined,
          setAuthenticatedUser: vi.fn(),
          registerUser: vi.fn(),
          loginUser: vi.fn(),
          clearUser: vi.fn(),
          refreshUser: vi.fn(),
          jwtData: vi.fn().mockReturnValue(null),
        }}
      >
        <SelectionContextProvider tournamentId={1} matchId={1} teamId={10}>
          <ContextConsumer />
        </SelectionContextProvider>
      </UserContext.Provider>,
    );

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(fetchMatch).toHaveBeenCalledWith(1, 1, '');
  });

  test('canModify is true when user is secondManager of the team', async () => {
    vi.mocked(fetchTeamById).mockResolvedValueOnce({
      ...mockTeam,
      manager: { ...manager, id: 99 },
      secondManager: manager,
    });

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(contextValue?.canModify).toBe(true);
  });

  test('fetches unavailabilities when user is secondManager', async () => {
    vi.mocked(fetchTeamById).mockResolvedValueOnce({
      ...mockTeam,
      manager: { ...manager, id: 99 },
      secondManager: manager,
    });

    renderContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(fetchMemberUnavailabilities).toHaveBeenCalledWith(2, 'test-token');
  });
});
