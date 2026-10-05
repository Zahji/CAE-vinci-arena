import { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { TeamDetailsContext } from '../../../contexts/TeamDetailsContext';
import { TeamActivity, TeamDetailsContextType } from '../../../types';
import TeamMembersTable from './components/TeamMembersTable';

const ActivityColumn = ({
  title,
  items,
}: {
  title: string;
  items: TeamActivity[];
}) => (
  <Box>
    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
      {title}
    </Typography>
    {items.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        Aucun tournoi
      </Typography>
    ) : (
      <Stack spacing={0.5}>
        {items.map((a) => (
          <Link
            key={a.tournamentId}
            to={`/tournaments/${a.tournamentId}`}
            style={{ textDecoration: 'none' }}
          >
            <Typography variant="body2" sx={{ color: 'info.main' }}>
              {a.tournamentName}
            </Typography>
          </Link>
        ))}
      </Stack>
    )}
  </Box>
);

const TeamDetailsPageContent = () => {
  const {
    team,
    memberList,
    totalTeamMembers,
    isPrimaryManager,
    isSecondManager,
    canViewMemberEmail,
    currentUserId,
    loading,
    error,
    success,
    actionLoading,
    pastActivity,
    ongoingActivity,
    futureActivity,
    clearError,
    clearSuccess,
    handleDesignateSecondManager,
    handleLeaveTeam,
    handleExcludeMember,
  } = useContext<TeamDetailsContextType>(TeamDetailsContext);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={clearError}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={clearSuccess}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Paper sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Paper>
        ) : !team ? (
          <Alert severity="warning">Team introuvable.</Alert>
        ) : (
          <>
            {isPrimaryManager &&
              totalTeamMembers > 1 &&
              !team.secondManager && (
                <Alert severity="warning">
                  Vous êtes responsable principal.{'\n'}Pour quitter la team,
                  désignez d&apos;abord un second responsable.
                </Alert>
              )}

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  background:
                    'linear-gradient(90deg, rgba(15,37,78,0.08) 0%, rgba(219,178,77,0.12) 100%)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Membres de la team : {team.name}
                </Typography>
              </Box>

              <TeamMembersTable
                memberList={memberList}
                team={team}
                totalTeamMembers={totalTeamMembers}
                currentUserId={currentUserId}
                isPrimaryManager={isPrimaryManager}
                isSecondManager={isSecondManager}
                canViewMemberEmail={canViewMemberEmail}
                actionLoading={actionLoading}
                onDesignate={handleDesignateSecondManager}
                onLeave={handleLeaveTeam}
                onExclude={handleExcludeMember}
              />
            </Paper>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  background:
                    'linear-gradient(90deg, rgba(15,37,78,0.08) 0%, rgba(219,178,77,0.12) 100%)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Activité de la team
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 3,
                  p: 3,
                }}
              >
                <ActivityColumn title="Passés" items={pastActivity} />
                <ActivityColumn title="En cours" items={ongoingActivity} />
                <ActivityColumn title="Futurs" items={futureActivity} />
              </Box>
            </Paper>
          </>
        )}
      </Stack>
    </Container>
  );
};

export default TeamDetailsPageContent;
