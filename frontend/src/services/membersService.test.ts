import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchAllMembers,
  fetchMemberById,
  banMember,
  fetchMemberUnavailabilities,
} from './membersService';

describe('membersService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('fetchAllMembers calls the users endpoint', async () => {
    const mockMembers = [
      {
        id: 1,
        tag: 'Storm',
        speciality: 'exécuteur',
        profilePicture: 'url1',
        date: '2026-01-10',
        teamName: 'TEAM_IOTA',
        teamId: 2,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMembers),
    });

    const result = await fetchAllMembers();

    expect(result).toEqual(mockMembers);
    expect(fetchMock).toHaveBeenCalledWith('/api/users', {
      method: 'GET',
    });
  });

  test('fetchAllMembers returns an empty list when the API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchAllMembers()).resolves.toEqual([]);
  });

  test('fetchAllMembers surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchAllMembers()).rejects.toThrow('Erreur 500');
  });

  test('fetchMemberById calls the correct user endpoint', async () => {
    const mockMember = {
      id: 6,
      tag: 'Storm',
      speciality: 'exécuteur',
      profilePicture: 'url1',
      date: '2026-01-10',
      teamName: 'TEAM_IOTA',
      teamId: 2,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMember),
    });

    const result = await fetchMemberById(6);

    expect(result).toEqual(mockMember);
    expect(fetchMock).toHaveBeenCalledWith('/api/users/6', {
      method: 'GET',
    });
  });

  test('fetchMemberById surfaces a 404 error when the user is not found', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(fetchMemberById(99999)).rejects.toThrow('Erreur 404');
  });

  test('fetchMemberById surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchMemberById(6)).rejects.toThrow('Erreur 500');
  });

  test('banMember calls the ban endpoint', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await banMember('test-token', 1);

    expect(fetchMock).toHaveBeenCalledWith('/api/users/1/ban', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('banMember surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(banMember('test-token', 1)).rejects.toThrow('Erreur 403');
  });

  test('fetchMemberUnavailabilities calls the correct endpoint with token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchMemberUnavailabilities(1, 'test-token');

    expect(fetchMock).toHaveBeenCalledWith('/api/users/1/unavailabilities', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchMemberUnavailabilities returns empty array when API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchMemberUnavailabilities(1, 'test-token')).resolves.toEqual(
      [],
    );
  });

  test('fetchMemberUnavailabilities throws when request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(fetchMemberUnavailabilities(1, 'test-token')).rejects.toThrow(
      'Erreur 403',
    );
  });
});
