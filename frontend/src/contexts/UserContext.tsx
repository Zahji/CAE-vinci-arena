import { createContext, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  MaybeAuthenticatedUser,
  UserContextType,
  User,
  AuthenticatedUser,
  UserRegister,
  JwtPayload,
} from '../types';

import {
  clearAuthenticatedUser,
  getAuthenticatedUser,
  setSessionStorage,
  storeAuthenticatedUser,
} from '../utils/session';
import { refreshToken } from '../services/administrationService';

const defaultUserContext: UserContextType = {
  authenticatedUser: undefined,
  registerUser: async () => {},
  loginUser: async () => {},
  clearUser: () => {},
  jwtData: () => {
    return null;
  },
  refreshUser: async () => {},
};

const UserContext = createContext<UserContextType>(defaultUserContext);

type HttpError = Error & {
  status?: number;
};

const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [authenticatedUser, setAuthenticatedUserState] =
    useState<MaybeAuthenticatedUser>(() => getAuthenticatedUser());

  const setAuthenticatedUser = (user: MaybeAuthenticatedUser) => {
    setAuthenticatedUserState(user);

    if (user) {
      storeAuthenticatedUser(user);
      return;
    }

    clearAuthenticatedUser();
  };

  const registerUser = async (newUser: UserRegister) => {
    try {
      const options = {
        method: 'POST',
        body: JSON.stringify(newUser),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await fetch('/api/auths/register', options);

      if (!response.ok) {
        const error: HttpError = new Error(
          `fetch error : ${response.status} : ${response.statusText}`,
        );
        error.status = response.status;
        throw error;
      }
    } catch (err) {
      console.error('registerUser::error: ', err);
      throw err;
    }
  };

  const loginUser = async (user: User, rememberMe: boolean) => {
    try {
      const options = {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await fetch('/api/auths/login', options);

      if (!response.ok) {
        const error: HttpError = new Error(
          `fetch error : ${response.status} : ${response.statusText}`,
        );
        error.status = response.status;
        throw error;
      }

      const authenticatedUser: AuthenticatedUser = await response.json();
      console.log('authenticatedUser: ', authenticatedUser);

      setSessionStorage(!rememberMe);
      setAuthenticatedUser(authenticatedUser);
    } catch (err) {
      console.error('loginUser::error: ', err);
      throw err;
    }
  };

  const clearUser = () => {
    setAuthenticatedUser(undefined);
  };

  const refreshUser = async () => {
    if (!authenticatedUser) {
      return;
    }
    const refreshed = await refreshToken(authenticatedUser.token);
    setAuthenticatedUser(refreshed);
  };

  const jwtData = () => {
    if (authenticatedUser == null || authenticatedUser.token == null) {
      return null;
    }

    const decodedToken = jwtDecode(authenticatedUser.token);

    if (decodedToken == null || typeof decodedToken === 'string') {
      return null;
    }

    return decodedToken as JwtPayload;
  };

  const myContext: UserContextType = {
    authenticatedUser,
    setAuthenticatedUser,
    registerUser,
    loginUser,
    clearUser,
    jwtData,
    refreshUser,
  };

  return (
    <UserContext.Provider value={myContext}>{children}</UserContext.Provider>
  );
};

export { UserContext, UserContextProvider };
