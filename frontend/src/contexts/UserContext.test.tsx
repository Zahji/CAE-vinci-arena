import { useContext } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { jwtDecode } from 'jwt-decode';
import { UserContext, UserContextProvider } from './UserContext';
import { AuthenticatedUser, JwtPayload, User, UserContextType } from '../types';
import {
  clearAuthenticatedUser,
  getAuthenticatedUser,
  setSessionStorage,
  storeAuthenticatedUser,
} from '../utils/session';
import { refreshToken } from '../services/administrationService';

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

vi.mock('../utils/session', () => ({
  clearAuthenticatedUser: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  setSessionStorage: vi.fn(),
  storeAuthenticatedUser: vi.fn(),
}));

vi.mock('../services/administrationService', () => ({
  refreshToken: vi.fn(),
}));

describe('UserContext', () => {
  const authenticatedUser: AuthenticatedUser = {
    id: 1,
    email: 'user@user.com',
    tag: 'user',
    token: 'jwt-token',
  };

  const loginPayload: User = {
    email: 'user@user.com',
    password: 'Password123',
  };

  let fetchMock: ReturnType<typeof vi.fn>;
  let contextValue: UserContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(UserContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(UserContext);
    return null;
  };

  const renderUserContext = () =>
    render(
      <UserContextProvider>
        <ContextConsumer />
      </UserContextProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    contextValue = undefined;
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(getAuthenticatedUser).mockReturnValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('hydrates the initial user from session helpers', () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue(authenticatedUser);

    renderUserContext();

    expect(contextValue?.authenticatedUser).toEqual(authenticatedUser);
  });

  test('exposes the default context value when no provider is mounted', () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.authenticatedUser).toBeUndefined();
    expect(contextValue?.jwtData()).toBeNull();
  });

  test('default context methods are harmless without a provider', async () => {
    render(<DefaultContextConsumer />);

    await expect(
      contextValue?.registerUser({
        email: 'default@user.com',
        password: 'Password123',
        tag: 'default',
        speciality: 'Mage',
        profile_picture: 'avatar',
      }) ?? Promise.resolve(),
    ).resolves.toBeUndefined();

    await expect(
      contextValue?.loginUser(loginPayload, false) ?? Promise.resolve(),
    ).resolves.toBeUndefined();

    expect(() => contextValue?.clearUser()).not.toThrow();

    await expect(
      contextValue?.refreshUser() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
  });

  test('registerUser creates user without starting a session', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
    });

    renderUserContext();

    await act(async () => {
      await contextValue?.registerUser({
        email: 'new@user.com',
        password: 'Password123',
        tag: 'newbie',
        speciality: 'Mage',
        profile_picture: 'avatar',
      });
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auths/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@user.com',
        password: 'Password123',
        tag: 'newbie',
        speciality: 'Mage',
        profile_picture: 'avatar',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(setSessionStorage).not.toHaveBeenCalled();
    expect(storeAuthenticatedUser).not.toHaveBeenCalled();
    expect(contextValue?.authenticatedUser).toBeUndefined();
  });

  test('registerUser rethrows HTTP errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      statusText: 'Conflict',
    });

    renderUserContext();

    await expect(
      contextValue?.registerUser({
        email: 'new@user.com',
        password: 'Password123',
        tag: 'newbie',
        speciality: 'Mage',
        profile_picture: 'avatar',
      }) ?? Promise.resolve(),
    ).rejects.toMatchObject({
      status: 409,
      message: 'fetch error : 409 : Conflict',
    });

    expect(storeAuthenticatedUser).not.toHaveBeenCalled();
  });

  test('loginUser stores the authenticated user and uses localStorage when remember me is checked', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(authenticatedUser),
    });

    renderUserContext();

    await act(async () => {
      await contextValue?.loginUser(loginPayload, true);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auths/login', {
      method: 'POST',
      body: JSON.stringify(loginPayload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(setSessionStorage).toHaveBeenCalledWith(false);
    expect(storeAuthenticatedUser).toHaveBeenCalledWith(authenticatedUser);
    expect(contextValue?.authenticatedUser).toEqual(authenticatedUser);
  });

  test('loginUser rethrows HTTP errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    renderUserContext();

    await expect(
      contextValue?.loginUser(loginPayload, false) ?? Promise.resolve(),
    ).rejects.toMatchObject({
      status: 401,
      message: 'fetch error : 401 : Unauthorized',
    });

    expect(setSessionStorage).not.toHaveBeenCalled();
    expect(storeAuthenticatedUser).not.toHaveBeenCalled();
  });

  test('clearUser clears the current user and session storage', async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue(authenticatedUser);

    renderUserContext();

    act(() => {
      contextValue?.clearUser();
    });

    expect(clearAuthenticatedUser).toHaveBeenCalled();
    expect(contextValue?.authenticatedUser).toBeUndefined();
  });

  test('jwtData returns null when there is no authenticated user', () => {
    renderUserContext();

    expect(contextValue?.jwtData()).toBeNull();
    expect(jwtDecode).not.toHaveBeenCalled();
  });

  test('jwtData returns null when jwtDecode returns a string', () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue(authenticatedUser);
    vi.mocked(jwtDecode).mockReturnValue('invalid token');

    renderUserContext();

    expect(contextValue?.jwtData()).toBeNull();
  });

  test('jwtData returns null when jwtDecode returns null', () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue(authenticatedUser);
    vi.mocked(jwtDecode).mockReturnValue(null as never);

    renderUserContext();

    expect(contextValue?.jwtData()).toBeNull();
  });

  test('refreshUser is a no-op when there is no authenticated user', async () => {
    renderUserContext();

    await act(async () => {
      await contextValue?.refreshUser();
    });

    expect(refreshToken).not.toHaveBeenCalled();
  });

  test('refreshUser updates the authenticated user after a successful refresh', async () => {
    const refreshedUser: AuthenticatedUser = {
      id: 1,
      email: 'user@user.com',
      tag: 'user',
      token: 'new-jwt-token',
    };

    vi.mocked(getAuthenticatedUser).mockReturnValue(authenticatedUser);
    vi.mocked(refreshToken).mockResolvedValueOnce(refreshedUser);

    renderUserContext();

    await act(async () => {
      await contextValue?.refreshUser();
    });

    expect(refreshToken).toHaveBeenCalledWith('jwt-token');
    expect(storeAuthenticatedUser).toHaveBeenCalledWith(refreshedUser);
    expect(contextValue?.authenticatedUser).toEqual(refreshedUser);
  });

  test('refreshUser propagates errors thrown by refreshToken', async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue(authenticatedUser);
    vi.mocked(refreshToken).mockRejectedValueOnce(new Error('Erreur 401'));

    renderUserContext();

    await expect(
      act(async () => {
        await contextValue?.refreshUser();
      }),
    ).rejects.toThrow('Erreur 401');
  });

  test('jwtData returns the decoded payload when available', () => {
    const payload: JwtPayload = {
      id: 1,
      email: 'user@user.com',
      isAdmin: true,
    };

    vi.mocked(getAuthenticatedUser).mockReturnValue(authenticatedUser);
    vi.mocked(jwtDecode).mockReturnValue(payload);

    renderUserContext();

    expect(contextValue?.jwtData()).toEqual(payload);
    expect(jwtDecode).toHaveBeenCalledWith('jwt-token');
  });
});
