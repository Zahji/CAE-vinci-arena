import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Team,
  TeamActivity,
  TeamMembership,
  TeamMemberRow,
  TeamDetailsContextType,
  UserContextType,
} from '../types';
import { UserContext } from './UserContext';
import {
  fetchTeamById,
  designateSecondManager,
  leaveTeam,
  excludeMember,
} from '../services/teamService';
import { fetchTeamMembers } from '../services/teamMembershipService';
import { fetchTeamActivity } from '../services/tournamentRegistrationService';

const defaultTeamDetailsContext: TeamDetailsContextType = {
  team: null,
  memberships: [],
  memberList: [],
  totalTeamMembers: 0,
  isPrimaryManager: false,
  isSecondManager: false,
  canViewMemberEmail: false,
  currentUserId: undefined,
  loading: true,
  error: null,
  success: null,
  actionLoading: null,
  teamActivity: [],
  pastActivity: [],
  ongoingActivity: [],
  futureActivity: [],
  clearError: () => {},
  clearSuccess: () => {},
  handleRefresh: () => {},
  handleDesignateSecondManager: async () => {},
  handleLeaveTeam: async () => {},
  handleExcludeMember: async () => {},
};

const TeamDetailsContext = createContext<TeamDetailsContextType>(
  defaultTeamDetailsContext,
);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur inconnue est survenue';
};

const TeamDetailsContextProvider = ({ children }: { children: ReactNode }) => {
  const { teamId } = useParams();
  const { authenticatedUser, setAuthenticatedUser, jwtData } =
    useContext<UserContextType>(UserContext);
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  const loadTeamData = useCallback(async () => {
    const parsedTeamId = Number(teamId);
    if (!parsedTeamId) {
      setError('Identifiant de team invalide.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = authenticatedUser?.token ?? '';
      const [teamData, membersData, activityData] = await Promise.all([
        fetchTeamById(parsedTeamId, token),
        fetchTeamMembers(parsedTeamId, token),
        fetchTeamActivity(parsedTeamId),
      ]);

      setTeam(teamData);
      setMemberships(membersData);
      setTeamActivity(activityData);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [authenticatedUser?.token, teamId]);

  useEffect(() => {
    void loadTeamData();
  }, [loadTeamData, refreshKey]);

  const handleDesignateSecondManager = async (memberId: number) => {
    if (!team?.id || !authenticatedUser?.token) return;

    setActionLoading(`designate-${memberId}`);
    setError(null);
    setSuccess(null);

    try {
      await designateSecondManager(authenticatedUser.token, team.id, memberId);
      setSuccess(`Le membre est maintenant second responsable de la team.`);
      handleRefresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team?.id || !authenticatedUser?.token) return;

    setActionLoading('leave');
    setError(null);
    setSuccess(null);

    try {
      await leaveTeam(authenticatedUser.token, team.id);

      if (setAuthenticatedUser) {
        setAuthenticatedUser({ ...authenticatedUser, teamId: undefined });
      }

      setSuccess('Vous avez quitté la team.');
      navigate('/teams');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExcludeMember = async (membershipId: number) => {
    if (!authenticatedUser?.token) return;

    setActionLoading(`exclude-${membershipId}`);
    setError(null);
    setSuccess(null);

    try {
      await excludeMember(authenticatedUser.token, membershipId);
      setSuccess('Le membre a été exclu de la team.');
      handleRefresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const acceptedMemberships = useMemo(
    () => memberships.filter((m) => m.status === 'ACCEPTED'),
    [memberships],
  );

  const memberList = useMemo((): TeamMemberRow[] => {
    if (!team) return [];

    const rows = new Map<number, TeamMemberRow>();

    if (team.manager) {
      // tiago exclure remake
      rows.set(team.manager.id, {
        membershipId: acceptedMemberships.find(
          (m) => m.member.id === team.manager?.id,
        )?.id,
        member: team.manager,
        roleLabel: 'Responsable',
      });
      // tiago exclure remake
    }

    if (team.secondManager) {
      rows.set(team.secondManager.id, {
        membershipId: acceptedMemberships.find(
          (m) => m.member.id === team.secondManager?.id,
        )?.id,
        member: team.secondManager,
        roleLabel: 'Second responsable',
      });
    }

    acceptedMemberships.forEach((m) => {
      if (!rows.has(m.member.id)) {
        rows.set(m.member.id, {
          membershipId: m.id,
          member: m.member,
          roleLabel: 'Membre',
        });
      }
    });

    return Array.from(rows.values());
  }, [acceptedMemberships, team]);

  const totalTeamMembers = team ? team.managersCount + team.membersCount : 0;

  const today = new Date().toISOString().split('T')[0];
  const pastActivity = teamActivity.filter((a) => a.endDate < today);
  const ongoingActivity = teamActivity.filter(
    (a) => a.startDate <= today && a.endDate >= today,
  );
  const futureActivity = teamActivity.filter((a) => a.startDate > today);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  const currentUserId = jwtData()?.id;
  const isPrimaryManager = authenticatedUser?.id === team?.manager?.id;
  const isSecondManager = authenticatedUser?.id === team?.secondManager?.id;
  const canViewMemberEmail =
    Boolean(jwtData()?.isAdmin) || isPrimaryManager || isSecondManager;

  const teamDetailsContextValue: TeamDetailsContextType = {
    team,
    memberships,
    memberList,
    totalTeamMembers,
    isPrimaryManager,
    isSecondManager,
    canViewMemberEmail,
    currentUserId,
    loading,
    error,
    success,
    actionLoading,
    teamActivity,
    pastActivity,
    ongoingActivity,
    futureActivity,
    clearError,
    clearSuccess,
    handleRefresh,
    handleDesignateSecondManager,
    handleLeaveTeam,
    handleExcludeMember,
  };

  return (
    <TeamDetailsContext.Provider value={teamDetailsContextValue}>
      {children}
    </TeamDetailsContext.Provider>
  );
};

export { TeamDetailsContext, TeamDetailsContextProvider };
