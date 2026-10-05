import { useState } from 'react';
import {
  Button,
  Chip,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import { useNavigate } from 'react-router-dom';
import { Team, TeamMemberRow } from '../../../../types';
import TeamActionDialog, { ConfirmAction } from './TeamActionDialog';

type TeamMembersTableProps = {
  memberList: TeamMemberRow[];
  team: Team;
  totalTeamMembers: number;
  currentUserId?: number;
  isPrimaryManager: boolean;
  isSecondManager: boolean;
  canViewMemberEmail: boolean;
  actionLoading: string | null;
  onDesignate: (memberId: number) => Promise<void>;
  onLeave: () => Promise<void>;
  onExclude: (membershipId: number) => Promise<void>;
};

const TeamMembersTable = ({
  memberList,
  team,
  totalTeamMembers,
  currentUserId,
  isPrimaryManager,
  isSecondManager,
  canViewMemberEmail,
  actionLoading,
  onDesignate,
  onLeave,
  onExclude,
}: TeamMembersTableProps) => {
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMemberRow | null>(
    null,
  );

  const openMemberAction = (action: ConfirmAction, member: TeamMemberRow) => {
    setSelectedMember(member);
    setConfirmAction(action);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === 'designate') {
      await onDesignate(selectedMember!.member.id);
    } else if (confirmAction === 'leave') {
      await onLeave();
    } else if (confirmAction === 'exclude') {
      await onExclude(selectedMember!.membershipId!);
    }

    setConfirmAction(null);
    setSelectedMember(null);
  };

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tag</TableCell>
              <TableCell>Spécialité</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {memberList.map((entry) => {
              const canDesignate =
                isPrimaryManager &&
                entry.roleLabel === 'Membre' &&
                !team.secondManager;
              const canSeeLeaveAction = entry.member.id === currentUserId;
              const canUseLeaveAction =
                entry.roleLabel !== 'Responsable' ||
                totalTeamMembers === 1 ||
                team.secondManager !== null;
              const canExclude =
                // tiago exclure remake
                entry.member.id !== currentUserId &&
                entry.membershipId !== undefined &&
                ((isPrimaryManager && entry.roleLabel !== 'Responsable') ||
                  (isSecondManager && !isPrimaryManager));
              // tiago exclure remake

              return (
                <TableRow
                  key={entry.member.id}
                  hover
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    backgroundColor:
                      entry.member.id === currentUserId
                        ? 'rgba(227, 242, 253, 0.5)'
                        : undefined,
                  }}
                >
                  <TableCell>
                    <Link
                      color="info.main"
                      sx={{ cursor: 'pointer', fontWeight: 700 }}
                      onClick={() =>
                        navigate(
                          entry.member.id === currentUserId
                            ? '/profile'
                            : `/members/${entry.member.id}`,
                        )
                      }
                    >
                      {entry.member.tag}
                    </Link>
                    {canViewMemberEmail && (
                      <Typography variant="body2" color="text.secondary">
                        {entry.member.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{entry.member.speciality}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={
                        entry.roleLabel === 'Responsable'
                          ? 'primary'
                          : entry.roleLabel === 'Second responsable'
                            ? 'secondary'
                            : 'default'
                      }
                      label={entry.roleLabel}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      {canDesignate && (
                        <Button
                          variant="contained"
                          startIcon={<WorkspacePremiumOutlinedIcon />}
                          onClick={() => openMemberAction('designate', entry)}
                        >
                          Désigner second responsable
                        </Button>
                      )}
                      {canExclude && (
                        <Button
                          color="error"
                          variant="contained"
                          disabled={actionLoading !== null}
                          onClick={() => openMemberAction('exclude', entry)}
                        >
                          Exclure
                        </Button>
                      )}
                      {canSeeLeaveAction && (
                        <Button
                          color="warning"
                          variant="contained"
                          startIcon={<LogoutOutlinedIcon />}
                          disabled={!canUseLeaveAction}
                          onClick={() => openMemberAction('leave', entry)}
                        >
                          Quitter la team
                        </Button>
                      )}
                      {!canDesignate && !canExclude && !canSeeLeaveAction && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ alignSelf: 'center' }}
                        >
                          Aucune action disponible
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TeamActionDialog
        confirmAction={confirmAction}
        selectedMember={selectedMember}
        totalTeamMembers={totalTeamMembers}
        actionLoading={actionLoading}
        onClose={() => {
          setConfirmAction(null);
          setSelectedMember(null);
        }}
        onConfirm={handleConfirmAction}
      />
    </>
  );
};

export default TeamMembersTable;
