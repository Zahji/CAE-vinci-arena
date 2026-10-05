import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Match, Team, UserContextType, MatchDetailContextType } from '../types';
import { UserContext } from './UserContext';
import { fetchMatch } from '../services/matchService';
import { fetchTeamById } from '../services/teamService';

const defaultMatchDetailContext: MatchDetailContextType = {
  match: null,
  team1: null,
  team2: null,
  loading: true,
  error: null,
  refetch: async () => {},
  matchEnded: false,
  isManagerOfAnyTeam: false,
  canSeeTeam1: false,
  canSeeTeam2: false,
};

/**
 * Returns flags about the match state and what the user can see.
 * @param {Match | null} match - the match
 * @param {Team | null} team1 - the first team
 * @param {Team | null} team2 - the second team
 * @param {number | undefined} userId - the current user ID
 * @param {number | undefined} userTeamId - the current user team ID
 * @param {boolean} isAdmin - whether the user is an admin
 * @return {object} the flags
 */
const computeDerived = (
  match: Match | null,
  team1: Team | null,
  team2: Team | null,
  userId: number | undefined,
  userTeamId: number | undefined,
  isAdmin: boolean,
) => {
  const matchEnded =
    match?.state === 'CONTESTED' ||
    (match?.state === 'ENDED' &&
      match?.team1Score != null &&
      match?.team2Score != null) ||
    false;

  const isManagerOfTeam1 =
    userId !== undefined &&
    (team1?.manager?.id === userId || team1?.secondManager?.id === userId);
  const isManagerOfTeam2 =
    userId !== undefined &&
    (team2?.manager?.id === userId || team2?.secondManager?.id === userId);
  const isManagerOfAnyTeam = Boolean(isManagerOfTeam1 || isManagerOfTeam2);

  const userInTeam1 = userTeamId !== undefined && userTeamId === match?.team1Id;
  const userInTeam2 = userTeamId !== undefined && userTeamId === match?.team2Id;
  const canSeeTeam1 = isAdmin || Boolean(userInTeam1) || matchEnded;
  const canSeeTeam2 = isAdmin || Boolean(userInTeam2) || matchEnded;

  return { matchEnded, isManagerOfAnyTeam, canSeeTeam1, canSeeTeam2 };
};

const MatchDetailContext = createContext<MatchDetailContextType>(
  defaultMatchDetailContext,
);

interface MatchDetailContextProviderProps {
  tournamentId: number;
  matchId: number;
  children: ReactNode;
}

/**
 * Loads match and team data and provides them to its children.
 * @return {JSX.Element} the provider
 */
const MatchDetailContextProvider = ({
  tournamentId,
  matchId,
  children,
}: MatchDetailContextProviderProps) => {
  const { authenticatedUser, jwtData } =
    useContext<UserContextType>(UserContext);
  const token = authenticatedUser?.token ?? '';
  const userId = authenticatedUser?.id;
  const userTeamId = authenticatedUser?.teamId;
  const isAdmin = Boolean(jwtData()?.isAdmin);

  const [match, setMatch] = useState<Match | null>(null);
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const matchData = await fetchMatch(tournamentId, matchId, token);
      setMatch(matchData);

      if (matchData.team1Id && matchData.team2Id) {
        const [t1, t2] = await Promise.all([
          fetchTeamById(matchData.team1Id, token),
          fetchTeamById(matchData.team2Id, token),
        ]);
        setTeam1(t1);
        setTeam2(t2);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, matchId, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const derived = computeDerived(
    match,
    team1,
    team2,
    userId,
    userTeamId,
    isAdmin,
  );

  return (
    <MatchDetailContext.Provider
      value={{
        match,
        team1,
        team2,
        loading,
        error,
        refetch: loadData,
        ...derived,
      }}
    >
      {children}
    </MatchDetailContext.Provider>
  );
};

export { MatchDetailContext, MatchDetailContextProvider };
