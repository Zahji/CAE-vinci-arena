import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchTournamentRegistrations,
  registerTeamToTournament,
  fetchTeamActivity,
} from './tournamentRegistrationService';

describe('tournamentRegistrationService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('fetchTournamentRegistrations calls the registrations endpoint', async () => {
    const registrations = [
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        teamId: 10,
        teamName: 'TEAM_ALPHA',
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(registrations),
    });

    const result = await fetchTournamentRegistrations(1);

    expect(result).toEqual(registrations);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/1/registrations', {
      method: 'GET',
    });
  });

  test('fetchTournamentRegistrations returns empty list when API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchTournamentRegistrations(1)).resolves.toEqual([]);
  });

  test('fetchTournamentRegistrations throws on HTTP error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchTournamentRegistrations(1)).rejects.toThrow('Erreur 404');
  });

  test('registerTeamToTournament sends POST with authorization header', async () => {
    const registration = {
      tournamentId: 1,
      tournamentName: 'Spring Cup',
      teamId: 10,
      teamName: 'TEAM_ALPHA',
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(registration),
    });

    const result = await registerTeamToTournament(1, 'Bearer test-token');

    expect(result).toEqual(registration);
    expect(fetchMock).toHaveBeenCalledWith('/api/tournaments/1/registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  test('registerTeamToTournament surfaces the registration period end message on 409', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
    });

    await expect(
      registerTeamToTournament(1, 'Bearer test-token'),
    ).rejects.toThrow("La période d'inscription est finie");
  });

  test('registerTeamToTournament falls back to the 4 members message on 400', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    await expect(
      registerTeamToTournament(1, 'Bearer test-token'),
    ).rejects.toThrow(
      "Votre team doit avoir au moins 4 membres pour s'inscrire à un tournoi.",
    );
  });

  test('registerTeamToTournament throws generic error on other HTTP errors', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(
      registerTeamToTournament(1, 'Bearer test-token'),
    ).rejects.toThrow('Erreur 500');
  });

  test('fetchTeamActivity calls the correct endpoint and returns activity', async () => {
    const activity = [
      {
        tournamentId: 1,
        tournamentName: 'Spring Cup',
        startDate: '2026-06-01',
        endDate: '2026-06-03',
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(activity),
    });

    const result = await fetchTeamActivity(5);

    expect(result).toEqual(activity);
    expect(fetchMock).toHaveBeenCalledWith('/api/teams/5/registrations', {
      method: 'GET',
    });
  });

  test('fetchTeamActivity returns empty list when API returns null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await expect(fetchTeamActivity(5)).resolves.toEqual([]);
  });

  test('fetchTeamActivity throws on HTTP error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchTeamActivity(5)).rejects.toThrow('Erreur 404');
  });
});
