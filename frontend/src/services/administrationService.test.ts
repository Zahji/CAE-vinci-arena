import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  demoteAdministrator,
  fetchAdministrators,
  fetchNonAdmins,
  promoteAdministrator,
  refreshToken,
} from './administrationService';

describe('administrationService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('fetchAdministrators calls the administrators endpoint', async () => {
    const mockAdministrators = [
      {
        id: 1,
        email: 'admin@admin.com',
        tag: 'admin1',
        speciality: 'Mage',
        profilePicture: 'url1',
        date: '2024-01-01',
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAdministrators),
    });

    const result = await fetchAdministrators('test-token');

    expect(result).toEqual(mockAdministrators);
    expect(fetchMock).toHaveBeenCalledWith('/api/administrators/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchAdministrators returns an empty list when the API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchAdministrators('test-token')).resolves.toEqual([]);
  });

  test('fetchNonAdmins calls the non-admins endpoint', async () => {
    const mockUsers = [
      {
        id: 2,
        email: 'user@user.com',
        tag: 'user1',
        speciality: 'Archer',
        profilePicture: 'url2',
        date: '2024-01-02',
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    });

    const result = await fetchNonAdmins('test-token');

    expect(result).toEqual(mockUsers);
    expect(fetchMock).toHaveBeenCalledWith('/api/administrators/non-admins', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchNonAdmins returns an empty list when the API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchNonAdmins('test-token')).resolves.toEqual([]);
  });

  test('promoteAdministrator calls the promote endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
    });

    await promoteAdministrator('test-token', 2);

    expect(fetchMock).toHaveBeenCalledWith('/api/administrators/2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('demoteAdministrator calls the demote endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
    });

    await demoteAdministrator('test-token', 2);

    expect(fetchMock).toHaveBeenCalledWith('/api/administrators/2', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('demoteAdministrator surfaces the last-admin self-demotion error on 403', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    await expect(demoteAdministrator('test-token', 1)).rejects.toThrow(
      'Vous ne pouvez pas vous rétrograder si vous êtes le seul administrateur',
    );
  });

  test('promoteAdministrator surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(promoteAdministrator('test-token', 2)).rejects.toThrow(
      'Erreur 500',
    );
  });

  test('refreshToken calls GET /api/auths/refresh with the token', async () => {
    const refreshedUser = {
      id: 1,
      email: 'admin@admin.com',
      tag: 'admin1',
      token: 'new-token',
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(refreshedUser),
    });

    const result = await refreshToken('test-token');

    expect(result).toEqual(refreshedUser);
    expect(fetchMock).toHaveBeenCalledWith('/api/auths/refresh', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('refreshToken surfaces a generic HTTP error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await expect(refreshToken('test-token')).rejects.toThrow('Erreur 401');
  });
});
