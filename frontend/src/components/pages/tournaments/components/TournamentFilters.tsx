import { useContext, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { TournamentContext } from '../../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../../types';

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

const DURATIONS = Array.from({ length: 30 }, (_, i) => i + 1);

const STATE_LABELS: Record<string, string> = {
  IN_PREPARATION: 'En préparation',
  PLANIFIED: 'Planifié',
  ONGOING: 'En cours',
  FINISHED: 'Terminé',
};

const selectSx = {
  fontSize: '0.8rem',
  color: 'primary.main',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
};

const textFieldSx = {
  ...selectSx,
  '& .MuiInputBase-input': { textAlign: 'center' },
  '& input::placeholder': {
    color: 'primary.main',
    opacity: 1,
    textAlign: 'center',
  },
};

/**
 * Shows all filter controls for the tournament list.
 * @return {JSX.Element} the filter bar
 */
const TournamentFilters = () => {
  const {
    tournamentList,
    filteredTournaments,
    isAdmin,
    stateFilter,
    setStateFilter,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    tournamentNameFilter,
    setTournamentNameFilter,
    dayOfWeekFilter,
    setDayOfWeekFilter,
    durationFilter,
    setDurationFilter,
    availabilityFilter,
    setAvailabilityFilter,
    fromDateFilter,
    setFromDateFilter,
    toDateFilter,
    setToDateFilter,
    teamNameFilter,
    setTeamNameFilter,
    playerTagFilter,
    setPlayerTagFilter,
    resetFilters,
    hasActiveFilters,
    isTeamNameDisabled,
    isPlayerTagDisabled,
    isAvailableOptionDisabled,
    isYearIncompatibleWithState,
    isMonthIncompatibleWithState,
    disabledMonths,
  } = useContext<TournamentContextType>(TournamentContext);

  const [periodAnchor, setPeriodAnchor] = useState<HTMLElement | null>(null);
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');

  /**
   * Opens the date range popover.
   * @param {React.MouseEvent<HTMLElement>} e - the click event
   * @return {void}
   */
  const openPeriodPopover = (e: React.MouseEvent<HTMLElement>) => {
    setPendingFrom(fromDateFilter);
    setPendingTo(toDateFilter);
    setPeriodAnchor(e.currentTarget);
  };

  /**
   * Saves the pending date range and closes the popover.
   * @return {void}
   */
  const applyPeriod = () => {
    setFromDateFilter(pendingFrom);
    setToDateFilter(pendingTo);
    setPeriodAnchor(null);
  };

  const monthLabel =
    monthFilter !== null
      ? MONTHS.find((m) => m.value === monthFilter)?.label
      : null;
  const dayLabel =
    dayOfWeekFilter !== null
      ? DAYS_OF_WEEK.find((d) => d.value === dayOfWeekFilter)?.label
      : null;

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" gap={1} alignItems="center" sx={{ pb: 0.5 }}>
        <TextField
          placeholder="Tournoi"
          value={tournamentNameFilter}
          onChange={(e) => setTournamentNameFilter(e.target.value)}
          size="small"
          sx={{ flex: '1 1 65px', ...textFieldSx }}
          inputProps={{
            style: { fontSize: '0.8rem' },
            'aria-label': 'Nom du tournoi',
          }}
        />

        <TextField
          placeholder="Team"
          value={teamNameFilter}
          onChange={(e) => setTeamNameFilter(e.target.value)}
          size="small"
          disabled={isTeamNameDisabled}
          sx={{ flex: '1 1 60px', ...textFieldSx }}
          inputProps={{
            style: { fontSize: '0.8rem' },
            'aria-label': 'Nom de team participante',
          }}
        />

        <TextField
          placeholder="Tag"
          value={playerTagFilter}
          onChange={(e) => setPlayerTagFilter(e.target.value)}
          size="small"
          disabled={isPlayerTagDisabled}
          sx={{ flex: '1 1 40px', ...textFieldSx }}
          inputProps={{
            style: { fontSize: '0.8rem' },
            'aria-label': "Tag d'un joueur inscrit",
          }}
        />

        <FormControl size="small" sx={{ flex: '1 1 65px' }}>
          <Select
            displayEmpty
            value={stateFilter ?? ''}
            onChange={(e) =>
              setStateFilter(e.target.value === '' ? null : e.target.value)
            }
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
              État
            </MenuItem>
            {isAdmin && (
              <MenuItem value="IN_PREPARATION" sx={{ fontSize: '0.8rem' }}>
                En préparation
              </MenuItem>
            )}
            <MenuItem value="PLANIFIED" sx={{ fontSize: '0.8rem' }}>
              Planifié
            </MenuItem>
            <MenuItem value="ONGOING" sx={{ fontSize: '0.8rem' }}>
              En cours
            </MenuItem>
            <MenuItem value="FINISHED" sx={{ fontSize: '0.8rem' }}>
              Terminé
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: '1 1 130px' }}>
          <Select
            displayEmpty
            value={availabilityFilter ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setAvailabilityFilter(
                v === '' ? null : (v as 'available' | 'unavailable'),
              );
            }}
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
              Disponibilité
            </MenuItem>
            <MenuItem
              value="available"
              disabled={isAvailableOptionDisabled}
              sx={{ fontSize: '0.8rem' }}
            >
              Places disponibles
            </MenuItem>
            <MenuItem value="unavailable" sx={{ fontSize: '0.8rem' }}>
              Complet
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: '1 1 70px' }}>
          <Select
            displayEmpty
            value={dayOfWeekFilter ?? ''}
            onChange={(e) =>
              setDayOfWeekFilter(
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
              Jour
            </MenuItem>
            {DAYS_OF_WEEK.map((d) => (
              <MenuItem
                key={d.value}
                value={d.value}
                sx={{ fontSize: '0.8rem' }}
              >
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          sx={{ flex: '1 1 70px' }}
          error={isMonthIncompatibleWithState}
        >
          <Select
            displayEmpty
            value={monthFilter ?? ''}
            onChange={(e) =>
              setMonthFilter(
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
              Mois
            </MenuItem>
            {MONTHS.map((m) => (
              <MenuItem
                key={m.value}
                value={m.value}
                disabled={disabledMonths.has(m.value)}
                sx={{ fontSize: '0.8rem' }}
              >
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          placeholder="Année"
          type="number"
          value={yearFilter ?? ''}
          onChange={(e) =>
            setYearFilter(e.target.value === '' ? null : Number(e.target.value))
          }
          size="small"
          error={isYearIncompatibleWithState}
          sx={{ flex: '1 1 70px', ...textFieldSx }}
          inputProps={{
            style: { fontSize: '0.8rem' },
            min: 2026,
            max: 2100,
            'aria-label': 'Année',
          }}
        />

        <FormControl size="small" sx={{ flex: '1 1 70px' }}>
          <Select
            displayEmpty
            value={durationFilter ?? ''}
            onChange={(e) =>
              setDurationFilter(
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
              Durée
            </MenuItem>
            {DURATIONS.map((d) => (
              <MenuItem key={d} value={d} sx={{ fontSize: '0.8rem' }}>
                {d} {d === 1 ? 'jour' : 'jours'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          size="small"
          onClick={openPeriodPopover}
          sx={{
            fontSize: '0.8rem',
            color: 'primary.main',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            textTransform: 'none',
            flex: '0 0 auto',
            px: 1.5,
            py: '5px',
          }}
        >
          Période
        </Button>
        <Popover
          open={Boolean(periodAnchor)}
          anchorEl={periodAnchor}
          onClose={() => setPeriodAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Box
            sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            <TextField
              label="Du"
              type="date"
              value={pendingFrom}
              onChange={(e) => setPendingFrom(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ style: { fontSize: '0.8rem' } }}
            />
            <TextField
              label="Au"
              type="date"
              value={pendingTo}
              onChange={(e) => setPendingTo(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ style: { fontSize: '0.8rem' } }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={applyPeriod}
              sx={{ fontSize: '0.8rem', textTransform: 'none' }}
            >
              OK
            </Button>
          </Box>
        </Popover>
      </Stack>

      {/* Reset + active filter chips + count */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          mt: 0.75,
        }}
      >
        <Button
          variant="outlined"
          onClick={resetFilters}
          size="small"
          disabled={!hasActiveFilters}
          sx={{ fontSize: '0.75rem', textTransform: 'none', flexShrink: 0 }}
        >
          Réinitialiser
        </Button>

        {tournamentNameFilter && (
          <Chip
            size="small"
            label={`Nom : ${tournamentNameFilter}`}
            onDelete={() => setTournamentNameFilter('')}
          />
        )}
        {stateFilter && (
          <Chip
            size="small"
            label={STATE_LABELS[stateFilter] ?? stateFilter}
            onDelete={() => setStateFilter(null)}
          />
        )}
        {yearFilter !== null && (
          <Chip
            size="small"
            label={String(yearFilter)}
            onDelete={() => setYearFilter(null)}
          />
        )}
        {monthFilter !== null && monthLabel && (
          <Chip
            size="small"
            label={monthLabel}
            onDelete={() => setMonthFilter(null)}
          />
        )}
        {dayOfWeekFilter !== null && dayLabel && (
          <Chip
            size="small"
            label={dayLabel}
            onDelete={() => setDayOfWeekFilter(null)}
          />
        )}
        {durationFilter !== null && (
          <Chip
            size="small"
            label={`${durationFilter} ${durationFilter === 1 ? 'jour' : 'jours'}`}
            onDelete={() => setDurationFilter(null)}
          />
        )}
        {availabilityFilter && (
          <Chip
            size="small"
            label={
              availabilityFilter === 'available'
                ? 'Places disponibles'
                : 'Complet'
            }
            onDelete={() => setAvailabilityFilter(null)}
          />
        )}
        {(fromDateFilter || toDateFilter) && (
          <Chip
            size="small"
            label={`${fromDateFilter ? fromDateFilter.split('-').reverse().join('/') : '...'} → ${toDateFilter ? toDateFilter.split('-').reverse().join('/') : '...'}`}
            onDelete={() => {
              setFromDateFilter('');
              setToDateFilter('');
            }}
          />
        )}
        {teamNameFilter && (
          <Chip
            size="small"
            label={`Team : ${teamNameFilter}`}
            onDelete={() => setTeamNameFilter('')}
          />
        )}
        {playerTagFilter && (
          <Chip
            size="small"
            label={`Joueur : ${playerTagFilter}`}
            onDelete={() => setPlayerTagFilter('')}
          />
        )}

        {(isYearIncompatibleWithState || isMonthIncompatibleWithState) && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mx: 'auto', textAlign: 'center' }}
          >
            {isYearIncompatibleWithState && stateFilter === 'FINISHED'
              ? 'Un tournoi terminé ne peut pas être dans le futur'
              : isYearIncompatibleWithState && stateFilter === 'ONGOING'
                ? 'Un tournoi en cours ne peut être que cette année'
                : isYearIncompatibleWithState
                  ? 'Un tournoi planifié ne peut pas être dans le passé'
                  : stateFilter === 'FINISHED' || stateFilter === 'ONGOING'
                    ? 'Ce mois est dans le futur pour un tournoi terminé ou en cours'
                    : 'Ce mois est dans le passé pour un tournoi planifié'}
          </Typography>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 'auto' }}
        >
          {filteredTournaments.length}/{tournamentList?.length ?? 0} tournoi
          {filteredTournaments.length !== 1 ? 's' : ''} affiché
          {filteredTournaments.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default TournamentFilters;
