import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SelectionContext } from '../../../contexts/SelectionContext';
import type { SelectionContextType } from '../../../types';
import SelectionMemberList from './components/SelectionMemberList';
import { formatDateTime } from '../../../utils/dateUtils';

interface SelectionPageContentProps {
  tournamentId: number;
}

/**
 * Shows the selection page for a match — member list and match info.
 * @return {JSX.Element} the page content
 */
const SelectionPageContent = ({ tournamentId }: SelectionPageContentProps) => {
  const { match, loading, error, actionError, clearActionError } =
    useContext<SelectionContextType>(SelectionContext);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Sélection des membres pour un match
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
            onClick={() => navigate(`/tournaments/${tournamentId}/bracket`)}
          >
            Retour au planning
          </Button>
        </Box>
        {match && (
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              <Box component="span" sx={{ color: 'error.main' }}>
                {match.team1Name ?? '-'}
              </Box>
              <Box component="span" sx={{ mx: 1 }}>
                vs
              </Box>
              <Box component="span" sx={{ color: 'error.main' }}>
                {match.team2Name ?? '-'}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(match.startTime)}
            </Typography>
          </Box>
        )}

        {actionError && (
          <Alert severity="error" onClose={clearActionError} sx={{ mb: 2 }}>
            {actionError}
          </Alert>
        )}

        <SelectionMemberList />
      </Paper>
    </Container>
  );
};

export default SelectionPageContent;
