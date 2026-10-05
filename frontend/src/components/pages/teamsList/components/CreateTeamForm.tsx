import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';

type CreateTeamFormProps = {
  newTeamName: string;
  acceptManagerRole: boolean;
  creating: boolean;
  createError: string | null;
  onNameChange: (name: string) => void;
  onAcceptManagerRoleChange: (value: boolean) => void;
  onClearCreateError: () => void;
  onSubmit: () => void;
};

/**
 * Shows the form to create a new team.
 * @param {CreateTeamFormProps} props - the form props
 * @return {JSX.Element} the form
 */
const CreateTeamForm = ({
  newTeamName,
  acceptManagerRole,
  creating,
  createError,
  onNameChange,
  onAcceptManagerRoleChange,
  onClearCreateError,
  onSubmit,
}: CreateTeamFormProps) => {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        maxWidth: 500,
      }}
    >
      <TextField
        fullWidth
        label="Nom de la team"
        value={newTeamName}
        onChange={(e) => {
          onNameChange(e.target.value);
          onClearCreateError();
        }}
      />

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={acceptManagerRole}
            onChange={(e) => onAcceptManagerRoleChange(e.target.checked)}
          />
        }
        label={
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
              textAlign: 'left',
            }}
          >
            En créant une team, vous acceptez d'être automatiquement désigné
            comme responsable et de participer activement à sa gestion.
          </Typography>
        }
        sx={{ alignSelf: 'flex-start', mt: 1 }}
      />

      {createError && (
        <Alert
          severity="error"
          sx={{ whiteSpace: 'pre-line', width: '100%' }}
          onClose={onClearCreateError}
        >
          {createError}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={creating || !acceptManagerRole}
        sx={{
          mt: 1,
          width: '50%',
          alignSelf: 'center',
          backgroundColor: 'primary.light',
          color: 'white',
          fontWeight: 'bold',
          '&:hover': { backgroundColor: 'primary.main' },
        }}
      >
        {creating ? (
          <CircularProgress size={24} sx={{ color: 'white' }} />
        ) : (
          'Créer une team'
        )}
      </Button>
    </Box>
  );
};

export default CreateTeamForm;
