import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate, useParams } from 'react-router-dom';
import TournamentBracketPage from '../tournamentsDetails/TournamentBracketPage';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';
import { fetchTournamentById } from '../../../services/tournamentService';
import { fetchTournamentRegistrations } from '../../../services/tournamentRegistrationService';
import { fetchTeamById } from '../../../services/teamService';

const scheduleSpy = vi.fn();

vi.mock('../tournamentsDetails/components/ScheduleBracket', () => ({
  default: (props: {
    tournamentId: number;
    currentTeamId?: number;
    isAdmin?: boolean;
    onSuccess: () => void;
  }) => {
    scheduleSpy(props);
    return (
      <div>
        <div>schedule tournament: {props.tournamentId}</div>
        <div>schedule team: {String(props.currentTeamId)}</div>
        <div>schedule admin: {String(props.isAdmin)}</div>
        <button onClick={() => props.onSuccess()}>refresh schedule</button>
      </div>
    );
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn(), useParams: vi.fn() };
});

vi.mock('../../../services/tournamentService', () => ({
  fetchTournamentById: vi.fn(),
}));

vi.mock('../../../services/tournamentRegistrationService', () => ({
  fetchTournamentRegistrations: vi.fn(),
}));

vi.mock('../../../services/teamService', () => ({
  fetchTeamById: vi.fn(),
}));

const tournament = {
  id: 1,
  name: 'Spring Cup',
  description: 'Tournoi de printemps',
  state: 'PLANIFIED',
  stateDisplayName: 'Planifié',
  startDate: '2026-06-01',
  endDate: '2026-06-03',
  startInscriptionDate: '2026-04-01',
  endInscriptionDate: '2026-05-31',
  maxTeams: 4,
  registrationsCount: 0,
};

const createUserContext = (isAdmin: boolean): UserContextType => ({
  authenticatedUser: {
    id: 10,
    email: 'user@mail.com',
    tag: 'Lynx',
    token: 'user-token',
    teamId: 77,
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ id: 10, email: 'user@mail.com', isAdmin }),
});

const renderWithUser = (isAdmin = false) =>
  render(
    <UserContext.Provider value={createUserContext(isAdmin)}>
      <TournamentBracketPage />
    </UserContext.Provider>,
  );

describe('TournamentBracketPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    navigateMock = vi.fn();
    scheduleSpy.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(useParams).mockReturnValue({ tournamentId: '1' });
    vi.mocked(fetchTournamentById).mockResolvedValue(tournament);
    vi.mocked(fetchTournamentRegistrations).mockResolvedValue([]);
    vi.mocked(fetchTeamById).mockResolvedValue({
      id: 77,
      name: 'TEAM_ALPHA',
      manager: null,
      secondManager: null,
      managersCount: 0,
      membersCount: 4,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('shows invalid id message when tournamentId is not numeric', () => {
    vi.mocked(useParams).mockReturnValue({ tournamentId: 'abc' });

    renderWithUser();

    expect(screen.getByText(/identifiant de tournoi invalide/i)).toBeTruthy();
  });

  test('returns null while tournament details are loading', () => {
    vi.mocked(fetchTournamentById).mockImplementation(
      () => new Promise(() => undefined) as Promise<typeof tournament>,
    );

    const { container } = renderWithUser();

    expect(container.firstChild).toBeNull();
  });

  test('shows warning when tournament loading fails', async () => {
    vi.mocked(fetchTournamentById).mockRejectedValueOnce(
      new Error('Erreur 404'),
    );

    renderWithUser();

    await waitFor(() => {
      expect(
        screen.getByText(/ce tournoi n'est pas encore publié ou n'existe pas/i),
      ).toBeTruthy();
    });
  });

  test('returns null when tournament is missing with no explicit error', async () => {
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(null as never);

    const { container } = renderWithUser();

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('shows loading state while matches are being fetched', async () => {
    fetchMock.mockImplementation(
      () => new Promise(() => undefined) as Promise<Response>,
    );

    renderWithUser();

    await waitFor(() => {
      expect(screen.getByText(/chargement du planning/i)).toBeTruthy();
    });
  });

  test('shows API error when matches endpoint returns non-ok status', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    renderWithUser();

    await waitFor(() => {
      expect(
        screen.getByText(/erreur lors du chargement du planning/i),
      ).toBeTruthy();
    });
  });

  test('shows network error when matches fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    renderWithUser();

    await waitFor(() => {
      expect(
        screen.getByText(
          /une erreur est survenue lors du chargement du planning/i,
        ),
      ).toBeTruthy();
    });
  });

  test('renders schedule with props, can navigate back, and refreshes matches', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              matchId: 12,
              round: 1,
              startTime: '2026-06-01T10:00:00',
              state: 'PLANIFIED',
            },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderWithUser(true);

    await waitFor(() => {
      expect(screen.getByText(/schedule tournament: 1/i)).toBeTruthy();
      expect(screen.getByText(/schedule team: 77/i)).toBeTruthy();
      expect(screen.getByText(/schedule admin: true/i)).toBeTruthy();
    });

    await userEvent.click(
      screen.getByRole('button', { name: /retour aux details/i }),
    );
    expect(navigateMock).toHaveBeenCalledWith('/tournaments/1');

    await userEvent.click(
      screen.getByRole('button', { name: /refresh schedule/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(scheduleSpy).toHaveBeenCalled();
    });
  });
});
