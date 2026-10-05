import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import EditTournamentDialog from './EditTournamentDialog';
import { toLocalDateInputValue } from '../../../../utils/dateUtils';

const baseTournament = {
  id: 1,
  name: 'Spring Clash',
  description: 'Tournoi du printemps',
  state: 'IN_PREPARATION',
  stateDisplayName: 'En préparation',
  startDate: '2099-04-10',
  endDate: '2099-04-12',
  startInscriptionDate: '2099-03-01',
  endInscriptionDate: '2099-03-31',
  maxTeams: 16,
  registrationsCount: 0,
};

describe('EditTournamentDialog', () => {
  test('uses default values when no tournament is selected', () => {
    render(
      <EditTournamentDialog
        open
        tournament={null}
        isEditing={false}
        onClose={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const dialog = within(screen.getByRole('dialog'));
    const nameInput = dialog.getByLabelText(/^nom$/i) as HTMLInputElement;
    const descriptionInput = dialog.getByLabelText(
      /description/i,
    ) as HTMLInputElement;
    const startDateInput = dialog.getByLabelText(
      /date du début du tournoi/i,
    ) as HTMLInputElement;
    const endDateInput = dialog.getByLabelText(
      /date de fin du tournoi/i,
    ) as HTMLInputElement;
    const startInscriptionInput = dialog.getByLabelText(
      /date début des inscriptions/i,
    ) as HTMLInputElement;
    const endInscriptionInput = dialog.getByLabelText(
      /date limite des inscriptions/i,
    ) as HTMLInputElement;
    const maxTeamsInput = dialog.getByRole('spinbutton', {
      name: /nombre maximum de teams/i,
    }) as HTMLInputElement;

    expect(nameInput.value).toBe('');
    expect(descriptionInput.value).toBe('');
    expect(startDateInput.value).toBe('');
    expect(endDateInput.value).toBe('');
    expect(startInscriptionInput.value).toBe(toLocalDateInputValue(new Date()));
    expect(endInscriptionInput.value).toBe('');
    expect(maxTeamsInput.value).toBe('2');
  });

  test('pre-fills form values from the selected tournament', () => {
    const { rerender } = render(
      <EditTournamentDialog
        open
        tournament={baseTournament}
        isEditing={false}
        onClose={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const dialog = within(screen.getByRole('dialog'));

    expect(dialog.getByDisplayValue('Spring Clash')).toBeTruthy();
    expect(dialog.getByDisplayValue('Tournoi du printemps')).toBeTruthy();
    expect(dialog.getByDisplayValue('2099-04-10')).toBeTruthy();
    expect(dialog.getByDisplayValue('2099-04-12')).toBeTruthy();
    expect(dialog.getByDisplayValue('2099-03-01')).toBeTruthy();
    expect(dialog.getByDisplayValue('2099-03-31')).toBeTruthy();
    expect(dialog.getByDisplayValue('16')).toBeTruthy();

    rerender(
      <EditTournamentDialog
        key="second"
        open
        tournament={{
          ...baseTournament,
          id: 2,
          name: 'Summer Cup',
          description: 'Tournoi estival',
          maxTeams: 8,
        }}
        isEditing={false}
        onClose={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByDisplayValue('Summer Cup')).toBeTruthy();
    expect(screen.getByDisplayValue('Tournoi estival')).toBeTruthy();
    expect(screen.getByDisplayValue('8')).toBeTruthy();
  });

  test('shows the same validation error as tournament creation and prevents submit', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <EditTournamentDialog
        open
        tournament={baseTournament}
        isEditing={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const dialog = within(screen.getByRole('dialog'));
    const maxTeamsInput = dialog.getByRole('spinbutton', {
      name: /nombre maximum de teams/i,
    });

    await userEvent.clear(maxTeamsInput);
    await userEvent.type(maxTeamsInput, '1');

    await userEvent.click(dialog.getByRole('button', { name: /^modifier$/i }));

    expect(
      screen.getByText(
        "Le nombre maximum d'équipes doit être un entier supérieur ou égal à 2.",
      ),
    ).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('submits the corrected payload without state', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <EditTournamentDialog
        open
        tournament={baseTournament}
        isEditing={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const dialog = within(screen.getByRole('dialog'));

    fireEvent.change(dialog.getByLabelText(/^nom$/i), {
      target: { value: '  Summer Cup  ' },
    });
    fireEvent.change(dialog.getByLabelText(/description/i), {
      target: { value: '  Tournoi estival mis a jour  ' },
    });
    fireEvent.change(
      dialog.getByRole('spinbutton', {
        name: /nombre maximum de teams/i,
      }),
      {
        target: { value: '8' },
      },
    );
    fireEvent.change(dialog.getByLabelText(/date du début du tournoi/i), {
      target: { value: '2099-05-10' },
    });
    fireEvent.change(dialog.getByLabelText(/date de fin du tournoi/i), {
      target: { value: '2099-05-12' },
    });
    fireEvent.change(dialog.getByLabelText(/date début des inscriptions/i), {
      target: { value: '2099-05-01' },
    });
    fireEvent.change(dialog.getByLabelText(/date limite des inscriptions/i), {
      target: { value: '2099-05-09' },
    });

    await userEvent.click(dialog.getByRole('button', { name: /^modifier$/i }));

    expect(onConfirm).toHaveBeenCalledWith({
      name: 'Summer Cup',
      description: 'Tournoi estival mis a jour',
      startDate: '2099-05-10',
      endDate: '2099-05-12',
      startInscriptionDate: '2099-05-01',
      endInscriptionDate: '2099-05-09',
      maxTeams: 8,
    });
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('state');
  });

  test('disables actions and shows the editing label while submitting', () => {
    render(
      <EditTournamentDialog
        open
        tournament={baseTournament}
        isEditing
        onClose={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const dialog = within(screen.getByRole('dialog'));
    const cancelButton = dialog.getByRole('button', {
      name: /annuler/i,
    }) as HTMLButtonElement;
    const submitButton = dialog.getByRole('button', {
      name: /modification\.\.\./i,
    }) as HTMLButtonElement;

    expect(cancelButton.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });
});
