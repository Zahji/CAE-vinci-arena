import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MatchDetailContext } from '../../../../contexts/MatchDetailContext';
import { UserContext } from '../../../../contexts/UserContext';
import { MatchDetailContextType, UserContextType } from '../../../../types';
import DeclareForfeitButton from './DeclareForfeitButton';
import { declareForfeit } from '../../../../services/participationService';

vi.mock('../../../../services/participationService', () => ({
  declareForfeit: vi.fn(),
}));

const makeUserContext = (teamId: number, id = 99): UserContextType => ({
  authenticatedUser: {
    id,
    email: 'manager@test.com',
    tag: 'Manager',
    token: 'token',
    teamId,
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ isAdmin: false }),
});

const makeMatchContext = (
  overrides: Partial<MatchDetailContextType> = {},
): MatchDetailContextType => ({
  match: {
    matchId: 1,
    round: 1,
    startTime: '2026-05-01T10:00:00',
    state: 'PLANIFIED',
    tournamentId: 6,
    adminId: 33,
    team1Id: 10,
    team1Name: 'TEAM_ALPHA',
    team2Id: 20,
    team2Name: 'TEAM_BETA',
    team1Score: undefined,
    team2Score: undefined,
    scoreUpdatedAt: undefined,
    team1MotifRefuse: undefined,
    team2MotifRefuse: undefined,
    ...overrides.match,
  },
  team1: {
    id: 10,
    name: 'TEAM_ALPHA',
    manager: {
      id: 99,
      email: 'manager@test.com',
      tag: 'Manager',
      speciality: 'Mage',
      profilePicture: '',
      date: '',
    },
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  },
  team2: {
    id: 20,
    name: 'TEAM_BETA',
    manager: {
      id: 100,
      email: 'other@test.com',
      tag: 'Other',
      speciality: 'Archer',
      profilePicture: '',
      date: '',
    },
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  },
  loading: false,
  error: null,
  refetch: vi.fn(),
  matchEnded: false,
  isManagerOfAnyTeam: true,
  canSeeTeam1: true,
  canSeeTeam2: true,
  ...overrides,
});

const renderButton = (ctx: MatchDetailContextType, userCtx: UserContextType) =>
  render(
    <UserContext.Provider value={userCtx}>
      <MatchDetailContext.Provider value={ctx}>
        <DeclareForfeitButton onSuccess={vi.fn()} />
      </MatchDetailContext.Provider>
    </UserContext.Provider>,
  );

describe('DeclareForfeitButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders for the manager of an ongoing match', () => {
    renderButton(makeMatchContext(), makeUserContext(10));

    expect(
      screen.getByRole('button', { name: /déclarer forfait/i }),
    ).toBeTruthy();
  });

  test('does not render when match is not ongoing', () => {
    renderButton(
      makeMatchContext({
        match: {
          state: 'ENDED',
          matchId: 0,
          round: 0,
          startTime: '',
        },
      }),
      makeUserContext(10),
    );

    expect(
      screen.queryByRole('button', { name: /déclarer forfait/i }),
    ).toBeNull();
  });

  test('does not render for non-manager users', () => {
    renderButton(makeMatchContext(), makeUserContext(999, 999));

    expect(
      screen.queryByRole('button', { name: /déclarer forfait/i }),
    ).toBeNull();
  });

  test('submits the forfeit request when confirmed', async () => {
    vi.mocked(declareForfeit).mockResolvedValueOnce();
    const onSuccess = vi.fn();

    render(
      <UserContext.Provider value={makeUserContext(10)}>
        <MatchDetailContext.Provider value={makeMatchContext()}>
          <DeclareForfeitButton onSuccess={onSuccess} />
        </MatchDetailContext.Provider>
      </UserContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /déclarer forfait/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(declareForfeit).toHaveBeenCalledWith('token', 6, 1, 10);
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
