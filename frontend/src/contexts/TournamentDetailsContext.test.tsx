import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  TournamentDetailsContext,
  TournamentDetailsContextProvider,
} from './TournamentDetailsContext';
import { UserContext } from './UserContext';
import {
  fetchTournamentRegistrations,
  registerTeamToTournament,
} from '../services/tournamentRegistrationService';
import { fetchTeamById } from '../services/teamService';
import {
  PublishTournamentPayload,
  TournamentDetailsContextType,
  UserContextType,
} from '../types';
import {
  fetchTournamentById,
  publishTournament,
} from '../services/tournamentService';

vi.mock('../services/tournamentService', () => ({
  fetchTournamentById: vi.fn(),
  publishTournament: vi.fn(),
}));

vi.mock('../services/tournamentRegistrationService', () => ({
  fetchTournamentRegistrations: vi.fn(),
  registerTeamToTournament: vi.fn(),
}));

vi.mock('../services/teamService', () => ({
  fetchTeamById: vi.fn(),
}));

describe('TournamentDetailsContext', () => {
  let contextValue: TournamentDetailsContextType | undefined;

  // Tournament used for registration tests (PLANIFIED state)
  const openTournament = {
    id: 1,
    name: 'Spring Cup',
    description: 'Tournoi de printemps',
    state: 'PLANIFIED',
    stateDisplayName: 'Planifié',
    startDate: '2026-06-01',
    endDate: '2026-06-03',
    startInscriptionDate: '2026-04-01',
    endInscriptionDate: '2026-05-31',
    maxTeams: 4,
    registrationsCount: 0,
  };

  // Tournament used for publish tests (IN_PREPARATION state)
  const prepTournament = {
    id: 1,
    name: 'Spring Clash',
    description: 'Tournoi du printemps',
    state: 'IN_PREPARATION',
    stateDisplayName: 'En préparation',
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    startInscriptionDate: '2026-03-01',
    endInscriptionDate: '2026-03-31',
    maxTeams: 16,
    registrationsCount: 0,
  };

  const manager = {
    id: 10,
    email: 'manager@mail.com',
    tag: 'Lynx',
    speciality: 'support',
    profilePicture: 'url',
    date: '2025-01-01',
  };
  const secondManager = {
    id: 20,
    email: 'sec@mail.com',
    tag: 'Rex',
    speciality: 'support',
    profilePicture: 'url',
    date: '2025-01-01',
  };

  const team = {
    id: 5,
    name: 'TEAM_ALPHA',
    manager,
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  };

  const registrations = [
    {
      tournamentId: 1,
      tournamentName: 'Spring Cup',
      teamId: 99,
      teamName: 'OTHER_TEAM',
    },
  ];

  const publishPayload: PublishTournamentPayload = {
    name: 'Spring Clash',
    description: 'Tournoi du printemps',
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    startInscriptionDate: '2026-03-01',
    endInscriptionDate: '2026-03-31',
    maxTeams: 16,
    state: 'PLANIFIED',
  };

  /**
   * Reads the context value and stores it for assertions.
   * @return {null} nothing
   */
  const ContextConsumer = () => {
    contextValue = useContext(TournamentDetailsContext);
    return null;
  };

  /**
   * Returns a user context with no authenticated user.
   * @return {UserContextType} the context value
   */
  const createAnonymousUserContext = (): UserContextType => ({
    authenticatedUser: undefined,
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue(null),
    refreshUser: vi.fn(),
  });

  /**
   * Returns a user context for a logged-in user with a team.
   * @param {number} userId - the user id
   * @param {number} teamId - the team id
   * @return {UserContextType} the context value
   */
  const createUserWithTeamContext = (
    userId = 10,
    teamId = 5,
  ): UserContextType => ({
    authenticatedUser: {
      id: userId,
      email: 'user@mail.com',
      tag: 'Lynx',
      token: 'user-token',
      teamId,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: userId, email: 'user@mail.com', isAdmin: false }),
    refreshUser: vi.fn(),
  });

  /**
   * Returns a user context for an admin user.
   * @return {UserContextType} the context value
   */
  const createAdminUserContext = (): UserContextType => ({
    authenticatedUser: {
      id: 99,
      email: 'admin@mail.com',
      tag: 'Admin',
      token: 'admin-token',
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 99, email: 'admin@mail.com', isAdmin: true }),
    refreshUser: vi.fn(),
  });

  /**
   * Returns a user context for a logged-in user with no team.
   * @return {UserContextType} the context value
   */
  const createUserWithoutTeamContext = (): UserContextType => ({
    authenticatedUser: {
      id: 42,
      email: 'noteam@mail.com',
      tag: 'Ghost',
      token: 'ghost-token',
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 42, email: 'noteam@mail.com', isAdmin: false }),
    refreshUser: vi.fn(),
  });

  /**
   * Shows the provider inside a user context for testing.
   * @param {UserContextType} userCtx - the user context
   * @param {number} tournamentId - the tournament id
   * @return {void}
   */
  const renderContext = (
    userCtx = createAnonymousUserContext(),
    tournamentId = 1,
  ) =>
    render(
      <UserContext.Provider value={userCtx}>
        <TournamentDetailsContextProvider tournamentId={tournamentId}>
          <ContextConsumer />
        </TournamentDetailsContextProvider>
      </UserContext.Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(fetchTournamentById).mockResolvedValue(openTournament);
    vi.mocked(fetchTournamentRegistrations).mockResolvedValue([]);
    vi.mocked(fetchTeamById).mockResolvedValue(team);
    vi.mocked(publishTournament).mockResolvedValue({
      ...prepTournament,
      state: 'PLANIFIED',
      stateDisplayName: 'Planifié',
    });
  });

  // --- Default context values ---

  test('exposes harmless default values without a provider', async () => {
    render(<ContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.success).toBeNull();
    expect(contextValue?.actionLoading).toBeNull();
    expect(contextValue?.tournament).toBeNull();
    expect(contextValue?.registrations).toEqual([]);
    expect(contextValue?.canRegister).toBe(false);
    expect(contextValue?.registering).toBe(false);
    expect(contextValue?.registerError).toBeNull();
    expect(contextValue?.registerSuccess).toBe(false);
    expect(contextValue?.isAdmin).toBe(false);
    expect(contextValue?.currentUserId).toBeUndefined();

    await expect(
      contextValue?.refreshRegistrations() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.registerTeam() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handlePublishTournament(publishPayload) ??
        Promise.resolve(),
    ).resolves.toBeUndefined();
    expect(() => contextValue?.clearRegisterError()).not.toThrow();
    expect(() => contextValue?.clearError()).not.toThrow();
    expect(() => contextValue?.clearSuccess()).not.toThrow();
    expect(() => contextValue?.handleRefresh()).not.toThrow();
  });

  // --- Tournament loading ---

  test('loads tournament and registrations for anonymous user', async () => {
    renderContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchTournamentById).toHaveBeenCalledWith(1, undefined);
    expect(fetchTournamentRegistrations).toHaveBeenCalledWith(1);
    expect(fetchTeamById).not.toHaveBeenCalled();
    expect(contextValue?.tournament).toEqual(openTournament);
    expect(contextValue?.registrations).toEqual([]);
    expect(contextValue?.error).toBeNull();
  });

  test('loads tournament, team and registrations for user with a team', async () => {
    renderContext(createUserWithTeamContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchTournamentById).toHaveBeenCalledWith(1, undefined);
    expect(fetchTeamById).toHaveBeenCalledWith(5, 'user-token');
    expect(fetchTournamentRegistrations).toHaveBeenCalledWith(1);
    expect(contextValue?.tournament).toEqual(openTournament);
    expect(contextValue?.error).toBeNull();
  });

  test('passes admin token to fetchTournamentById when user is admin', async () => {
    renderContext(createAdminUserContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchTournamentById).toHaveBeenCalledWith(1, 'admin-token');
  });

  test('does not fetch team for user without a teamId', async () => {
    renderContext(createUserWithoutTeamContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchTeamById).not.toHaveBeenCalled();
  });

  test('stores an error when tournament fetch fails', async () => {
    vi.mocked(fetchTournamentById).mockRejectedValueOnce(
      new Error('Tournoi introuvable'),
    );

    renderContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Tournoi introuvable');
    });
  });

  test('shows a friendly message when tournament is not found or not published (404)', async () => {
    vi.mocked(fetchTournamentById).mockRejectedValueOnce(
      new Error('Erreur 404'),
    );

    renderContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe(
        "Ce tournoi n'est pas encore publié ou n'existe pas.",
      );
    });
  });

  test('stores the fallback error message on unknown failure', async () => {
    vi.mocked(fetchTournamentById).mockRejectedValueOnce('oops');

    renderContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  // --- canRegister ---

  test('canRegister is true when primary manager, tournament PLANIFIED, not registered, not full', async () => {
    vi.mocked(fetchTournamentRegistrations).mockResolvedValue(registrations);

    renderContext(createUserWithTeamContext(10, 5));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canRegister).toBe(true);
    });
  });

  test('canRegister is true when second manager', async () => {
    const teamWithSecond = {
      ...team,
      manager: secondManager,
      secondManager: manager,
    };
    vi.mocked(fetchTeamById).mockResolvedValue(teamWithSecond);
    vi.mocked(fetchTournamentRegistrations).mockResolvedValue(registrations);

    renderContext(createUserWithTeamContext(10, 5));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canRegister).toBe(true);
    });
  });

  test('canRegister is false when user is not a manager', async () => {
    renderContext(createUserWithTeamContext(99, 5));

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canRegister).toBe(false);
    });
  });

  test('canRegister is false when tournament is not PLANIFIED', async () => {
    vi.mocked(fetchTournamentById).mockResolvedValue(prepTournament);

    renderContext(createUserWithTeamContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canRegister).toBe(false);
    });
  });

  test('canRegister is false when registration deadline has passed', async () => {
    vi.mocked(fetchTournamentById).mockResolvedValue({
      ...openTournament,
      endInscriptionDate: '2000-01-01',
    });

    renderContext(createUserWithTeamContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canRegister).toBe(false);
    });
  });

  test('canRegister is false when team is already registered', async () => {
    const ownRegistration = [
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        teamId: 5,
        teamName: 'TEAM_ALPHA',
      },
    ];
    vi.mocked(fetchTournamentRegistrations).mockResolvedValue(ownRegistration);

    renderContext(createUserWithTeamContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canRegister).toBe(false);
    });
  });

  test('canRegister is false when tournament is full', async () => {
    const fullRegistrations = [
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        teamId: 11,
        teamName: 'T1',
      },
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        teamId: 12,
        teamName: 'T2',
      },
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        teamId: 13,
        teamName: 'T3',
      },
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        teamId: 14,
        teamName: 'T4',
      },
    ];
    vi.mocked(fetchTournamentRegistrations).mockResolvedValue(
      fullRegistrations,
    );

    renderContext(createUserWithTeamContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canRegister).toBe(false);
    });
  });

  test('canRegister is false when user has no team', async () => {
    renderContext(createUserWithoutTeamContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.canRegister).toBe(false);
    });
  });

  // --- registerTeam ---

  test('registerTeam calls the service and refreshes registrations on success', async () => {
    const newRegistration = {
      tournamentId: 1,
      tournamentName: 'Spring Cup',
      teamId: 5,
      teamName: 'TEAM_ALPHA',
    };
    vi.mocked(registerTeamToTournament).mockResolvedValueOnce(newRegistration);

    const refreshedRegistrations = [
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        teamId: 5,
        teamName: 'TEAM_ALPHA',
      },
    ];
    vi.mocked(fetchTournamentRegistrations)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(refreshedRegistrations);

    renderContext(createUserWithTeamContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.registerTeam();
    });

    expect(registerTeamToTournament).toHaveBeenCalledWith(1, 'user-token');
    await waitFor(() => {
      expect(contextValue?.registrations).toEqual(refreshedRegistrations);
      expect(contextValue?.registerError).toBeNull();
      expect(contextValue?.registerSuccess).toBe(true);
      expect(contextValue?.registering).toBe(false);
    });
  });

  test('registerTeam sets registerError on failure', async () => {
    vi.mocked(registerTeamToTournament).mockRejectedValueOnce(
      new Error(
        "Votre team doit avoir au moins 4 membres pour s'inscrire à un tournoi.",
      ),
    );

    renderContext(createUserWithTeamContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.registerTeam();
    });

    expect(contextValue?.registerError).toBe(
      "Votre team doit avoir au moins 4 membres pour s'inscrire à un tournoi.",
    );
    expect(contextValue?.registerSuccess).toBe(false);
    expect(contextValue?.registering).toBe(false);
  });

  test('registerTeam does nothing when user is not authenticated', async () => {
    renderContext(createAnonymousUserContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.registerTeam();
    });

    expect(registerTeamToTournament).not.toHaveBeenCalled();
  });

  test('clearRegisterError clears the registerError', async () => {
    vi.mocked(registerTeamToTournament).mockRejectedValueOnce(
      new Error('Erreur inscription'),
    );

    renderContext(createUserWithTeamContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.registerTeam();
    });

    expect(contextValue?.registerError).toBe('Erreur inscription');

    act(() => {
      contextValue?.clearRegisterError();
    });

    expect(contextValue?.registerError).toBeNull();
  });

  test('refreshRegistrations updates the registrations list', async () => {
    renderContext(createAnonymousUserContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    const newRegs = [
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        teamId: 5,
        teamName: 'TEAM_ALPHA',
      },
    ];
    vi.mocked(fetchTournamentRegistrations).mockResolvedValueOnce(newRegs);

    await act(async () => {
      await contextValue?.refreshRegistrations();
    });

    expect(contextValue?.registrations).toEqual(newRegs);
  });

  test('refreshRegistrations sets error on failure', async () => {
    renderContext(createAnonymousUserContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    vi.mocked(fetchTournamentRegistrations).mockRejectedValueOnce(
      new Error('Erreur réseau'),
    );

    await act(async () => {
      await contextValue?.refreshRegistrations();
    });

    expect(contextValue?.error).toBe('Erreur réseau');
  });

  // --- handlePublishTournament ---

  test('handlePublishTournament does nothing without token', async () => {
    renderContext(createAnonymousUserContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handlePublishTournament(publishPayload);
    });

    expect(publishTournament).not.toHaveBeenCalled();
  });

  test('publishes tournament, stores success and refreshes data', async () => {
    renderContext(createAdminUserContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handlePublishTournament(publishPayload);
    });

    await waitFor(() => {
      expect(publishTournament).toHaveBeenCalledWith(
        'admin-token',
        1,
        publishPayload,
      );
      expect(contextValue?.success).toBe(
        'Le tournoi a été publié avec succès.',
      );
      expect(contextValue?.actionLoading).toBeNull();
      expect(vi.mocked(fetchTournamentById).mock.calls.length).toBeGreaterThan(
        1,
      );
    });
  });

  test('stores explicit publish errors', async () => {
    vi.mocked(publishTournament).mockRejectedValueOnce(new Error('Erreur 409'));

    renderContext(createAdminUserContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handlePublishTournament(publishPayload);
    });

    await waitFor(() => {
      expect(contextValue?.error).toBe('Erreur 409');
      expect(contextValue?.actionLoading).toBeNull();
    });
  });

  test('stores generic publish errors for unknown thrown values', async () => {
    vi.mocked(publishTournament).mockRejectedValueOnce('unexpected error');

    renderContext(createAdminUserContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handlePublishTournament(publishPayload);
    });

    await waitFor(() => {
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
      expect(contextValue?.actionLoading).toBeNull();
    });
  });

  test('clearError and clearSuccess reset messages', async () => {
    renderContext(createAdminUserContext());

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handlePublishTournament(publishPayload);
    });

    expect(contextValue?.success).toBe('Le tournoi a été publié avec succès.');

    act(() => {
      contextValue?.clearSuccess();
    });

    expect(contextValue?.success).toBeNull();

    vi.mocked(publishTournament).mockRejectedValueOnce(new Error('Erreur 500'));

    await act(async () => {
      await contextValue?.handlePublishTournament(publishPayload);
    });

    expect(contextValue?.error).toBe('Erreur 500');

    act(() => {
      contextValue?.clearError();
    });

    expect(contextValue?.error).toBeNull();
  });
});
