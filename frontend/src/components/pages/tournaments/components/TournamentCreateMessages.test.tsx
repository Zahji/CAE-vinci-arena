import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TournamentCreateMessages from './TournamentCreateMessages';
import { TournamentContext } from '../../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../../types';

describe('TournamentCreateMessages', () => {
  const createContextValue = (
    formError: string | null = null,
    formSuccess: string | null = null,
  ): TournamentContextType =>
    ({
      loading: false,
      error: null,
      tournamentList: [],
      filteredTournaments: [],
      helpText: '',
      isAdmin: true,
      today: '2026-03-27',
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      startInscriptionDate: '',
      endInscriptionDate: '',
      maxTeams: '2',
      submitting: false,
      formError,
      formSuccess,
      publishing: false,
      publishError: null,
      publishSuccess: null,
      editing: false,
      editError: null,
      editSuccess: null,
      generating: false,
      generateError: null,
      generateSuccess: null,
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
      handleGenerateSchedule: vi.fn(),
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
      registeredTournamentIds: new Set(),
      participatedTournamentIds: new Set(),
      setFromDateFilter: vi.fn(),
      setToDateFilter: vi.fn(),
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
    }) as TournamentContextType;

  test('renders nothing when there are no messages', () => {
    const contextValue = createContextValue();

    const { container } = render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateMessages />
      </TournamentContext.Provider>,
    );

    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts).toHaveLength(0);
  });

  test('renders error alert when formError is present', () => {
    const contextValue = createContextValue('Erreur de validation', null);

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateMessages />
      </TournamentContext.Provider>,
    );

    expect(screen.getByText('Erreur de validation')).toBeTruthy();
  });

  test('renders success alert when formSuccess is present', () => {
    const contextValue = createContextValue(null, 'Tournoi créé avec succès.');

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateMessages />
      </TournamentContext.Provider>,
    );

    expect(screen.getByText('Tournoi créé avec succès.')).toBeTruthy();
  });

  test('renders both alerts when formError and formSuccess are present', () => {
    const contextValue = createContextValue('Erreur', 'Succès');

    const { container } = render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateMessages />
      </TournamentContext.Provider>,
    );

    expect(screen.getByText('Erreur')).toBeTruthy();
    expect(screen.getByText('Succès')).toBeTruthy();
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(2);
  });
});
