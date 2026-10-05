import { Team } from '../types';
import { createHeaders, ensureRequestSucceeded } from './apiUtils';

const TEAMS_BASE_URL = '/api/teams';

/**
 * Fetches all teams.
 * @return {Promise<Team[]>} the list of teams
 */
const fetchAllTeams = async (): Promise<Team[]> => {
  const response = await fetch(TEAMS_BASE_URL, {
    method: 'GET',
  });

  ensureRequestSucceeded(response);

  const teams: Team[] | null = await response.json();
  return teams ?? [];
};

/**
 * Fetches a team by its ID.
 * @param {number} teamId - the team ID
 * @param {string} token - the auth token
 * @return {Promise<Team>} the team
 */
const fetchTeamById = async (teamId: number, token: string): Promise<Team> => {
  const response = await fetch(`${TEAMS_BASE_URL}/${teamId}`, {
    method: 'GET',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);

  return response.json() as Promise<Team>;
};

/**
 * Creates a new team with the given name.
 * @param {string} token - the auth token
 * @param {string} name - the team name
 * @return {Promise<Team>} the created team
 */
const createTeam = async (token: string, name: string): Promise<Team> => {
  const response = await fetch(TEAMS_BASE_URL, {
    method: 'POST',
    headers: createHeaders(token),
    body: JSON.stringify({ name }),
  });

  ensureRequestSucceeded(
    response,
    'Impossible de créer une nouvelle team (une ou plusieurs raisons) :\n' +
      "• Vous faites déjà partie d'une team\n" +
      '• Le nom de la team que vous voulez créer existe déjà\n' +
      "• Vous avez une demande d'adhésion en attente",
  );

  return response.json() as Promise<Team>;
};

/**
 * Designates a member as second manager of a team.
 * @param {string} token - the auth token
 * @param {number} teamId - the team ID
 * @param {number} memberId - the member ID
 * @return {Promise<Team>} the updated team
 */
const designateSecondManager = async (
  token: string,
  teamId: number,
  memberId: number,
): Promise<Team> => {
  const response = await fetch(
    `${TEAMS_BASE_URL}/${teamId}/second-manager/${memberId}`,
    {
      method: 'PATCH',
      headers: createHeaders(token),
    },
  );

  ensureRequestSucceeded(response);

  return response.json() as Promise<Team>;
};

/**
 * Renounces the manager role for the current user in a team.
 * @param {string} token - the auth token
 * @param {number} teamId - the team ID
 * @return {Promise<Team>} the updated team
 */
const renounceManagerRole = async (
  token: string,
  teamId: number,
): Promise<Team> => {
  const response = await fetch(`${TEAMS_BASE_URL}/${teamId}/manager/renounce`, {
    method: 'PATCH',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);

  return response.json() as Promise<Team>;
};

/**
 * Leaves a team.
 * @param {string} token - the auth token
 * @param {number} teamId - the team ID
 * @return {Promise<void>}
 */
const leaveTeam = async (token: string, teamId: number): Promise<void> => {
  const response = await fetch(`${TEAMS_BASE_URL}/${teamId}/leave`, {
    method: 'PATCH',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);
};

/**
 * Excludes a member from a team by their membership ID.
 * @param {string} token - the auth token
 * @param {number} membershipId - the membership ID
 * @return {Promise<void>}
 */
const excludeMember = async (
  token: string,
  membershipId: number,
): Promise<void> => {
  const response = await fetch(
    `${TEAMS_BASE_URL}/memberships/${membershipId}`,
    {
      method: 'DELETE',
      headers: createHeaders(token),
    },
  );

  ensureRequestSucceeded(response);
};

export {
  fetchAllTeams,
  fetchTeamById,
  createTeam,
  designateSecondManager,
  renounceManagerRole,
  leaveTeam,
  excludeMember,
};
