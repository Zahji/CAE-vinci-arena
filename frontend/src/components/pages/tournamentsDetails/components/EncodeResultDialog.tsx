import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { useContext, useState } from 'react';
import { UserContext } from '../../../../contexts/UserContext';
import { UserContextType, Match } from '../../../../types';
import { updateScore } from '../../../../services/participationService';

interface EncodeResultDialogProps {
  match: Match;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EncodeResultDialog = ({
  match,
  open,
  onClose,
  onSuccess,
}: EncodeResultDialogProps) => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setScore1('');
    setScore2('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!authenticatedUser?.token) return;

    const s1 = parseInt(score1);
    const s2 = parseInt(score2);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setError('Veuillez entrer des scores valides (nombres positifs).');
      return;
    }

    if (!match.team1Id || !match.team2Id || !match.tournamentId) {
      setError('Données du match incomplètes.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateScore(
        authenticatedUser.token,
        match.tournamentId,
        match.matchId,
        match.team1Id,
        s1,
      );
      await updateScore(
        authenticatedUser.token,
        match.tournamentId,
        match.matchId,
        match.team2Id,
        s2,
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
      <DialogTitle>Encoder le résultat</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ flex: 1, fontWeight: 600 }}>
              {match.team1Name ?? 'Équipe 1'}
            </Typography>
            <TextField
              type="number"
              label="Score"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              inputProps={{ min: 0 }}
              sx={{ width: 100 }}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ flex: 1, fontWeight: 600 }}>
              {match.team2Name ?? 'Équipe 2'}
            </Typography>
            <TextField
              type="number"
              label="Score"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              inputProps={{ min: 0 }}
              sx={{ width: 100 }}
              size="small"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Envoi...' : 'Confirmer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EncodeResultDialog;
