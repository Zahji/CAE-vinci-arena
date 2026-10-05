import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useContext, useState } from 'react';
import { UserContext } from '../../../../contexts/UserContext';
import { UserContextType, Match } from '../../../../types';
import { contestScore } from '../../../../services/participationService';

interface ContestScoreDialogProps {
  match: Match;
  teamId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ContestScoreDialog = ({
  match,
  teamId,
  open,
  onClose,
  onSuccess,
}: ContestScoreDialogProps) => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!authenticatedUser?.token) return;

    if (!reason.trim()) {
      setError('Veuillez entrer une raison.');
      return;
    }

    if (!match.tournamentId) {
      setError('Données du match incomplètes.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await contestScore(
        authenticatedUser.token,
        match.tournamentId,
        match.matchId,
        teamId,
        reason,
      );
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Contester le score</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Raison de la contestation"
          fullWidth
          multiline
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Envoi...' : 'Confirmer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContestScoreDialog;
