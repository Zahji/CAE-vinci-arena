import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createTournament,
  fetchTournamentById,
  fetchTournaments,
  fetchTournamentsFiltered,
  publishTournament,
  updateTournament,
} from './tournamentService';

describe('tournamentService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('fetchTournaments calls the tournaments endpoint', async () => {
    const tournaments = [
      {
        id: 1,
        name: 'Spring Clash',
        description: 'Tournoi du printemps',
        state: 'IN_PREPARATION',
        stateDisplayName: 'En préparation',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tournaments),
    });

    const result = await fetchTournaments();

    expect(result).toEqual(tournaments);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/', {
      method: 'GET',
      headers: {},
    });
  });

  test('fetchTournaments sends Authorization header when a token is provided', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchTournaments('Bearer my-token');

    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/', {
      method: 'GET',
      headers: { Authorization: 'Bearer my-token' },
    });
  });

  test('fetchTournaments appends state query parameter when provided', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchTournaments('Bearer my-token', 'PLANIFIED');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tournaments/?state=PLANIFIED',
      {
        method: 'GET',
        headers: { Authorization: 'Bearer my-token' },
      },
    );
  });

  test('fetchTournaments omits Authorization header when no token is provided', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchTournaments();

    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/', {
      method: 'GET',
      headers: {},
    });
  });

  test('fetchTournaments returns an empty list when the API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchTournaments()).resolves.toEqual([]);
  });

  test('fetchTournaments surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchTournaments()).rejects.toThrow('Erreur 500');
  });

  test('createTournament sends POST request with authorization and payload', async () => {
    const payload = {
      name: 'Test Tournament',
      description: 'Description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
    };

    const createdTournament = {
      id: 1,
      name: 'Test Tournament',
      description: 'Description',
      state: 'IN_PREPARATION',
      stateDisplayName: 'En préparation',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createdTournament),
    });

    const result = await createTournament('Bearer test-token', payload);

    expect(result).toEqual(createdTournament);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(payload),
    });
  });

  test('fetchTournamentById sends GET request with token', async () => {
    const tournament = {
      id: 1,
      name: 'Spring Clash',
      description: 'Tournoi du printemps',
      state: 'PLANIFIED',
      stateDisplayName: 'Planifié',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-01',
      endInscriptionDate: '2026-03-31',
      maxTeams: 16,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tournament),
    });

    const result = await fetchTournamentById(1, 'Bearer test-token');

    expect(result).toEqual(tournament);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/1', {
      method: 'GET',
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  test('fetchTournamentById surfaces HTTP error when request fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(fetchTournamentById(1)).rejects.toThrow('Erreur 404');
  });

  test('publishTournament sends PUT request and returns updated tournament', async () => {
    const payload = {
      name: 'Published Tournament',
      description: 'Description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
      state: 'PLANIFIED',
    };

    const updatedTournament = {
      id: 1,
      ...payload,
      stateDisplayName: 'Planifié',
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updatedTournament),
    });

    const result = await publishTournament('Bearer test-token', 1, payload);

    expect(result).toEqual(updatedTournament);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(payload),
    });
  });

  test('publishTournament surfaces HTTP error when request fails', async () => {
    const payload = {
      name: 'Published Tournament',
      description: 'Description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
      state: 'PLANIFIED',
    };

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
    });

    await expect(
      publishTournament('Bearer test-token', 1, payload),
    ).rejects.toThrow('Erreur 409');
  });

  test('updateTournament sends PUT request without state and returns updated tournament', async () => {
    const payload = {
      name: 'Edited Tournament',
      description: 'Updated description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
    };

    const updatedTournament = {
      id: 1,
      ...payload,
      state: 'IN_PREPARATION',
      stateDisplayName: 'En préparation',
      registrationsCount: 0,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updatedTournament),
    });

    const result = await updateTournament('Bearer test-token', 1, payload);

    expect(result).toEqual(updatedTournament);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(payload),
    });
    expect(
      JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)),
    ).not.toHaveProperty('state');
  });

  test('updateTournament surfaces HTTP error when request fails', async () => {
    const payload = {
      name: 'Edited Tournament',
      description: 'Updated description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
    };

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(
      updateTournament('Bearer test-token', 1, payload),
    ).rejects.toThrow('Erreur 500');
  });

  test('updateTournament maps 409 to duplicate-name message', async () => {
    const payload = {
      name: 'Edited Tournament',
      description: 'Updated description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
    };

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
    });

    await expect(
      updateTournament('Bearer test-token', 1, payload),
    ).rejects.toThrow('Un tournoi avec ce nom existe déjà');
  });

  test('createTournament surfaces HTTP error when request fails', async () => {
    const payload = {
      name: 'Test Tournament',
      description: 'Description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
    };

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
    });

    await expect(
      createTournament('Bearer test-token', payload),
    ).rejects.toThrow('Un tournoi avec ce nom existe déjà');
  });

  test('createTournament falls back to duplicate-name message on 409 when body is missing', async () => {
    const payload = {
      name: 'Test Tournament',
      description: 'Description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
    };

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
    });

    await expect(
      createTournament('Bearer test-token', payload),
    ).rejects.toThrow('Un tournoi avec ce nom existe déjà');
  });

  test('fetchTournaments surfaces various HTTP error statuses', async () => {
    const errorStatuses = [400, 401, 403, 404, 500, 502, 503];

    for (const status of errorStatuses) {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status,
      });

      await expect(fetchTournaments()).rejects.toThrow(`Erreur ${status}`);
    }
  });

  test('fetchTournamentById calls the correct endpoint and returns the tournament', async () => {
    const tournament = {
      id: 5,
      name: 'Summer Cup',
      description: 'Tournoi estival',
      state: 'PLANIFIED',
      stateDisplayName: 'Planifié',
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      startInscriptionDate: '2026-06-01',
      endInscriptionDate: '2026-06-30',
      maxTeams: 8,
      registrationsCount: 2,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tournament),
    });

    const result = await fetchTournamentById(5);

    expect(result).toEqual(tournament);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/5', {
      method: 'GET',
      headers: {},
    });
  });

  test('fetchTournamentById sends Authorization header when token is provided', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 5,
          name: 'Summer Cup',
          description: 'Tournoi estival',
          state: 'IN_PREPARATION',
          stateDisplayName: 'En préparation',
          startDate: '2026-07-01',
          endDate: '2026-07-03',
          startInscriptionDate: '2026-06-01',
          endInscriptionDate: '2026-06-30',
          maxTeams: 8,
          registrationsCount: 0,
        }),
    });

    await fetchTournamentById(5, 'admin-token');

    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/5', {
      method: 'GET',
      headers: { Authorization: 'admin-token' },
    });
  });

  test('fetchTournamentById throws on HTTP error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchTournamentById(999)).rejects.toThrow('Erreur 404');
  });

  test('fetchTournamentsFiltered fetches tournaments by teamName without token', async () => {
    const tournaments = [
      {
        id: 1,
        name: 'Spring Clash',
        description: 'Tournoi du printemps',
        state: 'PLANIFIED',
        stateDisplayName: 'Planifié',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
        registrationsCount: 2,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tournaments),
    });

    const result = await fetchTournamentsFiltered({ teamName: 'Alpha' });

    expect(result).toEqual(tournaments);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/?teamName=Alpha', {
      method: 'GET',
      headers: {},
    });
  });

  test('fetchTournamentsFiltered fetches tournaments by playerTag with token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchTournamentsFiltered({ playerTag: 'Flash' }, 'admin-token');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tournaments/?playerTag=Flash',
      {
        method: 'GET',
        headers: { Authorization: 'admin-token' },
      },
    );
  });

  test('fetchTournamentsFiltered returns empty array when API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    const result = await fetchTournamentsFiltered({});
    expect(result).toEqual([]);
  });

  test('fetchTournamentsFiltered surfaces HTTP error when request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(
      fetchTournamentsFiltered({ teamName: 'Alpha' }),
    ).rejects.toThrow('Erreur 403');
  });

  test('createTournament surfaces various HTTP error statuses', async () => {
    const payload = {
      name: 'Test Tournament',
      description: 'Description',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-04-09',
      maxTeams: 8,
    };

    const errorStatuses = [400, 401, 403, 404, 500, 502, 503];

    for (const status of errorStatuses) {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status,
      });

      await expect(
        createTournament('Bearer test-token', payload),
      ).rejects.toThrow(`Erreur ${status}`);
    }
  });
});
