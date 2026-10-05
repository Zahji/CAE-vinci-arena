import { TeamActivity, TournamentRegistration } from '../types';
import { createHeaders, ensureRequestSucceeded } from './apiUtils';

const TOURNAMENT_BASE_URL = '/api/tournaments';
const TEAMS_BASE_URL = '/api/teams';

/**
 * Fetches all registrations for a tournament.
 * @param {number} tournamentId - the tournament ID
 * @return {Promise<TournamentRegistration[]>} the list of registrations
 */
const fetchTournamentRegistrations = async (
  tournamentId: number,
): Promise<TournamentRegistration[]> => {
  const response = await fetch(
    `${TOURNAMENT_BASE_URL}/${tournamentId}/registrations`,
    { method: 'GET' },
  );

  ensureRequestSucceeded(response);

  const registrations: TournamentRegistration[] | null = await response.json();
  return registrations ?? [];
};

/**
 * Registers the current user's team to a tournament.
 * @param {number} tournamentId - the tournament ID
 * @param {string} token - the auth token
 * @return {Promise<TournamentRegistration>} the created registration
 */
const registerTeamToTournament = async (
  tournamentId: number,
  token: string,
): Promise<TournamentRegistration> => {
  const response = await fetch(
    `${TOURNAMENT_BASE_URL}/${tournamentId}/registrations`,
    {
      method: 'POST',
      headers: createHeaders(token),
    },
  );

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("La période d'inscription est finie");
    }

    if (response.status === 400) {
      throw new Error(
        "Votre team doit avoir au moins 4 membres pour s'inscrire à un tournoi.",
      );
    }

    ensureRequestSucceeded(response);
  }

  return response.json() as Promise<TournamentRegistration>;
};

/**
 * Fetches the tournament activity for a team.
 * @param {number} teamId - the team ID
 * @return {Promise<TeamActivity[]>} the list of tournament activities
 */
const fetchTeamActivity = async (teamId: number): Promise<TeamActivity[]> => {
  const response = await fetch(`${TEAMS_BASE_URL}/${teamId}/registrations`, {
    method: 'GET',
  });

  ensureRequestSucceeded(response);

  const activity: TeamActivity[] | null = await response.json();
  return activity ?? [];
};

export {
  fetchTournamentRegistrations,
  registerTeamToTournament,
  fetchTeamActivity,
};
