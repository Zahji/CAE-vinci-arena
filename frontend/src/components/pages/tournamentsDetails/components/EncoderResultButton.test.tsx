import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { UserContext } from '../../../../contexts/UserContext';
import { UserContextType, Match } from '../../../../types';
import EncoderResultButton from './EncoderResultButton';

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  matchId: 1,
  round: 1,
  startTime: '2026-05-01T10:00:00',
  state: 'ONGOING',
  tournamentId: 6,
  adminId: 33,
  team1Id: 10,
  team1Name: 'TEAM_ALPHA',
  team2Id: 20,
  team2Name: 'TEAM_BETA',
  ...overrides,
});

const makeAdminContext = (id = 33): UserContextType => ({
  authenticatedUser: {
    id,
    email: 'admin@test.com',
    tag: 'Admin',
    token: 'token',
    teamId: undefined,
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ isAdmin: true }),
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

describe('EncoderResultButton', () => {
  const onSuccess = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  test('renders button when admin is match admin and state is ONGOING', () => {
    renderWithContext(
      <EncoderResultButton
        match={makeMatch()}
        tournamentId={6}
        onSuccess={onSuccess}
      />,
      makeAdminContext(33),
    );
    expect(
      screen.getByRole('button', { name: /encoder résultat/i }),
    ).toBeTruthy();
  });

  test('renders button when state is CONTESTED', () => {
    renderWithContext(
      <EncoderResultButton
        match={makeMatch({ state: 'CONTESTED' })}
        tournamentId={6}
        onSuccess={onSuccess}
      />,
      makeAdminContext(33),
    );
    expect(
      screen.getByRole('button', { name: /encoder résultat/i }),
    ).toBeTruthy();
  });

  test('returns null when user is not admin', () => {
    renderWithContext(
      <EncoderResultButton
        match={makeMatch()}
        tournamentId={6}
        onSuccess={onSuccess}
      />,
      makeManagerContext(10),
    );
    expect(
      screen.queryByRole('button', { name: /encoder résultat/i }),
    ).toBeNull();
  });

  test('returns null when user is admin but not match admin', () => {
    renderWithContext(
      <EncoderResultButton
        match={makeMatch({ adminId: 99 })}
        tournamentId={6}
        onSuccess={onSuccess}
      />,
      makeAdminContext(33),
    );
    expect(
      screen.queryByRole('button', { name: /encoder résultat/i }),
    ).toBeNull();
  });

  test('returns null when state is ENDED', () => {
    renderWithContext(
      <EncoderResultButton
        match={makeMatch({ state: 'ENDED' })}
        tournamentId={6}
        onSuccess={onSuccess}
      />,
      makeAdminContext(33),
    );
    expect(
      screen.queryByRole('button', { name: /encoder résultat/i }),
    ).toBeNull();
  });

  test('opens dialog when button is clicked', async () => {
    renderWithContext(
      <EncoderResultButton
        match={makeMatch()}
        tournamentId={6}
        onSuccess={onSuccess}
      />,
      makeAdminContext(33),
    );
    fireEvent.click(screen.getByRole('button', { name: /encoder résultat/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
  });
});
