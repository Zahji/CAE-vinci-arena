import { useContext } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TournamentDetailsContext } from '../../../contexts/TournamentDetailsContext';
import { TournamentDetailsContextType } from '../../../types';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

/**
 * Converts a YYYY-MM-DD date string to DD/MM/YYYY.
 * @param {string} date - the date string
 * @return {string} the formatted date
 */
const formatDate = (date: string) => date.split('-').reverse().join('/');

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
 * Shows tournament details, registered teams and the registration button.
 * @return {JSX.Element | null} the page content
 */
const TournamentDetailsPageContent = () => {
  const {
    loading,
    error,
    tournament,
    registrations,
    canRegister,
    registering,
    registerError,
    registerSuccess,
    registerTeam,
    clearRegisterError,
  } = useContext<TournamentDetailsContextType>(TournamentDetailsContext);
  const navigate = useNavigate();

  if (loading) return null;

  if (error)
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">{error}</Alert>
      </Container>
    );

  if (!tournament) return null;

  const showBracketButton =
    registrations.length >= tournament.maxTeams ||
    getToday() > tournament.endInscriptionDate;

  return (
    <Container
      maxWidth="md"
      sx={{
        py: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 2.5,
        padding: 2,
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h4" fontWeight="bold">
          {tournament.name}
        </Typography>
        <Chip label={tournament.stateDisplayName} variant="outlined" />
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {tournament.description}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 3,
          flexWrap: 'wrap',
          border: '1px solid',
          borderColor: 'text.primary',
          borderRadius: 2,
          px: 2,
          py: 1,
          mb: 4,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Début : {formatDate(tournament.startDate)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fin : {formatDate(tournament.endDate)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Inscriptions : {formatDate(tournament.startInscriptionDate)} →{' '}
          {formatDate(tournament.endInscriptionDate)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Équipes : {registrations.length} / {tournament.maxTeams}
        </Typography>
      </Box>

      {canRegister && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={() => void registerTeam()}
            disabled={registering}
          >
            {registering ? 'Inscription...' : 'Inscrire ma team'}
          </Button>
        </Box>
      )}

      {registerSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Votre team a été inscrite avec succès !
        </Alert>
      )}

      {registerError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearRegisterError}>
          {registerError}
        </Alert>
      )}

      {tournament.state === 'FINISHED' && tournament.winner && (
        <Paper
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: '#FFF9C4',
            border: '1px solid #F9A825',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <EmojiEventsIcon sx={{ color: '#F9A825' }} />
          <Typography variant="h6" fontWeight="bold">
            Gagnant : {tournament.winner}
          </Typography>
        </Paper>
      )}

      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
        Teams inscrites
      </Typography>

      {registrations.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography color="text.secondary">
            Aucune team inscrite pour l'instant.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom de la team</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations.map((r) => (
                <TableRow key={r.teamId}>
                  <TableCell>
                    <Link
                      color="info.main"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/teams/${r.teamId}`)}
                    >
                      {r.teamName}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {showBracketButton && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/tournaments/${tournament.id}/bracket`)}
          >
            Afficher planning
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default TournamentDetailsPageContent;
