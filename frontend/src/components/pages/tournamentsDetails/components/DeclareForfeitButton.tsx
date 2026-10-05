import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';
import { useContext, useState } from 'react';
import { MatchDetailContext } from '../../../../contexts/MatchDetailContext';
import { UserContext } from '../../../../contexts/UserContext';
import { MatchDetailContextType, UserContextType } from '../../../../types';
import { declareForfeit } from '../../../../services/participationService';

interface DeclareForfeitButtonProps {
  onSuccess: () => void;
}

const DeclareForfeitButton = ({ onSuccess }: DeclareForfeitButtonProps) => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const { match, team1, team2 } =
    useContext<MatchDetailContextType>(MatchDetailContext);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (match?.state !== 'PLANIFIED' || !match.tournamentId) {
    return null;
  }

  const tournamentId = match.tournamentId;

  const userId = authenticatedUser?.id;
  const isTeam1Manager =
    userId != null &&
    (team1?.manager?.id === userId || team1?.secondManager?.id === userId);
  const isTeam2Manager =
    userId != null &&
    (team2?.manager?.id === userId || team2?.secondManager?.id === userId);

  const teamId = isTeam1Manager
    ? (match.team1Id ?? null)
    : isTeam2Manager
      ? (match.team2Id ?? null)
      : null;

  if (teamId == null) {
    return null;
  }

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!authenticatedUser?.token) return;

    setSubmitting(true);
    setError(null);

    try {
      await declareForfeit(
        authenticatedUser.token,
        tournamentId,
        match.matchId,
        teamId,
      );
      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="error"
        startIcon={<DangerousOutlinedIcon />}
        onClick={() => setOpen(true)}
        sx={{
          mt: 1,
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'none',
        }}
      >
        Déclarer forfait
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Déclarer forfait</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          Cette action attribuera automatiquement une victoire 5-0 à l’équipe
          adverse et l’enverra au tour suivant.
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
    </>
  );
};

export default DeclareForfeitButton;
