import { useContext } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  MatchDetailContext,
  MatchDetailContextProvider,
} from './MatchDetailContext';
import { UserContext } from './UserContext';
import { UserContextType, MatchDetailContextType } from '../types';
import { fetchMatch } from '../services/matchService';
import { fetchTeamById } from '../services/teamService';

vi.mock('../services/matchService', () => ({
  fetchMatch: vi.fn(),
}));

vi.mock('../services/teamService', () => ({
  fetchTeamById: vi.fn(),
}));

describe('MatchDetailContext', () => {
  const mockMatch = {
    matchId: 4,
    round: 1,
    startTime: '2026-04-23T13:00:00',
    state: 'ENDED',
    tournamentId: 1,
    team1Id: 5,
    team2Id: 8,
    team1Name: 'TEAM_1',
    team2Name: 'TEAM_4',
    team1Score: 5,
    team2Score: 8,
    scoreUpdatedAt: '2026-04-22T10:16:33',
    team1MotifRefuse: undefined,
    team2MotifRefuse: undefined,
  };

  const mockTeam1 = {
    id: 5,
    name: 'TEAM_1',
    manager: {
      id: 1,
      email: 'mgr1@test.com',
      tag: 'Mgr1',
      speciality: 'Mage',
      profilePicture: '',
      date: '',
    },
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  };

  const mockTeam2 = {
    id: 8,
    name: 'TEAM_4',
    manager: {
      id: 2,
      email: 'mgr2@test.com',
      tag: 'Mgr2',
      speciality: 'Archer',
      profilePicture: '',
      date: '',
    },
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  };

  let contextValue: MatchDetailContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(MatchDetailContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(MatchDetailContext);
    return null;
  };

  const createUserContextValue = (): UserContextType => ({
    authenticatedUser: {
      id: 1,
      email: 'user@test.com',
      tag: 'user',
      token: 'test-token',
      teamId: 5,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 1, email: 'user@test.com', isAdmin: false }),
  });

  const renderMatchDetailContext = (tournamentId = 1, matchId = 4) =>
    render(
      <UserContext.Provider value={createUserContextValue()}>
        <MatchDetailContextProvider
          tournamentId={tournamentId}
          matchId={matchId}
        >
          <ContextConsumer />
        </MatchDetailContextProvider>
      </UserContext.Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(fetchMatch).mockResolvedValue(mockMatch);
    vi.mocked(fetchTeamById)
      .mockResolvedValueOnce(mockTeam1)
      .mockResolvedValueOnce(mockTeam2);
  });

  test('exposes harmless default values without a provider', () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.match).toBeNull();
    expect(contextValue?.team1).toBeNull();
    expect(contextValue?.team2).toBeNull();
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.matchEnded).toBe(false);
    expect(contextValue?.isManagerOfAnyTeam).toBe(false);
    expect(contextValue?.canSeeTeam1).toBe(false);
    expect(contextValue?.canSeeTeam2).toBe(false);
    expect(() => contextValue?.refetch()).not.toThrow();
  });

  test('loads match and both teams on mount', async () => {
    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.match).toEqual(mockMatch);
      expect(contextValue?.team1).toEqual(mockTeam1);
      expect(contextValue?.team2).toEqual(mockTeam2);
      expect(contextValue?.error).toBeNull();
    });

    expect(fetchMatch).toHaveBeenCalledWith(1, 4, 'test-token');
    expect(fetchTeamById).toHaveBeenCalledWith(5, 'test-token');
    expect(fetchTeamById).toHaveBeenCalledWith(8, 'test-token');
  });

  test('does not fetch teams when match has no team ids', async () => {
    vi.mocked(fetchMatch).mockResolvedValueOnce({
      ...mockMatch,
      team1Id: undefined,
      team2Id: undefined,
    });

    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.team1).toBeNull();
      expect(contextValue?.team2).toBeNull();
    });

    expect(fetchTeamById).not.toHaveBeenCalled();
  });

  test('stores an error message when fetchMatch fails', async () => {
    vi.mocked(fetchMatch).mockRejectedValueOnce(new Error('Match introuvable'));

    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Match introuvable');
      expect(contextValue?.match).toBeNull();
    });
  });

  test('stores a generic error message when a non-Error is thrown', async () => {
    vi.mocked(fetchMatch).mockRejectedValueOnce('unknown');

    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Erreur inconnue');
    });
  });

  test('refetch reloads match and teams', async () => {
    renderMatchDetailContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    const updatedMatch = { ...mockMatch, team1Score: 10 };
    vi.mocked(fetchMatch).mockResolvedValueOnce(updatedMatch);
    vi.mocked(fetchTeamById)
      .mockResolvedValueOnce(mockTeam1)
      .mockResolvedValueOnce(mockTeam2);

    await contextValue!.refetch();

    await waitFor(() => {
      expect(contextValue?.match?.team1Score).toBe(10);
    });

    expect(fetchMatch).toHaveBeenCalledTimes(2);
  });

  test('matchEnded is true when state is ENDED with scores', async () => {
    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.matchEnded).toBe(true);
    });
  });

  test('matchEnded is true when state is CONTESTED', async () => {
    vi.mocked(fetchMatch).mockResolvedValueOnce({
      ...mockMatch,
      state: 'CONTESTED',
      team1Score: undefined,
      team2Score: undefined,
    });

    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.matchEnded).toBe(true);
    });
  });

  test('matchEnded is false when state is PLANIFIED', async () => {
    vi.mocked(fetchMatch).mockResolvedValueOnce({
      ...mockMatch,
      state: 'PLANIFIED',
      team1Score: undefined,
      team2Score: undefined,
    });

    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.matchEnded).toBe(false);
    });
  });

  test('isManagerOfAnyTeam is true when user is manager of team1', async () => {
    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.isManagerOfAnyTeam).toBe(true);
    });
  });

  test('isManagerOfAnyTeam is true when user is secondManager of team1', async () => {
    vi.mocked(fetchTeamById).mockReset();
    vi.mocked(fetchTeamById)
      .mockResolvedValueOnce({
        ...mockTeam1,
        secondManager: {
          id: 1,
          email: 'mgr1@test.com',
          tag: 'Mgr1',
          speciality: 'Mage',
          profilePicture: '',
          date: '',
        },
      })
      .mockResolvedValueOnce(mockTeam2);

    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.isManagerOfAnyTeam).toBe(true);
    });
  });

  test('isManagerOfAnyTeam is true when user is secondManager of team2', async () => {
    vi.mocked(fetchTeamById).mockReset();
    vi.mocked(fetchTeamById)
      .mockResolvedValueOnce(mockTeam1)
      .mockResolvedValueOnce({
        ...mockTeam2,
        secondManager: {
          id: 1,
          email: 'mgr1@test.com',
          tag: 'Mgr1',
          speciality: 'Mage',
          profilePicture: '',
          date: '',
        },
      });

    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.isManagerOfAnyTeam).toBe(true);
    });
  });

  test('isManagerOfAnyTeam is false when user is not manager of either team', async () => {
    render(
      <UserContext.Provider
        value={{
          ...createUserContextValue(),
          authenticatedUser: {
            id: 99,
            email: 'other@test.com',
            tag: 'other',
            token: 'test-token',
            teamId: 99,
          },
          jwtData: vi.fn().mockReturnValue({ id: 99, isAdmin: false }),
        }}
      >
        <MatchDetailContextProvider tournamentId={1} matchId={4}>
          <ContextConsumer />
        </MatchDetailContextProvider>
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(contextValue?.isManagerOfAnyTeam).toBe(false);
    });
  });

  test('canSeeTeam1 is true when user is in team1', async () => {
    renderMatchDetailContext();

    await waitFor(() => {
      expect(contextValue?.canSeeTeam1).toBe(true);
    });
  });

  test('canSeeTeam1 is false when user is in another team and match not ended', async () => {
    vi.mocked(fetchMatch).mockResolvedValueOnce({
      ...mockMatch,
      state: 'PLANIFIED',
      team1Score: undefined,
      team2Score: undefined,
    });

    render(
      <UserContext.Provider
        value={{
          ...createUserContextValue(),
          authenticatedUser: {
            id: 99,
            email: 'other@test.com',
            tag: 'other',
            token: 'test-token',
            teamId: 99,
          },
          jwtData: vi.fn().mockReturnValue({ id: 99, isAdmin: false }),
        }}
      >
        <MatchDetailContextProvider tournamentId={1} matchId={4}>
          <ContextConsumer />
        </MatchDetailContextProvider>
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(contextValue?.canSeeTeam1).toBe(false);
      expect(contextValue?.canSeeTeam2).toBe(false);
    });
  });

  test('canSeeTeam1 and canSeeTeam2 are true for admin even before match ends', async () => {
    vi.mocked(fetchMatch).mockResolvedValueOnce({
      ...mockMatch,
      state: 'PLANIFIED',
      team1Score: undefined,
      team2Score: undefined,
    });

    render(
      <UserContext.Provider
        value={{
          ...createUserContextValue(),
          authenticatedUser: {
            id: 99,
            email: 'admin@test.com',
            tag: 'admin',
            token: 'test-token',
            teamId: undefined,
          },
          jwtData: vi.fn().mockReturnValue({ id: 99, isAdmin: true }),
        }}
      >
        <MatchDetailContextProvider tournamentId={1} matchId={4}>
          <ContextConsumer />
        </MatchDetailContextProvider>
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(contextValue?.canSeeTeam1).toBe(true);
      expect(contextValue?.canSeeTeam2).toBe(true);
    });
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
        <MatchDetailContextProvider tournamentId={1} matchId={4}>
          <ContextConsumer />
        </MatchDetailContextProvider>
      </UserContext.Provider>,
    );

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(fetchMatch).toHaveBeenCalledWith(1, 4, '');
  });
});
