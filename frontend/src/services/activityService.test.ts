import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchTeamActivity, fetchPastTeams } from './activityService';

describe('activityService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('fetchTeamActivity calls the correct endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchTeamActivity(10, 'test-token');

    expect(fetchMock).toHaveBeenCalledWith('/api/teams/10/activity', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchTeamActivity returns the list of activities', async () => {
    const mockActivities = [
      {
        tournamentId: 1,
        tournamentName: 'Tournoi Marshall',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivities),
    });

    const result = await fetchTeamActivity(10, 'test-token');

    expect(result).toEqual(mockActivities);
  });

  test('fetchTeamActivity throws on error response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchTeamActivity(10, 'test-token')).rejects.toThrow(
      'Erreur 404',
    );
  });

  test('fetchPastTeams calls the correct endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchPastTeams(42, 'test-token');

    expect(fetchMock).toHaveBeenCalledWith('/api/users/42/past-teams', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchPastTeams returns the list of past teams', async () => {
    const mockPastTeams = [
      { teamId: 2, teamName: 'Team Beta', leftAt: '2023-06-01' },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPastTeams),
    });

    const result = await fetchPastTeams(42, 'test-token');

    expect(result).toEqual(mockPastTeams);
  });

  test('fetchPastTeams throws on error response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(fetchPastTeams(42, 'test-token')).rejects.toThrow(
      'Erreur 403',
    );
  });
});
