import { Box } from '@mui/material';
import RegisterFormContainer from './components/RegisterFormContainer';

const RegisterPageContent = () => (
  <Box
    sx={{
      justifyContent: 'center',
      marginX: 'auto',
      marginY: '3em',
    }}
    maxWidth="sm"
  >
    <RegisterFormContainer />
  </Box>
);

export default RegisterPageContent;
