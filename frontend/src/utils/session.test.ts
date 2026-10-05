import { beforeEach, describe, expect, test } from 'vitest';
import {
  clearAuthenticatedUser,
  getAuthenticatedUser,
  setSessionStorage,
  storeAuthenticatedUser,
} from './session';
import { AuthenticatedUser } from '../types';

describe('session helpers', () => {
  const authenticatedUser: AuthenticatedUser = {
    id: 1,
    email: 'user@user.com',
    tag: 'user',
    token: 'jwt-token',
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setSessionStorage(false);
  });

  test('stores the authenticated user in localStorage by default', () => {
    storeAuthenticatedUser(authenticatedUser);

    expect(localStorage.getItem('authenticatedUser')).toBe(
      JSON.stringify(authenticatedUser),
    );
    expect(sessionStorage.getItem('authenticatedUser')).toBeNull();
  });

  test('stores the authenticated user in sessionStorage when requested', () => {
    setSessionStorage(true);
    storeAuthenticatedUser(authenticatedUser);

    expect(sessionStorage.getItem('authenticatedUser')).toBe(
      JSON.stringify(authenticatedUser),
    );
    expect(localStorage.getItem('authenticatedUser')).toBeNull();
  });

  test('removes the authenticated user from the other storage when storing', () => {
    localStorage.setItem(
      'authenticatedUser',
      JSON.stringify(authenticatedUser),
    );

    setSessionStorage(true);
    storeAuthenticatedUser({
      ...authenticatedUser,
      id: 2,
      email: 'other@user.com',
    });

    expect(localStorage.getItem('authenticatedUser')).toBeNull();
    expect(sessionStorage.getItem('authenticatedUser')).toBe(
      JSON.stringify({
        ...authenticatedUser,
        id: 2,
        email: 'other@user.com',
      }),
    );
  });

  test('reads the user from localStorage before sessionStorage', () => {
    localStorage.setItem(
      'authenticatedUser',
      JSON.stringify(authenticatedUser),
    );
    sessionStorage.setItem(
      'authenticatedUser',
      JSON.stringify({
        ...authenticatedUser,
        id: 2,
        email: 'session@user.com',
      }),
    );

    expect(getAuthenticatedUser()).toEqual(authenticatedUser);
  });

  test('falls back to sessionStorage when localStorage is empty', () => {
    sessionStorage.setItem(
      'authenticatedUser',
      JSON.stringify(authenticatedUser),
    );

    expect(getAuthenticatedUser()).toEqual(authenticatedUser);
  });

  test('returns undefined when there is no authenticated user in storage', () => {
    expect(getAuthenticatedUser()).toBeUndefined();
  });

  test('clears the authenticated user from both storages', () => {
    localStorage.setItem(
      'authenticatedUser',
      JSON.stringify(authenticatedUser),
    );
    sessionStorage.setItem(
      'authenticatedUser',
      JSON.stringify(authenticatedUser),
    );

    clearAuthenticatedUser();

    expect(localStorage.getItem('authenticatedUser')).toBeNull();
    expect(sessionStorage.getItem('authenticatedUser')).toBeNull();
  });
});
