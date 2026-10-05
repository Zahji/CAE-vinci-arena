import { useState } from 'react';
import {
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Box,
  Typography,
  Button,
  Tooltip,
} from '@mui/material';
import {
  CreateTournamentPayload,
  Tournament,
  PublishTournamentPayload,
} from '../../../../types';
import { useNavigate } from 'react-router-dom';
import EditTournamentDialog from './EditTournamentDialog';
import PublishTournamentDialog from './PublishTournamentDialog';

type TournamentTableProps = {
  tournamentList: Tournament[] | null;
  showOnlyName?: boolean;
  isAdmin?: boolean;
  today?: string;
  now?: Date;
  onPublishTournament?: (
    tournamentId: number,
    payload: PublishTournamentPayload,
  ) => Promise<void>;
  isPublishing?: boolean;
  onEditTournament?: (
    tournament: Tournament,
    payload: CreateTournamentPayload,
  ) => Promise<void>;
  isEditing?: boolean;
  onGenerateSchedule?: (tournamentId: number) => Promise<void>;
  isGenerating?: boolean;
  lockedTournamentIds?: Set<number>;
  registeredTournamentIds?: Set<number>;
  participatedTournamentIds?: Set<number>;
};

const formatDate = (date: string) => date.split('-').reverse().join('/');

const canPublishTournament = (tournament: Tournament): boolean => {
  return tournament.state === 'IN_PREPARATION';
};

const canEditTournament = (tournament: Tournament): boolean => {
  return tournament.state === 'IN_PREPARATION';
};

const isGenerationWindowOpen = (tournament: Tournament, today: string) => {
  const todayDate = new Date(`${today}T00:00:00`);
  const endInscriptionDate = new Date(
    `${tournament.endInscriptionDate}T00:00:00`,
  );

  const isRegistrationClosed = todayDate > endInscriptionDate;
  const isTournamentFull = tournament.registrationsCount >= tournament.maxTeams;

  return isRegistrationClosed || isTournamentFull;
};

const isTournamentStartDateTimePassed = (
  tournamentStartDate: string,
  now: Date,
) => {
  const startDateTime = new Date(`${tournamentStartDate}T13:00:00`);
  return now.getTime() > startDateTime.getTime();
};

const canGenerateSchedule = (
  tournament: Tournament,
  today: string,
  now: Date,
): boolean => {
  return (
    tournament.state === 'PLANIFIED' &&
    isGenerationWindowOpen(tournament, today) &&
    !isTournamentStartDateTimePassed(tournament.startDate, now) &&
    tournament.registrationsCount >= 2
  );
};

const getGenerateScheduleDisabledReason = (
  tournament: Tournament,
  today: string,
  now: Date,
): string | null => {
  if (tournament.state !== 'PLANIFIED') {
    return 'Le tournoi doit être en état Planifié';
  }
  if (!isGenerationWindowOpen(tournament, today)) {
    return "Génération possible après la fin des inscriptions ou quand le nombre max d'équipes est atteint";
  }
  if (isTournamentStartDateTimePassed(tournament.startDate, now)) {
    return 'Génération impossible: la date de début du tournoi est déjà passée';
  }
  if (tournament.registrationsCount < 2) {
    return 'Minimum 2 équipes inscrites requises';
  }
  return null;
};

const getStatusConfig = (state: string) => {
  switch (state) {
    case 'IN_PREPARATION':
      return { color: '#9E9E9E', label: 'En préparation' };
    case 'PLANIFIED':
      return { color: '#2196F3', label: 'Planifié' };
    case 'OPEN':
      return { color: '#4CAF50', label: 'Ouvert' };
    case 'ONGOING':
      return { color: '#FFA500', label: 'En cours' };
    default:
      return { color: '#9E9E9E', label: state || 'Inconnu' };
  }
};

type PendingPublish = {
  id: number;
  name: string;
  payload: PublishTournamentPayload;
};

