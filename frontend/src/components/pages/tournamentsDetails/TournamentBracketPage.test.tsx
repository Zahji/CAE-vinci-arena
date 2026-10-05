import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TournamentDetailsContext } from '../../../contexts/TournamentDetailsContext';
import { UserContext } from '../../../contexts/UserContext';
import type {
  TournamentDetailsContextType,
  UserContextType,
} from '../../../types';
import TournamentBracketPage from './TournamentBracketPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ tournamentId: '7' }),
  };
});

vi.mock('../../../contexts/TournamentDetailsContext', async () => {
  const actual = await vi.importActual<{
    TournamentDetailsContext: typeof TournamentDetailsContext;
    TournamentDetailsContextProvider: React.ComponentType<{
      tournamentId: number;
      children: React.ReactNode;
    }>;
  }>('../../../contexts/TournamentDetailsContext');

  return {
    ...actual,
    TournamentDetailsContextProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <>{children}</>,
  };
});

vi.mock('./components/ScheduleBracket', () => ({
  default: () => <div>Schedule bracket</div>,
}));

const makeUserContext = (): UserContextType => ({
  authenticatedUser: {
    id: 12,
    email: 'user@test.com',
    tag: 'User',
    token: 'token',
    teamId: 3,
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ isAdmin: false }),
});

const makeTournamentContext = (
  overrides: Partial<TournamentDetailsContextType> = {},
) =>
  ({
    loading: false,
    error: null,
    success: null,
    actionLoading: null,
    tournament: {
      id: 7,
      name: 'Spring Clash',
      description: 'Tournoi du printemps',
      state: 'ONGOING',
      stateDisplayName: 'En cours',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-01',
      endInscriptionDate: '2026-03-31',
      maxTeams: 16,
      registrationsCount: 0,
    },
    registrations: [],
    canRegister: false,
    registering: false,
    registerError: null,
    registerSuccess: false,
    registerTeam: vi.fn(),
    clearRegisterError: vi.fn(),
    ...overrides,
  }) as TournamentDetailsContextType;

describe('TournamentBracketPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  test('renders the return button with an arrow and navigates to details', () => {
    render(
      <UserContext.Provider value={makeUserContext()}>
        <TournamentDetailsContext.Provider value={makeTournamentContext()}>
          <TournamentBracketPage />
        </TournamentDetailsContext.Provider>
      </UserContext.Provider>,
    );

    const button = screen.getByRole('button', { name: /retour aux details/i });
    expect(button).toBeTruthy();
    expect(button.querySelector('svg')).toBeTruthy();
  });
});
