import { useContext } from 'react';
import { UserContextType } from '../../../types';
import { AdministrationContextProvider } from '../../../contexts/AdministrationContext';
import { UserContext } from '../../../contexts/UserContext';
import AdministrationPageContent from './AdministrationPageContent';

const AdministrationPage = () => {
  const { authenticatedUser, jwtData } =
    useContext<UserContextType>(UserContext);

  if (!authenticatedUser || !jwtData()?.isAdmin) {
    return <p>Vous devez être administrateur pour voir cette page.</p>;
  }

  return (
    <AdministrationContextProvider>
      <AdministrationPageContent />
    </AdministrationContextProvider>
  );
};

export default AdministrationPage;
