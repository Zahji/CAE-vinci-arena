import { ChangeEvent, FormEvent, useContext } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { TournamentContext } from '../../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../../types';
import TournamentCreateMessages from './TournamentCreateMessages';

const TOURNAMENT_DESCRIPTION_MAX_LENGTH = 150;

const TournamentCreateForm = () => {
  const {
    name,
    description,
    startDate,
    endDate,
    startInscriptionDate,
    endInscriptionDate,
    maxTeams,
    today,
    submitting,
    setName,
    setDescription,
    setStartDate,
    setEndDate,
    setStartInscriptionDate,
    setEndInscriptionDate,
    setMaxTeams,
    submitTournamentCreation,
  } = useContext<TournamentContextType>(TournamentContext);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitTournamentCreation();
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
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
        onChange={(event) =>
          setDescription(
            event.target.value.slice(0, TOURNAMENT_DESCRIPTION_MAX_LENGTH),
          )
        }
        inputProps={{ maxLength: TOURNAMENT_DESCRIPTION_MAX_LENGTH }}
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
        value={startInscriptionDate}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setStartInscriptionDate(event.target.value)
        }
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

      <TournamentCreateMessages />

      <Box sx={{ gridColumn: { md: '1 / span 2' }, textAlign: 'right' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          sx={{
            backgroundColor: '#140746',
            color: '#fbfcfd',
            fontWeight: 800,
            '&:hover': { backgroundColor: '#aeaeae' },
          }}
        >
          {submitting ? 'Création...' : 'Créer'}
        </Button>
      </Box>
    </Box>
  );
};

export default TournamentCreateForm;
