import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { SelectionContext } from '../../../../contexts/SelectionContext';
import { UserContext } from '../../../../contexts/UserContext';
import type { SelectionContextType, UserContextType } from '../../../../types';

/**
 * Shows the list of team members and lets the manager pick who plays.
 * @return {JSX.Element} the member list
 */
const SelectionMemberList = () => {
  const {
    match,
    memberships,
    selections,
    canModify,
    unavailableMemberIds,
    handleToggle,
    loading,
  } = useContext<SelectionContextType>(SelectionContext);

  const navigate = useNavigate();
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!initialized && !loading) {
      setPendingIds(new Set(selections.map((s) => s.memberId)));
      setInitialized(true);
    }
  }, [selections, loading, initialized]);

  const pendingEffectiveCount = [...pendingIds].filter(
    (id) => !unavailableMemberIds.has(id),
  ).length;

  const isFull = pendingEffectiveCount >= 4;

  const isEnded = match?.state === 'ENDED';

  const visibleMembers = canModify
    ? memberships
    : memberships.filter(
        (m) =>
          pendingIds.has(m.member.id) && !unavailableMemberIds.has(m.member.id),
      );

  /**
   * Adds or removes a member from the pending selection.
   * @param {number} memberId - the member id
   * @return {void}
   */
  const togglePending = (memberId: number) => {
    setConfirmError(null);
    setConfirmSuccess(false);
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  /**
   * Saves the pending selection by adding and removing members.
   * @return {Promise<void>}
   */
  const handleConfirm = async () => {
    setConfirmError(null);
    setConfirmSuccess(false);
    if (pendingEffectiveCount === 0) {
      setConfirmError('Vous devez sélectionner au moins 1 membre.');
      return;
    }
    setConfirming(true);
    const currentIds = new Set(selections.map((s) => s.memberId));
    const conflictingTags: string[] = [];

    for (const id of currentIds) {
      if (!pendingIds.has(id)) await handleToggle(id);
    }
    for (const id of pendingIds) {
      if (!currentIds.has(id)) {
        try {
          await handleToggle(id);
        } catch {
          const tag =
            memberships.find((m) => m.member.id === id)?.member.tag ?? `#${id}`;
          conflictingTags.push(tag);
        }
      }
    }

    setConfirming(false);
    if (conflictingTags.length > 0) {
      const names = conflictingTags.join(', ');
      const verb =
        conflictingTags.length > 1
          ? 'sont déjà sélectionnés'
          : 'est déjà sélectionné(e)';
      setConfirmError(`${names} ${verb} pour un match au même horaire.`);
    } else {
      setConfirmSuccess(true);
    }
  };

  return (
    <>
      <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
        Membres sélectionnés : {pendingEffectiveCount}/4
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
            <TableCell sx={{ fontWeight: 700, width: 48 }} />
            <TableCell sx={{ fontWeight: 700 }}>Tag</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Spécialité</TableCell>
            {canModify && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {isEnded && !canModify
            ? selections.map((s) => (
                <TableRow key={s.memberId}>
                  <TableCell align="center">
                    <CheckCircleIcon color="success" sx={{ fontSize: 22 }} />
                  </TableCell>
                  <TableCell
                    sx={{ color: 'info.main', cursor: 'pointer' }}
                    onClick={() => {
                      if (s.memberId === authenticatedUser?.id) {
                        navigate('/profile');
                      } else {
                        navigate(`/members/${s.memberId}`);
                      }
                    }}
                  >
                    {s.memberTag}
                  </TableCell>
                  <TableCell>{s.memberSpeciality}</TableCell>
                </TableRow>
              ))
            : visibleMembers.map((m) => {
                const unavailable = unavailableMemberIds.has(m.member.id);
                const selected = pendingIds.has(m.member.id) && !unavailable;

                return (
                  <TableRow
                    key={m.member.id}
                    sx={{ opacity: unavailable ? 0.5 : 1 }}
                  >
                    <TableCell align="center">
                      {selected ? (
                        <CheckCircleIcon
                          color="success"
                          sx={{ fontSize: 22 }}
                        />
                      ) : (
                        <CancelIcon
                          sx={{
                            color: unavailable ? 'text.disabled' : 'error.main',
                            fontSize: 22,
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: unavailable ? 'text.disabled' : 'info.main',
                        fontStyle: unavailable ? 'italic' : 'normal',
                        cursor: unavailable ? 'default' : 'pointer',
                      }}
                      onClick={() => {
                        if (unavailable) return;
                        if (m.member.id === authenticatedUser?.id) {
                          navigate('/profile');
                        } else {
                          navigate(`/members/${m.member.id}`);
                        }
                      }}
                    >
                      {m.member.tag}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: unavailable ? 'text.disabled' : 'inherit',
                        fontStyle: unavailable ? 'italic' : 'normal',
                      }}
                    >
                      {m.member.speciality}
                    </TableCell>
                    {canModify && (
                      <TableCell align="right">
                        {!unavailable && (
                          <Button
                            size="small"
                            variant="outlined"
                            color={selected ? 'error' : 'success'}
                            disabled={!selected && isFull}
                            onClick={() => togglePending(m.member.id)}
                            sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}
                          >
                            {selected ? 'Retirer' : 'Ajouter'}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>

      {canModify && (
        <>
          {confirmError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {confirmError}
            </Alert>
          )}
          {confirmSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Sélection confirmée
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => void handleConfirm()}
            disabled={confirming}
          >
            {confirming ? 'Confirmation...' : 'Confirmer la sélection'}
          </Button>
        </>
      )}
    </>
  );
};

export default SelectionMemberList;
