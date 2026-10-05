import { describe, expect, test } from 'vitest';
import { validateTournamentForm } from './tournamentFormValidation';

const validInput = {
  today: '2026-04-03',
  name: 'Spring Clash',
  description: 'Tournoi du printemps',
  startDate: '2026-04-10',
  endDate: '2026-04-12',
  startInscriptionDate: '2026-04-04',
  endInscriptionDate: '2026-04-09',
  maxTeams: '16',
};

describe('validateTournamentForm', () => {
  test('returns an error when a required field is missing', () => {
    expect(
      validateTournamentForm({
        ...validInput,
        name: '   ',
      }),
    ).toBe('Tous les champs sont requis.');
  });

  test('returns an error when one date is in the past', () => {
    expect(
      validateTournamentForm({
        ...validInput,
        startDate: '2026-04-01',
      }),
    ).toBe('Impossible de créer un tournoi avec des dates passées.');
  });

  test('returns an error when maxTeams is invalid', () => {
    expect(
      validateTournamentForm({
        ...validInput,
        maxTeams: '1',
      }),
    ).toBe(
      "Le nombre maximum d'équipes doit être un entier supérieur ou égal à 2.",
    );
  });

  test('returns an error when end date is before start date', () => {
    expect(
      validateTournamentForm({
        ...validInput,
        endDate: '2026-04-09',
      }),
    ).toBe('La date de fin doit être postérieure ou égale à la date de début.');
  });

  test('returns an error when registration end date is after tournament start', () => {
    expect(
      validateTournamentForm({
        ...validInput,
        endInscriptionDate: '2026-04-11',
      }),
    ).toBe(
      'La date limite des inscriptions doit être antérieure ou égale à la date de début du tournoi.',
    );
  });

  test('returns an error when registration start date is after tournament start', () => {
    expect(
      validateTournamentForm({
        ...validInput,
        startInscriptionDate: '2026-04-11',
        endInscriptionDate: '2026-04-10',
      }),
    ).toBe(
      'La date de début des inscriptions ne peut pas être antérieur à celle du début du tournois.',
    );
  });

  test('returns an error when registration start date is after registration end date', () => {
    expect(
      validateTournamentForm({
        ...validInput,
        startInscriptionDate: '2026-04-08',
        endInscriptionDate: '2026-04-07',
      }),
    ).toBe(
      'La date de début des inscriptions ne peut pas être antérieur à celle de fin des inscriptions.',
    );
  });

  test('returns null when all values are valid', () => {
    expect(validateTournamentForm(validInput)).toBeNull();
  });
});
