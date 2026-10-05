import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { UserContext } from '../../../../contexts/UserContext';
import { UserContextType, Match } from '../../../../types';
import EncodeResultDialog from './EncodeResultDialog';

vi.mock('../../../../services/participationService', () => ({
  updateScore: vi.fn(),
  contestScore: vi.fn(),
}));

import { updateScore } from '../../../../services/participationService';

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

const makeAdminContext = (): UserContextType => ({
  authenticatedUser: {
    id: 33,
    email: 'admin@test.com',
    tag: 'Admin',
    token: 'token',
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ isAdmin: true }),
});

const renderDialog = (
  matchOverrides: Partial<Match> = {},
  onClose = vi.fn(),
  onSuccess = vi.fn(),
) =>
  render(
    <UserContext.Provider value={makeAdminContext()}>
      <EncodeResultDialog
        match={makeMatch(matchOverrides)}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </UserContext.Provider>,
  );

describe('EncodeResultDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders dialog with team names and score inputs', () => {
    renderDialog();
    expect(screen.getByText('TEAM_ALPHA')).toBeTruthy();
    expect(screen.getByText('TEAM_BETA')).toBeTruthy();
    expect(screen.getAllByLabelText(/score/i)).toHaveLength(2);
  });

  test('shows error when scores are empty', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(screen.getByText(/scores valides/i)).toBeTruthy();
    });
  });

  test('shows error when scores are negative', async () => {
    renderDialog();
    const inputs = screen.getAllByLabelText(/score/i);
    fireEvent.change(inputs[0], { target: { value: '-1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(screen.getByText(/scores valides/i)).toBeTruthy();
    });
  });

  test('calls updateScore twice on valid submit', async () => {
    vi.mocked(updateScore).mockResolvedValue(undefined);
    renderDialog();
    const inputs = screen.getAllByLabelText(/score/i);
    fireEvent.change(inputs[0], { target: { value: '3' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(updateScore).toHaveBeenCalledTimes(2);
      expect(updateScore).toHaveBeenCalledWith('token', 6, 1, 10, 3);
      expect(updateScore).toHaveBeenCalledWith('token', 6, 1, 20, 1);
    });
  });

  test('calls onSuccess after successful submit', async () => {
    const onSuccess = vi.fn();
    vi.mocked(updateScore).mockResolvedValue(undefined);
    renderDialog({}, vi.fn(), onSuccess);
    const inputs = screen.getAllByLabelText(/score/i);
    fireEvent.change(inputs[0], { target: { value: '2' } });
    fireEvent.change(inputs[1], { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('shows error message when updateScore fails', async () => {
    vi.mocked(updateScore).mockRejectedValue(new Error('Erreur 400'));
    renderDialog();
    const inputs = screen.getAllByLabelText(/score/i);
    fireEvent.change(inputs[0], { target: { value: '2' } });
    fireEvent.change(inputs[1], { target: { value: '0' } });
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

  test('shows error when match data is incomplete', async () => {
    renderDialog({ team1Id: undefined });
    const inputs = screen.getAllByLabelText(/score/i);
    fireEvent.change(inputs[0], { target: { value: '2' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(screen.getByText(/données du match incomplètes/i)).toBeTruthy();
    });
  });
});
