import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchNotifications,
  markNotificationAsRead,
  acceptTeamInvitation,
  declineTeamInvitation,
} from './notificationService';

describe('notificationService', () => {
  const token = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchNotifications', () => {
    test('returns notifications on success', async () => {
      const mockData = [
        {
          notificationId: 1,
          object: 'Bienvenue !',
          message: 'Votre compte a été créé.',
          createdAt: '2026-03-01T10:00:00',
          isRead: false,
          type: 'WELCOME',
          membershipId: null,
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchNotifications(token);

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/notifications/', {
        headers: { Authorization: token },
      });
      expect(result).toEqual(mockData);
    });

    test('throws error on failed response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

      await expect(fetchNotifications(token)).rejects.toThrow('Erreur 403');
    });
  });

  describe('markNotificationAsRead', () => {
    test('calls correct endpoint on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await markNotificationAsRead(token, 1);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/notifications/1/read',
        {
          method: 'POST',
          headers: { Authorization: token },
        },
      );
    });

    test('throws error on failed response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

      await expect(markNotificationAsRead(token, 1)).rejects.toThrow(
        'Erreur 404',
      );
    });
  });
  describe('acceptTeamInvitation', () => {
    test('calls correct endpoint on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await acceptTeamInvitation(token, 5);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/teams/memberships/5/accept',
        {
          method: 'PATCH',
          headers: { Authorization: token },
        },
      );
    });

    test('throws error on failed response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

      await expect(acceptTeamInvitation(token, 5)).rejects.toThrow(
        'Erreur 403',
      );
    });
  });

  describe('declineTeamInvitation', () => {
    test('calls correct endpoint with encoded reason on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await declineTeamInvitation(token, 5, 'Pas assez expérimenté');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/teams/memberships/5/refuse?reason=Pas%20assez%20exp%C3%A9riment%C3%A9',
        {
          method: 'PATCH',
          headers: { Authorization: token },
        },
      );
    });

    test('throws error on failed response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

      await expect(declineTeamInvitation(token, 5, 'raison')).rejects.toThrow(
        'Erreur 400',
      );
    });
  });
});
