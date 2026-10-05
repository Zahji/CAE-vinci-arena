import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { NavbarContext, NavbarContextProvider } from './NavbarContext';
import { UserContext } from './UserContext';
import { NavbarContextType, UserContextType } from '../types';

describe('NavbarContext', () => {
  const authenticatedUser = {
    id: 1,
    email: 'user@test.com',
    tag: 'TestUser',
    token: 'jwt-token',
  };

  let fetchMock: ReturnType<typeof vi.fn>;
  let contextValue: NavbarContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(NavbarContext);
    return null;
  };

  const createUserContextValue = (
    user: typeof authenticatedUser | null = authenticatedUser,
    isAdmin = false,
  ): UserContextType => ({
    authenticatedUser: user ?? undefined,
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue(
        user ? { id: user.id, email: user.email, isAdmin } : null,
      ),
  });

  const renderNavbarContext = (userCtx = createUserContextValue()) =>
    render(
      <UserContext.Provider value={userCtx}>
        <NavbarContextProvider>
          <ContextConsumer />
        </NavbarContextProvider>
      </UserContext.Provider>,
    );

  const makeNotificationsResponse = (notifications: { isRead: boolean }[]) =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(notifications),
    });

  const makeProfileResponse = (profilePicture: string | null) =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 1,
          email: 'user@test.com',
          tag: 'TestUser',
          speciality: '',
          profilePicture,
          date: '',
          isAdmin: false,
        }),
    });

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    contextValue = undefined;
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // --- Default values without provider ---

  test('exposes harmless default values without a provider', () => {
    render(<ContextConsumer />);

    expect(contextValue?.hasUnread).toBe(false);
    expect(contextValue?.profilePictureUrl).toBe('');
    expect(contextValue?.isAdmin).toBe(false);
    expect(contextValue?.displayName).toBe('');
    expect(contextValue?.menuAnchor).toBeNull();
    expect(() =>
      contextValue?.openProfileMenu(
        {} as unknown as React.MouseEvent<HTMLElement>,
      ),
    ).not.toThrow();
    expect(() => contextValue?.closeProfileMenu()).not.toThrow();
  });

  // --- No authenticated user ---

  test('does not call fetch when there is no authenticated user', async () => {
    renderNavbarContext(createUserContextValue(null));
    await act(async () => {});

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('hasUnread is false when no authenticated user', async () => {
    renderNavbarContext(createUserContextValue(null));
    await act(async () => {});

    expect(contextValue?.hasUnread).toBe(false);
  });

  test('profilePictureUrl is empty string when no authenticated user', async () => {
    renderNavbarContext(createUserContextValue(null));
    await act(async () => {});

    expect(contextValue?.profilePictureUrl).toBe('');
  });

  test('isAdmin is false when jwtData returns null', async () => {
    renderNavbarContext(createUserContextValue(null));
    await act(async () => {});

    expect(contextValue?.isAdmin).toBe(false);
  });

  test('displayName is empty string when no authenticated user', async () => {
    renderNavbarContext(createUserContextValue(null));
    await act(async () => {});

    expect(contextValue?.displayName).toBe('');
  });

  // --- Fetch on mount with authenticated user ---

  test('calls fetchUnread on mount when authenticated', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderNavbarContext();
    await act(async () => {});

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/',
      expect.objectContaining({ headers: { Authorization: 'jwt-token' } }),
    );
  });

  test('calls fetchMyProfilePicture on mount when authenticated', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    renderNavbarContext();
    await act(async () => {});

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  // --- hasUnread ---

  test('sets hasUnread to true when notifications contain an unread item', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/')
        return makeNotificationsResponse([{ isRead: false }]);
      return makeProfileResponse('pic.png');
    });

    renderNavbarContext();
    await waitFor(() => expect(contextValue?.hasUnread).toBe(true));
  });

  test('keeps hasUnread false when all notifications are read', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/')
        return makeNotificationsResponse([{ isRead: true }]);
      return makeProfileResponse('pic.png');
    });

    renderNavbarContext();
    await act(async () => {});

    expect(contextValue?.hasUnread).toBe(false);
  });

  test('keeps hasUnread false when notifications endpoint returns non-ok', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return Promise.resolve({ ok: false });
      return makeProfileResponse('');
    });

    renderNavbarContext();
    await act(async () => {});

    expect(contextValue?.hasUnread).toBe(false);
  });

  test('keeps hasUnread false when notifications fetch throws', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/')
        return Promise.reject(new Error('network error'));
      return makeProfileResponse('');
    });

    renderNavbarContext();
    await act(async () => {});

    expect(contextValue?.hasUnread).toBe(false);
  });

  test('does not call fetch when user logs out between polling ticks', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return makeNotificationsResponse([]);
      return makeProfileResponse('');
    });

    const { rerender } = renderNavbarContext();
    await act(async () => {});
    const callCountAfterMount = fetchMock.mock.calls.filter(
      (args) => args[0] === '/api/notifications/',
    ).length;

    rerender(
      <UserContext.Provider value={createUserContextValue(null)}>
        <NavbarContextProvider>
          <ContextConsumer />
        </NavbarContextProvider>
      </UserContext.Provider>,
    );
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(
      fetchMock.mock.calls.filter((args) => args[0] === '/api/notifications/')
        .length,
    ).toBe(callCountAfterMount);
  });

  // --- Polling ---

  test('sets up a 30-second polling interval after mount', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return makeNotificationsResponse([]);
      return makeProfileResponse('');
    });

    renderNavbarContext();
    await act(async () => {});
    const callCountAfterMount = fetchMock.mock.calls.filter(
      (args) => args[0] === '/api/notifications/',
    ).length;

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    const callCountAfterInterval = fetchMock.mock.calls.filter(
      (args) => args[0] === '/api/notifications/',
    ).length;
    expect(callCountAfterInterval).toBeGreaterThan(callCountAfterMount);
  });

  test('clears the interval on unmount', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return makeNotificationsResponse([]);
      return makeProfileResponse('');
    });

    const { unmount } = renderNavbarContext();
    await act(async () => {});

    unmount();

    const callCountAfterUnmount = fetchMock.mock.calls.filter(
      (args) => args[0] === '/api/notifications/',
    ).length;

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(
      fetchMock.mock.calls.filter((args) => args[0] === '/api/notifications/')
        .length,
    ).toBe(callCountAfterUnmount);
  });

  // --- profilePictureUrl ---

  test('sets profilePictureUrl from /api/users/me response', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return makeNotificationsResponse([]);
      return makeProfileResponse('https://example.com/pic.png');
    });

    renderNavbarContext();
    await waitFor(() =>
      expect(contextValue?.profilePictureUrl).toBe(
        'https://example.com/pic.png',
      ),
    );
  });

  test('falls back to empty string when profilePicture is null in response', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return makeNotificationsResponse([]);
      return makeProfileResponse(null);
    });

    renderNavbarContext();
    await act(async () => {});

    expect(contextValue?.profilePictureUrl).toBe('');
  });

  test('falls back to empty string when /api/users/me returns non-ok', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return makeNotificationsResponse([]);
      return Promise.resolve({ ok: false });
    });

    renderNavbarContext();
    await act(async () => {});

    expect(contextValue?.profilePictureUrl).toBe('');
  });

  test('falls back to empty string when /api/users/me throws', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return makeNotificationsResponse([]);
      return Promise.reject(new Error('network error'));
    });

    renderNavbarContext();
    await act(async () => {});

    expect(contextValue?.profilePictureUrl).toBe('');
  });

  test('resets profilePictureUrl to empty string when user logs out', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/notifications/') return makeNotificationsResponse([]);
      return makeProfileResponse('https://example.com/pic.png');
    });

    const { rerender } = renderNavbarContext();
    await waitFor(() =>
      expect(contextValue?.profilePictureUrl).toBe(
        'https://example.com/pic.png',
      ),
    );

    rerender(
      <UserContext.Provider value={createUserContextValue(null)}>
        <NavbarContextProvider>
          <ContextConsumer />
        </NavbarContextProvider>
      </UserContext.Provider>,
    );
    await act(async () => {});

    expect(contextValue?.profilePictureUrl).toBe('');
  });

  // --- isAdmin and displayName ---

  test('isAdmin is true when jwtData returns isAdmin: true', () => {
    renderNavbarContext(createUserContextValue(authenticatedUser, true));

    expect(contextValue?.isAdmin).toBe(true);
  });

  test('isAdmin is false when jwtData returns isAdmin: false', () => {
    renderNavbarContext(createUserContextValue(authenticatedUser, false));

    expect(contextValue?.isAdmin).toBe(false);
  });

  test('displayName reflects the authenticated user tag', () => {
    renderNavbarContext();

    expect(contextValue?.displayName).toBe('TestUser');
  });

  // --- menuAnchor ---

  test('menuAnchor is null initially', () => {
    renderNavbarContext(createUserContextValue(null));

    expect(contextValue?.menuAnchor).toBeNull();
  });

  test('openProfileMenu sets menuAnchor to event.currentTarget', () => {
    renderNavbarContext(createUserContextValue(null));

    const fakeElement = document.createElement('button');
    act(() => {
      contextValue?.openProfileMenu({
        currentTarget: fakeElement,
      } as unknown as React.MouseEvent<HTMLElement>);
    });

    expect(contextValue?.menuAnchor).toBe(fakeElement);
  });

  test('closeProfileMenu sets menuAnchor back to null', () => {
    renderNavbarContext(createUserContextValue(null));

    const fakeElement = document.createElement('button');
    act(() => {
      contextValue?.openProfileMenu({
        currentTarget: fakeElement,
      } as unknown as React.MouseEvent<HTMLElement>);
    });
    act(() => {
      contextValue?.closeProfileMenu();
    });

    expect(contextValue?.menuAnchor).toBeNull();
  });
});
