import { TeamsListContextProvider } from '../../../contexts/TeamsListContext';
import TeamsListPageContent from './TeamsListPageContent';

/**
 * Wraps the teams list page with its context.
 * @return {JSX.Element} the page
 */
const TeamsListPage = () => {
  return (
    <TeamsListContextProvider>
      <TeamsListPageContent />
    </TeamsListContextProvider>
  );
};

export default TeamsListPage;
