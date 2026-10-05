import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  CreateTournamentPayload,
  PublishTournamentPayload,
  Tournament,
  TournamentContextType,
} from '../types';
import {
  createTournament,
  fetchTournaments,
  fetchTournamentsFiltered,
  publishTournament,
  updateTournament,
  generateSchedule,
} from '../services/tournamentService';
import { fetchTeamById } from '../services/teamService';
import { fetchTeamActivity } from '../services/tournamentRegistrationService';
import { fetchMemberActivity } from '../services/activityService';
import { UserContext } from './UserContext';
import { toLocalDateInputValue } from '../utils/dateUtils';
import { validateTournamentForm } from '../utils/tournamentFormValidation';

const defaultTournamentContext: TournamentContextType = {
  loading: true,
  error: null,
  tournamentList: null,
  filteredTournaments: [],
  helpText: 'Cliquez sur un tournoi pour consulter son détail.',
  isAdmin: false,
  today: '',
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  startInscriptionDate: '',
  endInscriptionDate: '',
  maxTeams: '2',
  submitting: false,
  formError: null,
  formSuccess: null,
  publishing: false,
  publishError: null,
  publishSuccess: null,
  editing: false,
  editError: null,
  editSuccess: null,
  generating: false,
  generateError: null,
  generateSuccess: null,
  refreshTournaments: async () => {},
  setName: () => {},
  setDescription: () => {},
  setStartDate: () => {},
  setEndDate: () => {},
  setStartInscriptionDate: () => {},
  setEndInscriptionDate: () => {},
  setMaxTeams: () => {},
  submitTournamentCreation: async () => {},
  handlePublishTournament: async () => {},
  handleEditTournament: async () => {},
  handleGenerateSchedule: async () => {},
  stateFilter: null,
  yearFilter: null,
  monthFilter: null,
  tournamentNameFilter: '',
  dayOfWeekFilter: null,
  durationFilter: null,
  availabilityFilter: null,
  fromDateFilter: '',
  toDateFilter: '',
  teamNameFilter: '',
  playerTagFilter: '',
  registeredTournamentIds: new Set(),
  participatedTournamentIds: new Set(),
  setStateFilter: () => {},
  setYearFilter: () => {},
  setMonthFilter: () => {},
  setTournamentNameFilter: () => {},
  setDayOfWeekFilter: () => {},
  setDurationFilter: () => {},
  setAvailabilityFilter: () => {},
  setFromDateFilter: () => {},
  setToDateFilter: () => {},
  setTeamNameFilter: () => {},
  setPlayerTagFilter: () => {},
  resetFilters: () => {},
  hasActiveFilters: false,
  isTeamNameDisabled: false,
  isPlayerTagDisabled: false,
  isAvailableOptionDisabled: false,
  isYearIncompatibleWithState: false,
  isMonthIncompatibleWithState: false,
  disabledMonths: new Set<number>(),
};

const TournamentContext = createContext<TournamentContextType>(
  defaultTournamentContext,
);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur inconnue est survenue';
};

const tournamentIncludesDayOfWeek = (
  tournament: Tournament,
  dayOfWeek: number,
): boolean => {
  const start = new Date(tournament.startDate);
  const end = new Date(tournament.endDate);
  const diffDays = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays >= 6) return true;

  for (let i = 0; i <= diffDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    if (date.getDay() === dayOfWeek) {
      return true;
    }
  }

  return false;
};

