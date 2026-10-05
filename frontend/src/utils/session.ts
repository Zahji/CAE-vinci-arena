import { AuthenticatedUser, MaybeAuthenticatedUser } from '../types';

let isSessionStorage = false;

const setSessionStorage = (sessionStorageMode: boolean) => {
  isSessionStorage = sessionStorageMode;
};

const storeAuthenticatedUser = (authenticatedUser: AuthenticatedUser) => {
  const storage = isSessionStorage ? sessionStorage : localStorage;
  const otherStorage = isSessionStorage ? localStorage : sessionStorage;

  storage.setItem('authenticatedUser', JSON.stringify(authenticatedUser));
  otherStorage.removeItem('authenticatedUser');
};

const getAuthenticatedUser = (): MaybeAuthenticatedUser => {
  const authenticatedUser =
    localStorage.getItem('authenticatedUser') ||
    sessionStorage.getItem('authenticatedUser');

  if (!authenticatedUser) return undefined;

  return JSON.parse(authenticatedUser);
};

const clearAuthenticatedUser = () => {
  localStorage.removeItem('authenticatedUser');
  sessionStorage.removeItem('authenticatedUser');
};

export {
  setSessionStorage,
  storeAuthenticatedUser,
  getAuthenticatedUser,
  clearAuthenticatedUser,
};
