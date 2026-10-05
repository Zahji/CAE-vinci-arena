import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchSelections,
  addSelection,
  removeSelection,
} from './selectionService';

const TOKEN = 'Bearer test-token';
const T_ID = 6;
const M_ID = 10;
const TEAM_ID = 3;
const BASE = `/api/tournaments/${T_ID}/matches/${M_ID}/participations/${TEAM_ID}/selections`;

const mockSelection = {
  matchId: M_ID,
  teamId: TEAM_ID,
  memberId: 7,
  memberTag: 'Titi',
  memberSpeciality: 'Gardien',
};

describe('selectionService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // ── fetchSelections ─────────────────────────────────────────────────────────

  test('fetchSelections calls the correct URL with auth header', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockSelection]),
    });

    const result = await fetchSelections(T_ID, M_ID, TEAM_ID, TOKEN);

    expect(result).toEqual([mockSelection]);
    expect(fetchMock).toHaveBeenCalledWith(BASE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: TOKEN,
      },
    });
  });

  test('fetchSelections throws when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(fetchSelections(T_ID, M_ID, TEAM_ID, TOKEN)).rejects.toThrow(
      'Erreur 403',
    );
  });

  // ── addSelection ────────────────────────────────────────────────────────────

  test('addSelection posts memberId to the correct URL', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSelection),
    });

    const result = await addSelection(T_ID, M_ID, TEAM_ID, 7, TOKEN);

    expect(result).toEqual(mockSelection);
    expect(fetchMock).toHaveBeenCalledWith(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: TOKEN,
      },
      body: JSON.stringify({ memberId: 7 }),
    });
  });

  test('addSelection throws custom message on 400', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400 });

    await expect(addSelection(T_ID, M_ID, TEAM_ID, 7, TOKEN)).rejects.toThrow(
      'Ce membre est déjà sélectionné pour un match au même horaire.',
    );
  });

  test('addSelection throws generic message on other errors', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(addSelection(T_ID, M_ID, TEAM_ID, 7, TOKEN)).rejects.toThrow(
      'Erreur 401',
    );
  });

  // ── removeSelection ─────────────────────────────────────────────────────────

  test('removeSelection calls DELETE on the correct URL', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await removeSelection(T_ID, M_ID, TEAM_ID, 7, TOKEN);

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/7`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: TOKEN,
      },
    });
  });

  test('removeSelection throws when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(
      removeSelection(T_ID, M_ID, TEAM_ID, 7, TOKEN),
    ).rejects.toThrow('Erreur 404');
  });
});
