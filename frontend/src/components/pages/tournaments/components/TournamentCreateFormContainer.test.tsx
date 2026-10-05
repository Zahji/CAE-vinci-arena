import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TournamentCreateFormContainer from './TournamentCreateFormContainer';
import { TournamentContext } from '../../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../../types';

vi.mock('./TournamentCreateForm', () => ({
  default: () => <div data-testid="tournament-create-form" />,
}));

describe('TournamentCreateFormContainer', () => {
  const createContextValue = (isAdmin: boolean): TournamentContextType =>
    ({
      loading: false,
      error: null,
      tournamentList: [],
      filteredTournaments: [],
      helpText: '',
      isAdmin,
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

  test('renders nothing for non-admin users', () => {
    const { container } = render(
      <TournamentContext.Provider value={createContextValue(false)}>
        <TournamentCreateFormContainer />
      </TournamentContext.Provider>,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('tournament-create-form')).toBeNull();
  });

  test('renders heading and form for admin users', () => {
    render(
      <TournamentContext.Provider value={createContextValue(true)}>
        <TournamentCreateFormContainer />
      </TournamentContext.Provider>,
    );

    expect(
      screen.getByRole('heading', { name: /créer un tournoi/i }),
    ).toBeTruthy();
    expect(screen.getByTestId('tournament-create-form')).toBeTruthy();
  });
});
