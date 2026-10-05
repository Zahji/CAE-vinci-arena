import { useContext } from 'react';
import { Alert } from '@mui/material';
import { RegisterContextType } from '../../../../types';
import { RegisterContext } from '../../../../contexts/RegisterContext';

const FormMessages = () => {
  const { errorMessage, successMessage } =
    useContext<RegisterContextType>(RegisterContext);

  return (
    <>
      {errorMessage && (
        <Alert severity="error" sx={{ marginTop: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ marginTop: 2 }}>
          {successMessage}
        </Alert>
      )}
    </>
  );
};

export default FormMessages;
