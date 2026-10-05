import { useContext } from 'react';
import { Paper, Typography } from '@mui/material';
import { TournamentContext } from '../../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../../types';
import TournamentCreateForm from './TournamentCreateForm';

const TournamentCreateFormContainer = () => {
  const { isAdmin } = useContext<TournamentContextType>(TournamentContext);

  if (!isAdmin) {
    return null;
  }

  return (
    <Paper
      sx={{
        maxWidth: 760,
        margin: '0 auto 24px auto',
        padding: 3,
        backgroundColor: '#ffffff',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: '#333333',
          fontWeight: 600,
          marginBottom: 2,
        }}
      >
        CRÉER UN TOURNOI
      </Typography>

      <TournamentCreateForm />
    </Paper>
  );
};

export default TournamentCreateFormContainer;
