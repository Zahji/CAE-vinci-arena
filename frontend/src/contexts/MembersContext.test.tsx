import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MembersContext, MembersContextProvider } from './MembersContext';
import { MembersContextType } from '../types';
import { fetchAllMembers } from '../services/membersService';
import { UserContext } from './UserContext';

vi.mock('../services/membersService', () => ({
  fetchAllMembers: vi.fn(),
}));

describe('MembersContext', () => {
  const members = [
    {
      id: 1,
      tag: 'Storm',
      speciality: 'exécuteur',
      profilePicture: 'url1',
      date: '2026-01-10',
      teamName: 'TEAM_IOTA',
      teamId: 2,
      isBanned: false,
    },
  ];

  let contextValue: MembersContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(MembersContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(MembersContext);
    return null;
  };

  const renderMembersContext = () =>
    render(
      <MembersContextProvider>
        <ContextConsumer />
      </MembersContextProvider>,
    );

  const renderMembersContextAsAuthenticatedUser = (userId: number) =>
    render(
      <UserContext.Provider
        value={{
          authenticatedUser: { id: userId } as never,
          jwtData: () => null,
          registerUser: async () => {},
          loginUser: async () => {},
          clearUser: () => {},
          refreshUser: async () => {},
        }}
      >
        <MembersContextProvider>
          <ContextConsumer />
        </MembersContextProvider>
      </UserContext.Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(fetchAllMembers).mockResolvedValue(members);
  });

  test('exposes harmless default values without a provider', async () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.membersList).toBeNull();
    expect(contextValue?.filteredMembers).toEqual([]);
    expect(contextValue?.search).toBe('');
    expect(contextValue?.currentUserId).toBeUndefined();
    expect(() => contextValue?.setSearch('test')).not.toThrow();

    await expect(
      contextValue?.refreshMembers() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
  });

  test('loads members on mount without requiring an authenticated user', async () => {
    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchAllMembers).toHaveBeenCalledOnce();
  });

  test('stores members when the service succeeds', async () => {
    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.membersList).toEqual(members);
      expect(contextValue?.filteredMembers).toEqual(members);
      expect(contextValue?.error).toBeNull();
    });
  });

  test('filteredMembers returns all members when search is empty', async () => {
    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.filteredMembers).toEqual(members);
    });
  });

  test('filteredMembers returns members sorted alphabetically by tag', async () => {
    const unsortedMembers = [
      { ...members[0], id: 2, tag: 'Zorro' },
      { ...members[0], id: 3, tag: 'Alpha' },
      { ...members[0], id: 1, tag: 'Storm' },
    ];
    vi.mocked(fetchAllMembers).mockResolvedValueOnce(unsortedMembers);

    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.filteredMembers.map((m) => m.tag)).toEqual([
        'Alpha',
        'Storm',
        'Zorro',
      ]);
    });
  });

  test('filteredMembers filters by tag when search is set', async () => {
    const destroyer = { ...members[0], id: 2, tag: 'Destroyer' };
    vi.mocked(fetchAllMembers).mockResolvedValueOnce([...members, destroyer]);

    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setSearch('sto');
    });

    await waitFor(() => {
      expect(contextValue?.filteredMembers).toEqual(members);
      expect(contextValue?.search).toBe('sto');
    });
  });

  test('filteredMembers returns empty array when no member matches', async () => {
    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setSearch('xyz');
    });

    await waitFor(() => {
      expect(contextValue?.filteredMembers).toEqual([]);
    });
  });

  test('stores an explicit error message when loading fails', async () => {
    vi.mocked(fetchAllMembers).mockRejectedValueOnce(
      new Error('Chargement impossible'),
    );

    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Chargement impossible');
    });
  });

  test('stores the fallback error message when loading fails with an unknown value', async () => {
    vi.mocked(fetchAllMembers).mockRejectedValueOnce('unknown error');

    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  test('refreshMembers reloads the members list', async () => {
    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.membersList).toEqual(members);
    });

    const refreshedMembers = [
      ...members,
      {
        id: 2,
        tag: 'Blaze',
        speciality: 'stratège',
        profilePicture: 'url2',
        date: '2026-02-15',
        teamName: null,
        teamId: null,
        isBanned: false,
      },
    ];

    vi.mocked(fetchAllMembers).mockResolvedValueOnce(refreshedMembers);

    await act(async () => {
      await contextValue?.refreshMembers();
    });

    await waitFor(() => {
      expect(contextValue?.membersList).toEqual(refreshedMembers);
    });

    expect(fetchAllMembers).toHaveBeenCalledTimes(2);
  });

  test('exposes the authenticated user id as currentUserId', async () => {
    renderMembersContextAsAuthenticatedUser(1);

    await waitFor(() => {
      expect(contextValue?.currentUserId).toBe(1);
    });
  });

  test('places the current user first in filteredMembers regardless of alphabetical order', async () => {
    const multipleMembers = [
      { ...members[0], id: 2, tag: 'Alpha' },
      { ...members[0], id: 1, tag: 'Storm' },
      { ...members[0], id: 3, tag: 'Zorro' },
    ];
    vi.mocked(fetchAllMembers).mockResolvedValueOnce(multipleMembers);

    renderMembersContextAsAuthenticatedUser(1);

    await waitFor(() => {
      expect(contextValue?.filteredMembers.map((m) => m.tag)).toEqual([
        'Storm',
        'Alpha',
        'Zorro',
      ]);
    });
  });

  test('filteredMembers places banned members after non-banned members', async () => {
    const mixedMembers = [
      { ...members[0], id: 2, tag: 'Alpha', isBanned: true },
      { ...members[0], id: 3, tag: 'Beta', isBanned: false },
    ];
    vi.mocked(fetchAllMembers).mockResolvedValueOnce(mixedMembers);

    renderMembersContext();

    await waitFor(() => {
      expect(contextValue?.filteredMembers.map((m) => m.tag)).toEqual([
        'Beta',
        'Alpha',
      ]);
    });
  });

  test('places current user first even when other members are banned', async () => {
    const mixedMembers = [
      { ...members[0], id: 2, tag: 'Alpha', isBanned: false },
      { ...members[0], id: 1, tag: 'Storm', isBanned: false },
      { ...members[0], id: 3, tag: 'Zorro', isBanned: true },
    ];
    vi.mocked(fetchAllMembers).mockResolvedValueOnce(mixedMembers);

    renderMembersContextAsAuthenticatedUser(1);

    await waitFor(() => {
      expect(contextValue?.filteredMembers.map((m) => m.tag)).toEqual([
        'Storm',
        'Alpha',
        'Zorro',
      ]);
    });
  });
});
