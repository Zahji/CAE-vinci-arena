import { useContext } from 'react';
import { UserContextType } from '../../../types';
import { UserContext } from '../../../contexts/UserContext';
import { ProfileContextProvider } from '../../../contexts/ProfileContext';
import ProfilePageContent from './ProfilePageContent';

const ProfilePage = () => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);

  if (!authenticatedUser) {
    return <p>Vous devez être connecté pour voir cette page.</p>;
  }

  return (
    <ProfileContextProvider>
      <ProfilePageContent />
    </ProfileContextProvider>
  );
};

export default ProfilePage;
