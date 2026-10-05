import { ChangeEvent, SyntheticEvent, useContext } from 'react';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { RegisterContextType } from '../../../../types';
import { RegisterContext } from '../../../../contexts/RegisterContext';
import AvatarSelector from './AvatarSelector';

const RegisterForm = () => {
  const {
    email,
    password,
    tag,
    specialty,
    specialties,
    isPasswordVisible,
    setEmail,
    setPassword,
    setTag,
    setSpecialty,
    togglePasswordVisibility,
    submitRegistration,
  } = useContext<RegisterContextType>(RegisterContext);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    await submitRegistration();
  };

  const handleEmailInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        marginX: 'auto',
      }}
    >
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
            input: { color: 'primary.main' },
            textAlign: 'center',
          }}
        />
      </Box>

      <Box sx={{ marginBottom: 2 }}>
        <TextField
          fullWidth
          id="tag"
          name="tag"
          label="Tag"
          variant="outlined"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          required
          color="primary"
          sx={{
            input: { color: 'primary.main' },
          }}
        />
      </Box>

      <Box sx={{ marginBottom: 2 }}>
        <TextField
          fullWidth
          id="password"
          name="password"
          type={isPasswordVisible ? 'text' : 'password'}
          label="Mot de passe"
          variant="outlined"
          value={password}
          onChange={handlePasswordChange}
          required
          color="primary"
          sx={{
            input: { color: 'primary.main' },
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      isPasswordVisible
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                    onClick={togglePasswordVisibility}
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
        <TextField
          fullWidth
          id="specialty"
          name="specialty"
          select
          label="Specialité"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          required
          sx={{
            '& .MuiSelect-select': {
              textAlign: 'left',
            },
          }}
        >
          {specialties.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ marginBottom: 2, marginTop: 2 }}>
        <AvatarSelector />
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{
          '&:hover': {
            backgroundColor: 'primary.light',
          },
        }}
      >
        Créer le compte
      </Button>
    </Box>
  );
};

export default RegisterForm;
