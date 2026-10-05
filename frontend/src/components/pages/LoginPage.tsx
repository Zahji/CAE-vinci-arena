import { useState, SyntheticEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  useTheme,
} from '@mui/material';
import { UserContextType } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const LoginPage = () => {
  const { loginUser }: UserContextType = useContext(UserContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const theme = useTheme();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await loginUser({ email, password }, rememberMe);
      navigate('/');
    } catch (err) {
      console.error('LoginPage::error: ', err);
      const httpError = err as { status?: number };
      if (httpError.status === 403) {
        setErrorMessage('Votre compte a été banni de la plateforme.');
      } else {
        setErrorMessage(
          "Echec de connexion. Verifiez l'email et le mot de passe.",
        );
      }
    }
  };

  const handleEmailInputChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setEmail(input.value);
  };

  const handlePasswordChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setPassword(input.value);
  };

  const handleRememberMeChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setRememberMe(input.checked);
  };

  return (
    <Box
      sx={{
        paddingTop: '0.25em',
        paddingBottom: '1.5em',
        paddingX: '1.5em',
        borderRadius: 4,
        boxShadow: 4,
        textAlign: 'center',
        backgroundColor: '#FFF',
        marginX: 'auto',
        marginY: '3em',
      }}
      maxWidth="sm"
    >
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <Box sx={{ marginBottom: 2 }}>
          <TextField
            fullWidth
            id="email"
            name="email"
            type="email"
            label="Email"
            variant="outlined"
            value={email}
            onChange={handleEmailInputChange}
            required
            color="primary"
            sx={{
              input: { color: theme.palette.primary.main },
            }}
          />
        </Box>
        <Box sx={{ marginBottom: 2 }}>
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Mot de passe"
            variant="outlined"
            value={password}
            type={isPasswordVisible ? 'text' : 'password'}
            onChange={handlePasswordChange}
            required
            color="primary"
            sx={{
              input: { color: theme.palette.primary.main },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        isPasswordVisible
                          ? 'hide the password'
                          : 'display the password'
                      }
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      edge="end"
                    >
                      {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Box sx={{ marginBottom: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                id="remember-me"
                name="remember-me"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                color="primary"
              />
            }
            label="Se souvenir de moi"
          />
        </Box>
        <Button type="submit" variant="contained" color="primary">
          S'authentifier
        </Button>
        {errorMessage && (
          <Alert severity="error" sx={{ marginTop: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </form>
    </Box>
  );
};

export default LoginPage;
