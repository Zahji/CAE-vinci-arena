import { Link } from 'react-router-dom';
import { Box, Typography, useTheme } from '@mui/material';
import RegisterForm from './RegisterForm';
import FormMessages from './FormMessages';

const RegisterFormContainer = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        padding: '1.5em',
        boxShadow: 4,
        borderRadius: 4,
        textAlign: 'center',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 700 }}>
        S'inscrire
      </Typography>

      <RegisterForm />

      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
        Vous avez déjà un compte ? <Link to="/login">Connectez-vous</Link>
      </Typography>

      <FormMessages />
    </Box>
  );
};

export default RegisterFormContainer;
