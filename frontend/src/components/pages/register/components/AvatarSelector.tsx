import { useContext } from 'react';
import { Avatar, IconButton, Stack, Typography, useTheme } from '@mui/material';
import { RegisterContextType } from '../../../../types';
import { RegisterContext } from '../../../../contexts/RegisterContext';

const AvatarSelector = () => {
  const { avatarOptions, selectedAvatarId, setSelectedAvatarId } =
    useContext<RegisterContextType>(RegisterContext);
  const theme = useTheme();

  return (
    <>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Choisir une photo de profil
      </Typography>
      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
        {avatarOptions.map((avatar) => (
          <IconButton
            key={avatar.id}
            onClick={() => setSelectedAvatarId(avatar.id)}
            aria-label={`Choisir l'avatar ${avatar.label}`}
            sx={{
              border:
                selectedAvatarId === avatar.id
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Avatar
              src={avatar.src}
              alt={avatar.label}
              imgProps={{ loading: 'eager' }}
              sx={{ width: 46, height: 46 }}
            />
          </IconButton>
        ))}
      </Stack>
    </>
  );
};

export default AvatarSelector;
