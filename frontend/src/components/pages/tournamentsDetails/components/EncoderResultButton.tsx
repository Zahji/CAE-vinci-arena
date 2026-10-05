import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useContext, useState } from 'react';
import { UserContext } from '../../../../contexts/UserContext';
import { TournamentDetailsContext } from '../../../../contexts/TournamentDetailsContext';
import {
  UserContextType,
  Match,
  TournamentDetailsContextType,
} from '../../../../types';
import EncodeResultDialog from './EncodeResultDialog';

interface EncoderResultButtonProps {
  match: Match;
  tournamentId: number;
  onSuccess: () => void;
}

const EncoderResultButton = ({
  match,
  onSuccess,
}: EncoderResultButtonProps) => {
  const { authenticatedUser, jwtData } =
    useContext<UserContextType>(UserContext);
  const { alreadyRegistered } = useContext<TournamentDetailsContextType>(
    TournamentDetailsContext,
  );
  const [open, setOpen] = useState(false);

  const isAdmin = Boolean(jwtData()?.isAdmin);
  const isMatchAdmin = isAdmin && authenticatedUser?.id === match.adminId;
  const isOngoing = match.state === 'ONGOING';
  const isContested = match.state === 'CONTESTED';

  if (!isMatchAdmin || (!isOngoing && !isContested) || alreadyRegistered) {
    return null;
  }

  return (
    <>
      <Button
        size="small"
        variant="contained"
        color="warning"
        startIcon={<EditIcon />}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        sx={{
          mt: 1,
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'none',
        }}
      >
        Encoder résultat
      </Button>
      <EncodeResultDialog
        match={match}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          onSuccess();
        }}
      />
    </>
  );
};

export default EncoderResultButton;
