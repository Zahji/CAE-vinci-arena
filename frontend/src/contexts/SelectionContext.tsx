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
  Match,
  Team,
  TeamMembership,
  SelectionMatch,
  SelectionContextType,
  UserContextType,
} from '../types';
import { UserContext } from './UserContext';
import { fetchMatch, fetchParticipation } from '../services/matchService';
import { fetchTeamById } from '../services/teamService';
import { fetchTeamMembers } from '../services/teamMembershipService';
import { fetchMemberUnavailabilities } from '../services/membersService';
import {
  fetchSelections,
  addSelection,
  removeSelection,
} from '../services/selectionService';

const defaultSelectionContext: SelectionContextType = {
  match: null,
  memberships: [],
  selections: [],
  statusSelection: 0,
  unavailableMemberIds: new Set<number>(),
  loading: true,
  error: null,
  actionError: null,
  isSelected: () => false,
  canModify: false,
  handleToggle: async () => {},
  clearActionError: () => {},
};

const SelectionContext = createContext<SelectionContextType>(
  defaultSelectionContext,
);

/**
 * Extracts a readable message from an unknown error.
 * @param {unknown} error - the error to extract the message from
 * @return {string} the error message
 */
const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Une erreur inconnue est survenue';
};

interface SelectionContextProviderProps {
  tournamentId: number;
  matchId: number;
  teamId: number;
  children: ReactNode;
}

/**
 * Provides selection data and actions for a specific match and team.
 * @return {JSX.Element} the provider
 */
const SelectionContextProvider = ({
  tournamentId,
  matchId,
  teamId,
  children,
}: SelectionContextProviderProps) => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const token = authenticatedUser?.token ?? '';

  const [match, setMatch] = useState<Match | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [selections, setSelections] = useState<SelectionMatch[]>([]);
  const [statusSelection, setStatusSelection] = useState(0);
  const [unavailableMemberIds, setUnavailableMemberIds] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        matchData,
        teamData,
        membersData,
        selectionsData,
        participationData,
      ] = await Promise.all([
        fetchMatch(tournamentId, matchId, token),
        fetchTeamById(teamId, token),
        fetchTeamMembers(teamId, token),
        fetchSelections(tournamentId, matchId, teamId, token),
        fetchParticipation(tournamentId, matchId, teamId, token),
      ]);

      setMatch(matchData);
      setTeam(teamData);
      setStatusSelection(participationData.statusSelection);

      const accepted = membersData.filter(
        (m: TeamMembership) => m.status === 'ACCEPTED',
      );

      const acceptedIds = new Set(
        accepted.map((m: TeamMembership) => m.member.id),
      );
      const managerMemberships: TeamMembership[] = [];
      for (const manager of [teamData.manager, teamData.secondManager]) {
        if (manager && !acceptedIds.has(manager.id)) {
          managerMemberships.push({
            id: -manager.id,
            member: manager,
            team: teamData,
            status: 'ACCEPTED',
          });
        }
      }
      setMemberships([...managerMemberships, ...accepted]);
      setSelections(selectionsData);

      const isManagerOfTeam =
        authenticatedUser?.id === teamData.manager?.id ||
        authenticatedUser?.id === teamData.secondManager?.id;

      if (matchData.startTime && isManagerOfTeam) {
        const matchDate = matchData.startTime.split('T')[0];
        const unavailableIds = new Set<number>();
        await Promise.all(
          accepted.map(async (m: TeamMembership) => {
            try {
              const unavailabilities = await fetchMemberUnavailabilities(
                m.member.id,
                token,
              );
              const isUnavailable = unavailabilities.some(
                (u) => matchDate >= u.startDate && matchDate <= u.endDate,
              );
              if (isUnavailable) unavailableIds.add(m.member.id);
            } catch {
              // si indisponibilités inaccessibles, on considère le membre disponible
            }
          }),
        );
        setUnavailableMemberIds(unavailableIds);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tournamentId, matchId, teamId, token, authenticatedUser?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const isSelected = useCallback(
    (memberId: number) => selections.some((s) => s.memberId === memberId),
    [selections],
  );

  const canModify = useMemo(() => {
    if (match?.state !== 'PLANIFIED') return false;
    if (match?.startTime && new Date(match.startTime) <= new Date())
      return false;
    const userId = authenticatedUser?.id;
    return (
      userId !== undefined &&
      (team?.manager?.id === userId || team?.secondManager?.id === userId)
    );
  }, [match, team, authenticatedUser]);

  const reloadStatusSelection = async () => {
    try {
      const participation = await fetchParticipation(
        tournamentId,
        matchId,
        teamId,
        token,
      );
      setStatusSelection(participation.statusSelection);
    } catch {
      // non-bloquant
    }
  };

  const handleToggle = async (memberId: number) => {
    setActionError(null);
    if (isSelected(memberId)) {
      await removeSelection(tournamentId, matchId, teamId, memberId, token);
      setSelections((prev) => prev.filter((s) => s.memberId !== memberId));
    } else {
      if (statusSelection >= 4) return;
      const created = await addSelection(
        tournamentId,
        matchId,
        teamId,
        memberId,
        token,
      );
      setSelections((prev) => [...prev, created]);
    }
    await reloadStatusSelection();
  };

  const clearActionError = () => setActionError(null);

  const contextValue: SelectionContextType = {
    match,
    memberships,
    selections,
    statusSelection,
    unavailableMemberIds,
    loading,
    error,
    actionError,
    isSelected,
    canModify,
    handleToggle,
    clearActionError,
  };

  return (
    <SelectionContext.Provider value={contextValue}>
      {children}
    </SelectionContext.Provider>
  );
};

export { SelectionContext, SelectionContextProvider };
