import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  Team,
  TeamMembership,
  TeamsListContextType,
  UserContextType,
} from '../types';
import { UserContext } from './UserContext';
import { fetchAllTeams, createTeam } from '../services/teamService';
import {
  fetchCurrentMembership,
  joinTeam,
} from '../services/teamMembershipService';

const defaultTeamsListContext: TeamsListContextType = {
  teams: [],
  sortedTeams: [],
  currentTeamId: undefined,
  currentMembership: null,
  loading: true,
  error: null,
  createError: null,
  joinError: null,
  newTeamName: '',
  acceptManagerRole: false,
  creating: false,
  showJoinColumn: false,
  helpText: 'Cliquez sur une team pour consulter ses membres.',
  setNewTeamName: () => {},
  setAcceptManagerRole: () => {},
  clearError: () => {},
  clearCreateError: () => {},
  clearJoinError: () => {},
  handleCreateTeam: async () => {},
  handleJoinTeam: async () => {},
};

const TeamsListContext = createContext<TeamsListContextType>(
  defaultTeamsListContext,
);

/**
 * Gets a message from an error.
 * @param {unknown} error - the error
 * @return {string} the message
 */
const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur inconnue est survenue';
};

/**
 * Provides the list of teams, current membership, and team actions to its children.
 * @return {JSX.Element} the provider
 */
const TeamsListContextProvider = ({ children }: { children: ReactNode }) => {
  const { authenticatedUser, setAuthenticatedUser } =
    useContext<UserContextType>(UserContext);

  const [teams, setTeams] = useState<Team[]>([]);
  const [currentMembership, setCurrentMembership] =
    useState<TeamMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [acceptManagerRole, setAcceptManagerRole] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      setError(null);

      try {
        const [teamsData, membershipData] = await Promise.all([
          fetchAllTeams(),
          authenticatedUser
            ? fetchCurrentMembership(authenticatedUser.token)
            : Promise.resolve(null),
        ]);

        setTeams(teamsData);
        setCurrentMembership(membershipData);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticatedUser?.token]);

  const handleCreateTeam = async () => {
    if (!authenticatedUser || !newTeamName.trim() || !acceptManagerRole) return;

    setCreating(true);
    setCreateError(null);

    try {
      const createdTeam = await createTeam(
        authenticatedUser.token,
        newTeamName,
      );

      if (setAuthenticatedUser) {
        setAuthenticatedUser({ ...authenticatedUser, teamId: createdTeam.id });
      }
      setCurrentMembership(null);
      setTeams((prev) => [...prev, createdTeam]);
      setNewTeamName('');
      setAcceptManagerRole(false);
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (teamId: number) => {
    if (!authenticatedUser) return;

    try {
      await joinTeam(authenticatedUser.token, teamId);
      const membership = await fetchCurrentMembership(authenticatedUser.token);
      setCurrentMembership(membership);
    } catch (err: unknown) {
      setJoinError(getErrorMessage(err));
    }
  };

  const currentTeamId =
    authenticatedUser?.teamId ??
    (currentMembership?.status === 'ACCEPTED'
      ? currentMembership.team.id
      : undefined);

  const sortedTeams = useMemo(
    () =>
      teams.slice().sort((a, b) => {
        const isAUserTeam = a.id === currentTeamId;
        const isBUserTeam = b.id === currentTeamId;
        if (isAUserTeam && !isBUserTeam) return -1;
        if (!isAUserTeam && isBUserTeam) return 1;
        const isAInactive = a.managersCount + a.membersCount === 0;
        const isBInactive = b.managersCount + b.membersCount === 0;
        if (isAInactive && !isBInactive) return 1;
        if (!isAInactive && isBInactive) return -1;
        return a.name.localeCompare(b.name);
      }),
    [teams, currentTeamId],
  );

  const showJoinColumn = Boolean(authenticatedUser);

  const helpText = currentTeamId
    ? 'Cliquez sur une team pour consulter ses membres.\nSur votre team, vous pouvez également effectuer les actions liées à votre rôle.'
    : 'Cliquez sur une team pour consulter ses membres.';

  const clearError = () => setError(null);
  const clearCreateError = () => setCreateError(null);
  const clearJoinError = () => setJoinError(null);

  const teamsListContextValue: TeamsListContextType = {
    teams,
    sortedTeams,
    currentTeamId,
    currentMembership,
    loading,
    error,
    createError,
    joinError,
    newTeamName,
    acceptManagerRole,
    creating,
    showJoinColumn,
    helpText,
    setNewTeamName,
    setAcceptManagerRole,
    clearError,
    clearCreateError,
    clearJoinError,
    handleCreateTeam,
    handleJoinTeam,
  };

  return (
    <TeamsListContext.Provider value={teamsListContextValue}>
      {children}
    </TeamsListContext.Provider>
  );
};

export { TeamsListContext, TeamsListContextProvider };
