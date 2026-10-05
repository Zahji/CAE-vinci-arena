import { useContext } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { ProfileContextType } from '../../../../types';
import { ProfileContext } from '../../../../contexts/ProfileContext';

const ChangeSpecialityDialog = () => {
  const {
    openSpecialityModal,
    setOpenSpecialityModal,
    specialties,
    newSpeciality,
    setNewSpeciality,
    specialityError,
    handleUpdateSpeciality,
  } = useContext<ProfileContextType>(ProfileContext);

  return (
    <Dialog
      open={openSpecialityModal}
      onClose={() => setOpenSpecialityModal(false)}
    >
      <DialogTitle>Modifier la spécialité</DialogTitle>
      <DialogContent>
        {specialityError && <Alert severity="error">{specialityError}</Alert>}
        <TextField
          fullWidth
          select
          label="Spécialité"
          value={newSpeciality}
          onChange={(e) => setNewSpeciality(e.target.value)}
          sx={{ mt: 2 }}
        >
          {specialties.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenSpecialityModal(false)}>Annuler</Button>
        <Button variant="contained" onClick={handleUpdateSpeciality}>
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeSpecialityDialog;
