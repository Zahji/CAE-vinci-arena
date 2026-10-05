import { useContext } from 'react';
import { Box } from '@mui/material';
import { ProfileContextType, UserContextType } from '../../../types';
import { ProfileContext } from '../../../contexts/ProfileContext';
import { UserContext } from '../../../contexts/UserContext';
import ProfileInfo from './components/ProfileInfo';
import PrivateInfo from './components/PrivateInfo';
import ChangePasswordDialog from './components/ChangePasswordDialog';
import AddUnavailabilityDialog from './components/AddUnavailabilityDialog';
import ChangeSpecialityDialog from './components/ChangeSpecialityDialog';
import ChangePictureDialog from './components/ChangePictureDialog';
import MemberActivity from './components/MemberActivity';

const ProfilePageContent = () => {
  const { loading, error, profile } =
    useContext<ProfileContextType>(ProfileContext);
  const { authenticatedUser } = useContext<UserContextType>(UserContext);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;

  return (
    <>
      <Box
        sx={{
          margin: '0 auto',
          marginTop: 2,
          maxWidth: 800,
          width: '100%',
          padding: 2,
          textAlign: 'center',
          backgroundColor: '#F0F0F0',
          borderRadius: 2.5,
        }}
      >
        <h1>Mon Espace personnel</h1>
        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
          <ProfileInfo />
          <PrivateInfo />
        </Box>
        <ChangePasswordDialog />
        <AddUnavailabilityDialog />
        <ChangeSpecialityDialog />
        <ChangePictureDialog />
      </Box>

      {authenticatedUser && (
        <MemberActivity
          token={authenticatedUser.token}
          userId={authenticatedUser.id}
          currentTeamId={profile?.teamId ?? null}
          currentTeamName={profile?.teamName ?? null}
          showUpcoming={true}
        />
      )}
    </>
  );
};

export default ProfilePageContent;
