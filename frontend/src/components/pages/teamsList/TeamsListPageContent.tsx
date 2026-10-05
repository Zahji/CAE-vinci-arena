import { useContext } from 'react';
import { Alert, Box, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TeamsListContext } from '../../../contexts/TeamsListContext';
import { TeamsListContextType } from '../../../types';
import CreateTeamForm from './components/CreateTeamForm';
import TeamsTable from './components/TeamsTable';

/**
 * Shows the teams list with the create team form and join buttons.
 * @return {JSX.Element} the page content
 */
const TeamsListPageContent = () => {
  const {
    sortedTeams,
    currentTeamId,
    currentMembership,
    loading,
    error,
    joinError,
    newTeamName,
    acceptManagerRole,
    creating,
    createError,
    showJoinColumn,
    helpText,
    setNewTeamName,
    setAcceptManagerRole,
    clearError,
    clearCreateError,
    clearJoinError,
    handleCreateTeam,
    handleJoinTeam,
  } = useContext<TeamsListContextType>(TeamsListContext);

  const navigate = useNavigate();

  return (
    <Container
      component="main"
      maxWidth="lg"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: '#F0F0F0',
        borderRadius: 2.5,
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      <Box
        sx={{
          padding: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {showJoinColumn && (
          <>
            <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', mt: 2 }}>
              Créer une team
            </Typography>
            <CreateTeamForm
              newTeamName={newTeamName}
              acceptManagerRole={acceptManagerRole}
              creating={creating}
              createError={createError}
              onNameChange={setNewTeamName}
              onAcceptManagerRoleChange={setAcceptManagerRole}
              onClearCreateError={clearCreateError}
              onSubmit={handleCreateTeam}
            />
          </>
        )}

        <Typography variant="h4" sx={{ mb: 2, textAlign: 'center', mt: 0 }}>
          Liste des teams
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 2,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            color: 'text.secondary',
          }}
        >
          {helpText}
        </Typography>

        {error && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Alert severity="error" onClose={clearError}>
              {error}
            </Alert>
          </Box>
        )}
        {joinError && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Alert severity="error" onClose={clearJoinError}>
              {joinError}
            </Alert>
          </Box>
        )}

        <TeamsTable
          teams={sortedTeams}
          loading={loading}
          currentMembership={currentMembership}
          currentTeamId={currentTeamId}
          showJoinColumn={showJoinColumn}
          onNavigate={(teamId) => navigate(`/teams/${teamId}`)}
          onJoin={handleJoinTeam}
        />
      </Box>
    </Container>
  );
};

export default TeamsListPageContent;
