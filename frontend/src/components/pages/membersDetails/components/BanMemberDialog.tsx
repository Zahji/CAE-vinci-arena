import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

type BanMemberDialogProps = {
  open: boolean;
  memberTag: string;
  banError: string;
  onClose: () => void;
  onConfirm: () => void;
};

const BanMemberDialog = ({
  open,
  memberTag,
  banError,
  onClose,
  onConfirm,
}: BanMemberDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmer le bannissement</DialogTitle>
      <DialogContent>
        {banError && <Alert severity="error">{banError}</Alert>}
        <DialogContentText>
          Êtes-vous sûr de vouloir bannir <strong>{memberTag}</strong> ? Cette
          action est irréversible.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Bannir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BanMemberDialog;
