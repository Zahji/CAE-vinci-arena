import { TeamDetailsContextProvider } from '../../../contexts/TeamDetailsContext';
import TeamDetailsPageContent from './TeamDetailsPageContent';

const TeamDetailsPage = () => {
  return (
    <TeamDetailsContextProvider>
      <TeamDetailsPageContent />
    </TeamDetailsContextProvider>
  );
};

export default TeamDetailsPage;
