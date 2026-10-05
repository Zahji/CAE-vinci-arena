import { MembersContextProvider } from '../../../contexts/MembersContext';
import MembersPageContent from './MembersPageContent';

const MembersPage = () => {
  return (
    <MembersContextProvider>
      <MembersPageContent />
    </MembersContextProvider>
  );
};

export default MembersPage;
