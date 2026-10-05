import { useContext } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
} from '@mui/material';
import { ProfileContextType } from '../../../../types';
import { ProfileContext } from '../../../../contexts/ProfileContext';

const ChangePasswordDialog = () => {
  const {
    openPasswordModal,
    setOpenPasswordModal,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    passwordSuccess,
    handlePasswordUpdate,
  } = useContext<ProfileContextType>(ProfileContext);

  return (
    <Dialog
      open={openPasswordModal}
      onClose={() => setOpenPasswordModal(false)}
    >
      <DialogTitle>Modifier le mot de passe</DialogTitle>
      <DialogContent>
        {passwordError && <Alert severity="error">{passwordError}</Alert>}
        {passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <TextField
            label="Ancien mot de passe"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            sx={{ mt: 2 }}
          />
        </Box>
        <TextField
          label="Nouveau mot de passe"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <TextField
          label="Confirmer"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenPasswordModal(false)}>Annuler</Button>
        <Button variant="contained" onClick={handlePasswordUpdate}>
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
