import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import NotificationPage from '../notification/NotificationPage';
import { UserContext } from '../../../contexts/UserContext';
import { NotificationContext } from '../../../contexts/NotificationContext';
import { UserContextType } from '../../../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

describe('NotificationPage', () => {
  const navigateMock = vi.fn();

  const infoNotification = {
    notificationId: 1,
    object: 'Bienvenue',
    message: 'Vous avez reçu une notification.',
    type: 'INFO',
    isRead: false,
    createdAt: new Date('2026-04-01T10:00:00'),
    membershipId: null,
  };

  const invitationNotification = {
    notificationId: 2,
    object: 'Invitation équipe',
    message: 'Vous êtes invité dans TEAM_ALPHA.',
    type: 'TEAM_INVITATION',
    isRead: false,
    createdAt: new Date('2026-04-01T11:00:00'),
    membershipId: 10,
  };

  const makeNotificationContext = (overrides = {}) => ({
    notifications: [],
    error: null,
    decidedIds: new Set<number>(),
    markAsRead: vi.fn(),
    handleAccept: vi.fn(),
    handleDecline: vi.fn().mockResolvedValue(null),
    ...overrides,
  });

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

  const renderPage = (
    withUser = true,
    notifCtx = makeNotificationContext(),
  ) => {
    return render(
      <MemoryRouter>
        <UserContext.Provider value={createUserContext(withUser)}>
          <NotificationContext.Provider value={notifCtx}>
            <NotificationPage />
          </NotificationContext.Provider>
        </UserContext.Provider>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
  });

  test('redirects to /login when user is not authenticated', () => {
    renderPage(false);
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  test('shows "Aucune notification" when the list is empty', () => {
    renderPage();
    expect(screen.getByText(/aucune notification/i)).toBeTruthy();
  });

  test('shows an error alert when error is set', () => {
    renderPage(
      true,
      makeNotificationContext({ error: 'Erreur de chargement' }),
    );
    expect(screen.getByText('Erreur de chargement')).toBeTruthy();
  });

  test('renders the notification object as the title', () => {
    renderPage(
      true,
      makeNotificationContext({ notifications: [infoNotification] }),
    );
    expect(screen.getByText('Bienvenue')).toBeTruthy();
  });

  test('shows the "Non lu" chip for an unread notification', () => {
    renderPage(
      true,
      makeNotificationContext({ notifications: [infoNotification] }),
    );
    expect(screen.getByText('Non lu')).toBeTruthy();
  });

  test('does not show the "Non lu" chip for a read notification', () => {
    renderPage(
      true,
      makeNotificationContext({
        notifications: [{ ...infoNotification, isRead: true }],
      }),
    );
    expect(screen.queryByText('Non lu')).toBeNull();
  });

  test('expands a notification on click and shows its message', async () => {
    renderPage(
      true,
      makeNotificationContext({ notifications: [infoNotification] }),
    );

    fireEvent.click(screen.getByText('Bienvenue'));

    await waitFor(() => {
      expect(screen.getByText('Vous avez reçu une notification.')).toBeTruthy();
    });
  });

  test('collapses an expanded notification on second click', async () => {
    renderPage(
      true,
      makeNotificationContext({ notifications: [infoNotification] }),
    );

    fireEvent.click(screen.getByText('Bienvenue'));
    await waitFor(() =>
      expect(screen.getByText('Vous avez reçu une notification.')).toBeTruthy(),
    );

    fireEvent.click(screen.getByText('Bienvenue'));
    await waitFor(() => {
      expect(screen.queryByText('Vous avez reçu une notification.')).toBeNull();
    });
  });

  test('shows "Marquer comme lu" button for an unread non-invitation notification', async () => {
    renderPage(
      true,
      makeNotificationContext({ notifications: [infoNotification] }),
    );

    fireEvent.click(screen.getByText('Bienvenue'));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /marquer comme lu/i }),
      ).toBeTruthy();
    });
  });

  test('does not show "Marquer comme lu" button for a read notification', async () => {
    renderPage(
      true,
      makeNotificationContext({
        notifications: [{ ...infoNotification, isRead: true }],
      }),
    );

    fireEvent.click(screen.getByText('Bienvenue'));

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /marquer comme lu/i }),
      ).toBeNull();
    });
  });

  test('calls markAsRead with the correct id when the button is clicked', async () => {
    const markAsRead = vi.fn();
    renderPage(
      true,
      makeNotificationContext({
        notifications: [infoNotification],
        markAsRead,
      }),
    );

    fireEvent.click(screen.getByText('Bienvenue'));
    await waitFor(() =>
      fireEvent.click(
        screen.getByRole('button', { name: /marquer comme lu/i }),
      ),
    );

    expect(markAsRead).toHaveBeenCalledWith(1);
  });

  test('shows Accepter and Refuser buttons for an unread TEAM_INVITATION not yet decided', async () => {
    renderPage(
      true,
      makeNotificationContext({ notifications: [invitationNotification] }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accepter/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /refuser/i })).toBeTruthy();
    });
  });

  test('does not show accept/decline buttons when membershipId is in decidedIds', async () => {
    renderPage(
      true,
      makeNotificationContext({
        notifications: [invitationNotification],
        decidedIds: new Set([10]),
      }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /accepter/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /refuser/i })).toBeNull();
    });
  });

  test('does not show accept/decline buttons for a read invitation', async () => {
    renderPage(
      true,
      makeNotificationContext({
        notifications: [{ ...invitationNotification, isRead: true }],
      }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /accepter/i })).toBeNull();
    });
  });

  test('calls handleAccept with membershipId and notificationId when Accepter is clicked', async () => {
    const handleAccept = vi.fn();
    renderPage(
      true,
      makeNotificationContext({
        notifications: [invitationNotification],
        handleAccept,
      }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));
    await waitFor(() =>
      fireEvent.click(screen.getByRole('button', { name: /accepter/i })),
    );

    expect(handleAccept).toHaveBeenCalledWith(10, 2);
  });

  test('opens the decline dialog when Refuser is clicked', async () => {
    renderPage(
      true,
      makeNotificationContext({ notifications: [invitationNotification] }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));
    await waitFor(() =>
      fireEvent.click(screen.getByRole('button', { name: /refuser/i })),
    );

    expect(screen.getByText(/refuser la demande/i)).toBeTruthy();
    expect(screen.getByLabelText(/raison du refus/i)).toBeTruthy();
  });

  test('closes the decline dialog when Annuler is clicked', async () => {
    renderPage(
      true,
      makeNotificationContext({ notifications: [invitationNotification] }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));
    await waitFor(() =>
      fireEvent.click(screen.getByRole('button', { name: /refuser/i })),
    );

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    await waitFor(() => {
      expect(screen.queryByText(/refuser la demande/i)).toBeNull();
    });
  });

  test('shows a validation error in the dialog when handleDecline returns an error string', async () => {
    const handleDecline = vi
      .fn()
      .mockResolvedValue('Veuillez entrer une raison.');
    renderPage(
      true,
      makeNotificationContext({
        notifications: [invitationNotification],
        handleDecline,
      }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));
    await waitFor(() =>
      fireEvent.click(screen.getByRole('button', { name: /refuser/i })),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /confirmer le refus/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Veuillez entrer une raison.')).toBeTruthy();
    });
    expect(handleDecline).toHaveBeenCalled();
  });

  test('calls handleDecline with the typed reason and closes the dialog on success', async () => {
    const handleDecline = vi.fn().mockResolvedValue(null);
    renderPage(
      true,
      makeNotificationContext({
        notifications: [invitationNotification],
        handleDecline,
      }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));
    await waitFor(() =>
      fireEvent.click(screen.getByRole('button', { name: /refuser/i })),
    );

    fireEvent.change(screen.getByLabelText(/raison du refus/i), {
      target: { value: 'Pas intéressé' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /confirmer le refus/i }),
    );

    await waitFor(() => {
      expect(handleDecline).toHaveBeenCalledWith(10, 2, 'Pas intéressé');
    });
    await waitFor(() => {
      expect(screen.queryByText(/refuser la demande/i)).toBeNull();
    });
  });

  test('resets the reason and error when the decline dialog is closed via Annuler', async () => {
    const handleDecline = vi
      .fn()
      .mockResolvedValue('Veuillez entrer une raison.');
    renderPage(
      true,
      makeNotificationContext({
        notifications: [invitationNotification],
        handleDecline,
      }),
    );

    fireEvent.click(screen.getByText('Invitation équipe'));
    await waitFor(() =>
      fireEvent.click(screen.getByRole('button', { name: /refuser/i })),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /confirmer le refus/i }),
    );
    await waitFor(() =>
      expect(screen.getByText('Veuillez entrer une raison.')).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    // Re-open: error should be gone
    await waitFor(() =>
      fireEvent.click(screen.getByRole('button', { name: /refuser/i })),
    );
    await waitFor(() => {
      expect(screen.queryByText('Veuillez entrer une raison.')).toBeNull();
    });
  });

  test('renders multiple notifications', () => {
    const second = {
      ...infoNotification,
      notificationId: 3,
      object: 'Autre notification',
    };
    renderPage(
      true,
      makeNotificationContext({ notifications: [infoNotification, second] }),
    );

    expect(screen.getByText('Bienvenue')).toBeTruthy();
    expect(screen.getByText('Autre notification')).toBeTruthy();
  });
});
