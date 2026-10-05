import { MemberDetailsContextProvider } from '../../../contexts/MemberDetailsContext';
import MemberDetailsPageContent from './MemberDetailsPageContent';

/**
 * Wraps the member details page with its context.
 * @return {JSX.Element} the page
 */
const MemberDetailsPage = () => {
  return (
    <MemberDetailsContextProvider>
      <MemberDetailsPageContent />
    </MemberDetailsContextProvider>
  );
};

export default MemberDetailsPage;
