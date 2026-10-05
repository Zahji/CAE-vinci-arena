import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchCurrentMembership,
  fetchTeamMembers,
  joinTeam,
  excludeMember,
} from './teamMembershipService';

describe('teamMembershipService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('fetchCurrentMembership calls the me endpoint with the token', async () => {
    const mockMembership = {
      id: 1,
      member: {
        id: 10,
        email: 'user@test.com',
        tag: 'user',
        speciality: 'Mage',
        profilePicture: '',
        date: '',
      },
      team: { id: 2, name: 'Team A', managersCount: 1, membersCount: 3 },
      status: 'ACCEPTED',
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockMembership),
    });

    const result = await fetchCurrentMembership('test-token');

    expect(result).toEqual(mockMembership);
    expect(fetchMock).toHaveBeenCalledWith('/api/teams/memberships/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchCurrentMembership returns null when the API responds 204 (no membership)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 });

    const result = await fetchCurrentMembership('test-token');

    expect(result).toBeNull();
  });

  test('fetchCurrentMembership surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(fetchCurrentMembership('test-token')).rejects.toThrow(
      'Erreur 500',
    );
  });

  test('fetchTeamMembers calls the members endpoint with the team id and token', async () => {
    const mockMembers = [
      {
        id: 1,
        member: {
          id: 10,
          email: 'user@test.com',
          tag: 'user',
          speciality: 'Mage',
          profilePicture: '',
          date: '',
        },
        team: { id: 3, name: 'Team B', managersCount: 1, membersCount: 2 },
        status: 'ACCEPTED',
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMembers),
    });

    const result = await fetchTeamMembers(3, 'test-token');

    expect(result).toEqual(mockMembers);
    expect(fetchMock).toHaveBeenCalledWith('/api/teams/memberships/3/members', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchTeamMembers returns an empty list when the API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchTeamMembers(3, 'test-token')).resolves.toEqual([]);
  });

  test('fetchTeamMembers surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(fetchTeamMembers(3, 'test-token')).rejects.toThrow(
      'Erreur 403',
    );
  });

  test('joinTeam calls the membership endpoint with the team id', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await joinTeam('test-token', 5);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/teams/memberships/5/membership',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'test-token',
        },
      },
    );
  });

  test('joinTeam surfaces the duplicate tag error message on 400', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400 });

    await expect(joinTeam('test-token', 5)).rejects.toThrow(
      'Impossible de rejoindre la team',
    );
  });

  test('joinTeam surfaces a generic HTTP error on 403', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(joinTeam('test-token', 5)).rejects.toThrow('Erreur 403');
  });

  test('joinTeam surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(joinTeam('test-token', 5)).rejects.toThrow('Erreur 500');
  });

  test('excludeMember calls the membership endpoint with the membership id', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await excludeMember('test-token', 7);

    expect(fetchMock).toHaveBeenCalledWith('/api/teams/memberships/7', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('excludeMember surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(excludeMember('test-token', 7)).rejects.toThrow('Erreur 403');
  });
});
