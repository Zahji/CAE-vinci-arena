import { Avatar, Box, Card, CardContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { UserPublicProfile } from '../../../../types';

type MemberCardProps = {
  member: UserPublicProfile;
  isCurrentUser: boolean;
};

const formatDate = (date: string) => date.split('-').reverse().join('/');

const MemberCard = ({ member, isCurrentUser }: MemberCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        textAlign: 'center',
        padding: 2,
        cursor: 'pointer',
        backgroundColor: member.isBanned
          ? 'rgba(169, 167, 167, 0.42)'
          : isCurrentUser
            ? 'rgba(227, 242, 253, 0.5)'
            : undefined,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 6,
        },
      }}
      onClick={() =>
        navigate(isCurrentUser ? '/profile' : `/members/${member.id}`)
      }
    >
      <CardContent>
        <Avatar
          src={member.profilePicture}
          alt={member.tag}
          sx={{
            width: 80,
            height: 80,
            margin: '0 auto 12px',
            filter: member.isBanned ? 'grayscale(100%)' : 'none',
          }}
        />
        <Typography variant="h6" fontWeight="bold">
          {member.tag}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {member.speciality}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {member.teamName ?? 'Aucune team'}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.disabled">
            Membre depuis le {formatDate(member.date)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MemberCard;
