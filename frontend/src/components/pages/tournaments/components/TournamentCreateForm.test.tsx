import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TournamentContext } from '../../../../contexts/TournamentContext';
import { TournamentContextType } from '../../../../types';
import TournamentCreateForm from './TournamentCreateForm';

describe('TournamentCreateForm', () => {
  const createContextValue = (): TournamentContextType =>
    ({
      loading: false,
      error: null,
      tournamentList: [],
      filteredTournaments: [],
      helpText: '',
      isAdmin: true,
      today: '2026-03-27',
      name: 'Tournoi test',
      description: 'Description test',
      startDate: '2026-03-28',
      endDate: '2026-03-29',
      startInscriptionDate: '2026-03-27',
      endInscriptionDate: '2026-03-27',
      maxTeams: '8',
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

  test('renders all tournament form fields', () => {
    const contextValue = createContextValue();

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateForm />
      </TournamentContext.Provider>,
    );

    expect(screen.getByDisplayValue('Tournoi test')).toBeTruthy();
    expect(screen.getByDisplayValue('Description test')).toBeTruthy();
    expect(
      (screen.getByLabelText(/date du début du tournoi/i) as HTMLInputElement)
        .value,
    ).toBe('2026-03-28');
    expect(
      (screen.getByLabelText(/date de fin du tournoi/i) as HTMLInputElement)
        .value,
    ).toBe('2026-03-29');
    expect(
      (
        screen.getByLabelText(
          /date début des inscriptions/i,
        ) as HTMLInputElement
      ).value,
    ).toBe('2026-03-27');
    expect(
      (
        screen.getByLabelText(
          /date limite des inscriptions/i,
        ) as HTMLInputElement
      ).value,
    ).toBe('2026-03-27');
    expect(
      screen.getByRole('spinbutton', { name: /nombre maximum de teams/i }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /créer/i })).toBeTruthy();
  });

  test('calls setName when name changes', () => {
    const contextValue = createContextValue();

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateForm />
      </TournamentContext.Provider>,
    );

    fireEvent.change(screen.getByDisplayValue('Tournoi test'), {
      target: { value: 'Nouveau tournoi' },
    });

    expect(contextValue.setName).toHaveBeenCalledWith('Nouveau tournoi');
  });

  test('limits description to 150 characters', () => {
    const contextValue = createContextValue();
    const longDescription = 'a'.repeat(180);

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateForm />
      </TournamentContext.Provider>,
    );

    const descriptionInput = screen.getByLabelText(
      /description/i,
    ) as HTMLInputElement;

    fireEvent.change(descriptionInput, {
      target: { value: longDescription },
    });

    expect(contextValue.setDescription).toHaveBeenCalledWith('a'.repeat(150));
    expect(descriptionInput.getAttribute('maxlength')).toBe('150');
  });

  test('calls field setters when date and max teams change', () => {
    const contextValue = createContextValue();

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateForm />
      </TournamentContext.Provider>,
    );

    fireEvent.change(screen.getByLabelText(/date du début du tournoi/i), {
      target: { value: '2026-03-30' },
    });
    fireEvent.change(screen.getByLabelText(/date de fin du tournoi/i), {
      target: { value: '2026-03-31' },
    });
    fireEvent.change(screen.getByLabelText(/date début des inscriptions/i), {
      target: { value: '2026-03-28' },
    });
    fireEvent.change(screen.getByLabelText(/date limite des inscriptions/i), {
      target: { value: '2026-03-29' },
    });
    fireEvent.change(
      screen.getByRole('spinbutton', { name: /nombre maximum de teams/i }),
      {
        target: { value: '10' },
      },
    );

    expect(contextValue.setStartDate).toHaveBeenCalledWith('2026-03-30');
    expect(contextValue.setEndDate).toHaveBeenCalledWith('2026-03-31');
    expect(contextValue.setStartInscriptionDate).toHaveBeenCalledWith(
      '2026-03-28',
    );
    expect(contextValue.setEndInscriptionDate).toHaveBeenCalledWith(
      '2026-03-29',
    );
    expect(contextValue.setMaxTeams).toHaveBeenCalledWith('10');
  });

  test('uses today as min date on date fields', () => {
    const contextValue = createContextValue();

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateForm />
      </TournamentContext.Provider>,
    );

    expect(
      screen.getByLabelText(/date du début du tournoi/i).getAttribute('min'),
    ).toBe('2026-03-27');
    expect(
      screen.getByLabelText(/date de fin du tournoi/i).getAttribute('min'),
    ).toBe('2026-03-27');
    expect(
      screen
        .getByLabelText(/date limite des inscriptions/i)
        .getAttribute('min'),
    ).toBe('2026-03-27');
    expect(
      screen.getByLabelText(/date début des inscriptions/i).getAttribute('min'),
    ).toBe('2026-03-27');
  });

  test('calls submitTournamentCreation when submitting the form', () => {
    const contextValue = createContextValue();

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateForm />
      </TournamentContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /créer/i }));

    expect(contextValue.submitTournamentCreation).toHaveBeenCalled();
  });

  test('shows loading label and disables submit button when submitting', () => {
    const contextValue = createContextValue();
    contextValue.submitting = true;

    render(
      <TournamentContext.Provider value={contextValue}>
        <TournamentCreateForm />
      </TournamentContext.Provider>,
    );

    const submitButton = screen.getByRole('button', { name: /création/i });
    expect(submitButton).toBeTruthy();
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  });
});
