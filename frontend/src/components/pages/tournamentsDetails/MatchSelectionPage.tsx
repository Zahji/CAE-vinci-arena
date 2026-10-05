import { Alert, Container } from '@mui/material';
import { useParams } from 'react-router-dom';
import { MatchDetailContextProvider } from '../../../contexts/MatchDetailContext';
import MatchSelectionPageContent from './MatchSelectionPageContent';

const MatchSelectionPage = () => {
  const { tournamentId, matchId } = useParams<{
    tournamentId: string;
    matchId: string;
  }>();

  const tId = Number(tournamentId);
  const mId = Number(matchId);

  if (isNaN(tId) || isNaN(mId)) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">Paramètres invalides.</Alert>
      </Container>
    );
  }

  return (
    <MatchDetailContextProvider tournamentId={tId} matchId={mId}>
      <MatchSelectionPageContent tournamentId={tId} />
    </MatchDetailContextProvider>
  );
};

export default MatchSelectionPage;
