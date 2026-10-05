import { useContext } from 'react';
import { Alert } from '@mui/material';
import { TournamentContext } from '../../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../../types';

const TournamentCreateMessages = () => {
  const { formError, formSuccess } =
    useContext<TournamentContextType>(TournamentContext);

  return (
    <>
      {formError && (
        <Alert severity="error" sx={{ gridColumn: { md: '1 / span 2' } }}>
          {formError}
        </Alert>
      )}

      {formSuccess && (
        <Alert severity="success" sx={{ gridColumn: { md: '1 / span 2' } }}>
          {formSuccess}
        </Alert>
      )}
    </>
  );
};

export default TournamentCreateMessages;
