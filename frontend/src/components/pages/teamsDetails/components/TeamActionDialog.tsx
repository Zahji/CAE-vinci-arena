import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { TeamMemberRow } from '../../../../types';

type ConfirmAction = 'designate' | 'leave' | 'exclude' | null;

type TeamActionDialogProps = {
  confirmAction: ConfirmAction;
  selectedMember: TeamMemberRow | null;
  totalTeamMembers: number;
  actionLoading: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

const TeamActionDialog = ({
  confirmAction,
  selectedMember,
  totalTeamMembers,
  actionLoading,
  onClose,
  onConfirm,
}: TeamActionDialogProps) => {
  return (
    <Dialog
      open={confirmAction !== null}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {confirmAction === 'designate' && 'Confirmer la désignation'}
        {confirmAction === 'leave' && 'Confirmer le départ'}
        {confirmAction === 'exclude' && "Confirmer l'exclusion"}
      </DialogTitle>
      <DialogContent>
        {confirmAction === 'designate' && selectedMember && (
          <Typography>
            Êtes-vous sûr de vouloir désigner {selectedMember.member.tag} comme
            second responsable ? Aucune nouvelle promotion ne sera possible tant
            que la team compte 2 responsables.
          </Typography>
        )}
        {confirmAction === 'leave' && selectedMember && (
          <Typography>
            Êtes vous sûr de vouloir quitter la team ?
            {selectedMember.roleLabel === 'Responsable' &&
              totalTeamMembers === 1 &&
              ' Il ne restera aucun membre donc la team deviendra inactive. Cette action est définitive.'}
          </Typography>
        )}
        {confirmAction === 'exclude' && selectedMember && (
          <Typography>
            Êtes-vous sûr de vouloir exclure {selectedMember.member.tag} de la
            team ?
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={actionLoading !== null}
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export type { ConfirmAction };
export default TeamActionDialog;
