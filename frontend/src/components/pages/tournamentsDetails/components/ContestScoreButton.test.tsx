import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { UserContext } from '../../../../contexts/UserContext';
import { UserContextType, Match } from '../../../../types';
import ContestScoreButton from './ContestScoreButton';

const recentTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();
const expiredTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  matchId: 1,
  round: 1,
  startTime: '2026-05-01T10:00:00',
  state: 'ENDED',
  tournamentId: 6,
  adminId: 33,
  team1Id: 10,
  team1Name: 'TEAM_ALPHA',
  team2Id: 20,
  team2Name: 'TEAM_BETA',
  team1Score: 2,
  team2Score: 1,
  scoreUpdatedAt: recentTime,
  ...overrides,
});

const makeManagerContext = (teamId: number, id = 99): UserContextType => ({
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

const renderWithContext = (ui: React.ReactElement, ctx: UserContextType) =>
  render(<UserContext.Provider value={ctx}>{ui}</UserContext.Provider>);

describe('ContestScoreButton', () => {
  const onSuccess = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  test('renders button for team1 manager within 2h window', () => {
    renderWithContext(
      <ContestScoreButton match={makeMatch()} onSuccess={onSuccess} />,
      makeManagerContext(10),
    );
    expect(screen.getByRole('button', { name: /contester/i })).toBeTruthy();
  });

  test('renders button for team2 manager within 2h window', () => {
    renderWithContext(
      <ContestScoreButton match={makeMatch()} onSuccess={onSuccess} />,
      makeManagerContext(20),
    );
    expect(screen.getByRole('button', { name: /contester/i })).toBeTruthy();
  });

  test('returns null when state is not ENDED', () => {
    renderWithContext(
      <ContestScoreButton
        match={makeMatch({ state: 'ONGOING' })}
        onSuccess={onSuccess}
      />,
      makeManagerContext(10),
    );
    expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
  });

  test('returns null when scores are missing', () => {
    renderWithContext(
      <ContestScoreButton
        match={makeMatch({ team1Score: undefined, team2Score: undefined })}
        onSuccess={onSuccess}
      />,
      makeManagerContext(10),
    );
    expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
  });

  test('returns null when scoreUpdatedAt is missing', () => {
    renderWithContext(
      <ContestScoreButton
        match={makeMatch({ scoreUpdatedAt: undefined })}
        onSuccess={onSuccess}
      />,
      makeManagerContext(10),
    );
    expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
  });

  test('returns null when 2h window has expired', () => {
    renderWithContext(
      <ContestScoreButton
        match={makeMatch({ scoreUpdatedAt: expiredTime })}
        onSuccess={onSuccess}
      />,
      makeManagerContext(10),
    );
    expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
  });

  test('returns null when user team is not in the match', () => {
    renderWithContext(
      <ContestScoreButton match={makeMatch()} onSuccess={onSuccess} />,
      makeManagerContext(99),
    );
    expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
  });

  test('returns null when team1 already contested', () => {
    renderWithContext(
      <ContestScoreButton
        match={makeMatch({ team1MotifRefuse: 'Score incorrect' })}
        onSuccess={onSuccess}
      />,
      makeManagerContext(10),
    );
    expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
  });

  test('returns null when team2 already contested', () => {
    renderWithContext(
      <ContestScoreButton
        match={makeMatch({ team2MotifRefuse: 'Score incorrect' })}
        onSuccess={onSuccess}
      />,
      makeManagerContext(20),
    );
    expect(screen.queryByRole('button', { name: /contester/i })).toBeNull();
  });

  test('opens dialog when button is clicked', async () => {
    renderWithContext(
      <ContestScoreButton match={makeMatch()} onSuccess={onSuccess} />,
      makeManagerContext(10),
    );
    fireEvent.click(screen.getByRole('button', { name: /contester/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
  });
});
