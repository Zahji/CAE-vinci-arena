import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import {
  fetchPastTeams,
  fetchMemberActivity,
  MembershipHistory,
  MemberActivityData,
} from '../../../../services/activityService';

interface MemberActivityProps {
  token: string;
  userId: number;
  currentTeamId?: number | null;
  currentTeamName?: string | null;
  isMemberBanned?: boolean;
  fallbackPastTeam?: {
    teamId: number;
    teamName: string | null;
  } | null;
  showUpcoming?: boolean;
  showCurrentTeamLabel?: boolean;
  title?: string;
}

const getRoundLabel = (round: number, totalRounds: number) => {
  if (totalRounds === 1 || round === totalRounds) return 'Finale';
  if (round === totalRounds - 1) return 'Demi-finale';
  if (round === totalRounds - 2) return 'Quarts de finale';
  if (round === totalRounds - 3) return 'Huitièmes de finale';
  return `Round ${round}`;
};

const MatchTable = ({
  matches,
  loading,
  emptyMessage,
}: {
  matches: MemberActivityData[];
  loading: boolean;
  emptyMessage: string;
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (matches.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', py: 1, textAlign: 'center' }}
      >
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ backgroundColor: '#e8e8e8' }}>
          <TableCell align="center">
            <strong>Tournois</strong>
          </TableCell>
          <TableCell align="center">
            <strong>Tour</strong>
          </TableCell>
          <TableCell align="center">
            <strong>Match</strong>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {matches.map((match) => {
          const isEnded = match.state === 'ENDED';
          const team1Won = isEnded && match.winnerTeamId === match.team1Id;
          const team2Won = isEnded && match.winnerTeamId === match.team2Id;
          return (
            <TableRow key={match.matchId}>
              <TableCell align="center">
                <Link
                  sx={{ cursor: 'pointer' }}
                  color="info.main"
                  onClick={() => navigate(`/tournaments/${match.tournamentId}`)}
                >
                  {match.tournamentName}
                </Link>
              </TableCell>
              <TableCell align="center">
                <Link
                  sx={{ cursor: 'pointer' }}
                  color="info.main"
                  onClick={() =>
                    navigate(
                      `/tournaments/${match.tournamentId}/matches/${match.matchId}/selections`,
                    )
                  }
                >
                  {getRoundLabel(match.round, match.totalRounds)}
                </Link>
              </TableCell>
              <TableCell align="center">
                <Typography
                  component="span"
                  sx={{
                    color: team1Won ? 'green' : 'inherit',
                    fontWeight: team1Won ? 'bold' : 'normal',
                  }}
                >
                  {match.team1Name ?? '?'}
                </Typography>
                {' vs '}
                <Typography
                  component="span"
                  sx={{
                    color: team2Won ? 'green' : 'inherit',
                    fontWeight: team2Won ? 'bold' : 'normal',
                  }}
                >
                  {match.team2Name ?? '?'}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const PastTeamAccordion = ({
  pastTeam,
  token,
  userId,
  isBanEntry = false,
}: {
  pastTeam: MembershipHistory;
  token: string;
  userId: number;
  isBanEntry?: boolean;
}) => {
  const [pastMatches, setPastMatches] = useState<MemberActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleExpand = async () => {
    setExpanded((prev) => !prev);
    if (!loaded) {
      setLoading(true);
      try {
        const matchData = await fetchMemberActivity(userId, token);
        const filtered = matchData.filter(
          (m) => m.team1Id === pastTeam.teamId || m.team2Id === pastTeam.teamId,
        );
        setPastMatches(
          filtered.filter(
            (m) => m.state === 'ENDED' || m.state === 'CONTESTED',
          ),
        );
      } catch (err) {
        console.error('Erreur chargement activité ancienne team:', err);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }
  };

  const formattedDate = pastTeam.leftAt
    ? pastTeam.leftAt.split('-').reverse().join('/')
    : '—';
  const statusLabel = isBanEntry ? 'banni le' : 'quitté le';

  return (
    <Accordion expanded={expanded} onChange={handleExpand} sx={{ mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>
          Ancienne Team : <strong>{pastTeam.teamName}</strong>
          <Typography
            component="span"
            variant="body2"
            sx={{ color: 'text.secondary', ml: 2 }}
          >
            ({statusLabel} {formattedDate})
          </Typography>
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="subtitle2"
          sx={{ mt: 3, mb: 1, fontWeight: 600, textAlign: 'center' }}
        >
          Passés
        </Typography>
        <MatchTable
          matches={pastMatches}
          loading={loading}
          emptyMessage="Aucun match passé."
        />
      </AccordionDetails>
    </Accordion>
  );
};

const MemberActivity = ({
  token,
  userId,
  currentTeamId,
  currentTeamName,
  isMemberBanned = false,
  fallbackPastTeam = null,
  showUpcoming = false,
  showCurrentTeamLabel = true,
  title = 'Mon Activité',
}: MemberActivityProps) => {
  const [upcomingMatches, setUpcomingMatches] = useState<MemberActivityData[]>(
    [],
  );
  const [allMemberMatches, setAllMemberMatches] = useState<
    MemberActivityData[]
  >([]);
  const [pastMatches, setPastMatches] = useState<MemberActivityData[]>([]);
  const [pastTeams, setPastTeams] = useState<MembershipHistory[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const todayIsoDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      setLoadingMatches(true);
      try {
        const data = await fetchMemberActivity(userId, token);
        setAllMemberMatches(data);
        setUpcomingMatches(
          data.filter(
            (m) =>
              (m.state === 'PLANIFIED' || m.state === 'ONGOING') &&
              m.selectedTeamId === currentTeamId,
          ),
        );
        setPastMatches(
          data.filter(
            (m) =>
              (m.state === 'ENDED' || m.state === 'CONTESTED') &&
              m.selectedTeamId === currentTeamId,
          ),
        );
      } catch (err) {
        console.error('Erreur chargement matchs du membre:', err);
      } finally {
        setLoadingMatches(false);
      }
    };
    void load();
  }, [userId, token, currentTeamId]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPastTeams(userId, token);
        setPastTeams(data);
      } catch (err) {
        console.error('Erreur chargement anciennes teams:', err);
      }
    };
    void load();
  }, [userId, token]);

  const effectivePastTeams = (() => {
    const pastTeamMap = new Map<
      number,
      MembershipHistory & { isBanEntry?: boolean }
    >();

    pastTeams
      .filter((pastTeam) => pastTeam.teamId !== currentTeamId)
      .forEach((pastTeam) => {
        pastTeamMap.set(pastTeam.teamId, pastTeam);
      });

    const addPastTeam = (
      teamId: number,
      teamName: string | null,
      leftAt = '',
      isBanEntry = false,
    ) => {
      if (teamId === currentTeamId) return;

      const existing = pastTeamMap.get(teamId);
      if (!existing) {
        pastTeamMap.set(teamId, {
          teamId,
          teamName: teamName ?? `Team #${teamId}`,
          leftAt,
          isBanEntry,
        });
        return;
      }

      const hasGenericName = existing.teamName === `Team #${teamId}`;
      if (hasGenericName && teamName) {
        pastTeamMap.set(teamId, { ...existing, teamName });
      }

      if (isBanEntry && !existing.isBanEntry) {
        pastTeamMap.set(teamId, {
          ...existing,
          isBanEntry: true,
          leftAt: existing.leftAt || leftAt,
        });
      }
    };

    if (fallbackPastTeam) {
      addPastTeam(
        fallbackPastTeam.teamId,
        fallbackPastTeam.teamName,
        isMemberBanned ? todayIsoDate : '',
        isMemberBanned,
      );
    }

    const inferredTeamCounts = new Map<number, number>();
    allMemberMatches.forEach((match) => {
      inferredTeamCounts.set(
        match.selectedTeamId,
        (inferredTeamCounts.get(match.selectedTeamId) ?? 0) + 1,
      );
    });
    const inferredBannedTeamId = isMemberBanned
      ? Array.from(inferredTeamCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0]?.[0]
      : undefined;

    allMemberMatches.forEach((match) => {
      const selectedTeamId = match.selectedTeamId;
      const inferredTeamName =
        match.team1Id === selectedTeamId
          ? match.team1Name
          : match.team2Id === selectedTeamId
            ? match.team2Name
            : null;
      addPastTeam(
        selectedTeamId,
        inferredTeamName,
        isMemberBanned && selectedTeamId === inferredBannedTeamId
          ? todayIsoDate
          : '',
        Boolean(isMemberBanned && selectedTeamId === inferredBannedTeamId),
      );
    });

    return Array.from(pastTeamMap.values());
  })();

  return (
    <Box
      sx={{
        margin: '0 auto',
        marginTop: 3,
        maxWidth: 800,
        width: '100%',
        padding: 2,
        backgroundColor: '#F0F0F0',
        borderRadius: 2.5,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        {title}
      </Typography>

      {currentTeamId ? (
        <Box sx={{ mb: 3 }}>
          {showCurrentTeamLabel && (
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Team actuelle : {currentTeamName ?? `Team #${currentTeamId}`}
            </Typography>
          )}

          {showUpcoming && (
            <>
              <Typography
                variant="subtitle2"
                sx={{ mt: 2, mb: 1, fontWeight: 600 }}
              >
                À venir
              </Typography>
              <MatchTable
                matches={upcomingMatches}
                loading={loadingMatches}
                emptyMessage="Aucun match à venir."
              />
            </>
          )}

          <Typography
            variant="subtitle2"
            sx={{ mt: 3, mb: 1, fontWeight: 600 }}
          >
            Passés
          </Typography>
          <MatchTable
            matches={pastMatches}
            loading={loadingMatches}
            emptyMessage="Aucun match passé."
          />
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Ce membre n'appartient à aucune team actuellement.
        </Typography>
      )}

      {effectivePastTeams.map((pastTeam) => (
        <PastTeamAccordion
          key={pastTeam.teamId}
          pastTeam={pastTeam}
          token={token}
          userId={userId}
          isBanEntry={Boolean(pastTeam.isBanEntry)}
        />
      ))}
    </Box>
  );
};

export default MemberActivity;
