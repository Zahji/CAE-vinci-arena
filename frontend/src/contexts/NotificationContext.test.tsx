import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  NotificationContext,
  NotificationContextProvider,
} from './NotificationContext';
import { UserContext } from './UserContext';
import { NotificationContextType, UserContextType } from '../types';
import {
  fetchNotifications,
  markNotificationAsRead,
  acceptTeamInvitation,
  declineTeamInvitation,
} from '../services/notificationService';

vi.mock('../services/notificationService', () => ({
  fetchNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  acceptTeamInvitation: vi.fn(),
  declineTeamInvitation: vi.fn(),
}));

describe('NotificationContext', () => {
  const notification = {
    notificationId: 1,
    object: 'Invitation équipe',
    message: 'Vous êtes invité dans TEAM_ALPHA.',
    type: 'TEAM_INVITATION' as const,
    isRead: false,
    createdAt: new Date('2026-04-01T10:00:00'),
    membershipId: 10,
  };

  let contextValue: NotificationContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(NotificationContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(NotificationContext);
    return null;
  };

  const createUserContext = (withUser = true): UserContextType => ({
    authenticatedUser: withUser
      ? { id: 1, email: 'a@a.com', tag: 'user', token: 'token' }
      : undefined,
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue({ id: 1, isAdmin: false }),
  });

  const renderContext = (withUser = true) =>
    render(
      <UserContext.Provider value={createUserContext(withUser)}>
        <NotificationContextProvider>
          <ContextConsumer />
        </NotificationContextProvider>
      </UserContext.Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(fetchNotifications).mockResolvedValue([notification]);
    vi.mocked(markNotificationAsRead).mockResolvedValue(undefined);
    vi.mocked(acceptTeamInvitation).mockResolvedValue(undefined);
    vi.mocked(declineTeamInvitation).mockResolvedValue(undefined);
  });

  test('exposes harmless default values without a provider', async () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.notifications).toEqual([]);
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.decidedIds).toEqual(new Set());

    await expect(
      contextValue?.markAsRead(1) ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handleAccept(1, 1) ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    const result = await (contextValue?.handleDecline(1, 1, 'reason') ??
      Promise.resolve(null));
    expect(result).toBeNull();
  });

  test('does not load notifications when there is no authenticated user', async () => {
    renderContext(false);

    await waitFor(() => {
      expect(fetchNotifications).not.toHaveBeenCalled();
    });
    expect(contextValue?.notifications).toEqual([]);
  });

  test('loads notifications on mount when authenticated', async () => {
    renderContext();

    await waitFor(() => {
      expect(fetchNotifications).toHaveBeenCalledWith('token');
      expect(contextValue?.notifications).toEqual([notification]);
      expect(contextValue?.error).toBeNull();
    });
  });

  test('stores the error message when fetchNotifications fails with an Error', async () => {
    vi.mocked(fetchNotifications).mockRejectedValueOnce(
      new Error('Erreur réseau'),
    );

    renderContext();

    await waitFor(() => {
      expect(contextValue?.error).toBe('Erreur réseau');
      expect(contextValue?.notifications).toEqual([]);
    });
  });

  test('stores the fallback error message when fetchNotifications fails with an unknown value', async () => {
    vi.mocked(fetchNotifications).mockRejectedValueOnce('unknown');

    renderContext();

    await waitFor(() => {
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  test('markAsRead calls the service and updates the notification in place', async () => {
    renderContext();
    await waitFor(() => expect(contextValue?.notifications).toHaveLength(1));

    await act(async () => {
      await contextValue?.markAsRead(1);
    });

    expect(markNotificationAsRead).toHaveBeenCalledWith('token', 1);
    expect(contextValue?.notifications[0].isRead).toBe(true);
  });

  test('markAsRead stores error when the service fails', async () => {
    vi.mocked(markNotificationAsRead).mockRejectedValueOnce(
      new Error('Echec lu'),
    );

    renderContext();
    await waitFor(() => expect(contextValue?.notifications).toHaveLength(1));

    await act(async () => {
      await contextValue?.markAsRead(1);
    });

    expect(contextValue?.error).toBe('Echec lu');
  });

  test('handleAccept calls accept, marks as read, reloads notifications, and adds to decidedIds', async () => {
    renderContext();
    await waitFor(() => expect(contextValue?.notifications).toHaveLength(1));

    await act(async () => {
      await contextValue?.handleAccept(10, 1);
    });

    expect(acceptTeamInvitation).toHaveBeenCalledWith('token', 10);
    expect(markNotificationAsRead).toHaveBeenCalledWith('token', 1);
    expect(fetchNotifications).toHaveBeenCalledTimes(2);
    expect(contextValue?.decidedIds.has(10)).toBe(true);
  });

  test('handleAccept stores error when the service fails', async () => {
    vi.mocked(acceptTeamInvitation).mockRejectedValueOnce(
      new Error('Echec accept'),
    );

    renderContext();
    await waitFor(() => expect(contextValue?.notifications).toHaveLength(1));

    await act(async () => {
      await contextValue?.handleAccept(10, 1);
    });

    expect(contextValue?.error).toBe('Echec accept');
    expect(contextValue?.decidedIds.has(10)).toBe(false);
  });

  test('handleDecline returns a validation error when the reason is blank', async () => {
    renderContext();
    await waitFor(() => expect(contextValue?.notifications).toHaveLength(1));

    let result: string | null | undefined;
    await act(async () => {
      result = await contextValue?.handleDecline(10, 1, '   ');
    });

    expect(result).toBe('Veuillez entrer une raison.');
    expect(declineTeamInvitation).not.toHaveBeenCalled();
  });

  test('handleDecline calls service, marks as read, reloads, adds to decidedIds and returns null', async () => {
    renderContext();
    await waitFor(() => expect(contextValue?.notifications).toHaveLength(1));

    let result: string | null | undefined;
    await act(async () => {
      result = await contextValue?.handleDecline(10, 1, 'Pas intéressé');
    });

    expect(declineTeamInvitation).toHaveBeenCalledWith(
      'token',
      10,
      'Pas intéressé',
    );
    expect(markNotificationAsRead).toHaveBeenCalledWith('token', 1);
    expect(fetchNotifications).toHaveBeenCalledTimes(2);
    expect(contextValue?.decidedIds.has(10)).toBe(true);
    expect(result).toBeNull();
  });

  test('handleDecline returns null and stores error when the service fails', async () => {
    vi.mocked(declineTeamInvitation).mockRejectedValueOnce(
      new Error('Echec decline'),
    );

    renderContext();
    await waitFor(() => expect(contextValue?.notifications).toHaveLength(1));

    let result: string | null | undefined;
    await act(async () => {
      result = await contextValue?.handleDecline(10, 1, 'Raison');
    });

    expect(result).toBeNull();
    expect(contextValue?.error).toBe('Echec decline');
    expect(contextValue?.decidedIds.has(10)).toBe(false);
  });

  test('multiple handleAccept calls add all membershipIds to decidedIds', async () => {
    const secondNotification = {
      ...notification,
      notificationId: 2,
      membershipId: 20,
      createdAt: new Date('2026-04-01T10:00:00'),
    };
    vi.mocked(fetchNotifications).mockResolvedValue([
      notification,
      secondNotification,
    ]);

    renderContext();
    await waitFor(() => expect(contextValue?.notifications).toHaveLength(2));

    await act(async () => {
      await contextValue?.handleAccept(10, 1);
      await contextValue?.handleAccept(20, 2);
    });

    expect(contextValue?.decidedIds.has(10)).toBe(true);
    expect(contextValue?.decidedIds.has(20)).toBe(true);
  });
});
