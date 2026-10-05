import { useContext } from 'react';
import { Box, Button } from '@mui/material';
import { ProfileContextType, UserContextType } from '../../../../types';
import { ProfileContext } from '../../../../contexts/ProfileContext';
import { UserContext } from '../../../../contexts/UserContext';

const PrivateInfo = () => {
  const {
    profile,
    unavailabilities,
    setOpenPasswordModal,
    setOpenUnavailModal,
  } = useContext<ProfileContextType>(ProfileContext);
  const { jwtData } = useContext<UserContextType>(UserContext);

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
      <h2>Mes Informations Privées</h2>
      <p>
        <strong>Email :</strong> {profile?.email}
      </p>
      <p>
        <strong>Responsable d'une team :</strong>{' '}
        {profile?.isManager ? 'Oui' : 'Non'}
      </p>
      <p>
        <strong>Administrateur :</strong> {jwtData()?.isAdmin ? 'Oui' : 'Non'}
      </p>
      <p>
        <strong>Mot de passe :</strong> ••••••••
        <Button
          size="small"
          variant="outlined"
          sx={{ marginLeft: 2 }}
          onClick={() => setOpenPasswordModal(true)}
        >
          Modifier
        </Button>
      </p>
      <Box>
        <strong>Mes indisponibilités :</strong>
        <Button
          size="small"
          variant="outlined"
          sx={{ marginLeft: 2 }}
          onClick={() => setOpenUnavailModal(true)}
        >
          Ajouter
        </Button>
        {unavailabilities.length === 0 ? (
          <p>Aucune indisponibilité</p>
        ) : (
          <ul>
            {unavailabilities.map((u) => (
              <li key={u.id}>
                {u.startDate.split('-').reverse().join('/')} -{' '}
                {u.endDate.split('-').reverse().join('/')}
              </li>
            ))}
          </ul>
        )}
      </Box>
    </Box>
  );
};

export default PrivateInfo;
