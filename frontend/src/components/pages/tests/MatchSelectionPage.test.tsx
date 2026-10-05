import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import MatchSelectionPage from '../tournamentsDetails/MatchSelectionPage';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn(), useParams: vi.fn() };
});

describe('MatchSelectionPage', () => {
  const manager1 = {
    id: 1,
    email: 'mgr1@test.com',
    tag: 'Mgr1',
    speciality: 'Mage',
    profilePicture: '',
    date: '',
  };

  const manager2 = {
    id: 2,
    email: 'mgr2@test.com',
    tag: 'Mgr2',
    speciality: 'Archer',
    profilePicture: '',
    date: '',
  };

  const mockMatch = {
    matchId: 4,
    round: 1,
    startTime: '2026-04-23T13:00:00',
    state: 'ENDED',
    tournamentId: 1,
    team1Id: 5,
    team2Id: 8,
    team1Name: 'TIAGO_TEAM_1',
    team2Name: 'TIAGO_TEAM_4',
    team1Score: 5,
    team2Score: 8,
    scoreUpdatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    team1MotifRefuse: null,
    team2MotifRefuse: null,
  };

  const mockTeam1 = {
    id: 5,
    name: 'TIAGO_TEAM_1',
    manager: manager1,
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  };

  const mockTeam2 = {
    id: 8,
    name: 'TIAGO_TEAM_4',
    manager: manager2,
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  };

  /**
   * Returns a user context for a logged-in user.
   * @param {number} userId - the user id
   * @param {number} [teamId] - the user's team id
   * @return {UserContextType} the context value
   */
  const createUserContext = (
    userId: number,
    teamId?: number,
  ): UserContextType => ({
    authenticatedUser: {
      id: userId,
      email: 'user@test.com',
      tag: 'user',
      token: 'token',
      teamId,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue({ id: userId, isAdmin: false }),
  });

  /**
   * Returns a user context for an admin user.
   * @return {UserContextType} the context value
   */
  const createAdminContext = (): UserContextType => ({
    authenticatedUser: {
      id: 99,
      email: 'admin@test.com',
      tag: 'admin',
      token: 'token',
      teamId: undefined,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue({ id: 99, isAdmin: true }),
  });

  /**
   * Shows the match selection page inside a user context.
   * @param {UserContextType} ctx - the user context
   * @return {void}
   */
  const renderPage = (ctx: UserContextType) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={ctx}>
          <MatchSelectionPage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

  let fetchMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    navigateMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(useParams).mockReturnValue({ tournamentId: '1', matchId: '4' });

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMatch),
      }) // fetchMatch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam1),
      }) // fetchTeamById team1
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam2),
      }); // fetchTeamById team2
  });

  afterEach(() => vi.unstubAllGlobals());

  test('shows invalid params alert when tournamentId is not a number', () => {
    vi.mocked(useParams).mockReturnValue({ tournamentId: 'abc', matchId: '4' });

    renderPage(createUserContext(1, 5));

    expect(screen.getByText(/paramètres invalides/i)).toBeTruthy();
  });

  test('shows invalid params alert when matchId is not a number', () => {
    vi.mocked(useParams).mockReturnValue({ tournamentId: '1', matchId: 'abc' });

    renderPage(createUserContext(1, 5));

    expect(screen.getByText(/paramètres invalides/i)).toBeTruthy();
  });

  test('renders the page title', async () => {
    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(screen.getByText(/détail du match/i)).toBeTruthy();
    });
  });

  test('renders both team names', async () => {
    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(screen.getAllByText('TIAGO_TEAM_1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TIAGO_TEAM_4').length).toBeGreaterThan(0);
    });
  });

  test('renders the score when match is ended with scores', async () => {
    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('8')).toBeTruthy();
      expect(screen.getByText(/score final/i)).toBeTruthy();
    });
  });

  test('renders VS when scores are not set', async () => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockMatch,
            state: 'PLANIFIED',
            team1Score: undefined,
            team2Score: undefined,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam2),
      });

    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(screen.getByText('VS')).toBeTruthy();
    });
  });

  test('hides both trophy icons when scores are equal', async () => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockMatch,
            state: 'ENDED',
            team1Score: 3,
            team2Score: 3,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam2),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(screen.getAllByText('3')).toHaveLength(2);
      expect(screen.getByText(/score final/i)).toBeTruthy();
    });
  });

  test('shows contest button for manager of team in match', async () => {
    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /contester/i })).toBeTruthy();
    });
  });

  test('does not show contest button for non-manager team member', async () => {
    renderPage(createUserContext(99, 99));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
    });
  });

  test('does not show contest button for admin', async () => {
    renderPage(createAdminContext());

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
    });
  });

  test('shows error alert when match fetch fails', async () => {
    fetchMock.mockReset();
    fetchMock.mockRejectedValueOnce(new Error('Erreur réseau'));

    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(screen.getByText(/erreur réseau/i)).toBeTruthy();
    });
  });

  test('renders back button that navigates to bracket', async () => {
    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /retour au planning/i }),
      ).toBeTruthy();
    });
  });

  test('shows locked panel for team the user does not belong to before match ends', async () => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockMatch,
            state: 'PLANIFIED',
            team1Score: undefined,
            team2Score: undefined,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam2),
      });

    renderPage(createUserContext(1, 5));

    await waitFor(() => {
      expect(
        screen.getByText(/sera visible une fois le match terminé/i),
      ).toBeTruthy();
    });
  });

  test('admin can see both team panels even before match ends', async () => {
    fetchMock.mockReset();
    // Admin fetch: match + teams + 2x selections + 2x participations + 2x members
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockMatch,
            state: 'PLANIFIED',
            team1Score: undefined,
            team2Score: undefined,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam2),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderPage(createAdminContext());

    await waitFor(() => {
      expect(
        screen.queryByText(/sera visible une fois le match terminé/i),
      ).toBeNull();
    });
  });
});
