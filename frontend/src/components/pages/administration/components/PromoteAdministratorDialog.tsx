import { SyntheticEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { UserProfile } from '../../../../types';

type PromoteAdministratorDialogProps = {
  open: boolean;
  nonAdmins: UserProfile[];
  selectedUserId: number | '';
  promoteError: string;
  onClose: () => void;
  onConfirm: () => void;
  onUserChange: (e: SyntheticEvent) => void;
};

const PromoteAdministratorDialog = ({
  open,
  nonAdmins,
  selectedUserId,
  promoteError,
  onClose,
  onConfirm,
  onUserChange,
}: PromoteAdministratorDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Nommer un administrateur</DialogTitle>
      <DialogContent>
        {promoteError && <Alert severity="error">{promoteError}</Alert>}
        {nonAdmins.length === 0 ? (
          <Box sx={{ padding: 2, textAlign: 'center' }}>
            <p>Aucun utilisateur non-administrateur disponible.</p>
          </Box>
        ) : (
          <TextField
            select
            label="Utilisateur"
            value={selectedUserId}
            onChange={onUserChange}
            fullWidth
            margin="normal"
          >
            {nonAdmins.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.email} ({user.tag})
              </MenuItem>
            ))}
          </TextField>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={selectedUserId === '' || nonAdmins.length === 0}
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromoteAdministratorDialog;
