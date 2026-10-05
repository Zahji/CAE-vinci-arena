import { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { TournamentContext } from '../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../types';
import TournamentActions from './components/TournamentActions';
import TournamentCreateFormContainer from './components/TournamentCreateFormContainer';
import TournamentFilters from './components/TournamentFilters';
import TournamentGenerationController from './components/TournamentGenerationController';

const TournamentPageContent = () => {
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const {
    loading,
    error,
    filteredTournaments,
    helpText,
    isAdmin,
    today,
    formSuccess,
    publishError,
    publishSuccess,
    editError,
    editSuccess,
    handlePublishTournament,
    publishing,
    handleEditTournament,
    editing,
    handleGenerateSchedule,
    generating,
    generateError,
    generateSuccess,
    registeredTournamentIds,
    participatedTournamentIds,
  } = useContext<TournamentContextType>(TournamentContext);

  useEffect(() => {
    if (!formSuccess || !openCreateModal) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setOpenCreateModal(false);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [formSuccess, openCreateModal]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <p>Erreur : {error}</p>;
  }

  return (
    <Box
      sx={{
        margin: 15,
        padding: 1,
        textAlign: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 2.5,
      }}
    >
      <TournamentActions />
      {isAdmin && (
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => setOpenCreateModal(true)}>
            Créer un tournoi
          </Button>
          <Dialog
            open={openCreateModal}
            onClose={() => setOpenCreateModal(false)}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>Créer un tournoi</DialogTitle>
            <DialogContent>
              <TournamentCreateFormContainer />
            </DialogContent>
          </Dialog>
        </Box>
      )}
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {helpText}
      </Typography>
      {publishError && (
        <Box sx={{ color: 'error.main', marginBottom: 2 }}>
          Erreur : {publishError}
        </Box>
      )}
      {publishSuccess && (
        <Box sx={{ color: 'success.main', marginBottom: 2 }}>
          {publishSuccess}
        </Box>
      )}
      {editError && (
        <Box sx={{ color: 'error.main', marginBottom: 2 }}>
          Erreur : {editError}
        </Box>
      )}
      {editSuccess && (
        <Box sx={{ color: 'success.main', marginBottom: 2 }}>{editSuccess}</Box>
      )}
      {generateError && (
        <Box sx={{ color: 'error.main', marginBottom: 2 }}>
          Erreur : {generateError}
        </Box>
      )}
      {generateSuccess && (
        <Box sx={{ color: 'success.main', marginBottom: 2 }}>
          {generateSuccess}
        </Box>
      )}
      <TournamentFilters />
      <TournamentGenerationController
        tournamentList={filteredTournaments}
        isAdmin={isAdmin}
        today={today}
        onPublishTournament={handlePublishTournament}
        isPublishing={publishing}
        onEditTournament={handleEditTournament}
        isEditing={editing}
        handleGenerateSchedule={handleGenerateSchedule}
        isGenerating={generating}
        registeredTournamentIds={registeredTournamentIds}
        participatedTournamentIds={participatedTournamentIds}
      />
    </Box>
  );
};

export default TournamentPageContent;
