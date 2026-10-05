import { useContext } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useParams } from 'react-router-dom';
import {
  MemberDetailsContext,
  MemberDetailsContextProvider,
} from './MemberDetailsContext';
import { MemberDetailsContextType } from '../types';
import {
  fetchMemberById,
  banMember,
  fetchMemberUnavailabilities,
} from '../services/membersService';
import { act } from '@testing-library/react';
import { UserContext } from './UserContext';
import { UserContextType } from '../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: vi.fn() };
});

vi.mock('../services/membersService', () => ({
  fetchMemberById: vi.fn(),
  banMember: vi.fn(),
  fetchMemberUnavailabilities: vi.fn(),
}));

describe('MemberDetailsContext', () => {
  const member = {
    id: 1,
    tag: 'Storm',
    speciality: 'exécuteur',
    profilePicture: 'url1',
    date: '2026-01-10',
    teamName: 'TEAM_IOTA',
    teamId: 2,
    isBanned: false,
  };

  let contextValue: MemberDetailsContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(MemberDetailsContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(MemberDetailsContext);
    return null;
  };

  const createUserContext = (withUser = true): UserContextType => ({
    authenticatedUser: withUser
      ? { id: 1, email: 'a@a.com', tag: 'admin', token: 'token' }
      : undefined,
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 1, email: 'a@a.com', isAdmin: true }),
  });

  const renderMemberDetailsContext = (withUser = true) =>
    render(
      <UserContext.Provider value={createUserContext(withUser)}>
        <MemberDetailsContextProvider>
          <ContextConsumer />
        </MemberDetailsContextProvider>
      </UserContext.Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(useParams).mockReturnValue({ memberId: '1' });
    vi.mocked(fetchMemberById).mockResolvedValue(member);
    vi.mocked(banMember).mockResolvedValue(undefined);
    vi.mocked(fetchMemberUnavailabilities).mockResolvedValue([]);
  });

  test('exposes harmless default values without a provider', async () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.member).toBeNull();
    expect(() => contextValue?.setOpenBanModal(false)).not.toThrow();
    await expect(
      contextValue?.handleBanMember() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
  });

  test('loads the member on mount without requiring an authenticated user', async () => {
    renderMemberDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchMemberById).toHaveBeenCalledWith(1);
  });

  test('stores the member when the service succeeds', async () => {
    renderMemberDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.member).toEqual(member);
      expect(contextValue?.error).toBeNull();
    });
  });

  test('stores an explicit error message when loading fails', async () => {
    vi.mocked(fetchMemberById).mockRejectedValueOnce(
      new Error('Membre introuvable'),
    );

    renderMemberDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Membre introuvable');
    });
  });

  test('shows "Membre introuvable." when the member is not found (404)', async () => {
    vi.mocked(fetchMemberById).mockRejectedValueOnce(new Error('Erreur 404'));

    renderMemberDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Membre introuvable.');
    });
  });

  test('stores the fallback error message when loading fails with an unknown value', async () => {
    vi.mocked(fetchMemberById).mockRejectedValueOnce('unknown error');

    renderMemberDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  test('sets an error when memberId is invalid', async () => {
    vi.mocked(useParams).mockReturnValue({ memberId: 'abc' });

    renderMemberDetailsContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Identifiant de membre invalide');
    });
  });

  test('handleBanMember does nothing without authenticated user', async () => {
    renderMemberDetailsContext(false);
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleBanMember();
    });

    expect(banMember).not.toHaveBeenCalled();
  });

  test('handleBanMember calls banMember and reloads member on success', async () => {
    renderMemberDetailsContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleBanMember();
    });

    expect(banMember).toHaveBeenCalledWith('token', 1);
    expect(fetchMemberById).toHaveBeenCalledTimes(2);
  });

  test('handleBanMember stores error when ban fails', async () => {
    vi.mocked(banMember).mockRejectedValueOnce(
      new Error('Erreur de bannissement'),
    );
    renderMemberDetailsContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleBanMember();
    });

    expect(contextValue?.banError).toBe('Erreur de bannissement');
  });

  test('handleBanMember does nothing without member', async () => {
    vi.mocked(fetchMemberById).mockRejectedValueOnce(new Error('erreur'));
    renderMemberDetailsContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleBanMember();
    });

    expect(banMember).not.toHaveBeenCalled();
  });

  test('loads unavailabilities when authenticated user is present', async () => {
    const unavails = [
      { id: 1, startDate: '2026-05-01', endDate: '2026-05-05' },
    ];
    vi.mocked(fetchMemberUnavailabilities).mockResolvedValueOnce(unavails);

    renderMemberDetailsContext();

    await waitFor(() => {
      expect(contextValue?.unavailabilities).toEqual(unavails);
      expect(contextValue?.canViewUnavailabilities).toBe(true);
    });
  });

  test('handles 403 silently and sets canViewUnavailabilities to false', async () => {
    vi.mocked(fetchMemberUnavailabilities).mockRejectedValueOnce(
      new Error('Erreur 403'),
    );

    renderMemberDetailsContext();

    await waitFor(() => {
      expect(contextValue?.unavailabilities).toEqual([]);
      expect(contextValue?.canViewUnavailabilities).toBe(false);
    });
  });

  test('does not fetch unavailabilities when not authenticated', async () => {
    renderMemberDetailsContext(false);

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    expect(fetchMemberUnavailabilities).not.toHaveBeenCalled();
  });
});
