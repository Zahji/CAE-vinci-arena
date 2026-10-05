import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { TournamentContext } from '../../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../../types';
import TournamentFilters from './TournamentFilters';

/**
 * Builds a tournament context value for tests.
 * @param {Partial<TournamentContextType>} overrides - fields to override
 * @return {TournamentContextType} the context value
 */
const createTournamentContextValue = (
  overrides: Partial<TournamentContextType> = {},
): TournamentContextType =>
  ({
    loading: false,
    error: null,
    tournamentList: [],
    filteredTournaments: [],
    helpText: '',
    isAdmin: false,
    today: '2026-03-27',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    startInscriptionDate: '',
    endInscriptionDate: '',
    maxTeams: '2',
    submitting: false,
    formError: null,
    formSuccess: null,
    publishing: false,
    publishError: null,
    publishSuccess: null,
    editing: false,
    editError: null,
    editSuccess: null,
    refreshTournaments: vi.fn(),
    setName: vi.fn(),
    setDescription: vi.fn(),
    setStartDate: vi.fn(),
    setEndDate: vi.fn(),
    setStartInscriptionDate: vi.fn(),
    setEndInscriptionDate: vi.fn(),
    setMaxTeams: vi.fn(),
    submitTournamentCreation: vi.fn(),
    handlePublishTournament: vi.fn(),
    handleEditTournament: vi.fn(),
    stateFilter: null,
    yearFilter: null,
    monthFilter: null,
    tournamentNameFilter: '',
    dayOfWeekFilter: null,
    durationFilter: null,
    availabilityFilter: null,
    teamNameFilter: '',
    playerTagFilter: '',
    fromDateFilter: '',
    toDateFilter: '',
    setFromDateFilter: vi.fn(),
    setToDateFilter: vi.fn(),
    registeredTournamentIds: new Set(),
    setStateFilter: vi.fn(),
    setYearFilter: vi.fn(),
    setMonthFilter: vi.fn(),
    setTournamentNameFilter: vi.fn(),
    setDayOfWeekFilter: vi.fn(),
    setDurationFilter: vi.fn(),
    setAvailabilityFilter: vi.fn(),
    setTeamNameFilter: vi.fn(),
    setPlayerTagFilter: vi.fn(),
    resetFilters: vi.fn(),
    hasActiveFilters: false,
    isTeamNameDisabled: false,
    isPlayerTagDisabled: false,
    isAvailableOptionDisabled: false,
    isYearIncompatibleWithState: false,
    isMonthIncompatibleWithState: false,
    disabledMonths: new Set<number>(),
    ...overrides,
  }) as TournamentContextType;

/**
 * Shows the filters component inside a tournament context.
 * @param {TournamentContextType} tournamentCtx - the tournament context
 * @return {void}
 */
const renderFilters = (
  tournamentCtx: TournamentContextType = createTournamentContextValue(),
) =>
  render(
    <TournamentContext.Provider value={tournamentCtx}>
      <TournamentFilters />
    </TournamentContext.Provider>,
  );

/**
 * Gets the box that holds the filter chips.
 * @return {HTMLElement} the chips container
 */
const getChipsContainer = () =>
  screen
    .getByRole('button', { name: /réinitialiser/i })
    .closest('.MuiBox-root') as HTMLElement;

/**
 * Clicks the cancel icon on the first chip.
 * @return {Promise<void>}
 */
const clickCancelIcon = async () =>
  await userEvent.click(screen.getByTestId('CancelIcon'));

