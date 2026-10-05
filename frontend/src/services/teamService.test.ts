import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchAllTeams,
  fetchTeamById,
  createTeam,
  designateSecondManager,
  renounceManagerRole,
  leaveTeam,
} from './teamService';

describe('teamService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('fetchAllTeams calls the teams endpoint without authentication', async () => {
    const mockTeams = [
      { id: 1, name: 'Team A', managersCount: 1, membersCount: 3 },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTeams),
    });

    const result = await fetchAllTeams();

    expect(result).toEqual(mockTeams);
    expect(fetchMock).toHaveBeenCalledWith('/api/teams', { method: 'GET' });
  });

  test('fetchAllTeams returns an empty list when the API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchAllTeams()).resolves.toEqual([]);
  });

  test('fetchAllTeams surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(fetchAllTeams()).rejects.toThrow('Erreur 500');
  });

  test('fetchTeamById calls the team endpoint with the correct id and token', async () => {
    const mockTeam = {
      id: 42,
      name: 'Team B',
      managersCount: 1,
      membersCount: 5,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTeam),
    });

    const result = await fetchTeamById(42, 'test-token');

    expect(result).toEqual(mockTeam);
    expect(fetchMock).toHaveBeenCalledWith('/api/teams/42', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchTeamById surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchTeamById(99, 'test-token')).rejects.toThrow('Erreur 404');
  });

  test('createTeam calls the teams endpoint with the team name', async () => {
    const mockTeam = {
      id: 10,
      name: 'Nouvelle Team',
      managersCount: 1,
      membersCount: 1,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTeam),
    });

    const result = await createTeam('test-token', 'Nouvelle Team');

    expect(result).toEqual(mockTeam);
    expect(fetchMock).toHaveBeenCalledWith('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
      body: JSON.stringify({ name: 'Nouvelle Team' }),
    });
  });

  test('createTeam surfaces the forbidden error message on 403', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(createTeam('test-token', 'Team X')).rejects.toThrow(
      'Impossible de créer une nouvelle team',
    );
  });

  test('createTeam surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(createTeam('test-token', 'Team X')).rejects.toThrow(
      'Erreur 500',
    );
  });

  test('designateSecondManager calls the correct endpoint', async () => {
    const mockTeam = {
      id: 1,
      name: 'Team A',
      managersCount: 2,
      membersCount: 4,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTeam),
    });

    const result = await designateSecondManager('test-token', 1, 5);

    expect(result).toEqual(mockTeam);
    expect(fetchMock).toHaveBeenCalledWith('/api/teams/1/second-manager/5', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('designateSecondManager surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(designateSecondManager('test-token', 1, 5)).rejects.toThrow(
      'Erreur 403',
    );
  });

  test('renounceManagerRole calls the renounce endpoint', async () => {
    const mockTeam = {
      id: 1,
      name: 'Team A',
      managersCount: 1,
      membersCount: 4,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTeam),
    });

    const result = await renounceManagerRole('test-token', 1);

    expect(result).toEqual(mockTeam);
    expect(fetchMock).toHaveBeenCalledWith('/api/teams/1/manager/renounce', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('renounceManagerRole surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(renounceManagerRole('test-token', 1)).rejects.toThrow(
      'Erreur 403',
    );
  });

  test('leaveTeam calls the leave endpoint', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await leaveTeam('test-token', 1);

    expect(fetchMock).toHaveBeenCalledWith('/api/teams/1/leave', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('leaveTeam surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(leaveTeam('test-token', 1)).rejects.toThrow('Erreur 403');
  });
});
