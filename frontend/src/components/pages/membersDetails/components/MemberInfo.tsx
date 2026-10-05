import { Avatar, Box, Button, Link, Typography } from '@mui/material';
import { Unavailability, UserPublicProfile } from '../../../../types';
import UnavailabilityCalendar from './UnavailabilityCalendar';

/**
 * Turns a YYYY-MM-DD date into DD/MM/YYYY.
 * @param {string} date - the date string
 * @return {string} the formatted date
 */
const formatDate = (date: string) => date.split('-').reverse().join('/');

type MemberInfoProps = {
  member: UserPublicProfile;
  isAdmin: boolean;
  currentUserId?: number;
  canViewUnavailabilities: boolean;
  unavailabilities: Unavailability[];
  onNavigateToTeam: (teamId: number) => void;
  onOpenBanModal: () => void;
};

/**
 * Shows the member's avatar, info and ban button.
 * @param {MemberInfoProps} props - the component props
 * @return {JSX.Element} the member info
 */
const MemberInfo = ({
  member,
  isAdmin,
  currentUserId,
  canViewUnavailabilities,
  unavailabilities,
  onNavigateToTeam,
  onOpenBanModal,
}: MemberInfoProps) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 4 }}>
            {member.tag}
          </Typography>
          <Avatar
            src={member.profilePicture}
            alt={member.tag}
            sx={{ width: 120, height: 120 }}
          />
        </Box>
        {canViewUnavailabilities && (
          <UnavailabilityCalendar unavailabilities={unavailabilities} />
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 2,
          alignItems: 'center',
          border: '1px solid',
          borderColor: 'text.primary',
          borderRadius: 2,
          px: 2,
          py: 1,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {member.speciality}
        </Typography>
        {member.teamId ? (
          <Link
            variant="body1"
            color="info.main"
            sx={{ cursor: 'pointer' }}
            onClick={() => onNavigateToTeam(member.teamId!)}
          >
            {member.teamName}
          </Link>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Aucune team
          </Typography>
        )}
        <Typography variant="body2" color="text.disabled">
          Membre depuis le {formatDate(member.date)}
        </Typography>
      </Box>
      {member.isBanned ? (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          Ce membre ne fait plus partie de la plateforme.
        </Typography>
      ) : (
        isAdmin &&
        member.id !== currentUserId && (
          <Button variant="contained" color="error" onClick={onOpenBanModal}>
            Bannir
          </Button>
        )
      )}
    </>
  );
};

export default MemberInfo;
