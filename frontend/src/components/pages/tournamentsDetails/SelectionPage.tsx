import { Alert, Container } from '@mui/material';
import { useParams } from 'react-router-dom';
import { SelectionContextProvider } from '../../../contexts/SelectionContext';
import SelectionPageContent from './SelectionPageContent';

const SelectionPage = () => {
  const { tournamentId, matchId, teamId } = useParams<{
    tournamentId: string;
    matchId: string;
    teamId: string;
  }>();

  const tId = Number(tournamentId);
  const mId = Number(matchId);
  const teamIdNum = Number(teamId);

  if (isNaN(tId) || isNaN(mId) || isNaN(teamIdNum)) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">Paramètres invalides.</Alert>
      </Container>
    );
  }

  return (
    <SelectionContextProvider
      tournamentId={tId}
      matchId={mId}
      teamId={teamIdNum}
    >
      <SelectionPageContent tournamentId={tId} />
    </SelectionContextProvider>
  );
};

export default SelectionPage;