const TournamentContextProvider = ({ children }: { children: ReactNode }) => {
  const { authenticatedUser, jwtData } = useContext(UserContext);
  const [currentNow, setCurrentNow] = useState(() => new Date());
  const today = useMemo(() => toLocalDateInputValue(currentNow), [currentNow]);
  const isAdmin = Boolean(authenticatedUser && jwtData()?.isAdmin);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentList, setTournamentList] = useState<Tournament[] | null>(
    null,
  );
  const [backendFilteredList, setBackendFilteredList] = useState<
    Tournament[] | null
  >(null);
  const [isManager, setIsManager] = useState(false);
  const [registeredTournamentIds, setRegisteredTournamentIds] = useState<
    Set<number>
  >(new Set());
  const [participatedTournamentIds, setParticipatedTournamentIds] = useState<
    Set<number>
  >(new Set());

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startInscriptionDate, setStartInscriptionDate] = useState(today);
  const [endInscriptionDate, setEndInscriptionDate] = useState('');
  const [maxTeams, setMaxTeams] = useState('2');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);

  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [tournamentNameFilter, setTournamentNameFilter] = useState('');
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState<number | null>(null);
  const [durationFilter, setDurationFilter] = useState<number | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    'available' | 'unavailable' | null
  >(null);
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [teamNameFilter, setTeamNameFilter] = useState('');
  const [playerTagFilter, setPlayerTagFilter] = useState('');

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!formSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFormSuccess(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [formSuccess]);

  useEffect(() => {
    if (!publishSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPublishSuccess(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [publishSuccess]);

  useEffect(() => {
    if (!editSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEditSuccess(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [editSuccess]);

  useEffect(() => {
    if (!generateSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGenerateSuccess(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [generateSuccess]);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setStartInscriptionDate(today);
    setEndInscriptionDate('');
    setMaxTeams('2');
  }, [today]);

  const resetFilters = () => {
    setStateFilter(null);
    setYearFilter(null);
    setMonthFilter(null);
    setTournamentNameFilter('');
    setDayOfWeekFilter(null);
    setDurationFilter(null);
    setAvailabilityFilter(null);
    setFromDateFilter('');
    setToDateFilter('');
    setTeamNameFilter('');
    setPlayerTagFilter('');
    setBackendFilteredList(null);
  };

  const refreshTournaments = useCallback(async () => {
    try {
      const token = isAdmin ? authenticatedUser?.token : undefined;
      const tournaments = await fetchTournaments(token);
      setTournamentList(tournaments);
      setError(null);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError));
    }
  }, [authenticatedUser, isAdmin]);

  const submitTournamentCreation = useCallback(async (): Promise<void> => {
    if (!authenticatedUser?.token || !isAdmin) {
      return;
    }

    const validationError = validateTournamentForm({
      today,
      name,
      description,
      startDate,
      endDate,
      startInscriptionDate,
      endInscriptionDate,
      maxTeams,
    });

    if (validationError) {
      setFormError(validationError);
      setFormSuccess(null);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await createTournament(authenticatedUser.token, {
        name: name.trim(),
        description: description.trim(),
        startDate,
        endDate,
        startInscriptionDate,
        endInscriptionDate,
        maxTeams: Number(maxTeams),
      });
      await refreshTournaments();
      resetForm();
      setFormSuccess('Tournoi créé avec succès.');
    } catch (creationError: unknown) {
      setFormError(
        creationError instanceof Error
          ? creationError.message
          : 'Une erreur est survenue lors de la creation du tournoi.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    authenticatedUser,
    isAdmin,
    today,
    name,
    description,
    startDate,
    endDate,
    startInscriptionDate,
    endInscriptionDate,
    maxTeams,
    refreshTournaments,
    resetForm,
  ]);

  const handlePublishTournament = useCallback(
    async (
      tournamentId: number,
      payload: PublishTournamentPayload,
    ): Promise<void> => {
      if (!authenticatedUser?.token) return;

      setPublishing(true);
      setPublishError(null);
      setPublishSuccess(null);

      try {
        await publishTournament(authenticatedUser.token, tournamentId, payload);
        setPublishSuccess('Tournoi publié avec succès.');
        await refreshTournaments();
      } catch (publishActionError: unknown) {
        setPublishError(
          publishActionError instanceof Error
            ? publishActionError.message
            : 'Une erreur est survenue lors de la publication.',
        );
      } finally {
        setPublishing(false);
      }
    },
    [authenticatedUser, refreshTournaments],
  );

  const handleEditTournament = useCallback(
    async (
      tournament: Tournament,
      payload: CreateTournamentPayload,
    ): Promise<void> => {
      if (!authenticatedUser?.token) return;

      setEditing(true);
      setEditError(null);
      setEditSuccess(null);

      try {
        await updateTournament(authenticatedUser.token, tournament.id, payload);
        setEditSuccess('Tournoi modifié avec succès.');
        await refreshTournaments();
      } catch (editActionError: unknown) {
        setEditError(
          editActionError instanceof Error
            ? editActionError.message
            : 'Une erreur est survenue lors de la modification.',
        );
      } finally {
        setEditing(false);
      }
    },
    [authenticatedUser, refreshTournaments],
  );

  const handleGenerateSchedule = useCallback(
    async (tournamentId: number): Promise<void> => {
      if (!authenticatedUser?.token) return;

      setGenerating(true);
      setGenerateError(null);
      setGenerateSuccess(null);

      try {
        const tournament = tournamentList?.find((t) => t.id === tournamentId);

        if (!tournament) {
          setGenerateError(
            'Tournoi introuvable pour la génération du planning.',
          );
          return;
        }

        const startDate = `${tournament.startDate}T13:00:00`;

        await generateSchedule(authenticatedUser.token, tournamentId, {
          startDate,
          hoursBetweenRounds: 5,
        });
        setGenerateSuccess('Planning généré avec succès.');
        await refreshTournaments();
      } catch (generateActionError: unknown) {
        const errorMessage =
          generateActionError instanceof Error
            ? generateActionError.message
            : 'Une erreur est survenue lors de la génération du planning.';
        setGenerateError(errorMessage);
      } finally {
        setGenerating(false);
      }
    },
    [authenticatedUser, refreshTournaments, tournamentList],
  );

  useEffect(() => {
    const loadTournaments = async () => {
      setLoading(true);
      await refreshTournaments();
      setLoading(false);
    };

    void loadTournaments();
  }, [refreshTournaments]);

  useEffect(() => {
    if (!authenticatedUser?.teamId || !authenticatedUser.token) {
      setIsManager(false);
      return;
    }

    fetchTeamById(authenticatedUser.teamId, authenticatedUser.token)
      .then((team) => {
        setIsManager(
          team.manager?.id === authenticatedUser.id ||
            team.secondManager?.id === authenticatedUser.id,
        );
      })
      .catch(() => setIsManager(false));
  }, [authenticatedUser]);

  useEffect(() => {
    if (!authenticatedUser?.teamId) {
      setRegisteredTournamentIds(new Set());
      return;
    }

    fetchTeamActivity(authenticatedUser.teamId)
      .then((activity) => {
        setRegisteredTournamentIds(
          new Set(activity.map((a) => a.tournamentId)),
        );
      })
      .catch(() => setRegisteredTournamentIds(new Set()));
  }, [authenticatedUser?.teamId]);

  useEffect(() => {
    if (!authenticatedUser?.id || !authenticatedUser.token) {
      setParticipatedTournamentIds(new Set());
      return;
    }

    fetchMemberActivity(authenticatedUser.id, authenticatedUser.token)
      .then((matches) =>
        setParticipatedTournamentIds(
          new Set(matches.map((m) => m.tournamentId)),
        ),
      )
      .catch(() => setParticipatedTournamentIds(new Set()));
  }, [authenticatedUser?.id, authenticatedUser?.token]);

  useEffect(() => {
    const trimmedTeamName = teamNameFilter.trim();
    const trimmedPlayerTag = playerTagFilter.trim();

    if (!trimmedTeamName && !trimmedPlayerTag) {
      setBackendFilteredList(null);
      return;
    }

    const token = isAdmin ? authenticatedUser?.token : undefined;
    const timeoutId = window.setTimeout(() => {
      void fetchTournamentsFiltered(
        {
          teamName: trimmedTeamName || undefined,
          playerTag: trimmedPlayerTag || undefined,
        },
        token,
      )
        .then((data) => setBackendFilteredList(data))
        .catch(() => setBackendFilteredList([]));
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [teamNameFilter, playerTagFilter, authenticatedUser, isAdmin]);

  const filteredTournaments = useMemo(() => {
    const base = backendFilteredList ?? tournamentList ?? [];

    return base.filter((tournament) => {
      if (stateFilter && tournament.state !== stateFilter) return false;

      if (
        tournamentNameFilter.trim() &&
        !tournament.name
          .toLowerCase()
          .includes(tournamentNameFilter.trim().toLowerCase())
      ) {
        return false;
      }

      if (yearFilter !== null) {
        const startYear = new Date(tournament.startDate).getFullYear();
        if (startYear !== yearFilter) return false;
      }

      if (monthFilter !== null) {
        const startMonth = new Date(tournament.startDate).getMonth() + 1;
        const endMonth = new Date(tournament.endDate).getMonth() + 1;
        const startYear = new Date(tournament.startDate).getFullYear();
        const endYear = new Date(tournament.endDate).getFullYear();
        const inRange =
          startYear === endYear
            ? monthFilter >= startMonth && monthFilter <= endMonth
            : monthFilter >= startMonth || monthFilter <= endMonth;
        if (!inRange) return false;
      }

      if (fromDateFilter && tournament.endDate < fromDateFilter) return false;
      if (toDateFilter && tournament.endDate > toDateFilter) return false;

      if (dayOfWeekFilter !== null) {
        if (!tournamentIncludesDayOfWeek(tournament, dayOfWeekFilter)) {
          return false;
        }
      }

      if (durationFilter !== null) {
        const start = new Date(tournament.startDate);
        const end = new Date(tournament.endDate);
        const days =
          Math.round(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1;
        if (days !== durationFilter) return false;
      }

      if (
        availabilityFilter === 'available' &&
        tournament.registrationsCount >= tournament.maxTeams
      ) {
        return false;
      }

      if (
        availabilityFilter === 'unavailable' &&
        tournament.registrationsCount < tournament.maxTeams
      ) {
        return false;
      }

      return true;
    });
  }, [
    availabilityFilter,
    backendFilteredList,
    dayOfWeekFilter,
    durationFilter,
    fromDateFilter,
    monthFilter,
    stateFilter,
    toDateFilter,
    tournamentList,
    tournamentNameFilter,
    yearFilter,
  ]);

  const hasActiveFilters =
    stateFilter !== null ||
    yearFilter !== null ||
    monthFilter !== null ||
    tournamentNameFilter !== '' ||
    dayOfWeekFilter !== null ||
    durationFilter !== null ||
    availabilityFilter !== null ||
    fromDateFilter !== '' ||
    toDateFilter !== '' ||
    teamNameFilter !== '' ||
    playerTagFilter !== '';

  const isTeamNameDisabled = false;
  const isPlayerTagDisabled = false;
  const isAvailableOptionDisabled =
    stateFilter === 'FINISHED' || stateFilter === 'ONGOING';

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const isFutureState =
    stateFilter === 'PLANIFIED' || stateFilter === 'IN_PREPARATION';
  const isPastState = stateFilter === 'FINISHED';
  const isOngoingState = stateFilter === 'ONGOING';

  const isYearIncompatibleWithState =
    yearFilter !== null &&
    ((isPastState && yearFilter > currentYear) ||
      (isFutureState && yearFilter < currentYear) ||
      (isOngoingState && yearFilter !== currentYear));

  const isMonthIncompatibleWithState =
    monthFilter !== null &&
    yearFilter === currentYear &&
    ((isPastState && monthFilter > currentMonth) ||
      (isFutureState && monthFilter < currentMonth) ||
      (isOngoingState && monthFilter > currentMonth));

  const disabledMonths = useMemo(() => {
    if (yearFilter !== currentYear) {
      return new Set<number>();
    }

    const disabled = new Set<number>();
    for (let month = 1; month <= 12; month++) {
      if (
        ((isPastState || isOngoingState) && month > currentMonth) ||
        (isFutureState && month < currentMonth)
      ) {
        disabled.add(month);
      }
    }
    return disabled;
  }, [
    currentMonth,
    currentYear,
    isFutureState,
    isOngoingState,
    isPastState,
    yearFilter,
  ]);

  const helpText = isManager
    ? 'Cliquez sur un tournoi pour consulter son détail et inscrire votre team.'
    : 'Cliquez sur un tournoi pour consulter son détail.';

  const tournamentContextValue: TournamentContextType = {
    loading,
    error,
    tournamentList,
    filteredTournaments,
    helpText,
    isAdmin,
    today,
    name,
    description,
    startDate,
    endDate,
    startInscriptionDate,
    endInscriptionDate,
    maxTeams,
    submitting,
    formError,
    formSuccess,
    publishing,
    publishError,
    publishSuccess,
    editing,
    editError,
    editSuccess,
    generating,
    generateError,
    generateSuccess,
    refreshTournaments,
    setName,
    setDescription,
    setStartDate,
    setEndDate,
    setStartInscriptionDate,
    setEndInscriptionDate,
    setMaxTeams,
    submitTournamentCreation,
    handlePublishTournament,
    handleEditTournament,
    handleGenerateSchedule,
    stateFilter,
    yearFilter,
    monthFilter,
    tournamentNameFilter,
    dayOfWeekFilter,
    durationFilter,
    availabilityFilter,
    fromDateFilter,
    toDateFilter,
    teamNameFilter,
    playerTagFilter,
    registeredTournamentIds,
    participatedTournamentIds,
    setStateFilter,
    setYearFilter,
    setMonthFilter,
    setTournamentNameFilter,
    setDayOfWeekFilter,
    setDurationFilter,
    setAvailabilityFilter,
    setFromDateFilter,
    setToDateFilter,
    setTeamNameFilter,
    setPlayerTagFilter,
    resetFilters,
    hasActiveFilters,
    isTeamNameDisabled,
    isPlayerTagDisabled,
    isAvailableOptionDisabled,
    isYearIncompatibleWithState,
    isMonthIncompatibleWithState,
    disabledMonths,
  };

  return (
    <TournamentContext.Provider value={tournamentContextValue}>
      {children}
    </TournamentContext.Provider>
  );
};

export { TournamentContext, TournamentContextProvider };
