import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

type PublishTournamentDialogProps = {
  open: boolean;
  tournamentName: string;
  onClose: () => void;
  onConfirm: () => void;
  isPublishing: boolean;
};

const PublishTournamentDialog = ({
  open,
  tournamentName,
  onClose,
  onConfirm,
  isPublishing,
}: PublishTournamentDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmer la publication</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Êtes-vous sûr de vouloir publier le tournoi{' '}
          <strong>{tournamentName}</strong> ? Il passera à l'état{' '}
          <strong>Planifié</strong> et sera visible par tous les joueurs.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPublishing}>
          Annuler
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={onConfirm}
          disabled={isPublishing}
        >
          {isPublishing ? 'Publication...' : 'Publier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PublishTournamentDialog;
