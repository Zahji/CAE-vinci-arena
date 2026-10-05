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

const AddUnavailabilityDialog = () => {
  const {
    openUnavailModal,
    setOpenUnavailModal,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    unavailError,
    handleAddUnavailability,
  } = useContext<ProfileContextType>(ProfileContext);

  return (
    <Dialog open={openUnavailModal} onClose={() => setOpenUnavailModal(false)}>
      <DialogTitle>Ajouter une indisponibilité</DialogTitle>
      <DialogContent>
        {unavailError && <Alert severity="error">{unavailError}</Alert>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <TextField
            label="Date de début"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Date de fin"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenUnavailModal(false)}>Annuler</Button>
        <Button variant="contained" onClick={handleAddUnavailability}>
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUnavailabilityDialog;
