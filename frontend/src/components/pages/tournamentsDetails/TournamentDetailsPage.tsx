import { Alert, Container } from '@mui/material';
import { useParams } from 'react-router-dom';
import { TournamentDetailsContextProvider } from '../../../contexts/TournamentDetailsContext';
import TournamentDetailsPageContent from './TournamentDetailsPageContent';

const TournamentDetailsPage = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const id = Number(tournamentId);

  if (isNaN(id))
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">Identifiant de tournoi invalide</Alert>
      </Container>
    );

  return (
    <TournamentDetailsContextProvider tournamentId={id}>
      <TournamentDetailsPageContent />
    </TournamentDetailsContextProvider>
  );
};

export default TournamentDetailsPage;
