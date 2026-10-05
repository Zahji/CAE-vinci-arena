import { useContext } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useNavigate } from 'react-router-dom';
import { MatchDetailContext } from '../../../contexts/MatchDetailContext';
import { SelectionContextProvider } from '../../../contexts/SelectionContext';
import SelectionMemberList from './components/SelectionMemberList';
import ContestScoreButton from './components/ContestScoreButton';
import DeclareForfeitButton from './components/DeclareForfeitButton';
import type { MatchDetailContextType } from '../../../types';
import { formatDateTime } from '../../../utils/dateUtils';

/**
 * Returns a French preposition + round name to build the page title.
 * e.g. "de la finale", "de la demi-finale", "du quart de finale",
 * "du huitième de finale", or "du round N".
 * @param {number} round - the current round number
 * @param {number} totalRounds - the total number of rounds in the tournament
 * @return {string} a French string like "de la finale" or "du round 2"
 */
const getDetailLabel = (round: number, totalRounds: number) => {
  if (totalRounds === 1 || round === totalRounds) return 'de la finale';
  if (round === totalRounds - 1) return 'de la demi-finale';
  if (round === totalRounds - 2) return 'du quart de finale';
  if (round === totalRounds - 3) return 'du huitième de finale';
  return `du round ${round}`;
};

/**
 * Shows a lock icon when the team selection is not visible yet.
 * @return {JSX.Element} the locked panel
 */
const LockedPanel = () => (
  <Box
    sx={{
      flex: 1,
      minWidth: 280,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      color: 'text.disabled',
      gap: 1,
    }}
  >
    <LockIcon sx={{ fontSize: 36 }} />
    <Typography variant="body2" fontStyle="italic">
      La sélection sera visible une fois le match terminé et le score encodé.
    </Typography>
  </Box>
);

/**
 * Shows the match detail page with both teams' selections and the score.
 * @param {{ tournamentId: number }} props - the component props
 * @return {JSX.Element} the page content
 */
const MatchSelectionPageContent = ({
  tournamentId,
}: {
  tournamentId: number;
}) => {
  const {
    match,
    loading,
    error,
    refetch,
    isManagerOfAnyTeam,
    canSeeTeam1,
    canSeeTeam2,
  } = useContext<MatchDetailContextType>(MatchDetailContext);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !match) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error ?? 'Match introuvable.'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Détail du match
            </Typography>
            {match.totalRounds != null && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {`Détail ${getDetailLabel(match.round, match.totalRounds)}${match.tournamentName ? ` : ${match.tournamentName}` : ''}`}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 1,
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              size="small"
              onClick={() => navigate(`/tournaments/${tournamentId}/bracket`)}
            >
              Retour au planning
            </Button>
            {isManagerOfAnyTeam && match.state === 'ENDED' && (
              <ContestScoreButton match={match} onSuccess={refetch} />
            )}
            {isManagerOfAnyTeam && match.state === 'PLANIFIED' && (
              <DeclareForfeitButton onSuccess={refetch} />
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {match.team1Name ?? '-'}
            </Box>
            <Box component="span" sx={{ mx: 1, color: 'text.secondary' }}>
              vs
            </Box>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {match.team2Name ?? '-'}
            </Box>
          </Typography>
          {match.startTime && (
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(match.startTime)}
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="info.main"
              sx={{
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                cursor: match.team1Id ? 'pointer' : 'default',
              }}
              onClick={() =>
                match.team1Id && navigate(`/teams/${match.team1Id}`)
              }
            >
              {match.team1Name ?? 'Équipe 1'}
            </Typography>
            {canSeeTeam1 && match.team1Id ? (
              <SelectionContextProvider
                tournamentId={tournamentId}
                matchId={match.matchId}
                teamId={match.team1Id}
              >
                <SelectionMemberList />
              </SelectionContextProvider>
            ) : (
              <LockedPanel />
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              minWidth: 80,
              alignSelf: 'center',
            }}
          >
            {match.team1Score != null && match.team2Score != null ? (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 1,
                    mb: '20px',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <EmojiEventsIcon
                      sx={{
                        fontSize: 40,
                        color: 'gold',
                        visibility:
                          match.team1Score > match.team2Score
                            ? 'visible'
                            : 'hidden',
                      }}
                    />
                    <Typography variant="h4" fontWeight={900}>
                      {match.team1Score}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    color="text.secondary"
                    sx={{ mb: '6px' }}
                  >
                    –
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <EmojiEventsIcon
                      sx={{
                        fontSize: 40,
                        color: 'gold',
                        visibility:
                          match.team2Score > match.team1Score
                            ? 'visible'
                            : 'hidden',
                      }}
                    />
                    <Typography variant="h4" fontWeight={900}>
                      {match.team2Score}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Score final
                </Typography>
              </>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontStyle="italic"
              >
                VS
              </Typography>
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="info.main"
              sx={{
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                cursor: match.team2Id ? 'pointer' : 'default',
              }}
              onClick={() =>
                match.team2Id && navigate(`/teams/${match.team2Id}`)
              }
            >
              {match.team2Name ?? 'Équipe 2'}
            </Typography>
            {canSeeTeam2 && match.team2Id ? (
              <SelectionContextProvider
                tournamentId={tournamentId}
                matchId={match.matchId}
                teamId={match.team2Id}
              >
                <SelectionMemberList />
              </SelectionContextProvider>
            ) : (
              <LockedPanel />
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default MatchSelectionPageContent;
