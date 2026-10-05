import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { CreateTournamentPayload, Tournament } from '../../../../types';
import { toLocalDateInputValue } from '../../../../utils/dateUtils';
import { validateTournamentForm } from '../../../../utils/tournamentFormValidation';

type EditTournamentDialogProps = {
  open: boolean;
  tournament: Tournament | null;
  isEditing: boolean;
  onClose: () => void;
  onConfirm: (payload: CreateTournamentPayload) => Promise<void>;
};

const EditTournamentDialog = ({
  open,
  tournament,
  isEditing,
  onClose,
  onConfirm,
}: EditTournamentDialogProps) => {
  const today = useMemo(() => toLocalDateInputValue(new Date()), []);

  const [name, setName] = useState(tournament?.name ?? '');
  const [description, setDescription] = useState(tournament?.description ?? '');
  const [startDate, setStartDate] = useState(tournament?.startDate ?? '');
  const [endDate, setEndDate] = useState(tournament?.endDate ?? '');
  const [startInscriptionDate, setStartInscriptionDate] = useState(
    tournament?.startInscriptionDate ?? today,
  );
  const [endInscriptionDate, setEndInscriptionDate] = useState(
    tournament?.endInscriptionDate ?? '',
  );
  const [maxTeams, setMaxTeams] = useState(
    tournament ? String(tournament.maxTeams) : '2',
  );
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const error = validateTournamentForm({
      today,
      name,
      description,
      startDate,
      endDate,
      startInscriptionDate,
      endInscriptionDate,
      maxTeams,
    });
    if (error) {
      setFormError(error);
      return;
    }

    setFormError(null);

    await onConfirm({
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      startInscriptionDate,
      endInscriptionDate,
      maxTeams: Number(maxTeams),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Modifier le tournoi</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
            pt: 1,
            '& .MuiInputBase-input, & .MuiInputLabel-root': {
              color: '#01030c',
            },
            '& .MuiOutlinedInput-root fieldset': {
              borderColor: 'rgba(10, 0, 0, 0.35)',
            },
            '& .MuiOutlinedInput-root:hover fieldset': {
              borderColor: 'rgba(5, 4, 0, 0.8)',
            },
            '& .MuiOutlinedInput-root.Mui-focused fieldset': {
              borderColor: '#050400',
            },
          }}
        >
          <TextField
            fullWidth
            label="Nom"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <TextField
            fullWidth
            label="Nombre maximum de teams"
            name="maxTeams"
            type="number"
            inputProps={{ min: 2 }}
            value={maxTeams}
            onChange={(event) => setMaxTeams(event.target.value)}
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            sx={{ gridColumn: { md: '1 / span 2' } }}
          />

          <TextField
            fullWidth
            label="Date du début du tournoi"
            name="startDate"
            type="date"
            inputProps={{ min: today }}
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />

          <TextField
            fullWidth
            label="Date de fin du tournoi"
            name="endDate"
            type="date"
            inputProps={{ min: today }}
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />

          <TextField
            fullWidth
            label="Date début des inscriptions"
            name="startInscriptionDate"
            type="date"
            inputProps={{ min: today }}
            InputLabelProps={{ shrink: true }}
            value={startInscriptionDate}
            onChange={(event) => setStartInscriptionDate(event.target.value)}
          />

          <TextField
            fullWidth
            label="Date limite des inscriptions"
            name="endInscriptionDate"
            type="date"
            inputProps={{ min: today }}
            InputLabelProps={{ shrink: true }}
            value={endInscriptionDate}
            onChange={(event) => setEndInscriptionDate(event.target.value)}
          />

          {formError && (
            <Alert severity="error" sx={{ gridColumn: { md: '1 / span 2' } }}>
              {formError}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isEditing}>
          Annuler
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isEditing}
        >
          {isEditing ? 'Modification...' : 'Modifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTournamentDialog;
