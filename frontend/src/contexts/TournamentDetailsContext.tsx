import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  Tournament,
  TournamentRegistration,
  PublishTournamentPayload,
  TournamentDetailsContextType,
  Team,
} from '../types';
import {
  fetchTournamentById,
  publishTournament,
} from '../services/tournamentService';
import {
  fetchTournamentRegistrations,
  registerTeamToTournament,
} from '../services/tournamentRegistrationService';
import { fetchTeamById } from '../services/teamService';
import { UserContext } from './UserContext';

const defaultTournamentDetailsContext: TournamentDetailsContextType = {
  tournament: null,
  registrations: [],
  loading: true,
  error: null,
  success: null,
  actionLoading: null,
  alreadyRegistered: false,
  canRegister: false,
  registering: false,
  registerError: null,
  registerSuccess: false,
  isAdmin: false,
  currentUserId: undefined,
  refreshRegistrations: async () => {},
  registerTeam: async () => {},
  clearRegisterError: () => {},
  clearError: () => {},
  clearSuccess: () => {},
  handleRefresh: () => {},
  handlePublishTournament: async () => {},
};

const TournamentDetailsContext = createContext<TournamentDetailsContextType>(
  defaultTournamentDetailsContext,
);

/**
 * Gets a message from an error.
 * @param {unknown} error - the error
 * @return {string} the message
 */
const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Une erreur inconnue est survenue';
};

/**
 * Returns today's date as a YYYY-MM-DD string.
 * @return {string} today's date
 */
const getToday = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

/**
 * Provides tournament details, registrations, and related actions to its children.
 * @return {JSX.Element} the provider
 */
const TournamentDetailsContextProvider = ({
  tournamentId,
  children,
}: {
  tournamentId: number;
  children: ReactNode;
}) => {
  const { authenticatedUser, jwtData } = useContext(UserContext);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(
    [],
  );
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  const refreshRegistrations = useCallback(async () => {
    try {
      const regs = await fetchTournamentRegistrations(tournamentId);
      setRegistrations(regs);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError));
    }
  }, [tournamentId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const isAdminUser = Boolean(authenticatedUser && jwtData()?.isAdmin);
        const adminToken = isAdminUser ? authenticatedUser?.token : undefined;
        const t = await fetchTournamentById(tournamentId, adminToken);
        setTournament(t);

        const teamPromise = authenticatedUser?.teamId
          ? fetchTeamById(authenticatedUser.teamId, authenticatedUser.token)
          : Promise.resolve(null);

        const [fetchedTeam, regs] = await Promise.all([
          teamPromise,
          fetchTournamentRegistrations(tournamentId),
        ]);

        if (fetchedTeam) setTeam(fetchedTeam);
        setRegistrations(regs);
        setError(null);
      } catch (fetchError: unknown) {
        const msg = getErrorMessage(fetchError);
        setError(
          msg === 'Erreur 404'
            ? "Ce tournoi n'est pas encore publié ou n'existe pas."
            : msg,
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [tournamentId, authenticatedUser, jwtData, refreshKey]);

  const isManager =
    team !== null &&
    authenticatedUser !== undefined &&
    (team.manager?.id === authenticatedUser.id ||
      team.secondManager?.id === authenticatedUser.id);

  const alreadyRegistered = registrations.some(
    (r) => r.teamId === authenticatedUser?.teamId,
  );

  const isTournamentFull =
    tournament !== null && registrations.length >= tournament.maxTeams;

  const isRegistrationClosed =
    tournament !== null && getToday() > tournament.endInscriptionDate;

  const canRegister =
    isManager &&
    tournament?.state === 'PLANIFIED' &&
    !alreadyRegistered &&
    !isTournamentFull &&
    !isRegistrationClosed;

  const registerTeam = useCallback(async () => {
    if (!authenticatedUser?.token || !tournament) return;

    setRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(false);

    try {
      await registerTeamToTournament(tournamentId, authenticatedUser.token);
      setRegisterSuccess(true);
      await refreshRegistrations();
    } catch (err: unknown) {
      setRegisterError(getErrorMessage(err));
    } finally {
      setRegistering(false);
    }
  }, [authenticatedUser, tournament, tournamentId, refreshRegistrations]);

  const handlePublishTournament = async (
    payload: PublishTournamentPayload,
  ): Promise<void> => {
    if (!tournament?.id || !authenticatedUser?.token) return;

    setActionLoading('publish');
    setError(null);
    setSuccess(null);

    try {
      await publishTournament(authenticatedUser.token, tournament.id, payload);
      setSuccess('Le tournoi a été publié avec succès.');
      handleRefresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const clearRegisterError = () => setRegisterError(null);
  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  const isAdmin = Boolean(jwtData()?.isAdmin);
  const currentUserId = jwtData()?.id;

  const contextValue: TournamentDetailsContextType = {
    tournament,
    registrations,
    loading,
    error,
    success,
    actionLoading,
    alreadyRegistered,
    canRegister,
    registering,
    registerError,
    registerSuccess,
    isAdmin,
    currentUserId,
    refreshRegistrations,
    registerTeam,
    clearRegisterError,
    clearError,
    clearSuccess,
    handleRefresh,
    handlePublishTournament,
  };

  return (
    <TournamentDetailsContext.Provider value={contextValue}>
      {children}
    </TournamentDetailsContext.Provider>
  );
};

export { TournamentDetailsContext, TournamentDetailsContextProvider };