const TournamentTable = ({
  tournamentList,
  showOnlyName = false,
  isAdmin = false,
  today,
  now,
  onPublishTournament,
  isPublishing = false,
  onEditTournament,
  isEditing = false,
  onGenerateSchedule,
  isGenerating = false,
  lockedTournamentIds,
  registeredTournamentIds,
  participatedTournamentIds,
}: TournamentTableProps) => {
  const navigate = useNavigate();
  const [pendingPublish, setPendingPublish] = useState<PendingPublish | null>(
    null,
  );
  const [pendingEdit, setPendingEdit] = useState<Tournament | null>(null);
  const currentNow = now ?? new Date();
  const currentDate =
    today ??
    `${currentNow.getFullYear()}-${String(currentNow.getMonth() + 1).padStart(2, '0')}-${String(currentNow.getDate()).padStart(2, '0')}`;

  if (!tournamentList || tournamentList.length === 0) {
    return (
      <Paper sx={{ padding: 2 }}>
        <p>Aucun tournoi actuellement.</p>
      </Paper>
    );
  }
  if (showOnlyName) {
    return (
      <TableContainer
        component={Paper}
        sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}
      >
        <Table size="small">
          <TableBody>
            {tournamentList.map((tournament) => {
              const { color, label } = getStatusConfig(tournament.state);
              return (
                <TableRow
                  key={tournament.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                >
                  <TableCell
                    sx={{
                      color: '#F6F7FF',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      width: '70%',
                    }}
                  >
                    {tournament.name}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      width: '30%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: color,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#C8CEDE' }}>
                        {label}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2,
        width: '100%',
      }}
    >
      {tournamentList.map((tournament) => {
        const isRegistered =
          registeredTournamentIds?.has(tournament.id) ?? false;
        const hasParticipated =
          participatedTournamentIds?.has(tournament.id) ?? false;
        const isGenerationLocked =
          lockedTournamentIds?.has(tournament.id) ?? false;

        return (
          <Card
            key={tournament.id}
            data-highlighted={
              isRegistered && hasParticipated ? 'true' : 'false'
            }
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: '1px solid rgba(0,0,0,0.08)',
              backgroundColor:
                isRegistered && hasParticipated
                  ? 'rgba(227, 242, 253, 0.7)'
                  : '#FFFFFF',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: 6,
              },
            }}
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                {tournament.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Début des inscriptions :{' '}
                {formatDate(tournament.startInscriptionDate)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                Fin des inscriptions :{' '}
                {formatDate(tournament.endInscriptionDate)}
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                Teams inscrites : {tournament.registrationsCount}/
                {tournament.maxTeams}
              </Typography>

              {isAdmin && (
                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    disabled={!canEditTournament(tournament) || isEditing}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingEdit(tournament);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={!canPublishTournament(tournament) || isPublishing}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingPublish({
                        id: tournament.id,
                        name: tournament.name,
                        payload: {
                          name: tournament.name,
                          description: tournament.description,
                          startDate: tournament.startDate,
                          endDate: tournament.endDate,
                          startInscriptionDate: tournament.startInscriptionDate,
                          endInscriptionDate: tournament.endInscriptionDate,
                          maxTeams: tournament.maxTeams,
                          state: 'PLANIFIED',
                        },
                      });
                    }}
                  >
                    Publier
                  </Button>
                  <Tooltip
                    title={
                      !canGenerateSchedule(tournament, currentDate, currentNow)
                        ? getGenerateScheduleDisabledReason(
                            tournament,
                            currentDate,
                            currentNow,
                          )
                        : isGenerating
                          ? 'Génération en cours...'
                          : ''
                    }
                  >
                    <span>
                      <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        sx={{
                          '&.Mui-disabled': {
                            color: 'rgba(0, 0, 0, 0.26)',
                            borderColor: 'rgba(0, 0, 0, 0.12)',
                            backgroundColor: 'rgba(0, 0, 0, 0.12)',
                            cursor: 'not-allowed',
                            opacity: 0.6,
                          },
                        }}
                        disabled={
                          !canGenerateSchedule(
                            tournament,
                            currentDate,
                            currentNow,
                          ) ||
                          isGenerating ||
                          isGenerationLocked
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateSchedule?.(tournament.id);
                        }}
                      >
                        {isGenerating ? 'Génération...' : 'Générer planning'}
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
      {pendingEdit && (
        <EditTournamentDialog
          key={pendingEdit.id}
          open
          tournament={pendingEdit}
          isEditing={isEditing}
          onClose={() => setPendingEdit(null)}
          onConfirm={async (payload) => {
            if (onEditTournament) {
              await onEditTournament(pendingEdit, payload);
            }
            setPendingEdit(null);
          }}
        />
      )}
      <PublishTournamentDialog
        open={pendingPublish !== null}
        tournamentName={pendingPublish?.name ?? ''}
        isPublishing={isPublishing}
        onClose={() => setPendingPublish(null)}
        onConfirm={() => {
          if (pendingPublish && onPublishTournament) {
            void onPublishTournament(
              pendingPublish.id,
              pendingPublish.payload,
            ).then(() => setPendingPublish(null));
          }
        }}
      />
    </Box>
  );
};

export default TournamentTable;