describe('TournamentFilters', () => {
  describe('tournament count', () => {
    test('shows singular form for one tournament', () => {
      const tournament = {
        id: 1,
        name: 'Spring Clash',
        description: '',
        state: 'PLANIFIED',
        stateDisplayName: 'Planifié',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
        registrationsCount: 0,
      };
      renderFilters(
        createTournamentContextValue({
          tournamentList: [tournament],
          filteredTournaments: [tournament],
        }),
      );

      expect(screen.getByText(/1\/1 tournoi affiché/i)).toBeTruthy();
    });

    test('shows plural form for zero or multiple tournaments', () => {
      const tournament = {
        id: 1,
        name: 'Spring Clash',
        description: '',
        state: 'PLANIFIED',
        stateDisplayName: 'Planifié',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        startInscriptionDate: '2026-03-01',
        endInscriptionDate: '2026-03-31',
        maxTeams: 16,
        registrationsCount: 0,
      };
      renderFilters(
        createTournamentContextValue({
          tournamentList: [tournament],
          filteredTournaments: [],
        }),
      );

      expect(screen.getByText(/0\/1 tournois affichés/i)).toBeTruthy();
    });

    test('shows 0 as total when tournamentList is null', () => {
      renderFilters(
        createTournamentContextValue({
          tournamentList: null,
          filteredTournaments: [],
        }),
      );

      expect(screen.getByText(/0\/0 tournois affichés/i)).toBeTruthy();
    });
  });

  describe('reset button', () => {
    test('is disabled when no filter is active', () => {
      renderFilters();

      const btn = screen.getByRole('button', { name: /réinitialiser/i });
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    test('is enabled when a filter is active', () => {
      renderFilters(createTournamentContextValue({ hasActiveFilters: true }));

      const btn = screen.getByRole('button', { name: /réinitialiser/i });
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });

    test('calls resetFilters on click', async () => {
      const resetFilters = vi.fn();
      renderFilters(
        createTournamentContextValue({ hasActiveFilters: true, resetFilters }),
      );

      await userEvent.click(
        screen.getByRole('button', { name: /réinitialiser/i }),
      );

      expect(resetFilters).toHaveBeenCalledOnce();
    });
  });

  describe('text inputs', () => {
    test('calls setTournamentNameFilter when typing in the name field', async () => {
      const setTournamentNameFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setTournamentNameFilter }));

      await userEvent.type(screen.getByLabelText(/nom du tournoi/i), 'Spring');

      expect(setTournamentNameFilter).toHaveBeenCalled();
    });

    test('calls setTeamNameFilter when typing in the team name field', async () => {
      const setTeamNameFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setTeamNameFilter }));

      await userEvent.type(
        screen.getByLabelText(/nom de team participante/i),
        'ALPHA',
      );

      expect(setTeamNameFilter).toHaveBeenCalled();
    });

    test('calls setPlayerTagFilter when typing in the player tag field', async () => {
      const setPlayerTagFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setPlayerTagFilter }));

      await userEvent.type(
        screen.getByLabelText(/tag d'un joueur inscrit/i),
        'Flash',
      );

      expect(setPlayerTagFilter).toHaveBeenCalled();
    });

    test('team name field is disabled when isTeamNameDisabled is true', () => {
      renderFilters(createTournamentContextValue({ isTeamNameDisabled: true }));

      const input = screen.getByLabelText(/nom de team participante/i);
      expect((input as HTMLInputElement).disabled).toBe(true);
    });

    test('player tag field is disabled when isPlayerTagDisabled is true', () => {
      renderFilters(
        createTournamentContextValue({ isPlayerTagDisabled: true }),
      );

      const input = screen.getByLabelText(/tag d'un joueur inscrit/i);
      expect((input as HTMLInputElement).disabled).toBe(true);
    });
  });

  describe('select filters', () => {
    test('admin sees the EN_PREPARATION state option', async () => {
      renderFilters(createTournamentContextValue({ isAdmin: true }));

      await userEvent.click(screen.getAllByRole('combobox')[0]);

      expect(
        screen.getByRole('option', { name: 'En préparation' }),
      ).toBeTruthy();
    });

    test('non-admin does not see the EN_PREPARATION state option', async () => {
      renderFilters(createTournamentContextValue({ isAdmin: false }));

      await userEvent.click(screen.getAllByRole('combobox')[0]);

      expect(
        screen.queryByRole('option', { name: 'En préparation' }),
      ).toBeNull();
    });

    test('calls setStateFilter with the selected value', async () => {
      const setStateFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setStateFilter }));

      await userEvent.click(screen.getAllByRole('combobox')[0]);
      await userEvent.click(screen.getByRole('option', { name: 'Planifié' }));

      expect(setStateFilter).toHaveBeenCalledWith('PLANIFIED');
    });

    test('calls setYearFilter when typing in the year field', async () => {
      const setYearFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setYearFilter }));

      await userEvent.type(screen.getByLabelText('Année'), '2026');

      expect(setYearFilter).toHaveBeenCalled();
    });

    test('calls setYearFilter with null when clearing the year field', async () => {
      const setYearFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({ yearFilter: 2026, setYearFilter }),
      );

      await userEvent.clear(screen.getByLabelText('Année'));

      expect(setYearFilter).toHaveBeenCalledWith(null);
    });

    test('calls setMonthFilter with the selected month', async () => {
      const setMonthFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setMonthFilter }));

      await userEvent.click(screen.getAllByRole('combobox')[3]);
      await userEvent.click(screen.getByRole('option', { name: 'Mars' }));

      expect(setMonthFilter).toHaveBeenCalledWith(3);
    });

    test('calls setDayOfWeekFilter with the selected day', async () => {
      const setDayOfWeekFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setDayOfWeekFilter }));

      await userEvent.click(screen.getAllByRole('combobox')[2]);
      await userEvent.click(screen.getByRole('option', { name: 'Lundi' }));

      expect(setDayOfWeekFilter).toHaveBeenCalledWith(1);
    });

    test('calls setDurationFilter with the selected duration', async () => {
      const setDurationFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setDurationFilter }));

      await userEvent.click(screen.getAllByRole('combobox')[4]);
      await userEvent.click(screen.getByRole('option', { name: /^2 jours$/ }));

      expect(setDurationFilter).toHaveBeenCalledWith(2);
    });

    test('calls setAvailabilityFilter with available when selecting places disponibles', async () => {
      const setAvailabilityFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setAvailabilityFilter }));

      await userEvent.click(screen.getAllByRole('combobox')[1]);
      await userEvent.click(
        screen.getByRole('option', { name: /places disponibles/i }),
      );

      expect(setAvailabilityFilter).toHaveBeenCalledWith('available');
    });

    test('calls setAvailabilityFilter with unavailable when selecting complet', async () => {
      const setAvailabilityFilter = vi.fn();
      renderFilters(createTournamentContextValue({ setAvailabilityFilter }));

      await userEvent.click(screen.getAllByRole('combobox')[1]);
      await userEvent.click(screen.getByRole('option', { name: /complet/i }));

      expect(setAvailabilityFilter).toHaveBeenCalledWith('unavailable');
    });

    test('calls setStateFilter with null when deselecting state', async () => {
      const setStateFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          stateFilter: 'PLANIFIED',
          setStateFilter,
        }),
      );

      await userEvent.click(screen.getAllByRole('combobox')[0]);
      await userEvent.click(screen.getByRole('option', { name: 'État' }));

      expect(setStateFilter).toHaveBeenCalledWith(null);
    });

    test('calls setMonthFilter with null when deselecting month', async () => {
      const setMonthFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({ monthFilter: 3, setMonthFilter }),
      );

      await userEvent.click(screen.getAllByRole('combobox')[3]);
      await userEvent.click(screen.getByRole('option', { name: 'Mois' }));

      expect(setMonthFilter).toHaveBeenCalledWith(null);
    });

    test('calls setDayOfWeekFilter with null when deselecting day', async () => {
      const setDayOfWeekFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          dayOfWeekFilter: 1,
          setDayOfWeekFilter,
        }),
      );

      await userEvent.click(screen.getAllByRole('combobox')[2]);
      await userEvent.click(screen.getByRole('option', { name: 'Jour' }));

      expect(setDayOfWeekFilter).toHaveBeenCalledWith(null);
    });

    test('calls setDurationFilter with null when deselecting duration', async () => {
      const setDurationFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({ durationFilter: 3, setDurationFilter }),
      );

      await userEvent.click(screen.getAllByRole('combobox')[4]);
      await userEvent.click(screen.getByRole('option', { name: 'Durée' }));

      expect(setDurationFilter).toHaveBeenCalledWith(null);
    });

    test('calls setAvailabilityFilter with null when deselecting availability', async () => {
      const setAvailabilityFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          availabilityFilter: 'available',
          setAvailabilityFilter,
        }),
      );

      await userEvent.click(screen.getAllByRole('combobox')[1]);
      await userEvent.click(
        screen.getByRole('option', { name: 'Disponibilité' }),
      );

      expect(setAvailabilityFilter).toHaveBeenCalledWith(null);
    });

    test('availability option is disabled when isAvailableOptionDisabled is true', async () => {
      renderFilters(
        createTournamentContextValue({ isAvailableOptionDisabled: true }),
      );

      await userEvent.click(screen.getAllByRole('combobox')[1]);

      const option = screen.getByRole('option', {
        name: /places disponibles/i,
      });
      expect(option.getAttribute('aria-disabled')).toBe('true');
    });

    test('shows warning when year is incompatible with FINISHED state', () => {
      renderFilters(
        createTournamentContextValue({
          stateFilter: 'FINISHED',
          isYearIncompatibleWithState: true,
        }),
      );

      expect(
        screen.getByText('Un tournoi terminé ne peut pas être dans le futur'),
      ).toBeTruthy();
    });

    test('shows warning when year is incompatible with PLANIFIED state', () => {
      renderFilters(
        createTournamentContextValue({
          stateFilter: 'PLANIFIED',
          isYearIncompatibleWithState: true,
        }),
      );

      expect(
        screen.getByText('Un tournoi planifié ne peut pas être dans le passé'),
      ).toBeTruthy();
    });

    test('shows warning when month is incompatible with FINISHED state', () => {
      renderFilters(
        createTournamentContextValue({
          stateFilter: 'FINISHED',
          isMonthIncompatibleWithState: true,
        }),
      );

      expect(
        screen.getByText(
          'Ce mois est dans le futur pour un tournoi terminé ou en cours',
        ),
      ).toBeTruthy();
    });

    test('shows warning when month is incompatible with ONGOING state', () => {
      renderFilters(
        createTournamentContextValue({
          stateFilter: 'ONGOING',
          isMonthIncompatibleWithState: true,
        }),
      );

      expect(
        screen.getByText(
          'Ce mois est dans le futur pour un tournoi terminé ou en cours',
        ),
      ).toBeTruthy();
    });

    test('shows warning when month is incompatible with PLANIFIED state', () => {
      renderFilters(
        createTournamentContextValue({
          stateFilter: 'PLANIFIED',
          isMonthIncompatibleWithState: true,
        }),
      );

      expect(
        screen.getByText('Ce mois est dans le passé pour un tournoi planifié'),
      ).toBeTruthy();
    });

    test('shows warning when year is incompatible with ONGOING state', () => {
      renderFilters(
        createTournamentContextValue({
          stateFilter: 'ONGOING',
          isYearIncompatibleWithState: true,
        }),
      );

      expect(
        screen.getByText('Un tournoi en cours ne peut être que cette année'),
      ).toBeTruthy();
    });
  });

  describe('month disabled options', () => {
    test('disables months provided in disabledMonths', async () => {
      renderFilters(
        createTournamentContextValue({
          disabledMonths: new Set([5, 6, 7]),
        }),
      );

      await userEvent.click(screen.getAllByRole('combobox')[3]);

      expect(
        screen
          .getByRole('option', { name: 'Mai' })
          .getAttribute('aria-disabled'),
      ).toBe('true');
      expect(
        screen
          .getByRole('option', { name: 'Mars' })
          .getAttribute('aria-disabled'),
      ).toBeNull();
    });
  });

  describe('period popover', () => {
    test('applies from/to filters when clicking OK', async () => {
      const setFromDateFilter = vi.fn();
      const setToDateFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({ setFromDateFilter, setToDateFilter }),
      );

      await userEvent.click(screen.getByRole('button', { name: /période/i }));

      const popover = screen.getByRole('presentation');
      const fromInput = within(popover).getByLabelText('Du');
      const toInput = within(popover).getByLabelText('Au');

      await userEvent.type(fromInput, '2026-01-01');
      await userEvent.type(toInput, '2026-06-30');

      await userEvent.click(
        within(popover).getByRole('button', { name: /ok/i }),
      );

      expect(setFromDateFilter).toHaveBeenCalled();
      expect(setToDateFilter).toHaveBeenCalled();
    });

    test('closes period popover when pressing Escape', async () => {
      renderFilters();

      await userEvent.click(screen.getByRole('button', { name: /période/i }));
      expect(screen.getByRole('presentation')).toBeTruthy();

      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('presentation')).toBeNull();
    });
  });

  describe('filter chips', () => {
    test('shows and deletes tournament name chip', async () => {
      const setTournamentNameFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          tournamentNameFilter: 'Test',
          hasActiveFilters: true,
          setTournamentNameFilter,
        }),
      );

      within(getChipsContainer()).getByText('Nom : Test');
      await clickCancelIcon();
      expect(setTournamentNameFilter).toHaveBeenCalledWith('');
    });

    test('shows and deletes state chip', async () => {
      const setStateFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          stateFilter: 'PLANIFIED',
          setStateFilter,
        }),
      );

      within(getChipsContainer()).getByText('Planifié');
      await clickCancelIcon();
      expect(setStateFilter).toHaveBeenCalledWith(null);
    });

    test('shows and deletes year chip', async () => {
      const setYearFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({ yearFilter: 2026, setYearFilter }),
      );

      within(getChipsContainer()).getByText('2026');
      await clickCancelIcon();
      expect(setYearFilter).toHaveBeenCalledWith(null);
    });

    test('shows and deletes month chip', async () => {
      const setMonthFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({ monthFilter: 3, setMonthFilter }),
      );

      within(getChipsContainer()).getByText('Mars');
      await clickCancelIcon();
      expect(setMonthFilter).toHaveBeenCalledWith(null);
    });

    test('shows and deletes day chip', async () => {
      const setDayOfWeekFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          dayOfWeekFilter: 1,
          setDayOfWeekFilter,
        }),
      );

      within(getChipsContainer()).getByText('Lundi');
      await clickCancelIcon();
      expect(setDayOfWeekFilter).toHaveBeenCalledWith(null);
    });

    test('shows and deletes duration chip', async () => {
      const setDurationFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({ durationFilter: 3, setDurationFilter }),
      );

      within(getChipsContainer()).getByText('3 jours');
      await clickCancelIcon();
      expect(setDurationFilter).toHaveBeenCalledWith(null);
    });

    test('shows singular label for duration of 1 day', () => {
      renderFilters(createTournamentContextValue({ durationFilter: 1 }));

      expect(within(getChipsContainer()).getByText('1 jour')).toBeTruthy();
    });

    test('shows and deletes availability chip when available', async () => {
      const setAvailabilityFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          availabilityFilter: 'available',
          setAvailabilityFilter,
        }),
      );

      within(getChipsContainer()).getByText('Places disponibles');
      await clickCancelIcon();
      expect(setAvailabilityFilter).toHaveBeenCalledWith(null);
    });

    test('shows raw state value in chip when state label is unknown', () => {
      renderFilters(
        createTournamentContextValue({ stateFilter: 'UNKNOWN_STATE' }),
      );

      expect(
        within(getChipsContainer()).getByText('UNKNOWN_STATE'),
      ).toBeTruthy();
    });

    test('shows complet label when availability is unavailable', () => {
      renderFilters(
        createTournamentContextValue({ availabilityFilter: 'unavailable' }),
      );

      expect(within(getChipsContainer()).getByText('Complet')).toBeTruthy();
    });

    test('shows and deletes team name chip', async () => {
      const setTeamNameFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          teamNameFilter: 'Alpha',
          setTeamNameFilter,
        }),
      );

      within(getChipsContainer()).getByText('Team : Alpha');
      await clickCancelIcon();
      expect(setTeamNameFilter).toHaveBeenCalledWith('');
    });

    test('shows and deletes player tag chip', async () => {
      const setPlayerTagFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          playerTagFilter: 'Flash',
          setPlayerTagFilter,
        }),
      );

      within(getChipsContainer()).getByText('Joueur : Flash');
      await clickCancelIcon();
      expect(setPlayerTagFilter).toHaveBeenCalledWith('');
    });

    test('shows and deletes period chip', async () => {
      const setFromDateFilter = vi.fn();
      const setToDateFilter = vi.fn();
      renderFilters(
        createTournamentContextValue({
          fromDateFilter: '2026-01-01',
          toDateFilter: '2026-06-30',
          setFromDateFilter,
          setToDateFilter,
        }),
      );

      within(getChipsContainer()).getByText('01/01/2026 → 30/06/2026');
      await clickCancelIcon();
      expect(setFromDateFilter).toHaveBeenCalledWith('');
      expect(setToDateFilter).toHaveBeenCalledWith('');
    });

    test('shows period chip with only from date', () => {
      renderFilters(
        createTournamentContextValue({ fromDateFilter: '2026-03-15' }),
      );

      expect(
        within(getChipsContainer()).getByText('15/03/2026 → ...'),
      ).toBeTruthy();
    });

    test('shows period chip with only to date', () => {
      renderFilters(
        createTournamentContextValue({ toDateFilter: '2026-12-31' }),
      );

      expect(
        within(getChipsContainer()).getByText('... → 31/12/2026'),
      ).toBeTruthy();
    });
  });
});
