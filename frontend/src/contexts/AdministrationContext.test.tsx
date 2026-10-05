import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import {
  AdministrationContext,
  AdministrationContextProvider,
} from './AdministrationContext';
import { UserContext } from './UserContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});
import {
  AdministrationContextType,
  UserContextType,
  UserProfile,
} from '../types';
import {
  demoteAdministrator,
  fetchAdministrators,
  fetchNonAdmins,
  promoteAdministrator,
} from '../services/administrationService';

vi.mock('../services/administrationService', () => ({
  fetchAdministrators: vi.fn(),
  fetchNonAdmins: vi.fn(),
  promoteAdministrator: vi.fn(),
  demoteAdministrator: vi.fn(),
}));

describe('AdministrationContext', () => {
  const authenticatedUser = {
    id: 1,
    email: 'admin@admin.com',
    tag: 'admin',
    token: 'test-token',
  };

  const administrators: UserProfile[] = [
    {
      id: 1,
      email: 'admin@admin.com',
      tag: 'admin',
      speciality: 'Mage',
      profilePicture: 'avatar-1',
      date: '2024-01-01',
    },
  ];

  const nonAdmins: UserProfile[] = [
    {
      id: 2,
      email: 'user@user.com',
      tag: 'user',
      speciality: 'Archer',
      profilePicture: 'avatar-2',
      date: '2024-01-02',
    },
  ];

  let contextValue: AdministrationContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(AdministrationContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(AdministrationContext);
    return null;
  };

  const createUserContextValue = (
    user: typeof authenticatedUser | null = authenticatedUser,
  ): UserContextType => {
    const resolvedUser = user ?? undefined;

    return {
      authenticatedUser: resolvedUser,
      registerUser: vi.fn(),
      loginUser: vi.fn(),
      clearUser: vi.fn(),
      refreshUser: vi.fn(),
      jwtData: vi.fn().mockReturnValue(
        resolvedUser
          ? {
              id: resolvedUser.id,
              email: resolvedUser.email,
              isAdmin: true,
            }
          : null,
      ),
    };
  };

  const renderAdministrationContext = (
    userContextValue = createUserContextValue(),
  ) =>
    render(
      <UserContext.Provider value={userContextValue}>
        <AdministrationContextProvider>
          <ContextConsumer />
        </AdministrationContextProvider>
      </UserContext.Provider>,
    );

  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(fetchAdministrators).mockResolvedValue(administrators);
    vi.mocked(fetchNonAdmins).mockResolvedValue(nonAdmins);
    vi.mocked(promoteAdministrator).mockResolvedValue(undefined);
    vi.mocked(demoteAdministrator).mockResolvedValue(undefined);
  });

  test('exposes harmless default values and methods without a provider', async () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.administrationList).toBeNull();
    expect(contextValue?.nonAdmins).toEqual([]);
    expect(contextValue?.openPromoteModal).toBe(false);
    expect(contextValue?.selectedUserId).toBe('');
    expect(contextValue?.promoteError).toBe('');
    expect(contextValue?.demoteError).toBe('');
    expect(contextValue?.currentUserId).toBeUndefined();

    await expect(
      contextValue?.refreshAdministrators() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.openPromoteModalAndLoadUsers() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    expect(() => contextValue?.closePromoteModal()).not.toThrow();
    expect(() => contextValue?.setSelectedUserId(2)).not.toThrow();
    await expect(
      contextValue?.promoteSelectedUser() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.demoteUser(2) ?? Promise.resolve(),
    ).resolves.toBeUndefined();
  });

  test('resets state when the authenticated user disappears', async () => {
    const view = renderAdministrationContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.administrationList).toEqual(administrators);
    });

    await act(async () => {
      await contextValue?.openPromoteModalAndLoadUsers();
    });

    act(() => {
      contextValue?.setSelectedUserId(2);
    });

    vi.mocked(demoteAdministrator).mockRejectedValueOnce(
      new Error('Demotion impossible'),
    );

    await act(async () => {
      await contextValue?.demoteUser(2);
    });

    await waitFor(() => {
      expect(contextValue?.openPromoteModal).toBe(true);
      expect(contextValue?.selectedUserId).toBe(2);
      expect(contextValue?.demoteError).toBe('Demotion impossible');
    });

    view.rerender(
      <UserContext.Provider value={createUserContextValue(null)}>
        <AdministrationContextProvider>
          <ContextConsumer />
        </AdministrationContextProvider>
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.administrationList).toBeNull();
      expect(contextValue?.nonAdmins).toEqual([]);
      expect(contextValue?.openPromoteModal).toBe(false);
      expect(contextValue?.selectedUserId).toBe('');
      expect(contextValue?.promoteError).toBe('');
      expect(contextValue?.demoteError).toBe('');
      expect(contextValue?.error).toBeNull();
      expect(contextValue?.currentUserId).toBeUndefined();
    });
  });

  test('refreshAdministrators is a no-op without an authenticated user', async () => {
    renderAdministrationContext(createUserContextValue(null));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    await act(async () => {
      await contextValue?.refreshAdministrators();
    });

    expect(fetchAdministrators).not.toHaveBeenCalled();
    expect(contextValue?.administrationList).toBeNull();
    expect(contextValue?.error).toBeNull();
  });

  test('refreshAdministrators stores service errors', async () => {
    vi.mocked(fetchAdministrators).mockRejectedValueOnce(
      new Error('Chargement impossible'),
    );

    renderAdministrationContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Chargement impossible');
    });
  });

  test('openPromoteModalAndLoadUsers is a no-op without an authenticated user', async () => {
    renderAdministrationContext(createUserContextValue(null));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    await act(async () => {
      await contextValue?.openPromoteModalAndLoadUsers();
    });

    expect(fetchNonAdmins).not.toHaveBeenCalled();
    expect(contextValue?.openPromoteModal).toBe(false);
    expect(contextValue?.promoteError).toBe('');
  });

  test('openPromoteModalAndLoadUsers shows the unknown error fallback', async () => {
    renderAdministrationContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    vi.mocked(fetchNonAdmins).mockRejectedValueOnce({ reason: 'unknown' });

    await act(async () => {
      await contextValue?.openPromoteModalAndLoadUsers();
    });

    await waitFor(() => {
      expect(contextValue?.promoteError).toBe(
        'Une erreur inconnue est survenue',
      );
    });
  });

  test('closePromoteModal resets modal-specific state', async () => {
    renderAdministrationContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    await act(async () => {
      await contextValue?.openPromoteModalAndLoadUsers();
    });

    act(() => {
      contextValue?.setSelectedUserId(2);
    });

    vi.mocked(promoteAdministrator).mockRejectedValueOnce(
      new Error('Promotion impossible'),
    );

    await act(async () => {
      await contextValue?.promoteSelectedUser();
    });

    await waitFor(() => {
      expect(contextValue?.openPromoteModal).toBe(true);
      expect(contextValue?.selectedUserId).toBe(2);
      expect(contextValue?.promoteError).toBe('Promotion impossible');
    });

    act(() => {
      contextValue?.closePromoteModal();
    });

    expect(contextValue?.openPromoteModal).toBe(false);
    expect(contextValue?.selectedUserId).toBe('');
    expect(contextValue?.promoteError).toBe('');
  });

  test('promoteSelectedUser does nothing when no user is selected', async () => {
    renderAdministrationContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    await act(async () => {
      await contextValue?.promoteSelectedUser();
    });

    expect(promoteAdministrator).not.toHaveBeenCalled();
  });

  test('promoteSelectedUser refreshes administrators after success', async () => {
    vi.mocked(fetchAdministrators)
      .mockResolvedValueOnce(administrators)
      .mockResolvedValueOnce([...administrators, nonAdmins[0]]);

    renderAdministrationContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    await act(async () => {
      await contextValue?.openPromoteModalAndLoadUsers();
    });

    act(() => {
      contextValue?.setSelectedUserId(2);
    });

    await act(async () => {
      await contextValue?.promoteSelectedUser();
    });

    await waitFor(() => {
      expect(promoteAdministrator).toHaveBeenCalledWith('test-token', 2);
      expect(contextValue?.openPromoteModal).toBe(false);
      expect(contextValue?.selectedUserId).toBe('');
      expect(contextValue?.administrationList).toEqual([
        ...administrators,
        nonAdmins[0],
      ]);
    });
  });

  test('promoteSelectedUser stores promotion errors', async () => {
    renderAdministrationContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setSelectedUserId(2);
    });

    vi.mocked(promoteAdministrator).mockRejectedValueOnce(
      new Error('Promotion impossible'),
    );

    await act(async () => {
      await contextValue?.promoteSelectedUser();
    });

    await waitFor(() => {
      expect(contextValue?.promoteError).toBe('Promotion impossible');
    });
  });

  test('demoteUser does nothing without an authenticated user', async () => {
    renderAdministrationContext(createUserContextValue(null));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    await act(async () => {
      await contextValue?.demoteUser(2);
    });

    expect(demoteAdministrator).not.toHaveBeenCalled();
  });

  test('demoteUser calls refreshUser instead of refreshAdministrators when demoting self', async () => {
    const userContextValue = createUserContextValue();
    vi.mocked(demoteAdministrator).mockResolvedValueOnce(undefined);

    renderAdministrationContext(userContextValue);

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    await act(async () => {
      await contextValue?.demoteUser(1);
    });

    expect(demoteAdministrator).toHaveBeenCalledWith('test-token', 1);
    expect(userContextValue.refreshUser).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/');
    expect(fetchAdministrators).toHaveBeenCalledTimes(1);
  });

  test('demoteUser stores the error then clears it after a successful retry', async () => {
    vi.mocked(fetchAdministrators)
      .mockResolvedValueOnce(administrators)
      .mockResolvedValueOnce([]);

    renderAdministrationContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    vi.mocked(demoteAdministrator).mockRejectedValueOnce(
      new Error('Demotion impossible'),
    );

    await act(async () => {
      await contextValue?.demoteUser(2);
    });

    await waitFor(() => {
      expect(contextValue?.demoteError).toBe('Demotion impossible');
    });

    vi.mocked(demoteAdministrator).mockResolvedValueOnce(undefined);

    await act(async () => {
      await contextValue?.demoteUser(2);
    });

    await waitFor(() => {
      expect(demoteAdministrator).toHaveBeenCalledWith('test-token', 2);
      expect(contextValue?.demoteError).toBe('');
      expect(contextValue?.administrationList).toEqual([]);
    });
  });
});
