import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchProfile,
  fetchUnavailabilities,
  fetchSpecialities,
  fetchAvatars,
  updatePassword,
  addUnavailability,
  updateSpeciality,
  updateProfilePicture,
} from './profileService';

describe('profileService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // fetchProfile
  test('fetchProfile calls GET /api/users/me with token', async () => {
    const mockProfile = {
      id: 1,
      email: 'user@user.com',
      tag: 'user1',
      speciality: 'Mage',
      profilePicture: 'url1',
      date: '2024-01-01',
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProfile),
    });

    const result = await fetchProfile('test-token');

    expect(result).toEqual(mockProfile);
    expect(fetchMock).toHaveBeenCalledWith('/api/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchProfile throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(fetchProfile('test-token')).rejects.toThrow('Erreur 401');
  });

  // fetchUnavailabilities
  test('fetchUnavailabilities calls GET /api/users/me/unavailabilities', async () => {
    const mockUnavails = [
      { id: 1, startDate: '2024-02-01', endDate: '2024-02-05' },
    ];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUnavails),
    });

    const result = await fetchUnavailabilities('test-token');

    expect(result).toEqual(mockUnavails);
    expect(fetchMock).toHaveBeenCalledWith('/api/users/me/unavailabilities', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
    });
  });

  test('fetchUnavailabilities throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(fetchUnavailabilities('test-token')).rejects.toThrow(
      'Erreur 403',
    );
  });

  // fetchSpecialities
  test('fetchSpecialities calls GET /api/specialities', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(['Mage', 'Archer']),
    });

    const result = await fetchSpecialities();

    expect(result).toEqual(['Mage', 'Archer']);
    expect(fetchMock).toHaveBeenCalledWith('/api/specialities');
  });

  test('fetchSpecialities throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchSpecialities()).rejects.toThrow('Erreur 500');
  });

  // fetchAvatars
  test('fetchAvatars maps URLs to AvatarOption objects', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(['url1', 'url2']),
    });

    const result = await fetchAvatars();

    expect(result).toEqual([
      { id: 'avatar-1', src: 'url1', label: 'Avatar 1' },
      { id: 'avatar-2', src: 'url2', label: 'Avatar 2' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('/api/profile-pictures');
  });

  test('fetchAvatars throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchAvatars()).rejects.toThrow('Erreur 500');
  });

  // updatePassword
  test('updatePassword calls PATCH /api/users/me/password', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await updatePassword('test-token', 'old', 'new');

    expect(fetchMock).toHaveBeenCalledWith('/api/users/me/password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
      body: JSON.stringify({ oldPassword: 'old', newPassword: 'new' }),
    });
  });

  test('updatePassword throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(updatePassword('test-token', 'wrong', 'new')).rejects.toThrow(
      'Ancien mot de passe incorrect.',
    );
  });

  // addUnavailability
  test('addUnavailability calls POST /api/users/me/unavailabilities', async () => {
    const created = { id: 2, startDate: '2024-03-01', endDate: '2024-03-05' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const result = await addUnavailability(
      'test-token',
      '2024-03-01',
      '2024-03-05',
    );

    expect(result).toEqual(created);
    expect(fetchMock).toHaveBeenCalledWith('/api/users/me/unavailabilities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
      body: JSON.stringify({ startDate: '2024-03-01', endDate: '2024-03-05' }),
    });
  });

  test('addUnavailability throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(
      addUnavailability('test-token', '2024-03-01', '2024-03-05'),
    ).rejects.toThrow("Erreur lors de l'ajout.");
  });

  // updateSpeciality
  test('updateSpeciality calls PATCH /api/users/me/speciality', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await updateSpeciality('test-token', 'Archer');

    expect(fetchMock).toHaveBeenCalledWith('/api/users/me/speciality', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
      body: JSON.stringify({ specialityName: 'Archer' }),
    });
  });

  test('updateSpeciality throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(updateSpeciality('test-token', 'Unknown')).rejects.toThrow(
      'Erreur lors de la modification.',
    );
  });

  // updateProfilePicture
  test('updateProfilePicture calls PATCH /api/users/me/profile-picture', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await updateProfilePicture('test-token', 'url2');

    expect(fetchMock).toHaveBeenCalledWith('/api/users/me/profile-picture', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token',
      },
      body: JSON.stringify({ profilePictureUrl: 'url2' }),
    });
  });

  test('updateProfilePicture throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(updateProfilePicture('test-token', 'bad-url')).rejects.toThrow(
      'Erreur lors de la modification.',
    );
  });
});
