import { useState, useContext } from 'react';
import {
  Box,
  Button,
  Alert,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';
import { NotificationContext } from '../../../contexts/NotificationContext';

const NotificationPage = () => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const {
    notifications,
    error,
    decidedIds,
    markAsRead,
    handleAccept,
    handleDecline,
  } = useContext(NotificationContext);
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineNotificationId, setDeclineNotificationId] = useState<
    number | null
  >(null);
  const [declineError, setDeclineError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const navigate = useNavigate();

  if (!authenticatedUser) {
    navigate('/login');
    return <p>Vous devez être connecté pour voir cette page.</p>;
  }

  const onDeclineConfirm = async () => {
    if (!declineId || !declineNotificationId) return;
    const validationError = await handleDecline(
      declineId,
      declineNotificationId,
      reason,
    );
    if (validationError) {
      setDeclineError(validationError);
      return;
    }
    setDeclineId(null);
    setReason('');
  };

  const closeDeclineDialog = () => {
    setDeclineId(null);
    setDeclineError(null);
    setReason('');
  };

  return (
    <Box
      sx={{
        margin: 2,
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F0F0F0',
        borderRadius: 2.5,
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      <h1>Notifications</h1>

      {error && <Alert severity="error">{error}</Alert>}

      {notifications.length === 0 ? (
        <p>Aucune notification</p>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {notifications.map((n) => (
            <Box
              key={n.notificationId}
              className="notification-item"
              sx={{
                padding: 2,
                border: '1px solid grey',
                borderRadius: 2,
                opacity: n.isRead ? 0.6 : 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                }}
                onClick={() =>
                  setExpandedId(
                    expandedId === n.notificationId ? null : n.notificationId,
                  )
                }
              >
                <Typography variant="h6">{n.object}</Typography>
                {!n.isRead && (
                  <Chip label="Non lu" color="primary" size="small" />
                )}
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  {expandedId === n.notificationId ? '▲' : '▼'}
                </Typography>
              </Box>

              {expandedId === n.notificationId && (
                <Box sx={{ marginTop: 1 }}>
                  <Typography>{n.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(n.createdAt).toLocaleString()}
                  </Typography>

                  {!n.isRead && n.type !== 'TEAM_INVITATION' && (
                    <Box sx={{ marginTop: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => markAsRead(n.notificationId)}
                      >
                        Marquer comme lu
                      </Button>
                    </Box>
                  )}

                  {n.type === 'TEAM_INVITATION' &&
                    !n.isRead &&
                    !decidedIds.has(n.membershipId!) && (
                      <Box sx={{ display: 'flex', gap: 1, marginTop: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() =>
                            handleAccept(n.membershipId!, n.notificationId)
                          }
                        >
                          Accepter
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setDeclineId(n.membershipId!);
                            setDeclineNotificationId(n.notificationId);
                          }}
                        >
                          Refuser
                        </Button>
                      </Box>
                    )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={declineId !== null} onClose={closeDeclineDialog}>
        <DialogTitle>Refuser la demande</DialogTitle>
        <DialogContent>
          {declineError && <Alert severity="error">{declineError}</Alert>}
          <TextField
            label="Raison du refus"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setDeclineError(null);
            }}
            sx={{ marginTop: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeclineDialog}>Annuler</Button>
          <Button variant="contained" color="error" onClick={onDeclineConfirm}>
            Confirmer le refus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationPage;
