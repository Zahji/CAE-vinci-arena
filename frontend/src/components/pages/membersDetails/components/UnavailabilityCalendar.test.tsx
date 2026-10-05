import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import UnavailabilityCalendar from './UnavailabilityCalendar';

describe('UnavailabilityCalendar', () => {
  test('renders the button', () => {
    render(<UnavailabilityCalendar unavailabilities={[]} />);

    expect(
      screen.getByRole('button', { name: /indisponibilités/i }),
    ).toBeTruthy();
  });

  test('dialog is closed by default', () => {
    render(<UnavailabilityCalendar unavailabilities={[]} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('opens the dialog when button is clicked', () => {
    render(<UnavailabilityCalendar unavailabilities={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /indisponibilités/i }));

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  test('shows empty message when no unavailabilities', () => {
    render(<UnavailabilityCalendar unavailabilities={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /indisponibilités/i }));

    expect(
      screen.getByText(/aucune indisponibilité enregistrée/i),
    ).toBeTruthy();
  });

  test('shows the calendar when unavailabilities exist', () => {
    const unavailabilities = [
      { id: 1, startDate: '2026-05-01', endDate: '2026-05-05' },
    ];

    render(<UnavailabilityCalendar unavailabilities={unavailabilities} />);

    fireEvent.click(screen.getByRole('button', { name: /indisponibilités/i }));

    expect(screen.queryByText(/aucune indisponibilité/i)).toBeNull();
  });

  test('closes the dialog when close button is clicked', async () => {
    render(<UnavailabilityCalendar unavailabilities={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /indisponibilités/i }));
    fireEvent.click(screen.getByTestId('CloseIcon').closest('button')!);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
