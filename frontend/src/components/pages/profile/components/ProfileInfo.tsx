import { useContext } from 'react';
import { Box, Button, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ProfileContextType, UserContextType } from '../../../../types';
import { ProfileContext } from '../../../../contexts/ProfileContext';
import { UserContext } from '../../../../contexts/UserContext';

const ProfileInfo = () => {
  const { profile, setOpenSpecialityModal, setOpenPictureModal } =
    useContext<ProfileContextType>(ProfileContext);
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const navigate = useNavigate();

  const formattedDate = profile?.date
    ? profile.date.split('-').reverse().join('/')
    : '—';

  return (
    <Box
      sx={{
        width: 350,
        padding: 2,
        border: '1px solid grey',
        borderRadius: 2,
        textAlign: 'center',
      }}
    >
      <h2>Mes Informations de Profil</h2>
      <p>
        <strong>Tag :</strong> {profile?.tag}
      </p>
      <p>
        <strong>Spécialité :</strong> {profile?.speciality}
        <Button
          size="small"
          variant="outlined"
          sx={{ marginLeft: 2 }}
          onClick={() => setOpenSpecialityModal(true)}
        >
          Modifier
        </Button>
      </p>
      <p>
        <strong>Team :</strong>{' '}
        {profile?.teamName && authenticatedUser?.teamId ? (
          <Link
            sx={{ cursor: 'pointer' }}
            color="info.main"
            onClick={() => navigate(`/teams/${authenticatedUser.teamId}`)}
          >
            {profile.teamName}
          </Link>
        ) : (
          'Aucune team'
        )}
      </p>
      <p>
        <strong>Date d'inscription :</strong> {formattedDate}
      </p>
      <Box>
        <strong>Photo :</strong>{' '}
        {profile?.profilePicture ? (
          <img
            src={profile.profilePicture}
            alt="Photo de profil"
            width={80}
            style={{ borderRadius: 8, verticalAlign: 'middle' }}
          />
        ) : (
          'Aucune photo'
        )}
        <Button
          size="small"
          variant="outlined"
          sx={{ marginLeft: 2 }}
          onClick={() => setOpenPictureModal(true)}
        >
          Modifier
        </Button>
      </Box>
    </Box>
  );
};

export default ProfileInfo;
