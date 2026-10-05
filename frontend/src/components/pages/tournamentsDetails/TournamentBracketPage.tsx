import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { TournamentDetailsContext } from '../../../contexts/TournamentDetailsContext';
import { TournamentDetailsContextProvider } from '../../../contexts/TournamentDetailsContext';
import type {
  Match,
  TournamentDetailsContextType,
  UserContextType,
} from '../../../types';
import { UserContext } from '../../../contexts/UserContext';
import ScheduleBracket from './components/ScheduleBracket';

const TournamentBracketPageContent = () => {
  const { loading, error, tournament } =
    useContext<TournamentDetailsContextType>(TournamentDetailsContext);
  const { authenticatedUser, jwtData } =
    useContext<UserContextType>(UserContext);
  const navigate = useNavigate();

  const isAdmin = Boolean(jwtData()?.isAdmin);
  const currentTeamId = authenticatedUser?.teamId;

  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const refreshMatches = useCallback(async () => {
    if (!tournament) return;

    setLoadingMatches(true);
    setMatchesError(null);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/matches`);
      if (response.ok) {
        const data = (await response.json()) as Match[];
        setMatches(data);
      } else {
        setMatchesError('Erreur lors du chargement du planning.');
        setMatches([]);
      }
    } catch {
      setMatchesError(
        'Une erreur est survenue lors du chargement du planning.',
      );
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, [tournament]);

  useEffect(() => {
    void refreshMatches();
  }, [refreshMatches]);

  if (loading) return null;

  if (error)
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">{error}</Alert>
      </Container>
    );

  if (!tournament) return null;

  return (
    <Container
      maxWidth="xl"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        mt: 2,
        mb: 2,
        px: 0,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          minHeight: { xs: 96, sm: 76 },
        }}
      >
        <Button
          variant="outlined"
          onClick={() => navigate(`/tournaments/${tournament.id}`)}
          startIcon={<ArrowBackIcon />}
          sx={{
            width: 'fit-content',
            whiteSpace: 'nowrap',
            position: { sm: 'absolute' },
            right: { sm: 0 },
            top: { xs: 0, sm: '50%' },
            transform: { sm: 'translateY(-50%)' },
            color: '#111',
            borderColor: '#111',
            backgroundColor: '#fff',
            '&:hover': {
              borderColor: '#111',
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          Retour aux details
        </Button>

        <Paper
          sx={{
            px: { xs: 1.5, sm: 2.5 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: 1.5,
            textAlign: 'center',
            width: 'fit-content',
            maxWidth: { xs: '100%', sm: '70%' },
            backgroundColor: 'rgba(255, 255, 255, 0.62)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography variant="h4" fontWeight="bold" sx={{ lineHeight: 1.1 }}>
            Planning du tournoi
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {tournament.name}
          </Typography>
        </Paper>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          p: 0.5,
        }}
      >
        {loadingMatches ? (
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary">
              Chargement du planning...
            </Typography>
          </Paper>
        ) : matchesError ? (
          <Alert severity="error">{matchesError}</Alert>
        ) : (
          <ScheduleBracket
            matches={matches}
            onSuccess={() => refreshMatches()}
            tournamentId={tournament.id}
            currentTeamId={currentTeamId}
            isAdmin={isAdmin}
          />
        )}
      </Box>
    </Container>
  );
};

const TournamentBracketPage = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const id = Number(tournamentId);

  if (isNaN(id)) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">Identifiant de tournoi invalide</Alert>
      </Container>
    );
  }

  return (
    <TournamentDetailsContextProvider tournamentId={id}>
      <TournamentBracketPageContent />
    </TournamentDetailsContextProvider>
  );
};

export default TournamentBracketPage;
