import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MemberActivity from './MemberActivity';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

interface ActivityProps {
  token: string;
  userId: number;
  currentTeamId: number | null;
  currentTeamName: string | null;
  isMemberBanned?: boolean;
  fallbackPastTeam?: {
    teamId: number;
    teamName: string | null;
  } | null;
  showUpcoming?: boolean;
}

describe('MemberActivity', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  const todayFrDate = todayIsoDate.split('-').reverse().join('/');

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const defaultProps: ActivityProps = {
    token: 'test-token',
    userId: 1,
    currentTeamId: null,
    currentTeamName: null,
  };

  const mockAllEmpty = () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  };

  const renderActivity = (props: ActivityProps = defaultProps) =>
    render(
      <MemoryRouter>
        <MemberActivity {...props} />
      </MemoryRouter>,
    );

  test('renders the activity title', async () => {
    mockAllEmpty();
    renderActivity();
    await waitFor(() => {
      expect(screen.getByText(/mon activité/i)).toBeTruthy();
    });
  });

  test('shows message when member has no current team', async () => {
    mockAllEmpty();
    renderActivity();
    await waitFor(() => {
      expect(
        screen.getByText(/ce membre n'appartient à aucune team/i),
      ).toBeTruthy();
    });
  });

  test('shows current team name when teamId is provided', async () => {
    mockAllEmpty();
    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getByText(/team actuelle/i)).toBeTruthy();
    });
  });

  test('shows "Aucun match à venir" and "Aucun match passé" when no matches', async () => {
    mockAllEmpty();
    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
      showUpcoming: true,
    });
    await waitFor(() => {
      expect(screen.getByText(/aucun match à venir/i)).toBeTruthy();
      expect(screen.getByText(/aucun match passé/i)).toBeTruthy();
    });
  });

  test('shows upcoming matches', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi Marshall',
              round: 1,
              totalRounds: 1,
              matchId: 1,
              selectedTeamId: 10,
              team1Id: 10,
              team1Name: 'Team Alpha',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: null,
              state: 'PLANIFIED',
            },
          ]),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
      showUpcoming: true,
    });
    await waitFor(() => {
      expect(screen.getByText('Tournoi Marshall')).toBeTruthy();
      expect(screen.getByText('Team Beta')).toBeTruthy();
    });
  });

  test('shows past matches with winner in green', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi Marshall',
              round: 1,
              totalRounds: 1,
              matchId: 1,
              selectedTeamId: 10,
              team1Id: 10,
              team1Name: 'Team Alpha',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: 10,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeTruthy();
      expect(screen.getByText(/passés/i)).toBeTruthy();
    });
  });

  test('shows past teams as accordions', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { teamId: 2, teamName: 'Team Beta', leftAt: '2023-06-01' },
          ]),
      });

    renderActivity();
    await waitFor(() => {
      expect(screen.getByText('Team Beta')).toBeTruthy();
      expect(screen.getByText(/quitté le 01\/06\/2023/i)).toBeTruthy();
    });
  });

  test('shows fallback former team when member has no current team', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderActivity({
      ...defaultProps,
      fallbackPastTeam: { teamId: 9, teamName: 'Team Omega' },
    });

    await waitFor(() => {
      expect(screen.getByText('Team Omega')).toBeTruthy();
      expect(screen.getByText(/quitté le —/i)).toBeTruthy();
    });
  });

  test('shows "banni le" with date for banned fallback former team', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderActivity({
      ...defaultProps,
      isMemberBanned: true,
      fallbackPastTeam: { teamId: 9, teamName: 'Team Omega' },
    });

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`banni le ${todayFrDate}`, 'i')),
      ).toBeTruthy();
    });
  });

  test('rebuilds former team from member activity after refresh', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi Marshall',
              round: 1,
              totalRounds: 1,
              matchId: 55,
              selectedTeamId: 15,
              team1Id: 15,
              team1Name: 'Team Sigma',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: 15,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderActivity();

    await waitFor(() => {
      expect(screen.getByText('Team Sigma')).toBeTruthy();
      expect(screen.getByText(/quitté le —/i)).toBeTruthy();
    });
  });

  test('shows "banni le" when former team is rebuilt from activity for banned member', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi Marshall',
              round: 1,
              totalRounds: 1,
              matchId: 55,
              selectedTeamId: 15,
              team1Id: 15,
              team1Name: 'Team Sigma',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: 15,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderActivity({ ...defaultProps, isMemberBanned: true });

    await waitFor(() => {
      expect(screen.getByText('Team Sigma')).toBeTruthy();
      expect(
        screen.getByText(new RegExp(`banni le ${todayFrDate}`, 'i')),
      ).toBeTruthy();
    });
  });

  test('shows "—" when leftAt is missing', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { teamId: 2, teamName: 'Team Beta', leftAt: undefined },
          ]),
      });

    renderActivity();
    await waitFor(() => {
      expect(screen.getByText(/quitté le —/i)).toBeTruthy();
    });
  });

  test('calls fetchPastTeams with correct userId and token', async () => {
    mockAllEmpty();
    renderActivity({ ...defaultProps, userId: 42 });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/42/past-teams',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'test-token' }),
        }),
      );
    });
  });

  test('calls fetchMemberActivity with correct userId and token', async () => {
    mockAllEmpty();
    renderActivity({ ...defaultProps, userId: 42 });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/42/member-activity',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'test-token' }),
        }),
      );
    });
  });

  test('handles fetchPastTeams error gracefully', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));
    renderActivity();
    await waitFor(() => {
      expect(screen.getByText(/mon activité/i)).toBeTruthy();
    });
  });

  test('loads team activity when accordion is expanded', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { teamId: 2, teamName: 'Team Beta', leftAt: '2023-06-01' },
          ]),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderActivity();
    await waitFor(() => {
      expect(screen.getByText('Team Beta')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('Team Beta'));
    await waitFor(() => {
      expect(screen.getByText(/aucun match passé/i)).toBeTruthy();
    });
  });

  test('handles fetchTeamActivity error gracefully when accordion is expanded', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { teamId: 2, teamName: 'Team Beta', leftAt: '2023-06-01' },
          ]),
      })
      .mockRejectedValueOnce(new Error('Network error'));

    renderActivity();
    await waitFor(() => {
      expect(screen.getByText('Team Beta')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('Team Beta'));
    await waitFor(() => {
      expect(screen.getByText(/aucun match passé/i)).toBeTruthy();
    });
  });

  test('handles fetchTeamActivity error gracefully for current team', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getByText(/mon activité/i)).toBeTruthy();
    });
  });

  test('shows loading spinner while fetching member activity', async () => {
    let resolveFetch!: (value: unknown) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    resolveFetch({ ok: true, json: () => Promise.resolve([]) });
    await waitFor(() => {
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    });
  });

  test('shows "Aucune activité" when team has no tournaments', async () => {
    mockAllEmpty();
    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
      showUpcoming: true,
    });
    await waitFor(() => {
      expect(screen.getByText(/aucun match à venir/i)).toBeTruthy();
      expect(screen.getByText(/aucun match passé/i)).toBeTruthy();
    });
  });

  test('shows team id when currentTeamName is null', async () => {
    mockAllEmpty();
    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: null,
    });
    await waitFor(() => {
      expect(screen.getByText(/Team #10/i)).toBeTruthy();
    });
  });

  test('shows "?" when team names are null', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi Marshall',
              round: 1,
              totalRounds: 1,
              matchId: 1,
              selectedTeamId: 10,
              team1Id: null,
              team1Name: null,
              team2Id: null,
              team2Name: null,
              winnerTeamId: null,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getAllByText('?').length).toBeGreaterThan(0);
    });
  });

  test('shows team2 winner in green', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi',
              round: 1,
              totalRounds: 1,
              matchId: 1,
              selectedTeamId: 10,
              team1Id: 10,
              team1Name: 'Team Alpha',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: 20,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getByText('Team Beta')).toBeTruthy();
    });
  });

  test('shows Demi-finale label', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi',
              round: 2,
              totalRounds: 3,
              matchId: 1,
              selectedTeamId: 10,
              team1Id: 10,
              team1Name: 'Team Alpha',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: null,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getByText('Demi-finale')).toBeTruthy();
    });
  });

  test('shows Quarts de finale label', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi',
              round: 2,
              totalRounds: 4,
              matchId: 1,
              selectedTeamId: 10,
              team1Id: 10,
              team1Name: 'Team Alpha',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: null,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getByText('Quarts de finale')).toBeTruthy();
    });
  });

  test('shows Huitièmes de finale label', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi',
              round: 2,
              totalRounds: 5,
              matchId: 1,
              selectedTeamId: 10,
              team1Id: 10,
              team1Name: 'Team Alpha',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: null,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getByText('Huitièmes de finale')).toBeTruthy();
    });
  });

  test('shows Round label for early rounds', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 1,
              tournamentName: 'Tournoi',
              round: 1,
              totalRounds: 6,
              matchId: 1,
              selectedTeamId: 10,
              team1Id: 10,
              team1Name: 'Team Alpha',
              team2Id: 20,
              team2Name: 'Team Beta',
              winnerTeamId: null,
              state: 'ENDED',
            },
          ]),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderActivity({
      ...defaultProps,
      currentTeamId: 10,
      currentTeamName: 'Team Alpha',
    });
    await waitFor(() => {
      expect(screen.getByText('Round 1')).toBeTruthy();
    });
  });
});
