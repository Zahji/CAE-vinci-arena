import { TournamentContextProvider } from '../../../contexts/TournamentContext';
import TournamentPageContent from './TournamentPageContent';

const TournamentPage = () => {
  return (
    <TournamentContextProvider>
      <TournamentPageContent />
    </TournamentContextProvider>
  );
};

export default TournamentPage;
