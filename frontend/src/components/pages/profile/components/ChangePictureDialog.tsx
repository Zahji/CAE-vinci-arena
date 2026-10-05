import { useContext } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from '@mui/material';
import { ProfileContextType } from '../../../../types';
import { ProfileContext } from '../../../../contexts/ProfileContext';

const ChangePictureDialog = () => {
  const {
    openPictureModal,
    setOpenPictureModal,
    avatarOptions,
    selectedAvatarSrc,
    setSelectedAvatarSrc,
    pictureError,
    handleUpdatePicture,
  } = useContext<ProfileContextType>(ProfileContext);

  return (
    <Dialog open={openPictureModal} onClose={() => setOpenPictureModal(false)}>
      <DialogTitle>Modifier la photo de profil</DialogTitle>
      <DialogContent>
        {pictureError && <Alert severity="error">{pictureError}</Alert>}
        <Stack
          direction="row"
          spacing={1}
          sx={{ overflowX: 'auto', pb: 1, mt: 2 }}
        >
          {avatarOptions.map((avatar) => (
            <IconButton
              key={avatar.id}
              onClick={() => setSelectedAvatarSrc(avatar.src)}
              sx={{
                border:
                  selectedAvatarSrc === avatar.src
                    ? '2px solid blue'
                    : '1px solid grey',
                borderRadius: 2,
              }}
            >
              <Avatar src={avatar.src} sx={{ width: 46, height: 46 }} />
            </IconButton>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenPictureModal(false)}>Annuler</Button>
        <Button variant="contained" onClick={handleUpdatePicture}>
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePictureDialog;
