import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  TournamentContext,
  TournamentContextProvider,
} from './TournamentContext';
import { UserContext } from './UserContext';
import { TournamentContextType, UserContextType } from '../types';
import {
  createTournament,
  fetchTournaments,
  fetchTournamentsFiltered,
  publishTournament,
  updateTournament,
} from '../services/tournamentService';
import { fetchTeamById } from '../services/teamService';
import { fetchTeamActivity } from '../services/tournamentRegistrationService';
import { fetchMemberActivity } from '../services/activityService';

vi.mock('../services/tournamentService', () => ({
  createTournament: vi.fn(),
  fetchTournaments: vi.fn(),
  fetchTournamentsFiltered: vi.fn(),
  publishTournament: vi.fn(),
  updateTournament: vi.fn(),
}));

vi.mock('../services/teamService', () => ({
  fetchTeamById: vi.fn(),
}));

vi.mock('../services/tournamentRegistrationService', () => ({
  fetchTeamActivity: vi.fn(),
}));

vi.mock('../services/activityService', () => ({
  fetchMemberActivity: vi.fn(),
  fetchTeamActivity: vi.fn(),
  fetchPastTeams: vi.fn(),
}));

describe('TournamentContext', () => {
  const tournaments = [
    {
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
    },
  ];

  const userTeam = {
    id: 99,
    name: 'MY_TEAM',
    manager: {
      id: 1,
      email: 'manager@test.com',
      tag: 'Manager',
      speciality: '',
      profilePicture: '',
      date: '',
    },
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  };

  let contextValue: TournamentContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(TournamentContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(TournamentContext);
    return null;
  };

  const createAnonymousUserContext = (): UserContextType => ({
    authenticatedUser: undefined,
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue(null),
    refreshUser: vi.fn(),
  });

  const createAdminUserContext = (): UserContextType => ({
    authenticatedUser: {
      id: 1,
      email: 'admin@mail.com',
      tag: 'admin',
      token: 'admin-token',
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 1, email: 'admin@mail.com', isAdmin: true }),
    refreshUser: vi.fn(),
  });

  const createNonAdminUserContext = (): UserContextType => ({
    authenticatedUser: {
      id: 2,
      email: 'user@mail.com',
      tag: 'user',
      token: 'user-token',
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 2, email: 'user@mail.com', isAdmin: false }),
    refreshUser: vi.fn(),
  });

  const createManagerUserContext = (): UserContextType => ({
    authenticatedUser: {
      id: 1,
      email: 'manager@test.com',
      tag: 'Manager',
      token: 'test-token',
      teamId: 99,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 1, email: 'manager@test.com', isAdmin: false }),
    refreshUser: vi.fn(),
  });

  const renderTournamentContext = (userCtx = createAnonymousUserContext()) =>
    render(
      <UserContext.Provider value={userCtx}>
        <TournamentContextProvider>
          <ContextConsumer />
        </TournamentContextProvider>
      </UserContext.Provider>,
    );

  const setValidCreationFormValues = () => {
    act(() => {
      contextValue?.setName('New Tournament');
      contextValue?.setDescription('Description test');
      contextValue?.setStartDate('2099-04-10');
      contextValue?.setEndDate('2099-04-12');
      contextValue?.setStartInscriptionDate('2099-03-01');
      contextValue?.setEndInscriptionDate('2099-03-31');
      contextValue?.setMaxTeams('16');
    });
  };

  const planifiedTournament = {
    id: 2,
    name: 'Summer Clash',
    description: "Tournoi de l'été",
    state: 'PLANIFIED',
    stateDisplayName: 'Planifié',
    startDate: '2026-07-04',
    endDate: '2026-07-04',
    startInscriptionDate: '2026-06-01',
    endInscriptionDate: '2026-06-30',
    maxTeams: 8,
    registrationsCount: 8,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(createTournament).mockResolvedValue(tournaments[0]);
    vi.mocked(fetchTournaments).mockResolvedValue(tournaments);
    vi.mocked(fetchTeamById).mockResolvedValue(userTeam);
    vi.mocked(fetchTeamActivity).mockResolvedValue([]);
    vi.mocked(fetchTournamentsFiltered).mockResolvedValue([]);
    vi.mocked(fetchMemberActivity).mockResolvedValue([]);
    vi.mocked(publishTournament).mockResolvedValue({
      ...tournaments[0],
      state: 'PLANIFIED',
      stateDisplayName: 'Planifié',
    });
    vi.mocked(updateTournament).mockResolvedValue(tournaments[0]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('exposes harmless default values without a provider', async () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.tournamentList).toBeNull();
    expect(contextValue?.helpText).toBe(
      'Cliquez sur un tournoi pour consulter son détail.',
    );
    expect(contextValue?.isAdmin).toBe(false);
    expect(contextValue?.today).toBe('');
    expect(contextValue?.name).toBe('');
    expect(contextValue?.submitting).toBe(false);
    expect(contextValue?.publishing).toBe(false);
    expect(contextValue?.editing).toBe(false);

    await expect(
      contextValue?.refreshTournaments() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.submitTournamentCreation() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handlePublishTournament(1, {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        startInscriptionDate: '',
        endInscriptionDate: '',
        maxTeams: 2,
        state: 'PLANIFIED',
      }) ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handleEditTournament(
        {
          id: 1,
          name: '',
          description: '',
          state: 'IN_PREPARATION',
          stateDisplayName: '',
          startDate: '',
          endDate: '',
          startInscriptionDate: '',
          endInscriptionDate: '',
          maxTeams: 2,
          registrationsCount: 0,
        },
        {
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          startInscriptionDate: '',
          endInscriptionDate: '',
          maxTeams: 2,
        },
      ) ?? Promise.resolve(),
    ).resolves.toBeUndefined();

    expect(() => {
      contextValue?.setName('Test');
      contextValue?.setDescription('Description');
      contextValue?.setStartDate('2026-01-01');
      contextValue?.setEndDate('2026-01-02');
      contextValue?.setStartInscriptionDate('2026-01-01');
      contextValue?.setEndInscriptionDate('2026-01-01');
      contextValue?.setMaxTeams('8');
      contextValue?.setStateFilter('PLANIFIED');
      contextValue?.setYearFilter(2026);
      contextValue?.setMonthFilter(4);
      contextValue?.setTournamentNameFilter('Test');
      contextValue?.setDayOfWeekFilter(1);
      contextValue?.setDurationFilter(3);
      contextValue?.setAvailabilityFilter('available');
      contextValue?.setFromDateFilter('2026-01-01');
      contextValue?.setToDateFilter('2026-12-31');
      contextValue?.setTeamNameFilter('Alpha');
      contextValue?.setPlayerTagFilter('Flash');
      contextValue?.resetFilters();
    }).not.toThrow();
  });

  test('loads tournaments on mount without requiring an authenticated user', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchTournaments).toHaveBeenCalledWith(undefined);
  });

  test('passes the admin token when user is an admin', async () => {
    renderTournamentContext(createAdminUserContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchTournaments).toHaveBeenCalledWith('admin-token');
  });

  test('does not pass a token when authenticated user is not an admin', async () => {
    renderTournamentContext(createNonAdminUserContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(fetchTournaments).toHaveBeenCalledWith(undefined);
  });

  test('stores tournaments when the service succeeds', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.tournamentList).toEqual(tournaments);
      expect(contextValue?.error).toBeNull();
    });
  });

  test('stores an explicit error message when loading fails', async () => {
    vi.mocked(fetchTournaments).mockRejectedValueOnce(
      new Error('Chargement impossible'),
    );

    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Chargement impossible');
    });
  });

  test('stores the fallback error message when loading fails with an unknown value', async () => {
    vi.mocked(fetchTournaments).mockRejectedValueOnce('unknown error');

    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  test('refreshTournaments reloads the tournaments list', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.tournamentList).toEqual(tournaments);
    });

    const refreshedTournaments = [
      ...tournaments,
      {
        id: 2,
        name: 'Summer Clash',
        description: "Tournoi de l'été",
        state: 'PLANIFIED',
        stateDisplayName: 'Planifié',
        startDate: '2026-07-10',
        endDate: '2026-07-12',
        startInscriptionDate: '2026-06-01',
        endInscriptionDate: '2026-06-30',
        maxTeams: 32,
        registrationsCount: 0,
      },
    ];

    vi.mocked(fetchTournaments).mockResolvedValueOnce(refreshedTournaments);

    await act(async () => {
      await contextValue?.refreshTournaments();
    });

    await waitFor(() => {
      expect(contextValue?.tournamentList).toEqual(refreshedTournaments);
    });

    expect(fetchTournaments).toHaveBeenCalledTimes(2);
  });

  test('helpText is the basic text when user has no team', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.helpText).toBe(
        'Cliquez sur un tournoi pour consulter son détail.',
      );
    });
  });

  test('helpText is the extended text when user is the team manager', async () => {
    renderTournamentContext(createManagerUserContext());

    await waitFor(() => {
      expect(contextValue?.helpText).toBe(
        'Cliquez sur un tournoi pour consulter son détail et inscrire votre team.',
      );
    });
  });

  test('helpText is the extended text when user is the second manager', async () => {
    vi.mocked(fetchTeamById).mockResolvedValue({
      ...userTeam,
      manager: {
        id: 99,
        email: 'other@test.com',
        tag: 'Other',
        speciality: '',
        profilePicture: '',
        date: '',
      },
      secondManager: {
        id: 1,
        email: 'manager@test.com',
        tag: 'Manager',
        speciality: '',
        profilePicture: '',
        date: '',
      },
    });

    renderTournamentContext(createManagerUserContext());

    await waitFor(() => {
      expect(contextValue?.helpText).toBe(
        'Cliquez sur un tournoi pour consulter son détail et inscrire votre team.',
      );
    });
  });

  test('helpText is the basic text when user is not the team manager', async () => {
    vi.mocked(fetchTeamById).mockResolvedValue({
      ...userTeam,
      manager: {
        id: 99,
        email: 'other@test.com',
        tag: 'Other',
        speciality: '',
        profilePicture: '',
        date: '',
      },
      secondManager: null,
    });

    renderTournamentContext(createManagerUserContext());

    await waitFor(() => {
      expect(contextValue?.helpText).toBe(
        'Cliquez sur un tournoi pour consulter son détail.',
      );
    });
  });

  test('helpText is the basic text when fetchTeamById fails', async () => {
    vi.mocked(fetchTeamById).mockRejectedValueOnce(new Error('Erreur réseau'));

    renderTournamentContext(createManagerUserContext());

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.helpText).toBe(
        'Cliquez sur un tournoi pour consulter son détail.',
      );
    });
  });

  test('filteredTournaments equals tournamentList when no filter is active', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.filteredTournaments).toEqual(tournaments);
    });
  });

  test('setStateFilter keeps only tournaments matching the given state', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([
      tournaments[0],
      planifiedTournament,
    ]);

    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setStateFilter('PLANIFIED');
    });

    expect(contextValue?.filteredTournaments).toHaveLength(1);
    expect(contextValue?.filteredTournaments[0].name).toBe('Summer Clash');
  });

  test('setTournamentNameFilter keeps only tournaments whose name matches', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([
      tournaments[0],
      planifiedTournament,
    ]);

    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setTournamentNameFilter('spring');
    });

    expect(contextValue?.filteredTournaments).toHaveLength(1);
    expect(contextValue?.filteredTournaments[0].name).toBe('Spring Clash');
  });

  test('setYearFilter keeps only tournaments starting in that year', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([
      tournaments[0],
      planifiedTournament,
    ]);

    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setYearFilter(2026);
    });

    expect(contextValue?.filteredTournaments).toHaveLength(2);

    act(() => {
      contextValue?.setYearFilter(2099);
    });

    expect(contextValue?.filteredTournaments).toHaveLength(0);
  });

  test('setMonthFilter keeps only tournaments starting in that month', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([
      tournaments[0],
      planifiedTournament,
    ]);

    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setMonthFilter(7);
    });

    expect(contextValue?.filteredTournaments).toHaveLength(1);
    expect(contextValue?.filteredTournaments[0].name).toBe('Summer Clash');
  });

  test('hasActiveFilters is false by default and true when a filter is set', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(contextValue?.hasActiveFilters).toBe(false);

    act(() => {
      contextValue?.setStateFilter('PLANIFIED');
    });

    expect(contextValue?.hasActiveFilters).toBe(true);
  });

  test('isPlayerTagDisabled is always false regardless of teamNameFilter', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(contextValue?.isPlayerTagDisabled).toBe(false);

    act(() => {
      contextValue?.setTeamNameFilter('TEAM_ALPHA');
    });

    expect(contextValue?.isPlayerTagDisabled).toBe(false);
  });

  test('isTeamNameDisabled is always false regardless of playerTagFilter', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(contextValue?.isTeamNameDisabled).toBe(false);

    act(() => {
      contextValue?.setPlayerTagFilter('Flash');
    });

    expect(contextValue?.isTeamNameDisabled).toBe(false);
  });

  test('isAvailableOptionDisabled is true when stateFilter is FINISHED', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    expect(contextValue?.isAvailableOptionDisabled).toBe(false);

    act(() => {
      contextValue?.setStateFilter('FINISHED');
    });

    expect(contextValue?.isAvailableOptionDisabled).toBe(true);
  });

  test('isYearIncompatibleWithState is true when FINISHED and year is in the future', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('FINISHED');
      contextValue?.setYearFilter(new Date().getFullYear() + 1);
    });

    expect(contextValue?.isYearIncompatibleWithState).toBe(true);
  });

  test('isYearIncompatibleWithState is true when PLANIFIED and year is in the past', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('PLANIFIED');
      contextValue?.setYearFilter(new Date().getFullYear() - 1);
    });

    expect(contextValue?.isYearIncompatibleWithState).toBe(true);
  });

  test('isYearIncompatibleWithState is true when IN_PREPARATION and year is in the past', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('IN_PREPARATION');
      contextValue?.setYearFilter(new Date().getFullYear() - 1);
    });

    expect(contextValue?.isYearIncompatibleWithState).toBe(true);
  });

  test('isYearIncompatibleWithState is false when no state or compatible year', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setYearFilter(new Date().getFullYear());
    });

    expect(contextValue?.isYearIncompatibleWithState).toBe(false);
  });

  test('isMonthIncompatibleWithState is true when FINISHED and month is in the future this year', async () => {
    const currentMonth = new Date().getMonth() + 1;
    const futureMonth = currentMonth === 12 ? null : currentMonth + 1;
    if (futureMonth === null) return;

    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('FINISHED');
      contextValue?.setYearFilter(new Date().getFullYear());
      contextValue?.setMonthFilter(futureMonth);
    });

    expect(contextValue?.isMonthIncompatibleWithState).toBe(true);
  });

  test('isMonthIncompatibleWithState is true when PLANIFIED and month is in the past this year', async () => {
    const currentMonth = new Date().getMonth() + 1;
    const pastMonth = currentMonth === 1 ? null : currentMonth - 1;
    if (pastMonth === null) return;

    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('PLANIFIED');
      contextValue?.setYearFilter(new Date().getFullYear());
      contextValue?.setMonthFilter(pastMonth);
    });

    expect(contextValue?.isMonthIncompatibleWithState).toBe(true);
  });

  test('isMonthIncompatibleWithState is false when year differs from current year', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('FINISHED');
      contextValue?.setYearFilter(new Date().getFullYear() - 1);
      contextValue?.setMonthFilter(12);
    });

    expect(contextValue?.isMonthIncompatibleWithState).toBe(false);
  });

  test('disabledMonths contains future months when FINISHED and yearFilter is current year', async () => {
    const currentMonth = new Date().getMonth() + 1;
    const futureMonth = currentMonth === 12 ? null : currentMonth + 1;
    if (futureMonth === null) return;

    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('FINISHED');
      contextValue?.setYearFilter(new Date().getFullYear());
    });

    expect(contextValue?.disabledMonths.has(futureMonth)).toBe(true);
  });

  test('disabledMonths is empty when yearFilter differs from current year', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('FINISHED');
      contextValue?.setYearFilter(new Date().getFullYear() - 1);
    });

    expect(contextValue?.disabledMonths.size).toBe(0);
  });

  test('isYearIncompatibleWithState is true when ONGOING and year is in the future', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('ONGOING');
      contextValue?.setYearFilter(new Date().getFullYear() + 1);
    });

    expect(contextValue?.isYearIncompatibleWithState).toBe(true);
  });

  test('isYearIncompatibleWithState is true when ONGOING and year is in the past', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('ONGOING');
      contextValue?.setYearFilter(new Date().getFullYear() - 1);
    });

    expect(contextValue?.isYearIncompatibleWithState).toBe(true);
  });

  test('isMonthIncompatibleWithState is true when ONGOING and month is in the future this year', async () => {
    const currentMonth = new Date().getMonth() + 1;
    const futureMonth = currentMonth === 12 ? null : currentMonth + 1;
    if (futureMonth === null) return;

    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStateFilter('ONGOING');
      contextValue?.setYearFilter(new Date().getFullYear());
      contextValue?.setMonthFilter(futureMonth);
    });

    expect(contextValue?.isMonthIncompatibleWithState).toBe(true);
  });

  test('isAvailableOptionDisabled is true when stateFilter is ONGOING', async () => {
    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setStateFilter('ONGOING');
    });

    expect(contextValue?.isAvailableOptionDisabled).toBe(true);
  });

  test('resetFilters clears all filters and restores the full list', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([
      tournaments[0],
      planifiedTournament,
    ]);

    renderTournamentContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });

    act(() => {
      contextValue?.setStateFilter('PLANIFIED');
      contextValue?.setTournamentNameFilter('Summer');
    });

    expect(contextValue?.hasActiveFilters).toBe(true);

    act(() => {
      contextValue?.resetFilters();
    });

    expect(contextValue?.hasActiveFilters).toBe(false);
    expect(contextValue?.stateFilter).toBeNull();
    expect(contextValue?.tournamentNameFilter).toBe('');
    expect(contextValue?.filteredTournaments).toHaveLength(2);
  });

  test('setDayOfWeekFilter keeps only tournaments that include that day', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([tournaments[0]]);
    renderTournamentContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setDayOfWeekFilter(5);
    });
    expect(contextValue?.filteredTournaments).toHaveLength(1);

    act(() => {
      contextValue?.setDayOfWeekFilter(1);
    });
    expect(contextValue?.filteredTournaments).toHaveLength(0);
  });

  test('tournamentIncludesDayOfWeek returns true for any day when tournament spans 7+ days', async () => {
    const longTournament = {
      ...tournaments[0],
      id: 10,
      startDate: '2026-04-01',
      endDate: '2026-04-08',
    };
    vi.mocked(fetchTournaments).mockResolvedValue([longTournament]);
    renderTournamentContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setDayOfWeekFilter(3);
    });
    expect(contextValue?.filteredTournaments).toHaveLength(1);
  });

  test('setDurationFilter keeps only tournaments with matching duration', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([tournaments[0]]);
    renderTournamentContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setDurationFilter(3);
    });
    expect(contextValue?.filteredTournaments).toHaveLength(1);

    act(() => {
      contextValue?.setDurationFilter(1);
    });
    expect(contextValue?.filteredTournaments).toHaveLength(0);
  });

  test('setAvailabilityFilter available hides full tournaments', async () => {
    const fullTournament = {
      ...planifiedTournament,
      registrationsCount: 8,
      maxTeams: 8,
    };
    vi.mocked(fetchTournaments).mockResolvedValue([
      tournaments[0],
      fullTournament,
    ]);
    renderTournamentContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setAvailabilityFilter('available');
    });
    expect(
      contextValue?.filteredTournaments.every(
        (t) => t.registrationsCount < t.maxTeams,
      ),
    ).toBe(true);
  });

  test('setAvailabilityFilter unavailable keeps only full tournaments', async () => {
    const fullTournament = {
      ...planifiedTournament,
      registrationsCount: 8,
      maxTeams: 8,
    };
    vi.mocked(fetchTournaments).mockResolvedValue([
      tournaments[0],
      fullTournament,
    ]);
    renderTournamentContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setAvailabilityFilter('unavailable');
    });
    expect(
      contextValue?.filteredTournaments.every(
        (t) => t.registrationsCount >= t.maxTeams,
      ),
    ).toBe(true);
  });

  test('setFromDateFilter excludes tournaments ending before the from date', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([tournaments[0]]);
    renderTournamentContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setFromDateFilter('2026-04-13');
    });
    expect(contextValue?.filteredTournaments).toHaveLength(0);

    act(() => {
      contextValue?.setFromDateFilter('2026-04-12');
    });
    expect(contextValue?.filteredTournaments).toHaveLength(1);
  });

  test('setToDateFilter excludes tournaments ending after the to date', async () => {
    vi.mocked(fetchTournaments).mockResolvedValue([tournaments[0]]);
    renderTournamentContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setToDateFilter('2026-04-11');
    });
    expect(contextValue?.filteredTournaments).toHaveLength(0);

    act(() => {
      contextValue?.setToDateFilter('2026-04-12');
    });
    expect(contextValue?.filteredTournaments).toHaveLength(1);
  });

  test('setMonthFilter handles cross-year tournament range', async () => {
    const crossYearTournament = {
      ...tournaments[0],
      id: 11,
      startDate: '2026-11-01',
      endDate: '2027-01-31',
    };
    vi.mocked(fetchTournaments).mockResolvedValue([crossYearTournament]);
    renderTournamentContext();

    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setMonthFilter(1);
    });
    expect(contextValue?.filteredTournaments).toHaveLength(1);

    act(() => {
      contextValue?.setMonthFilter(6);
    });
    expect(contextValue?.filteredTournaments).toHaveLength(0);
  });

  test('playerTagFilter triggers fetchTournamentsFiltered with playerTag after debounce', async () => {
    const filtered = [{ ...tournaments[0], name: 'Flash Cup' }];
    vi.mocked(fetchTournamentsFiltered).mockResolvedValue(filtered);

    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    vi.useFakeTimers();

    act(() => {
      contextValue?.setPlayerTagFilter('Flash');
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    vi.useRealTimers();

    expect(fetchTournamentsFiltered).toHaveBeenCalledWith(
      { playerTag: 'Flash' },
      undefined,
    );
  });

  test('teamNameFilter passes admin token to fetchTournamentsFiltered', async () => {
    vi.mocked(fetchTournamentsFiltered).mockResolvedValue([]);

    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    vi.useFakeTimers();

    act(() => {
      contextValue?.setTeamNameFilter('Alpha');
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    vi.useRealTimers();

    expect(fetchTournamentsFiltered).toHaveBeenCalledWith(
      { teamName: 'Alpha' },
      'admin-token',
    );
  });

  test('teamNameFilter triggers fetchTournamentsFiltered after debounce', async () => {
    const filtered = [{ ...tournaments[0], name: 'Alpha Cup' }];
    vi.mocked(fetchTournamentsFiltered).mockResolvedValue(filtered);

    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    vi.useFakeTimers();

    act(() => {
      contextValue?.setTeamNameFilter('Alpha');
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    vi.useRealTimers();

    expect(fetchTournamentsFiltered).toHaveBeenCalledWith(
      { teamName: 'Alpha' },
      undefined,
    );
  });

  test('registeredTournamentIds is populated from team activity', async () => {
    vi.mocked(fetchTeamActivity).mockResolvedValue([
      {
        tournamentId: 1,
        tournamentName: 'Spring Clash',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
      },
    ]);

    renderTournamentContext(createManagerUserContext());

    await waitFor(() => {
      expect(contextValue?.registeredTournamentIds.has(1)).toBe(true);
    });
  });

  test('participatedTournamentIds is populated from member activity', async () => {
    vi.mocked(fetchMemberActivity).mockResolvedValue([
      {
        tournamentId: 1,
        tournamentName: 'Spring Clash',
        round: 1,
        totalRounds: 4,
        matchId: 10,
        selectedTeamId: 99,
        team1Id: 99,
        team1Name: 'MY_TEAM',
        team2Id: 50,
        team2Name: 'OPP',
        winnerTeamId: 99,
        state: 'ENDED',
      },
    ]);

    renderTournamentContext(createManagerUserContext());

    await waitFor(() => {
      expect(contextValue?.participatedTournamentIds.has(1)).toBe(true);
    });
  });

  test('participatedTournamentIds is empty when user is not authenticated', async () => {
    renderTournamentContext(createAnonymousUserContext());

    await waitFor(() => {
      expect(contextValue?.participatedTournamentIds.size).toBe(0);
    });
  });

  test('participatedTournamentIds is empty when fetchMemberActivity fails', async () => {
    vi.mocked(fetchMemberActivity).mockRejectedValue(
      new Error('network error'),
    );

    renderTournamentContext(createManagerUserContext());

    await waitFor(() => {
      expect(contextValue?.participatedTournamentIds.size).toBe(0);
    });
  });

  test('submitTournamentCreation validates, creates the tournament and clears success after timeout', async () => {
    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    vi.useFakeTimers();

    setValidCreationFormValues();

    await act(async () => {
      await contextValue?.submitTournamentCreation();
    });

    expect(createTournament).toHaveBeenCalledWith('admin-token', {
      name: 'New Tournament',
      description: 'Description test',
      startDate: '2099-04-10',
      endDate: '2099-04-12',
      startInscriptionDate: '2099-03-01',
      endInscriptionDate: '2099-03-31',
      maxTeams: 16,
    });
    expect(contextValue?.formSuccess).toBe('Tournoi créé avec succès.');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(contextValue?.formSuccess).toBeNull();
    vi.useRealTimers();
  });

  test('submitTournamentCreation does nothing without an authenticated token', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    setValidCreationFormValues();

    await act(async () => {
      await contextValue?.submitTournamentCreation();
    });

    expect(createTournament).not.toHaveBeenCalled();
    expect(contextValue?.submitting).toBe(false);
  });

  test('submitTournamentCreation does nothing when the user is not admin', async () => {
    renderTournamentContext(createNonAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    setValidCreationFormValues();

    await act(async () => {
      await contextValue?.submitTournamentCreation();
    });

    expect(createTournament).not.toHaveBeenCalled();
    expect(contextValue?.submitting).toBe(false);
  });

  test('submitTournamentCreation stores validation errors and skips the service call', async () => {
    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setName('   ');
      contextValue?.setDescription('Description test');
      contextValue?.setStartDate('2099-04-10');
      contextValue?.setEndDate('2099-04-12');
      contextValue?.setStartInscriptionDate('2099-03-01');
      contextValue?.setEndInscriptionDate('2099-03-31');
      contextValue?.setMaxTeams('16');
    });

    await act(async () => {
      await contextValue?.submitTournamentCreation();
    });

    expect(contextValue?.formError).toBe('Tous les champs sont requis.');
    expect(contextValue?.formSuccess).toBeNull();
    expect(createTournament).not.toHaveBeenCalled();
  });

  test('submitTournamentCreation exposes the fallback message for unknown errors', async () => {
    vi.mocked(createTournament).mockRejectedValueOnce('unknown error');

    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    setValidCreationFormValues();

    await act(async () => {
      await contextValue?.submitTournamentCreation();
    });

    expect(contextValue?.formError).toBe(
      'Une erreur est survenue lors de la creation du tournoi.',
    );
  });

  test('submitTournamentCreation exposes the Error message when the service throws an Error instance', async () => {
    vi.mocked(createTournament).mockRejectedValueOnce(
      new Error('Creation failed'),
    );

    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    setValidCreationFormValues();

    await act(async () => {
      await contextValue?.submitTournamentCreation();
    });

    expect(contextValue?.formError).toBe('Creation failed');
  });

  test('handlePublishTournament updates the tournament and clears success after timeout', async () => {
    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    vi.useFakeTimers();

    await act(async () => {
      await contextValue?.handlePublishTournament(1, {
        name: 'Spring Clash',
        description: 'Tournoi du printemps',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
        state: 'PLANIFIED',
      });
    });

    expect(publishTournament).toHaveBeenCalledWith('admin-token', 1, {
      name: 'Spring Clash',
      description: 'Tournoi du printemps',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-01',
      endInscriptionDate: '2026-03-31',
      maxTeams: 16,
      state: 'PLANIFIED',
    });
    expect(fetchTournaments).toHaveBeenCalledTimes(2);
    expect(contextValue?.publishSuccess).toBe('Tournoi publié avec succès.');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(contextValue?.publishSuccess).toBeNull();
    vi.useRealTimers();
  });

  test('handlePublishTournament exposes service errors', async () => {
    vi.mocked(publishTournament).mockRejectedValueOnce(new Error('Erreur 409'));

    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handlePublishTournament(1, {
        name: 'Spring Clash',
        description: 'Tournoi du printemps',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
        state: 'PLANIFIED',
      });
    });

    expect(contextValue?.publishError).toBe('Erreur 409');
  });

  test('handlePublishTournament exposes the fallback error for unknown values', async () => {
    vi.mocked(publishTournament).mockRejectedValueOnce('unknown error');

    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handlePublishTournament(1, {
        name: 'Spring Clash',
        description: 'Tournoi du printemps',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
        state: 'PLANIFIED',
      });
    });

    expect(contextValue?.publishError).toBe(
      'Une erreur est survenue lors de la publication.',
    );
  });

  test('handleEditTournament updates the tournament and clears success after timeout', async () => {
    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    vi.useFakeTimers();

    await act(async () => {
      await contextValue?.handleEditTournament(tournaments[0], {
        name: 'Spring Clash Updated',
        description: 'Tournoi mis a jour',
        startDate: '2099-04-10',
        endDate: '2099-04-12',
        startInscriptionDate: '2099-03-01',
        endInscriptionDate: '2099-03-31',
        maxTeams: 32,
      });
    });

    expect(updateTournament).toHaveBeenCalledWith('admin-token', 1, {
      name: 'Spring Clash Updated',
      description: 'Tournoi mis a jour',
      startDate: '2099-04-10',
      endDate: '2099-04-12',
      startInscriptionDate: '2099-03-01',
      endInscriptionDate: '2099-03-31',
      maxTeams: 32,
    });
    expect(contextValue?.editSuccess).toBe('Tournoi modifié avec succès.');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(contextValue?.editSuccess).toBeNull();
    vi.useRealTimers();
  });

  test('handleEditTournament exposes the fallback error for unknown values', async () => {
    vi.mocked(updateTournament).mockRejectedValueOnce('unknown error');

    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleEditTournament(tournaments[0], {
        name: 'Spring Clash Updated',
        description: 'Tournoi mis a jour',
        startDate: '2099-04-10',
        endDate: '2099-04-12',
        startInscriptionDate: '2099-03-01',
        endInscriptionDate: '2099-03-31',
        maxTeams: 32,
      });
    });

    expect(contextValue?.editError).toBe(
      'Une erreur est survenue lors de la modification.',
    );
  });

  test('handleEditTournament exposes the Error message when the service throws an Error instance', async () => {
    vi.mocked(updateTournament).mockRejectedValueOnce(new Error('Edit failed'));

    renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleEditTournament(tournaments[0], {
        name: 'Spring Clash Updated',
        description: 'Tournoi mis a jour',
        startDate: '2099-04-10',
        endDate: '2099-04-12',
        startInscriptionDate: '2099-03-01',
        endInscriptionDate: '2099-03-31',
        maxTeams: 32,
      });
    });

    expect(contextValue?.editError).toBe('Edit failed');
  });

  test('handlePublishTournament and handleEditTournament do nothing without a token', async () => {
    renderTournamentContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handlePublishTournament(1, {
        name: 'Spring Clash',
        description: 'Tournoi du printemps',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
        state: 'PLANIFIED',
      });
      await contextValue?.handleEditTournament(tournaments[0], {
        name: 'Spring Clash Updated',
        description: 'Tournoi mis a jour',
        startDate: '2099-04-10',
        endDate: '2099-04-12',
        startInscriptionDate: '2099-03-01',
        endInscriptionDate: '2099-03-31',
        maxTeams: 32,
      });
    });

    expect(publishTournament).not.toHaveBeenCalled();
    expect(updateTournament).not.toHaveBeenCalled();
    expect(contextValue?.publishing).toBe(false);
    expect(contextValue?.editing).toBe(false);
  });

  test('clears the creation success timeout on unmount', async () => {
    const { unmount } = renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    setValidCreationFormValues();

    await act(async () => {
      await contextValue?.submitTournamentCreation();
    });

    clearTimeoutSpy.mockClear();
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  test('clears the publish success timeout on unmount', async () => {
    const { unmount } = renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    await act(async () => {
      await contextValue?.handlePublishTournament(1, {
        name: 'Spring Clash',
        description: 'Tournoi du printemps',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
        state: 'PLANIFIED',
      });
    });

    clearTimeoutSpy.mockClear();
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  test('clears the edit success timeout on unmount', async () => {
    const { unmount } = renderTournamentContext(createAdminUserContext());
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    await act(async () => {
      await contextValue?.handleEditTournament(tournaments[0], {
        name: 'Spring Clash Updated',
        description: 'Tournoi mis a jour',
        startDate: '2099-04-10',
        endDate: '2099-04-12',
        startInscriptionDate: '2099-03-01',
        endInscriptionDate: '2099-03-31',
        maxTeams: 32,
      });
    });

    clearTimeoutSpy.mockClear();
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });
});
