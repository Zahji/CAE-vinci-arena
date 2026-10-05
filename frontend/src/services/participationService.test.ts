// participationMatchService.test.ts
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  updateScore,
  contestScore,
  declareForfeit,
} from './participationService';

describe('participationMatchService', () => {
  const token = 'Bearer test-token';
  const tournamentId = 6;
  const matchId = 1;
  const teamId = 10;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateScore', () => {
    test('calls correct endpoint with score as query param on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await updateScore(token, tournamentId, matchId, teamId, 3);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/tournaments/${tournamentId}/matches/${matchId}/participations/${teamId}/score?score=3`,
        {
          method: 'PATCH',
          headers: {
            Authorization: token,
          },
        },
      );
    });

    test('throws error on failed response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

      await expect(
        updateScore(token, tournamentId, matchId, teamId, 5),
      ).rejects.toThrow('Erreur 400');
    });

    test('throws error with correct status code', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

      await expect(
        updateScore(token, tournamentId, matchId, teamId, 2),
      ).rejects.toThrow('Erreur 403');
    });
  });

  describe('contestScore', () => {
    test('calls correct endpoint with encoded reason on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await contestScore(token, tournamentId, matchId, teamId, 'Referee error');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/tournaments/${tournamentId}/matches/${matchId}/participations/${teamId}/contest?reason=Referee%20error`,
        {
          method: 'PATCH',
          headers: {
            Authorization: token,
          },
        },
      );
    });

    test('encodes special characters in reason', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await contestScore(
        token,
        tournamentId,
        matchId,
        teamId,
        'Score incorrect ! @#$',
      );

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('reason=Score%20incorrect%20!%20%40%23%24'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { Authorization: token },
        }),
      );
    });

    test('encodes french characters in reason', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await contestScore(
        token,
        tournamentId,
        matchId,
        teamId,
        "Erreur d'arbitrage",
      );

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("reason=Erreur%20d'arbitrage"),
        expect.objectContaining({
          method: 'PATCH',
          headers: { Authorization: token },
        }),
      );
    });

    test('throws error on failed response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

      await expect(
        contestScore(token, tournamentId, matchId, teamId, 'reason'),
      ).rejects.toThrow('Erreur 400');
    });

    test('throws error with correct status code for forbidden', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

      await expect(
        contestScore(token, tournamentId, matchId, teamId, 'reason'),
      ).rejects.toThrow('Erreur 403');
    });

    test('throws error when outside 2-hour window', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

      await expect(
        contestScore(token, tournamentId, matchId, teamId, 'Too late'),
      ).rejects.toThrow('Erreur 400');
    });
  });

  describe('declareForfeit', () => {
    test('calls correct endpoint with forfeit=true on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await declareForfeit(token, tournamentId, matchId, teamId);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/tournaments/${tournamentId}/matches/${matchId}/participations/${teamId}/forfeit?forfeit=true`,
        {
          method: 'PATCH',
          headers: {
            Authorization: token,
          },
        },
      );
    });

    test('throws error on failed response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

      await expect(
        declareForfeit(token, tournamentId, matchId, teamId),
      ).rejects.toThrow('Erreur 400');
    });
  });
});
