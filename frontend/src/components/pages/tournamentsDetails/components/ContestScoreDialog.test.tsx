import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { UserContext } from '../../../../contexts/UserContext';
import { UserContextType, Match } from '../../../../types';
import ContestScoreDialog from './ContestScoreDialog';

vi.mock('../../../../services/participationService', () => ({
  updateScore: vi.fn(),
  contestScore: vi.fn(),
}));

import { contestScore } from '../../../../services/participationService';

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
  ...overrides,
});

const makeManagerContext = (): UserContextType => ({
  authenticatedUser: {
    id: 99,
    email: 'manager@test.com',
    tag: 'Manager',
    token: 'token',
    teamId: 10,
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ isAdmin: false }),
});

const renderDialog = (
  matchOverrides: Partial<Match> = {},
  onClose = vi.fn(),
  onSuccess = vi.fn(),
) =>
  render(
    <UserContext.Provider value={makeManagerContext()}>
      <ContestScoreDialog
        match={makeMatch(matchOverrides)}
        teamId={10}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </UserContext.Provider>,
  );

describe('ContestScoreDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders dialog with reason field', () => {
    renderDialog();
    expect(screen.getByLabelText(/raison de la contestation/i)).toBeTruthy();
  });

  test('shows error when reason is empty', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(screen.getByText(/veuillez entrer une raison/i)).toBeTruthy();
    });
  });

  test('calls contestScore with correct args on valid submit', async () => {
    vi.mocked(contestScore).mockResolvedValue(undefined);
    renderDialog();
    fireEvent.change(screen.getByLabelText(/raison de la contestation/i), {
      target: { value: 'Score incorrect' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(contestScore).toHaveBeenCalledWith(
        'token',
        6,
        1,
        10,
        'Score incorrect',
      );
    });
  });

  test('calls onSuccess after successful submit', async () => {
    const onSuccess = vi.fn();
    vi.mocked(contestScore).mockResolvedValue(undefined);
    renderDialog({}, vi.fn(), onSuccess);
    fireEvent.change(screen.getByLabelText(/raison de la contestation/i), {
      target: { value: 'Score incorrect' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('shows error message when contestScore fails', async () => {
    vi.mocked(contestScore).mockRejectedValue(new Error('Erreur 400'));
    renderDialog();
    fireEvent.change(screen.getByLabelText(/raison de la contestation/i), {
      target: { value: 'raison valide' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(screen.getByText(/erreur 400/i)).toBeTruthy();
    });
  });

  test('calls onClose when Annuler is clicked', () => {
    const onClose = vi.fn();
    renderDialog({}, onClose);
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('shows error when tournamentId is missing', async () => {
    renderDialog({ tournamentId: undefined });
    fireEvent.change(screen.getByLabelText(/raison de la contestation/i), {
      target: { value: 'raison valide' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(screen.getByText(/données du match incomplètes/i)).toBeTruthy();
    });
  });

  test('clears error when typing in reason field', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(screen.getByText(/veuillez entrer une raison/i)).toBeTruthy();
    });
    fireEvent.change(screen.getByLabelText(/raison de la contestation/i), {
      target: { value: 'nouvelle raison' },
    });
    await waitFor(() => {
      expect(screen.queryByText(/veuillez entrer une raison/i)).toBeNull();
    });
  });
});
