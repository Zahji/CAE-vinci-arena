import {
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Team, TeamMembership } from '../../../../types';

type TeamsTableProps = {
  teams: Team[];
  loading: boolean;
  currentMembership: TeamMembership | null;
  currentTeamId: number | undefined;
  showJoinColumn: boolean;
  onNavigate: (teamId: number) => void;
  onJoin: (teamId: number) => void;
};

/**
 * Shows the list of teams in a table with join buttons.
 * @param {TeamsTableProps} props - the table props
 * @return {JSX.Element} the table
 */
const TeamsTable = ({
  teams,
  loading,
  currentMembership,
  currentTeamId,
  showJoinColumn,
  onNavigate,
  onJoin,
}: TeamsTableProps) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        width: '100%',
        flex: 1,
        maxHeight: 450,
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: 10 },
        '&::-webkit-scrollbar-track': { backgroundColor: '#f1f1f1' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#bdbdbd',
          borderRadius: 5,
        },
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell align="center">Nom</TableCell>
            <TableCell align="center">Nombre de membres</TableCell>
            {showJoinColumn && (
              <TableCell align="center">Demande d'adhésion</TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : (
            teams.map((team) => {
              const isUserTeam = team.id === currentTeamId;
              const isInactiveTeam =
                team.managersCount + team.membersCount === 0;
              const isPendingForTeam =
                currentMembership?.status === 'PENDING' &&
                currentMembership.team.id === team.id;
              const hasBlockedMembership =
                currentTeamId !== undefined ||
                currentMembership?.status === 'PENDING' ||
                currentMembership?.status === 'ACCEPTED';

              return (
                <TableRow
                  key={team.id}
                  sx={{
                    backgroundColor: isInactiveTeam
                      ? '#f5f5f5'
                      : isUserTeam
                        ? 'rgba(227, 242, 253, 0.7)'
                        : 'white',
                    cursor: isInactiveTeam ? 'default' : 'pointer',
                    opacity: isInactiveTeam ? 0.5 : 1,
                  }}
                  onClick={() => !isInactiveTeam && onNavigate(team.id)}
                >
                  <TableCell align="center">{team.name}</TableCell>
                  <TableCell align="center">
                    {team.managersCount + team.membersCount}
                  </TableCell>
                  {showJoinColumn && (
                    <TableCell align="center">
                      {isUserTeam ? (
                        'Ma team'
                      ) : isInactiveTeam ? (
                        'Team inactive'
                      ) : isPendingForTeam ? (
                        'Demande en attente'
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={hasBlockedMembership}
                          onClick={(e) => {
                            e.stopPropagation();
                            onJoin(team.id);
                          }}
                        >
                          {hasBlockedMembership ? 'Indisponible' : 'Rejoindre'}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TeamsTable;
