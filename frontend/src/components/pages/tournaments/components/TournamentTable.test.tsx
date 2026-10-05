import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import TournamentTable from './TournamentTable';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

describe('TournamentTable', () => {
  const tournaments = [
    {
      id: 1,
      name: 'Spring Clash',
      description: 'Tournoi du printemps',
      state: 'IN_PREPARATION',
      stateDisplayName: 'En préparation',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-01',
      endInscriptionDate: '2026-03-31',
      maxTeams: 16,
      registrationsCount: 3,
    },
  ];

  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test('renders the empty state when there is no tournament', () => {
    render(<TournamentTable tournamentList={[]} />);

    expect(screen.getByText(/aucun tournoi actuellement/i)).toBeTruthy();
  });

  test('renders tournament cards with the requested info', () => {
    render(<TournamentTable tournamentList={tournaments} />);

    expect(screen.getByText('Spring Clash')).toBeTruthy();
    expect(
      screen.getByText(/début des inscriptions : 01\/03\/2026/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/fin des inscriptions : 31\/03\/2026/i),
    ).toBeTruthy();
    expect(screen.getByText(/teams inscrites : 3\/16/i)).toBeTruthy();
  });

  test('renders formatted dates in cards', () => {
    render(<TournamentTable tournamentList={tournaments} />);

    expect(screen.getByText('Spring Clash')).toBeTruthy();
    expect(
      screen.getByText(/début des inscriptions :\s*01\/03\/2026/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/fin des inscriptions :\s*31\/03\/2026/i),
    ).toBeTruthy();
    expect(screen.getByText(/3\/16/)).toBeTruthy();
  });

  test('navigates to tournament detail page when clicking a row', async () => {
    render(<TournamentTable tournamentList={tournaments} />);

    await userEvent.click(screen.getByText('Spring Clash'));

    expect(navigateMock).toHaveBeenCalledWith('/tournaments/1');
  });

  test('renders only name and status in showOnlyName mode', () => {
    render(<TournamentTable tournamentList={tournaments} showOnlyName />);

    expect(screen.getByText('Spring Clash')).toBeTruthy();
    expect(screen.queryByText('Description')).toBeNull();
    expect(screen.queryByText('Nom')).toBeNull();
  });

  test('navigates to tournament detail page when clicking a row in showOnlyName mode', async () => {
    render(<TournamentTable tournamentList={tournaments} showOnlyName />);

    await userEvent.click(screen.getByText('Spring Clash'));

    expect(navigateMock).toHaveBeenCalledWith('/tournaments/1');
  });

  test('getStatusConfig returns correct color for OPEN state', () => {
    const openTournament = [
      { ...tournaments[0], id: 2, state: 'OPEN', name: 'Open Cup' },
    ];
    render(<TournamentTable tournamentList={openTournament} showOnlyName />);

    expect(screen.getByText('Ouvert')).toBeTruthy();
  });

  test('getStatusConfig returns correct color for PLANIFIED state', () => {
    const planifiedTournament = [
      { ...tournaments[0], id: 3, state: 'PLANIFIED', name: 'Plan Cup' },
    ];
    render(
      <TournamentTable tournamentList={planifiedTournament} showOnlyName />,
    );

    expect(screen.getByText('Planifié')).toBeTruthy();
  });

  test('getStatusConfig returns correct color for ONGOING state', () => {
    const ongoingTournament = [
      { ...tournaments[0], id: 4, state: 'ONGOING', name: 'On Cup' },
    ];
    render(<TournamentTable tournamentList={ongoingTournament} showOnlyName />);

    expect(screen.getByText('En cours')).toBeTruthy();
  });

  test('getStatusConfig returns state name for unknown state', () => {
    const unknownTournament = [
      { ...tournaments[0], id: 5, state: 'FINISHED', name: 'Done Cup' },
    ];
    render(<TournamentTable tournamentList={unknownTournament} showOnlyName />);

    expect(screen.getByText('FINISHED')).toBeTruthy();
  });

  test('getStatusConfig returns Inconnu when state is empty', () => {
    const emptyStateTournament = [
      { ...tournaments[0], id: 6, state: '', name: 'Unknown Cup' },
    ];
    render(
      <TournamentTable tournamentList={emptyStateTournament} showOnlyName />,
    );

    expect(screen.getByText('Inconnu')).toBeTruthy();
  });

  test('renders a registered tournament row without errors', () => {
    const registeredIds = new Set([1]);

    render(
      <TournamentTable
        tournamentList={tournaments}
        registeredTournamentIds={registeredIds}
      />,
    );

    expect(screen.getByText('Spring Clash')).toBeTruthy();
  });

  test('shows edit action for admin and opens a prefilled dialog', async () => {
    render(<TournamentTable tournamentList={tournaments} isAdmin />);

    await userEvent.click(screen.getByRole('button', { name: /^modifier$/i }));

    const dialog = screen.getByRole('dialog', { name: /modifier le tournoi/i });
    const dialogContent = within(dialog);

    expect(screen.getByText('Modifier le tournoi')).toBeTruthy();
    expect(dialogContent.getByDisplayValue('Spring Clash')).toBeTruthy();
    expect(
      dialogContent.getByDisplayValue('Tournoi du printemps'),
    ).toBeTruthy();
    expect(dialogContent.getByDisplayValue('2026-04-10')).toBeTruthy();
    expect(dialogContent.getByDisplayValue('2026-04-12')).toBeTruthy();
    expect(dialogContent.getByDisplayValue('2026-03-01')).toBeTruthy();
    expect(dialogContent.getByDisplayValue('2026-03-31')).toBeTruthy();
    expect(dialogContent.getByDisplayValue('16')).toBeTruthy();
  });

  test('calls onEditTournament with the selected tournament and payload', async () => {
    const onEditTournament = vi.fn().mockResolvedValue(undefined);

    render(
      <TournamentTable
        tournamentList={tournaments}
        isAdmin
        onEditTournament={onEditTournament}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^modifier$/i }));

    const dialog = screen.getByRole('dialog');
    const dialogContent = within(dialog);

    fireEvent.change(dialogContent.getByLabelText(/^nom$/i), {
      target: { value: '  Spring Clash Reloaded  ' },
    });
    fireEvent.change(dialogContent.getByLabelText(/description/i), {
      target: { value: '  Tournoi du printemps mis a jour  ' },
    });
    fireEvent.change(
      dialogContent.getByRole('spinbutton', {
        name: /nombre maximum de teams/i,
      }),
      {
        target: { value: '32' },
      },
    );
    fireEvent.change(
      dialogContent.getByLabelText(/date du début du tournoi/i),
      {
        target: { value: '2099-04-10' },
      },
    );
    fireEvent.change(dialogContent.getByLabelText(/date de fin du tournoi/i), {
      target: { value: '2099-04-12' },
    });
    fireEvent.change(
      dialogContent.getByLabelText(/date début des inscriptions/i),
      {
        target: { value: '2099-03-01' },
      },
    );
    fireEvent.change(
      dialogContent.getByLabelText(/date limite des inscriptions/i),
      {
        target: { value: '2099-03-31' },
      },
    );

    await userEvent.click(
      dialogContent.getByRole('button', { name: /^modifier$/i }),
    );

    await waitFor(() => {
      expect(onEditTournament).toHaveBeenCalledWith(tournaments[0], {
        name: 'Spring Clash Reloaded',
        description: 'Tournoi du printemps mis a jour',
        startDate: '2099-04-10',
        endDate: '2099-04-12',
        startInscriptionDate: '2099-03-01',
        endInscriptionDate: '2099-03-31',
        maxTeams: 32,
      });
    });
  });

  test('cancelling the edit dialog does not call onEditTournament', async () => {
    const onEditTournament = vi.fn().mockResolvedValue(undefined);

    render(
      <TournamentTable
        tournamentList={tournaments}
        isAdmin
        onEditTournament={onEditTournament}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^modifier$/i }));

    const dialog = screen.getByRole('dialog', { name: /modifier le tournoi/i });
    const dialogContent = within(dialog);
    await userEvent.click(
      dialogContent.getByRole('button', { name: /annuler/i }),
    );

    expect(onEditTournament).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /modifier le tournoi/i }),
      ).toBeNull();
    });
  });

  test('shows publish action for admin and calls onPublishTournament with payload', async () => {
    const onPublishTournament = vi.fn().mockResolvedValue(undefined);

    render(
      <TournamentTable
        tournamentList={tournaments}
        isAdmin
        onPublishTournament={onPublishTournament}
      />,
    );

    const publishButton = screen.getByRole('button', { name: /publier/i });
    expect((publishButton as HTMLButtonElement).disabled).toBe(false);

    await userEvent.click(publishButton);

    expect(screen.getByText('Confirmer la publication')).toBeTruthy();

    const confirmButton = screen
      .getAllByRole('button', { name: /publier/i })
      .find((btn) => btn.closest('[role="dialog"]'))!;
    await userEvent.click(confirmButton);

    expect(onPublishTournament).toHaveBeenCalledWith(1, {
      name: 'Spring Clash',
      description: 'Tournoi du printemps',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-01',
      endInscriptionDate: '2026-03-31',
      maxTeams: 16,
      state: 'PLANIFIED',
    });
  });

  test('cancelling the confirmation dialog does not call onPublishTournament', async () => {
    const onPublishTournament = vi.fn().mockResolvedValue(undefined);

    render(
      <TournamentTable
        tournamentList={tournaments}
        isAdmin
        onPublishTournament={onPublishTournament}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /publier/i }));
    expect(screen.getByText('Confirmer la publication')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(onPublishTournament).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  test('disables publish button when tournament is not in preparation', () => {
    const onPublishTournament = vi.fn().mockResolvedValue(undefined);
    const nonPublishableTournament = [
      { ...tournaments[0], id: 7, state: 'PLANIFIED', name: 'Already Planned' },
    ];

    render(
      <TournamentTable
        tournamentList={nonPublishableTournament}
        isAdmin
        onPublishTournament={onPublishTournament}
      />,
    );

    const publishButton = screen.getByRole('button', { name: /publier/i });
    expect((publishButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('disables edit button when tournament is not in preparation', () => {
    const onEditTournament = vi.fn().mockResolvedValue(undefined);
    const nonEditableTournament = [
      { ...tournaments[0], id: 8, state: 'PLANIFIED', name: 'Already Planned' },
    ];

    render(
      <TournamentTable
        tournamentList={nonEditableTournament}
        isAdmin
        onEditTournament={onEditTournament}
      />,
    );

    const editButton = screen.getByRole('button', { name: /modifier/i });
    expect((editButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('disables publish button when isPublishing is true', () => {
    const onPublishTournament = vi.fn().mockResolvedValue(undefined);

    render(
      <TournamentTable
        tournamentList={tournaments}
        isAdmin
        onPublishTournament={onPublishTournament}
        isPublishing
      />,
    );

    const publishButton = screen.getByRole('button', { name: /publier/i });
    expect((publishButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('disables edit button when isEditing is true', () => {
    const onEditTournament = vi.fn().mockResolvedValue(undefined);

    render(
      <TournamentTable
        tournamentList={tournaments}
        isAdmin
        onEditTournament={onEditTournament}
        isEditing
      />,
    );

    const editButton = screen.getByRole('button', { name: /modifier/i });
    expect((editButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('does not fail when publish is clicked without onPublishTournament handler', async () => {
    render(<TournamentTable tournamentList={tournaments} isAdmin />);

    await userEvent.click(screen.getByRole('button', { name: /publier/i }));
    expect(screen.getByText('Confirmer la publication')).toBeTruthy();

    await userEvent.click(
      screen
        .getAllByRole('button', { name: /publier/i })
        .find((btn) => btn.closest('[role="dialog"]'))!,
    );

    expect(screen.getAllByText('Spring Clash').length).toBeGreaterThan(0);
  });

  test('enables generate planning when registration period is over', () => {
    const onGenerateSchedule = vi.fn().mockResolvedValue(undefined);
    const planifiedTournament = [
      {
        ...tournaments[0],
        id: 7,
        name: 'Plan Cup',
        state: 'PLANIFIED',
        endInscriptionDate: '2026-04-09',
      },
    ];

    render(
      <TournamentTable
        tournamentList={planifiedTournament}
        isAdmin
        today="2026-04-10"
        now={new Date('2026-04-10T10:00:00')}
        onGenerateSchedule={onGenerateSchedule}
      />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: /générer planning/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  test('enables generate planning when max teams are reached', () => {
    const onGenerateSchedule = vi.fn().mockResolvedValue(undefined);
    const planifiedTournament = [
      {
        ...tournaments[0],
        id: 70,
        name: 'Full Cup',
        state: 'PLANIFIED',
        endInscriptionDate: '2026-04-20',
        registrationsCount: 16,
        maxTeams: 16,
      },
    ];

    render(
      <TournamentTable
        tournamentList={planifiedTournament}
        isAdmin
        today="2026-04-10"
        now={new Date('2026-04-10T10:00:00')}
        onGenerateSchedule={onGenerateSchedule}
      />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: /générer planning/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  test('disables generate planning once the tournament is locked', () => {
    const onGenerateSchedule = vi.fn().mockResolvedValue(undefined);
    const planifiedTournament = [
      {
        ...tournaments[0],
        id: 8,
        name: 'Locked Cup',
        state: 'PLANIFIED',
        startDate: '2026-04-10',
      },
    ];

    render(
      <TournamentTable
        tournamentList={planifiedTournament}
        isAdmin
        today="2026-04-10"
        lockedTournamentIds={new Set([8])}
        onGenerateSchedule={onGenerateSchedule}
      />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: /générer planning/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  test('disables generate planning when fewer than 2 teams are registered', () => {
    const onGenerateSchedule = vi.fn().mockResolvedValue(undefined);
    const emptyTournament = [
      {
        ...tournaments[0],
        id: 9,
        name: 'Empty Cup',
        state: 'PLANIFIED',
        endInscriptionDate: '2026-03-31',
        registrationsCount: 0,
      },
    ];

    render(
      <TournamentTable
        tournamentList={emptyTournament}
        isAdmin
        today="2026-04-10"
        onGenerateSchedule={onGenerateSchedule}
      />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: /générer planning/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  test('disables generate planning when registration is still open and tournament is not full', () => {
    const onGenerateSchedule = vi.fn().mockResolvedValue(undefined);
    const futureTournament = [
      {
        ...tournaments[0],
        id: 10,
        name: 'Future Cup',
        state: 'PLANIFIED',
        endInscriptionDate: '2026-04-15',
        registrationsCount: 8,
        maxTeams: 16,
      },
    ];

    render(
      <TournamentTable
        tournamentList={futureTournament}
        isAdmin
        today="2026-04-10"
        onGenerateSchedule={onGenerateSchedule}
      />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: /générer planning/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  test('disables generate planning when tournament startDate is already passed', () => {
    const onGenerateSchedule = vi.fn().mockResolvedValue(undefined);
    const pastStartTournament = [
      {
        ...tournaments[0],
        id: 11,
        name: 'Past Start Cup',
        state: 'PLANIFIED',
        startDate: '2026-04-09',
        endInscriptionDate: '2026-04-08',
        registrationsCount: 10,
        maxTeams: 16,
      },
    ];

    render(
      <TournamentTable
        tournamentList={pastStartTournament}
        isAdmin
        today="2026-04-10"
        now={new Date('2026-04-10T14:00:00')}
        onGenerateSchedule={onGenerateSchedule}
      />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: /générer planning/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  test('card is not highlighted when registered but not participated', () => {
    const registeredIds = new Set([1]);
    render(
      <TournamentTable
        tournamentList={tournaments}
        registeredTournamentIds={registeredIds}
        participatedTournamentIds={new Set()}
      />,
    );

    const card = document.querySelector('[data-highlighted]');
    expect(card?.getAttribute('data-highlighted')).toBe('false');
  });

  test('card is not highlighted when participated but not registered', () => {
    const participatedIds = new Set([1]);
    render(
      <TournamentTable
        tournamentList={tournaments}
        registeredTournamentIds={new Set()}
        participatedTournamentIds={participatedIds}
      />,
    );

    const card = document.querySelector('[data-highlighted]');
    expect(card?.getAttribute('data-highlighted')).toBe('false');
  });

  test('card is highlighted when both registered and participated', () => {
    const ids = new Set([1]);
    render(
      <TournamentTable
        tournamentList={tournaments}
        registeredTournamentIds={ids}
        participatedTournamentIds={ids}
      />,
    );

    const card = document.querySelector('[data-highlighted]');
    expect(card?.getAttribute('data-highlighted')).toBe('true');
  });
});
