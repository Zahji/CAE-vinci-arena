import { Button } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import { useContext, useState } from 'react';
import { UserContext } from '../../../../contexts/UserContext';
import { UserContextType, Match } from '../../../../types';
import ContestScoreDialog from './ContestScoreDialog';

interface ContestScoreButtonProps {
  match: Match;
  onSuccess: () => void;
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const ContestScoreButton = ({ match, onSuccess }: ContestScoreButtonProps) => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const [open, setOpen] = useState(false);

  // Must be ENDED
  if (match.state !== 'ENDED') return null;

  // Must have scores encoded
  if (match.team1Score == null || match.team2Score == null) return null;

  if (match?.team1Forfeit || match?.team2Forfeit) {
    return null;
  }

  // Must be within 2 hours of score encoding
  if (!match.scoreUpdatedAt) return null;
  const timeSinceUpdate = Date.now() - new Date(match.scoreUpdatedAt).getTime();
  if (timeSinceUpdate > TWO_HOURS_MS) return null;

  // Determine which team this user manages
  const userTeamId = authenticatedUser?.teamId;
  const isTeam1 = userTeamId === match.team1Id;
  const isTeam2 = userTeamId === match.team2Id;

  if (!isTeam1 && !isTeam2) return null;

  // Check if this team already contested
  const alreadyContested = isTeam1
    ? match.team1MotifRefuse != null
    : match.team2MotifRefuse != null;

  if (alreadyContested) return null;

  const teamId = isTeam1 ? match.team1Id! : match.team2Id!;

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="error"
        startIcon={<GavelIcon />}
        onClick={() => setOpen(true)}
        sx={{
          mt: 1,
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'none',
        }}
      >
        Contester
      </Button>
      <ContestScoreDialog
        match={match}
        teamId={teamId}
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

export default ContestScoreButton;
